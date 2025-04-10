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
# Imports for drf-yasg documentation
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status
from rest_framework.response import Response
from rest_framework import serializers

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

@swagger_auto_schema(
    tags=['Authentification'],
    operation_summary="Enregistrer un nouveau compte client",
    operation_description=(
        "Crée un nouveau compte utilisateur (sera automatiquement assigné au groupe 'Customers') et son profil client associé.\\n\\n"
        "**Champs Requis:**\\n"
        "- `username`: Nom d'utilisateur unique.\\n"
        "- `password`: Mot de passe.\\n"
        "- `password2`: Confirmation du mot de passe (doit correspondre à `password`).\\n"
        "- `email`: Adresse email unique.\\n"
        "- `phone_number`: Numéro de téléphone tunisien (Format: +216 XX XXX XXX ou 216XXXXXXXX ou XX XXX XXX).\\n\\n"
        "**Champs Optionnels:**\\n"
        "- `first_name`: Prénom.\\n"
        "- `last_name`: Nom de famille."
    ),
    request_body=RegisterSerializer,
    responses={
        status.HTTP_201_CREATED: openapi.Response(
            description="Compte créé avec succès. Retourne les détails de l'utilisateur créé (sans le mot de passe).",
            schema=UserSerializer, # Assuming UserSerializer shows basic user info
            examples={
                "application/json": {
                    "id": 1,
                    "username": "nouveau_client",
                    "email": "client@example.com",
                    "first_name": "Test",
                    "last_name": "Client",
                    "is_staff": False # Example field from UserSerializer
                }
            }
        ),
        status.HTTP_400_BAD_REQUEST: openapi.Response(
            description="Erreur de validation des données fournies.",
            examples={
                "application/json": {
                    "password": [
                        "Les deux mots de passe ne correspondent pas."
                    ],
                    "email": [
                        "utilisateur avec ce adresse e-mail existe déjà."
                    ],
                    "phone_number": [
                         "Le numéro de téléphone doit être au format tunisien valide."
                    ]
                }
            }
        )
    }
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,) # Allow anyone to register
    serializer_class = RegisterSerializer

# --- Current User View ---

@swagger_auto_schema(
    tags=['Utilisateurs'],
    operation_summary="Obtenir les détails de l'utilisateur connecté",
    operation_description=(
        "Retourne les informations de base (id, username, email, prénom, nom) de l'utilisateur actuellement authentifié via le jeton JWT."
    ),
    responses={
        status.HTTP_200_OK: openapi.Response(
            description="Détails de l'utilisateur connecté.",
            schema=UserSerializer,
            examples={
                "application/json": {
                    "id": 1,
                    "username": "testclient",
                    "email": "client@example.com",
                    "first_name": "Test",
                    "last_name": "Client"
                }
            }
        ),
        status.HTTP_401_UNAUTHORIZED: openapi.Response(
            description="Authentification requise (jeton manquant ou invalide)."
        )
    }
)
class CurrentUserView(generics.RetrieveAPIView):
    """Renvoie les détails de l'utilisateur actuellement authentifié."""
    permission_classes = [permissions.IsAuthenticated] # Ensure user is logged in
    serializer_class = UserSerializer

    def get_object(self):
        """Retourne l'objet utilisateur actuel (request.user)."""
        return self.request.user

# --- ViewSets --- 

