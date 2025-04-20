from rest_framework import serializers
from .models import Vehicle, MileageRecord, ServiceType, ServiceEvent, PredictionRule, ServicePrediction, CustomerProfile, tunisian_phone_validator, Invoice
from django.conf import settings # Use settings.AUTH_USER_MODEL
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model # Import get_user_model
from django.db import transaction
from django.core.exceptions import ValidationError
from datetime import datetime

# Get the actual User model class
User = get_user_model()

class VehicleSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le modèle Vehicle.
    Gère la conversion entre les objets Vehicle et leur représentation JSON.
    Utilisé pour afficher les détails des véhicules et pour la création/mise à jour (validation).
    """
    # Display username for readability, but make owner read-only in the serializer
    # It will be set automatically in the view based on the logged-in user.
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    # Make owner writable via its ID for creation/update
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='owner', write_only=True, 
        label="ID Propriétaire"
    )

    class Meta:
        model = Vehicle
        fields = [
            'id', 
            # 'owner', # Keep original read-only nested or pk representation if needed later 
            'owner_id', # Writable field for setting the owner
            'owner_username', # Readable username (read-only)
            'make', 
            'model', 
            'year', 
            'registration_number', 
            'vin', 
            'initial_mileage', # Add initial_mileage
            'average_daily_km', # <--- Add the new field here
            'created_at', 
            'updated_at'
        ]
        # Owner is now writable via owner_id
        read_only_fields = ['id', 'owner_username', 'average_daily_km', 'created_at', 'updated_at']

class MileageRecordSerializer(serializers.ModelSerializer):
    """Serializer for the MileageRecord model."""
    # Display username instead of user ID for better readability (optional)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    # Make vehicle field writable by ID, but represent as nested object on read
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), source='vehicle', write_only=True
    )

    class Meta:
        model = MileageRecord
        fields = [
            'id',
            'vehicle', # Read representation (nested or pk, depending on depth)
            'vehicle_id', # Write representation
            'mileage', 
            'recorded_at', 
            'source', 
            'recorded_by', # Foreign key ID (useful for filtering/updates)
            'recorded_by_username' # Readable username
        ]
        read_only_fields = ['id', 'recorded_at', 'vehicle']

    # Optional: Add depth for nested vehicle representation on read
    # depth = 1 

    def create(self, validated_data):
        # Automatically set recorded_by if user is available in context
        # This will be overridden by perform_create in the view, but good default
        request = self.context.get('request')
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
            
        # Create the instance first (without saving to DB yet)
        instance = MileageRecord(**validated_data)
        
        # Perform model-level validation (including mileage check)
        try:
            instance.full_clean()
        except ValidationError as e:
            # Convert Django ValidationError to DRF ValidationError
            raise serializers.ValidationError(serializers.as_serializer_error(e))
            
        # If validation passes, let super().create handle the actual DB save
        # The view's perform_create will override recorded_by and set source
        return super().create(validated_data)

    def validate_mileage(self, value):
        """Ensure mileage is positive."""
        if value <= 0:
            raise serializers.ValidationError("Le kilométrage doit être un nombre positif.")
        return value 

# --- New Serializers --- 

class ServiceTypeSerializer(serializers.ModelSerializer):
    """Serializer for the ServiceType model."""
    class Meta:
        model = ServiceType
        fields = '__all__' # Include all fields

class ServiceEventSerializer(serializers.ModelSerializer):
    """Serializer for the ServiceEvent model."""
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), source='vehicle', write_only=True
    )
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceType.objects.all(), source='service_type', write_only=True
    )
    vehicle_info = serializers.SerializerMethodField()
    service_type_info = serializers.SerializerMethodField()
    event_date = serializers.DateTimeField()

    class Meta:
        model = ServiceEvent
        fields = [
            'id', 
            'vehicle_id', 
            'service_type_id', 
            'event_date', 
            'mileage_at_service', 
            'notes', 
            'created_at',
            'vehicle_info', 
            'service_type_info',
        ]
        read_only_fields = ['id', 'created_at']

    def get_vehicle_info(self, obj):
        if not obj.vehicle:
            return None
        return {
            'id': obj.vehicle.id,
            'registration_number': getattr(obj.vehicle, 'registration_number', None),
            'make': getattr(obj.vehicle, 'make', None),
            'model': getattr(obj.vehicle, 'model', None)
        }
    
    def get_service_type_info(self, obj):
        if not obj.service_type:
            return None
        return {
            'id': obj.service_type.id,
            'name': obj.service_type.name,
            'description': obj.service_type.description
        }
    
    def to_representation(self, instance):
        # Convertir le champ event_date en datetime si c'est un date
        from datetime import date
        if hasattr(instance, 'event_date') and isinstance(instance.event_date, date) and not isinstance(instance.event_date, datetime):
            instance.event_date = datetime.combine(instance.event_date, datetime.min.time())
            instance.save(update_fields=['event_date'])
        
        return super().to_representation(instance)

    def create(self, validated_data):
        service_event = super().create(validated_data)
        mileage = validated_data.get('mileage_at_service')
        if mileage:
            MileageRecord.objects.create(
                vehicle=service_event.vehicle,
                mileage=mileage,
                recorded_at=service_event.event_date,
                source='ADMIN'
            )
        return service_event

class PredictionRuleSerializer(serializers.ModelSerializer):
    """Serializer for the PredictionRule model."""
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceType.objects.all(), source='service_type', write_only=True
    )
    service_type_info = ServiceTypeSerializer(source='service_type', read_only=True)

    class Meta:
        model = PredictionRule
        fields = [
            'id', 
            'service_type_id', 
            'interval_km', 
            'interval_months', 
            'is_active',
            # Read-only representation
            'service_type_info'
        ]
        read_only_fields = ['id']

class ServicePredictionSerializer(serializers.ModelSerializer):
    """Serializer for the ServicePrediction model."""
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), source='vehicle', write_only=True
    )
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceType.objects.all(), source='service_type', write_only=True
    )
    vehicle_info = VehicleSerializer(source='vehicle', read_only=True)
    service_type_info = ServiceTypeSerializer(source='service_type', read_only=True)
    
    class Meta:
        model = ServicePrediction
        fields = [
            'id', 
            'vehicle_id', 
            'service_type_id', 
            'predicted_due_date', 
            'predicted_due_mileage', 
            'prediction_source', 
            'generated_at',
            # Read-only representations
            'vehicle_info',
            'service_type_info'
        ]
        # Typically predictions are generated by the system, so make them read-only by default
        read_only_fields = ['id', 'generated_at', 'prediction_source']

    # Add validation if needed, e.g., ensure due date or mileage is present 

# --- User Serializer --- 

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number']

    def get_phone_number(self, obj):
        # Correction : éviter l'exception si le profil n'existe pas
        customer_profile = getattr(obj, 'customer_profile', None)
        if customer_profile is not None:
            return getattr(customer_profile, 'phone_number', None)
        return None

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', '')
        user = super().create(validated_data)
        from garage.models import CustomerProfile
        CustomerProfile.objects.create(user=user, phone_number=phone_number)
        return user

    def update(self, instance, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        user = super().update(instance, validated_data)
        if phone_number is not None:
            from garage.models import CustomerProfile
            profile, _ = CustomerProfile.objects.get_or_create(user=user)
            profile.phone_number = phone_number
            profile.save()
        return user

# --- Profile Serializer (for updating phone number) ---
class ProfileSerializer(serializers.ModelSerializer):
     class Meta:
         model = CustomerProfile
         fields = ['phone_number'] # Only allow updating phone_number for now
         extra_kwargs = {
             'phone_number': {'validators': [tunisian_phone_validator]}
         }

# --- Minimal Customer List Serializer ---
class CustomerListSerializer(serializers.ModelSerializer):
    """Minimal serializer for listing customers (ID, Username, First/Last Name, Email, Phone)."""
    # Correctement sourcer le numéro de téléphone du profil lié
    phone_number = serializers.CharField(source='customer_profile.phone_number', read_only=True, allow_null=True)

    class Meta:
        model = User
        # S'assurer que phone_number est dans la liste
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone_number']

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    # Explicit fields are needed for validation/write_only
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")
    email = serializers.EmailField(required=True) # Email is on User model, but explicit allows easy required=True
    phone_number = serializers.CharField(required=True, validators=[tunisian_phone_validator], write_only=True) # Add write_only=True

    class Meta:
        model = User 
        # Add 'id' to the fields tuple to include it in the response
        fields = ('id', 'username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone_number') 
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les deux mots de passe ne correspondent pas."}) 
        # Add validation for phone number uniqueness if needed (model already has unique=True)
        # if CustomerProfile.objects.filter(phone_number=attrs['phone_number']).exists():
        #     raise serializers.ValidationError({"phone_number": "Ce numéro de téléphone est déjà utilisé."}) 
        return attrs

    @transaction.atomic 
    def create(self, validated_data):
        # Pop phone_number as it doesn't belong to the User model directly
        phone_number = validated_data.pop('phone_number')
        # Pop password2 as it's not needed for User creation
        validated_data.pop('password2')
        
        # Create User instance first
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ""),
            last_name=validated_data.get('last_name', "")
        )
        user.set_password(validated_data['password'])
        user.save()

        # Create CustomerProfile instance
        CustomerProfile.objects.create(user=user, phone_number=phone_number)

        # Add user to the 'Customers' group
        try:
            customer_group = Group.objects.get(name='Customers')
            user.groups.add(customer_group)
        except Group.DoesNotExist:
            print("ERROR: 'Customers' group not found during registration.")
            pass 

        # Ensure the created user instance is returned
        return user 

# --- Invoice Serializer --- 

class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for the Invoice model."""
    # Use PrimaryKeyRelatedField for writing vehicle/service_event IDs
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), source='vehicle', write_only=True
    )
    service_event_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceEvent.objects.all(), source='service_event', required=False, allow_null=True, write_only=True
    )
    # Read-only fields for displaying related info
    vehicle_info = VehicleSerializer(source='vehicle', read_only=True)
    # Provide URL for the uploaded file
    pdf_file_url = serializers.FileField(source='pdf_file', read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'vehicle_id', # Write
            'service_event_id', # Write (Optional)
            'pdf_file', # Write (Upload)
            'final_amount',
            'invoice_date',
            'uploaded_at',
            'uploaded_by', # Read only ID
            # Read-only fields
            'vehicle_info',
            'pdf_file_url', 
            'uploaded_by_username'
        ]
        # pdf_file is handled by upload parsers, uploaded_by is set in view
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']

    # Add validation if final_amount should be required, etc. 