from django.shortcuts import render
from rest_framework import viewsets, permissions, generics
from django.contrib.auth import get_user_model
from .models import Vehicle, MileageRecord, ServiceType, ServiceEvent, PredictionRule, ServicePrediction, Invoice
from .serializers import (
    VehicleSerializer, MileageRecordSerializer, ServiceTypeSerializer, 
    ServiceEventSerializer, PredictionRuleSerializer, ServicePredictionSerializer,
    RegisterSerializer, UserSerializer, InvoiceSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction

# Get User model instance
User = get_user_model()

# Create your views here.

# --- Permission Classes --- (Define custom permissions later if needed)
# Example: IsOwnerOrReadOnly permission class
class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission personnalisée : autorise lecture seule à tous, écriture uniquement au propriétaire.
    Les administrateurs (staff/superuser) ont toujours accès.
    S'assure que l'objet a un attribut 'owner'.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True
        
        # Read permissions are allowed to any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the owner of the object.
        # Ensure the object has an 'owner' attribute
        if hasattr(obj, 'owner'):
             return obj.owner == request.user
        # Handle cases where the object might not have an owner (e.g., maybe ServiceType?)
        # Depending on policy, either deny or allow if no owner attribute
        return False # Deny if no owner attribute for write permissions

# --- Role-Based Permissions ---

def is_in_group(user, group_name):
    """Takes a user and a group name, and returns `True` if the user is in that group."""
    return user.groups.filter(name=group_name).exists()

class IsAdminUser(permissions.BasePermission):
    """Permission personnalisée : autorise accès uniquement aux administrateurs (is_staff ou is_superuser)."""
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)

class IsCustomerUser(permissions.BasePermission):
    """Permission personnalisée : autorise accès uniquement aux clients (groupe 'Customers') ou aux administrateurs."""
    # Note: Admins are usually included for ease of testing/management.
    # Adjust if strict customer-only access is needed.
    def has_permission(self, request, view):
        return request.user and (is_in_group(request.user, 'Customers') or request.user.is_staff or request.user.is_superuser)

# --- User Registration View --- 