@swagger_auto_schema(
    tags=['Véhicules'], # Group all vehicle actions under this tag
    operation_description="Opérations CRUD pour les véhicules."
)
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

    @swagger_auto_schema(
        operation_summary="Créer un nouveau véhicule",
        operation_description=(
            "Crée un nouveau véhicule associé à l'utilisateur authentifié.\n"
            "L'utilisateur devient le propriétaire.\n"
            "Le premier relevé de kilométrage est créé automatiquement avec `initial_mileage`."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['make', 'model', 'registration_number', 'initial_mileage'],
            properties={
                'make': openapi.Schema(type=openapi.TYPE_STRING, description="Marque du véhicule", example="Renault"),
                'model': openapi.Schema(type=openapi.TYPE_STRING, description="Modèle du véhicule", example="Clio"),
                'year': openapi.Schema(type=openapi.TYPE_INTEGER, description="Année de fabrication (optionnel)", example=2018),
                'registration_number': openapi.Schema(type=openapi.TYPE_STRING, description="Numéro d'immatriculation (format Tunisien TU/RS)", example="123TU4567"),
                'vin': openapi.Schema(type=openapi.TYPE_STRING, description="VIN (optionnel)", example="VF1ABC..."),
                'initial_mileage': openapi.Schema(type=openapi.TYPE_INTEGER, description="Kilométrage initial lors de l'ajout", example=5000)
            }
        ),
        responses={
            status.HTTP_201_CREATED: openapi.Response(
                description="Véhicule créé avec succès.",
                schema=VehicleSerializer,
                examples={
                    "application/json": {
                        "id": 1,
                        "owner": 1,
                        "owner_username": "testclient",
                        "make": "Renault",
                        "model": "Clio",
                        "year": 2018,
                        "registration_number": "123TU4567",
                        "vin": None,
                        "initial_mileage": 5000,
                        "created_at": "2024-05-20T10:00:00Z",
                        "updated_at": "2024-05-20T10:00:00Z"
                    }
                }
            ),
            status.HTTP_400_BAD_REQUEST: openapi.Response(
                description="Erreur de validation (ex: format plaque invalide, plaque dupliquée).",
                examples={
                    "application/json": {
                        "registration_number": ["Le numéro d'immatriculation doit être au format tunisien (ex: 123TU1234 ou RS123456)."],
                        # "registration_number": ["véhicule avec ce Numéro d'immatriculation existe déjà."] 
                    }
                }
            ),
            status.HTTP_401_UNAUTHORIZED: openapi.Response(description="Authentification requise") 
        }
    )
    def create(self, request, *args, **kwargs):
        # We override create just to decorate it, the logic is in perform_create
        return super().create(request, *args, **kwargs)

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

    @swagger_auto_schema(
        operation_summary="Lister les véhicules",
        operation_description="Retourne la liste des véhicules accessibles par l'utilisateur (les siens pour Client, tous pour Admin).",
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Liste des véhicules.",
                schema=VehicleSerializer(many=True),
                examples={
                    "application/json": [
                        {
                            "id": 1,
                            "owner": 1,
                            "owner_username": "testclient",
                            "make": "Renault",
                            "model": "Clio",
                            "year": 2018,
                            "registration_number": "123TU4567",
                            "vin": None,
                            "initial_mileage": 5000,
                            "created_at": "2024-05-20T10:00:00Z",
                            "updated_at": "2024-05-20T10:00:00Z"
                        },
                        {
                            "id": 2,
                            "owner": 1,
                            "owner_username": "testclient",
                            "make": "Peugeot",
                            "model": "208",
                            "year": 2020,
                            "registration_number": "222TU888",
                            "vin": "VF3XYZ...",
                            "initial_mileage": 15000,
                             "created_at": "2024-05-21T11:30:00Z",
                             "updated_at": "2024-05-21T11:30:00Z"
                        }
                    ]
                }
            )
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(operation_summary="Récupérer un véhicule spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(operation_summary="Mettre à jour un véhicule (partiellement)")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Mettre à jour un véhicule (complètement)")
    def update(self, request, *args, **kwargs):
         return super().update(request, *args, **kwargs)
         
    @swagger_auto_schema(operation_summary="Supprimer un véhicule")
    def destroy(self, request, *args, **kwargs):
         return super().destroy(request, *args, **kwargs)