class RegisterView(generics.CreateAPIView):
    """Crée un nouveau compte utilisateur (Client).

    Accepte `username`, `password`, `password2`, `email`, `phone_number`, `first_name` (optionnel), `last_name` (optionnel).
    Ajoute automatiquement l'utilisateur au groupe 'Customers'.
    Crée le profil client associé avec le numéro de téléphone.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,) # Allow anyone to register
    serializer_class = RegisterSerializer

# --- ViewSets --- 

class VehicleViewSet(viewsets.ModelViewSet):
    """Gère les véhicules (CRUD).

    - **list**: Retourne les véhicules de l'utilisateur connecté (ou tous pour admin).
    - **create**: Crée un véhicule pour l'utilisateur connecté (définit `owner` automatiquement).
    - **retrieve**: Retourne les détails d'un véhicule spécifique (si autorisé).
    - **update/partial_update**: Met à jour un véhicule (propriétaire ou admin uniquement).
    - **destroy**: Supprime un véhicule (propriétaire ou admin uniquement).
    """
    serializer_class = VehicleSerializer
    # Apply IsOwnerOrReadOnly for object-level permissions on detail views (update/delete)
    # IsAuthenticated is applied globally in settings.py
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """This view should return a list of all vehicles
        for the currently authenticated user.
        Admins should see all vehicles.
        """
        user = self.request.user
        # Add check for swagger generation
        if getattr(self, 'swagger_fake_view', False):
             return Vehicle.objects.none()
             
        if user.is_staff or user.is_superuser:
            return Vehicle.objects.all().order_by('-created_at')
        elif user.is_authenticated: # Check if authenticated before filtering
            return Vehicle.objects.filter(owner=user).order_by('-created_at')
        else:
            return Vehicle.objects.none() # Unauthenticated users see nothing

    @transaction.atomic # Ensure Vehicle and MileageRecord creation are atomic
    def perform_create(self, serializer):
        """Associate the vehicle with the logged-in user upon creation
           and create the initial mileage record.
        """
        # Save the vehicle instance first, associated with the user
        vehicle = serializer.save(owner=self.request.user)
        
        # Now, create the initial MileageRecord for this vehicle
        MileageRecord.objects.create(
            vehicle=vehicle,
            mileage=vehicle.initial_mileage,
            recorded_by=self.request.user,
            source='INITIAL' # Use a specific source, or determine based on user role
            # recorded_at defaults to now
        )

class MileageRecordViewSet(viewsets.ModelViewSet):
    """Gère les relevés de kilométrage (CRUD).

    - **list/retrieve**: Retourne les relevés des véhicules du client (ou tous pour admin).
    - **create**: Ajoute un relevé pour un véhicule (propriétaire ou admin), définit `source` selon le rôle.
    - **update/partial_update/destroy**: Modifie/supprime un relevé (admin uniquement pour l'instant).
    """
    serializer_class = MileageRecordSerializer
    
    def get_permissions(self):
        """Instantiates and returns the list of permissions that this view requires."""
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser] # Only admins can modify/delete
        else: # create, list, retrieve
            permission_classes = [permissions.IsAuthenticated] # Any authenticated user (customer/admin) can attempt
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        # Add check for swagger generation if needed, or just rely on is_authenticated
        if getattr(self, 'swagger_fake_view', False):
             return MileageRecord.objects.none() # Return empty for schema generation if needed
             
        base_queryset = MileageRecord.objects.all().select_related('vehicle', 'recorded_by')
        if user.is_staff or user.is_superuser:
            queryset = base_queryset
        elif user.is_authenticated: # Check if authenticated before filtering by owner
            queryset = base_queryset.filter(vehicle__owner=user)
        else:
             queryset = MileageRecord.objects.none() # Unauthenticated users see nothing
        
        # Optional filtering by vehicle_id query parameter
        vehicle_id = self.request.query_params.get('vehicle_id')
        if vehicle_id is not None:
            if user.is_staff or user.is_superuser or Vehicle.objects.filter(id=vehicle_id, owner=user).exists():
                queryset = queryset.filter(vehicle_id=vehicle_id)
            else:
                return queryset.none()
        
        return queryset.order_by('-recorded_at')

    def perform_create(self, serializer):
        """Ensure the user owns the vehicle they are adding mileage for.
           Sets the 'recorded_by' field automatically.
        """
        # Determine source based on user role (Admin or Customer)
        user = self.request.user
        source = 'ADMIN'
        if not user.is_staff and not user.is_superuser and is_in_group(user, 'Customers'):
            source = 'CUSTOMER'
        # Check ownership for non-admins
        vehicle = serializer.validated_data['vehicle']
        if not (user.is_staff or user.is_superuser) and vehicle.owner != user:
            raise serializers.ValidationError({"vehicle": "Vous ne pouvez ajouter un relevé que pour vos propres véhicules."}) 
        serializer.save(recorded_by=user, source=source)

# --- New ViewSets --- 

class ServiceTypeViewSet(viewsets.ModelViewSet):
    """Gère les types de service (Admin uniquement - CRUD)."""
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [IsAdminUser] # Example: Only admins can manage service types

class ServiceEventViewSet(viewsets.ModelViewSet):
    """Gère les interventions de service effectuées (CRUD).

    - **list/retrieve**: Retourne les interventions des véhicules du client (ou tous pour admin).
    - **create/update/partial_update/destroy**: Ajoute/modifie/supprime une intervention (admin uniquement).
    """
    serializer_class = ServiceEventSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can create/modify/delete service events
            permission_classes = [IsAdminUser] 
        else: # list, retrieve
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if getattr(self, 'swagger_fake_view', False):
             return ServiceEvent.objects.none()
             
        base_queryset = ServiceEvent.objects.all().select_related('vehicle', 'service_type')
        if user.is_staff or user.is_superuser:
            queryset = base_queryset
        elif user.is_authenticated:
            queryset = base_queryset.filter(vehicle__owner=user)
        else:
            queryset = ServiceEvent.objects.none()
        
        # Optional filtering by vehicle_id query parameter
        vehicle_id = self.request.query_params.get('vehicle_id')
        if vehicle_id is not None:
            # Ensure the user has permission to view events for this vehicle_id
            can_view_vehicle = (user.is_staff 
                                or user.is_superuser 
                                or Vehicle.objects.filter(id=vehicle_id, owner=user).exists())
            if can_view_vehicle:
                queryset = queryset.filter(vehicle_id=vehicle_id)
            else:
                return queryset.none()

        return queryset.order_by('-event_date')

    def perform_create(self, serializer):
        """(No specific action needed here beyond permissions check,
           unless we want to link who recorded the event)
        """
        # Validation for vehicle ownership is not strictly needed here
        # because only Mechanics/Admins (who have broad access) can create.
        # If needed later, add check: vehicle = serializer.validated_data['vehicle'] etc.
        serializer.save()

class PredictionRuleViewSet(viewsets.ModelViewSet):
    """Gère les règles de prédiction basées sur les intervalles (Admin uniquement - CRUD)."""
    queryset = PredictionRule.objects.filter(is_active=True).select_related('service_type')
    serializer_class = PredictionRuleSerializer
    permission_classes = [IsAdminUser] # Example: Only admins can manage rules

class ServicePredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """Affiche les prédictions de service générées (Lecture seule).

    - **list/retrieve**: Retourne les prédictions des véhicules du client (ou tous pour admin).
    """
    serializer_class = ServicePredictionSerializer
    permission_classes = [permissions.IsAuthenticated] # Read-only, access controlled by queryset filter

    def get_queryset(self):
        user = self.request.user
        if getattr(self, 'swagger_fake_view', False):
             return ServicePrediction.objects.none()
             
        base_queryset = ServicePrediction.objects.all().select_related('vehicle', 'service_type')
        if user.is_staff or user.is_superuser:
            queryset = base_queryset
        elif user.is_authenticated:
            queryset = base_queryset.filter(vehicle__owner=user)
        else:
            queryset = ServicePrediction.objects.none()
        
        # Optional filtering by vehicle_id query parameter
        vehicle_id = self.request.query_params.get('vehicle_id')
        if vehicle_id is not None:
            # Ensure the user has permission to view predictions for this vehicle_id
            can_view_vehicle = (user.is_staff 
                                or user.is_superuser 
                                or Vehicle.objects.filter(id=vehicle_id, owner=user).exists())
            if can_view_vehicle:
                queryset = queryset.filter(vehicle_id=vehicle_id)
            else:
                return queryset.none()
                
        return queryset.order_by('vehicle', 'predicted_due_date', 'predicted_due_mileage')

    # No perform_create needed for ReadOnlyModelViewSet
    # perform_create method removed as it's not applicable here and was likely a copy-paste error

# --- Invoice ViewSet --- 

class InvoiceViewSet(viewsets.ModelViewSet):
    """Gère les factures PDF (CRUD).

    Accepte les uploads via `multipart/form-data`.
    - **list/retrieve**: Retourne les factures des véhicules du client (ou tous pour admin).
    - **create/update/partial_update/destroy**: Ajoute/modifie/supprime une facture (admin uniquement).
    """
    serializer_class = InvoiceSerializer
    parser_classes = (MultiPartParser, FormParser) # Support file uploads

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser] # Only admins can manage invoices
        else: # list, retrieve
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if getattr(self, 'swagger_fake_view', False):
             return Invoice.objects.none()
             
        base_queryset = Invoice.objects.all().select_related('vehicle', 'uploaded_by')
        if user.is_staff or user.is_superuser:
            queryset = base_queryset
        elif user.is_authenticated: 
            queryset = base_queryset.filter(vehicle__owner=user)
        else:
            queryset = Invoice.objects.none()
        
        # Optional filtering by vehicle_id query parameter
        vehicle_id = self.request.query_params.get('vehicle_id')
        if vehicle_id is not None:
             # Ensure the user has permission to view invoices for this vehicle_id
            can_view_vehicle = (user.is_staff 
                                or user.is_superuser 
                                or Vehicle.objects.filter(id=vehicle_id, owner=user).exists())
            if can_view_vehicle:
                queryset = queryset.filter(vehicle_id=vehicle_id)
            else:
                return queryset.none()

        return queryset.order_by('-uploaded_at')

    def perform_create(self, serializer):
        """Associate the invoice with the uploading user."""
        serializer.save(uploaded_by=self.request.user)