@swagger_auto_schema(
    tags=['Kilométrage'],
    operation_description="Opérations CRUD pour les relevés de kilométrage."
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

    @swagger_auto_schema(
        operation_summary="Lister les relevés de kilométrage",
        operation_description="Retourne les relevés de kilométrage pour les véhicules de l'utilisateur (ou tous pour admin). Peut être filtré par `vehicle_id`.",
        manual_parameters=[
            openapi.Parameter('vehicle_id', openapi.IN_QUERY, description="Filtrer les relevés par ID de véhicule", type=openapi.TYPE_INTEGER)
        ],
        responses={status.HTTP_200_OK: MileageRecordSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Créer un relevé de kilométrage",
        operation_description=(
            "Ajoute un nouveau relevé de kilométrage pour un véhicule spécifié.\n"
            "Le `recorded_by` est défini automatiquement. La `source` est déduite (CUSTOMER/ADMIN).\n"
            "Validation : Le kilométrage doit être >= au dernier relevé pour ce véhicule."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['vehicle', 'mileage'],
            properties={
                'vehicle': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID du véhicule associé"),
                'mileage': openapi.Schema(type=openapi.TYPE_INTEGER, description="Kilométrage enregistré", example=15000),
                'notes': openapi.Schema(type=openapi.TYPE_STRING, description="Notes additionnelles (optionnel)", example="Vérification avant long trajet")
            }
        ),
        responses={
            status.HTTP_201_CREATED: MileageRecordSerializer,
            status.HTTP_400_BAD_REQUEST: "Erreur de validation (ex: kilométrage inférieur, véhicule invalide)",
            status.HTTP_403_FORBIDDEN: "Permission refusée (ex: client ajoutant pour un autre client)"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Set recorded_by and determine source based on user.
           Ensure the user owns the vehicle they are adding mileage for (if not admin).
        """
        user = self.request.user
        vehicle = serializer.validated_data.get('vehicle')

        # Check ownership if the user is not an admin/staff
        if not user.is_staff and vehicle.owner != user:
             # Raise PermissionDenied (403) or ValidationError (400)
             # Using ValidationError might be clearer for field-specific issues
             # Need to ensure 'serializers' is imported in views.py
             raise serializers.ValidationError({"vehicle_id": "Vous ne pouvez ajouter un relevé que pour vos propres véhicules."})

        # Determine source based on user role
        if user.is_staff:
            source = 'ADMIN' # Or 'MECHANIC' based on more specific roles/groups
        else:
            source = 'CUSTOMER'
            
        # Save with recorded_by and determined source
        serializer.save(recorded_by=user, source=source)

    @swagger_auto_schema(operation_summary="Récupérer un relevé spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour un relevé (partiellement) - Admin Seulement",
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour un relevé (complètement) - Admin Seulement",
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Supprimer un relevé - Admin Seulement",
        responses={ 
            status.HTTP_204_NO_CONTENT: "Supprimé avec succès",
            status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" 
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

# --- New ViewSets --- 

@swagger_auto_schema(
    tags=['Types de Service (Admin)'],
    operation_description="Gestion des types de service disponibles (réservé aux administrateurs)."
)
class ServiceTypeViewSet(viewsets.ModelViewSet):
    """Gère les types de service (Admin uniquement - CRUD)."""
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [IsAdminUser] # Example: Only admins can manage service types

    @swagger_auto_schema(operation_summary="Lister tous les types de service")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Créer un nouveau type de service")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Récupérer un type de service spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(operation_summary="Mettre à jour un type de service (partiellement)")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Mettre à jour un type de service (complètement)")
    def update(self, request, *args, **kwargs):
         return super().update(request, *args, **kwargs)
         
    @swagger_auto_schema(operation_summary="Supprimer un type de service")
    def destroy(self, request, *args, **kwargs):
         return super().destroy(request, *args, **kwargs)

@swagger_auto_schema(
    tags=['Événements de Service'],
    operation_description="Gestion des enregistrements des interventions de service effectuées sur les véhicules."
)
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

    @swagger_auto_schema(
        operation_summary="Lister les interventions de service",
        operation_description="Retourne les interventions pour les véhicules de l'utilisateur (ou tous pour admin). Peut être filtré par `vehicle_id`.",
        manual_parameters=[
            openapi.Parameter('vehicle_id', openapi.IN_QUERY, description="Filtrer les interventions par ID de véhicule", type=openapi.TYPE_INTEGER)
        ],
        responses={status.HTTP_200_OK: ServiceEventSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Créer une intervention de service - Admin Seulement",
        operation_description="Enregistre une nouvelle intervention de service pour un véhicule.",
        request_body=ServiceEventSerializer, # Assuming serializer handles required fields
        responses={
            status.HTTP_201_CREATED: ServiceEventSerializer,
            status.HTTP_400_BAD_REQUEST: "Erreur de validation",
            status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """(No specific action needed here beyond permissions check,
           unless we want to link who recorded the event)
        """
        # Validation for vehicle ownership is not strictly needed here
        # because only Mechanics/Admins (who have broad access) can create.
        # If needed later, add check: vehicle = serializer.validated_data['vehicle'] etc.
        serializer.save()

    @swagger_auto_schema(operation_summary="Récupérer une intervention spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour une intervention (partiellement) - Admin Seulement",
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour une intervention (complètement) - Admin Seulement",
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Supprimer une intervention - Admin Seulement",
        responses={ 
            status.HTTP_204_NO_CONTENT: "Supprimé avec succès",
            status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" 
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

@swagger_auto_schema(
    tags=['Règles de Prédiction (Admin)'],
    operation_description="Gestion des règles (intervalles kilométriques/temporels) utilisées pour prédire les prochains services (réservé aux administrateurs)."
)
class PredictionRuleViewSet(viewsets.ModelViewSet):
    """Gère les règles de prédiction basées sur les intervalles (Admin uniquement - CRUD)."""
    queryset = PredictionRule.objects.all().select_related('service_type')
    serializer_class = PredictionRuleSerializer
    permission_classes = [IsAdminUser] # Example: Only admins can manage rules

    @swagger_auto_schema(operation_summary="Lister les règles de prédiction actives")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Créer une nouvelle règle de prédiction")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Récupérer une règle de prédiction spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(operation_summary="Mettre à jour une règle (partiellement)")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
        
    @swagger_auto_schema(operation_summary="Mettre à jour une règle (complètement)")
    def update(self, request, *args, **kwargs):
         return super().update(request, *args, **kwargs)
         
    @swagger_auto_schema(operation_summary="Supprimer une règle de prédiction")
    def destroy(self, request, *args, **kwargs):
         return super().destroy(request, *args, **kwargs)

@swagger_auto_schema(
    tags=['Prédictions de Service'],
    operation_description="Affichage des prédictions de service générées pour les véhicules (lecture seule)."
)
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

    @swagger_auto_schema(
        operation_summary="Lister les prédictions de service",
        operation_description="Retourne les prédictions pour les véhicules de l'utilisateur (ou tous pour admin). Peut être filtré par `vehicle_id`.",
        manual_parameters=[
            openapi.Parameter('vehicle_id', openapi.IN_QUERY, description="Filtrer les prédictions par ID de véhicule", type=openapi.TYPE_INTEGER)
        ],
        responses={status.HTTP_200_OK: ServicePredictionSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @swagger_auto_schema(operation_summary="Récupérer une prédiction spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

# --- Invoice ViewSet --- 

@swagger_auto_schema(
    tags=['Factures'],
    operation_description="Gestion des factures PDF associées aux véhicules."
)
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

    @swagger_auto_schema(
        operation_summary="Lister les factures",
        operation_description="Retourne les factures pour les véhicules de l'utilisateur (ou tous pour admin). Peut être filtré par `vehicle_id`.",
        manual_parameters=[
            openapi.Parameter('vehicle_id', openapi.IN_QUERY, description="Filtrer les factures par ID de véhicule", type=openapi.TYPE_INTEGER)
        ],
        responses={status.HTTP_200_OK: InvoiceSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @swagger_auto_schema(
        operation_summary="Créer/Uploader une facture - Admin Seulement",
        operation_description=(
            "Associe une facture PDF à un véhicule. Requiert `multipart/form-data`.\n"
            "Champs requis: `vehicle` (ID), `invoice_file` (fichier PDF), `final_amount` (montant en TND)."
        ),
        manual_parameters=[
             openapi.Parameter(
                 name="invoice_file", 
                 in_=openapi.IN_FORM, 
                 type=openapi.TYPE_FILE, 
                 required=True, 
                 description="Fichier PDF de la facture"
            ),
             openapi.Parameter(
                 name="vehicle", 
                 in_=openapi.IN_FORM, 
                 type=openapi.TYPE_INTEGER, 
                 required=True, 
                 description="ID du véhicule concerné"
             ),
             openapi.Parameter(
                 name="final_amount", 
                 in_=openapi.IN_FORM, 
                 type=openapi.TYPE_NUMBER, 
                 format=openapi.FORMAT_DECIMAL, 
                 required=True, 
                 description="Montant final de la facture (TND)"
             ),
             openapi.Parameter(
                 name="service_date", 
                 in_=openapi.IN_FORM, 
                 type=openapi.TYPE_STRING, 
                 format=openapi.FORMAT_DATE, 
                 required=False, 
                 description="Date du service (AAAA-MM-JJ, optionnel)"
             ),
            # Add other form fields from InvoiceSerializer if needed
        ],
        # request_body=InvoiceSerializer, # Not ideal for multipart/form-data, use manual_parameters
        responses={
            status.HTTP_201_CREATED: InvoiceSerializer,
            status.HTTP_400_BAD_REQUEST: "Erreur de validation ou fichier manquant/invalide",
            status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)"
        },
        consumes=['multipart/form-data'] # Explicitly state the content type
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Associate the invoice with the uploading user."""
        serializer.save(uploaded_by=self.request.user)

    @swagger_auto_schema(operation_summary="Récupérer une facture spécifique")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour une facture (partiellement) - Admin Seulement",
        # Similar manual_parameters might be needed if allowing file change here
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def partial_update(self, request, *args, **kwargs):
        # Note: Updating file uploads via partial_update can be complex
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Mettre à jour une facture (complètement) - Admin Seulement",
        # Similar manual_parameters needed here
        responses={ status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Supprimer une facture - Admin Seulement",
        responses={ 
            status.HTTP_204_NO_CONTENT: "Supprimé avec succès",
            status.HTTP_403_FORBIDDEN: "Permission refusée (non admin)" 
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
