from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings # To reference AUTH_USER_MODEL
from django.core.validators import RegexValidator # Import RegexValidator
# Consider using settings.AUTH_USER_MODEL if you customize the User model later
from django.contrib.auth.models import User

# Validator for Tunisian registration numbers (e.g., 123TU1234 or RS123456)
tunisian_plate_validator = RegexValidator(
    # Match either TU format OR RS format, case-insensitive
    regex=r'^(?:(?:\d{1,3}[Tt][Uu]\d{1,4})|(?:[Rr][Ss]\d+))$',
    message="Le numéro d'immatriculation doit être au format tunisien (ex: 123TU1234 ou RS123456)."
)

# Validator for Tunisian phone numbers (e.g., +216 XX XXX XXX)
tunisian_phone_validator = RegexValidator(
    # Allows +216 followed by optional space and 8 digits (can be grouped)
    regex=r'^\+216\s?\d{2}\s?\d{3}\s?\d{3}$',
    message="Le numéro de téléphone doit être au format tunisien (ex: +216 20 123 456)."
)

class Vehicle(models.Model):
    """Represents a vehicle in the garage."""
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, # Or models.PROTECT/SET_NULL depending on desired behavior when user is deleted
        related_name='vehicles',
        verbose_name="Propriétaire"
    )
    make = models.CharField(max_length=100, verbose_name="Marque")
    model = models.CharField(max_length=100, verbose_name="Modèle")
    year = models.PositiveIntegerField(null=True, blank=True, verbose_name="Année")
    registration_number = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="Numéro d'immatriculation",
        validators=[tunisian_plate_validator] # Add the validator
    )
    vin = models.CharField(max_length=17, unique=True, null=True, blank=True, verbose_name="VIN") # Vehicle Identification Number
    initial_mileage = models.PositiveIntegerField(verbose_name="Kilométrage Initial") # Add initial mileage
    # Add the new field here
    average_daily_km = models.FloatField(
        null=True,
        blank=True, # Allow blank in forms/admin
        default=None, # Default to None (unknown/not calculated)
        verbose_name="Moyenne Kilométrage Journalier (km/jour)"
    )
    # Add owner relationship if needed, e.g., ForeignKey to User or a Customer model
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.registration_number}) - {self.owner.username}"

    class Meta:
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
        ordering = ['owner', 'make', 'model'] # Order by owner then make/model

class MileageRecord(models.Model):
    """Represents a mileage reading for a vehicle."""
    SOURCE_CHOICES = [
        ('CUSTOMER', 'Client'),
        ('ADMIN', 'Admin'),
        ('MECHANIC', 'Mécanicien'),
        ('INITIAL', 'Initial'), 
        ('SERVICE', 'Service'), # Add Service source
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='mileage_records', verbose_name="Véhicule")
    mileage = models.PositiveIntegerField(verbose_name="Kilométrage")
    recorded_at = models.DateTimeField(default=timezone.now, verbose_name="Date d'enregistrement")
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='ADMIN', verbose_name="Source")
    recorded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Enregistré par") # Optional link to user who recorded it

    def clean(self):
        """Validate that mileage is not less than the previous record for the same vehicle."""
        latest_record = MileageRecord.objects.filter(vehicle=self.vehicle).order_by('-recorded_at', '-id').first()
        if latest_record and self.mileage < latest_record.mileage:
            raise ValidationError({
                'mileage': f'Le kilométrage ({self.mileage} km) ne peut pas être inférieur au dernier relevé ({latest_record.mileage} km).'
            })

    def save(self, *args, **kwargs):
        self.full_clean() # Call clean() before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vehicle}: {self.mileage} km at {self.recorded_at.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        verbose_name = "Relevé de Kilométrage"
        verbose_name_plural = "Relevés de Kilométrage"
        ordering = ['-recorded_at'] # Show newest first

class ServiceType(models.Model):
    """Represents a type of service offered by the garage."""
    name = models.CharField(max_length=200, unique=True, verbose_name="Nom du Service")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    # Default interval for rule-based prediction (Phase 1)
    default_interval_km = models.PositiveIntegerField(null=True, blank=True, verbose_name="Intervalle par défaut (km)")
    default_interval_months = models.PositiveIntegerField(null=True, blank=True, verbose_name="Intervalle par défaut (mois)")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Type de Service"
        verbose_name_plural = "Types de Service"
        ordering = ['name']

class ServiceEvent(models.Model):
    """Represents an instance of a service performed on a vehicle."""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='service_events', verbose_name="Véhicule")
    service_type = models.ForeignKey(ServiceType, on_delete=models.PROTECT, related_name='service_events', verbose_name="Type de Service") # Protect deletion if events exist
    event_date = models.DateField(default=timezone.now, verbose_name="Date de l'intervention")
    mileage_at_service = models.PositiveIntegerField(verbose_name="Kilométrage lors de l'intervention")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    # Link to Invoice model if created later
    # invoice = models.ForeignKey('Invoice', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service_type} for {self.vehicle} on {self.event_date.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Intervention de Service"
        verbose_name_plural = "Interventions de Service"
        ordering = ['-event_date', '-id']

# For Phase 1: Rule-Based Predictions
class PredictionRule(models.Model):
    """Defines a rule for predicting service needs based on intervals."""
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='prediction_rules')
    # Optional: Link to specific make/model for more granular rules later
    # vehicle_make = models.CharField(max_length=100, blank=True, null=True)
    # vehicle_model = models.CharField(max_length=100, blank=True, null=True)
    interval_km = models.PositiveIntegerField(verbose_name="Intervalle (km)")
    interval_months = models.PositiveIntegerField(null=True, blank=True, verbose_name="Intervalle (mois)")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    def __str__(self):
        return f"Rule for {self.service_type} every {self.interval_km} km" + (f" or {self.interval_months} months" if self.interval_months else "")

    class Meta:
        verbose_name = "Règle de Prédiction"
        verbose_name_plural = "Règles de Prédiction"
        # Ensure only one active rule per service type (can add make/model later)
        constraints = [
            models.UniqueConstraint(fields=['service_type'], condition=models.Q(is_active=True), name='unique_active_rule_per_service')
        ]

class ServicePrediction(models.Model):
    """Stores the calculated prediction for a future service need."""
    PREDICTION_SOURCE_CHOICES = [
        ('RULE', 'Basée sur règle'),
        ('ML', 'Modèle ML'), # For Phase 2
    ]
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='service_predictions')
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='service_predictions')
    predicted_due_date = models.DateField(null=True, blank=True, verbose_name="Date d'échéance prévue")
    predicted_due_mileage = models.PositiveIntegerField(null=True, blank=True, verbose_name="Kilométrage prévu")
    prediction_source = models.CharField(max_length=10, choices=PREDICTION_SOURCE_CHOICES, default='RULE')
    generated_at = models.DateTimeField(auto_now_add=True)
    # Optional: Add confidence score later for ML models
    # confidence_score = models.FloatField(null=True, blank=True)

    def __str__(self):
        due = []
        if self.predicted_due_date:
            due.append(f"date: {self.predicted_due_date.strftime('%d/%m/%Y')}")
        if self.predicted_due_mileage:
            due.append(f"mileage: {self.predicted_due_mileage} km")
        return f"Prediction for {self.service_type} on {self.vehicle}: Due { ' or '.join(due) }"

    class Meta:
        verbose_name = "Prédiction de Service"
        verbose_name_plural = "Prédictions de Service"
        ordering = ['vehicle', 'predicted_due_date', 'predicted_due_mileage']
        # Ensure only one active prediction per vehicle/service type
        constraints = [
            models.UniqueConstraint(fields=['vehicle', 'service_type'], name='unique_prediction_per_vehicle_service')
        ]

# --- Customer Profile Model --- 

class CustomerProfile(models.Model):
    """Stores additional profile information for a user, specifically customers."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        primary_key=True, # Make the user the primary key
        related_name='customer_profile',
        verbose_name="Utilisateur"
    )
    phone_number = models.CharField(
        max_length=20, 
        unique=True, # Assuming phone numbers should be unique
        validators=[tunisian_phone_validator],
        verbose_name="Numéro de téléphone"
    )
    # Add any other customer-specific fields here later (e.g., address)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

    class Meta:
        verbose_name = "Profil Client"
        verbose_name_plural = "Profils Client"

# Optional: Signal to auto-create profile when a User is created
# (We will handle this in the RegisterSerializer instead for now)
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# @receiver(post_save, sender=settings.AUTH_USER_MODEL)
# def create_user_profile(sender, instance, created, **kwargs):
#     if created:
#         # Check if user is intended to be a customer before creating?
#         # Might need adjustment based on how Admins/Mechanics are created.
#         CustomerProfile.objects.create(user=instance)
# @receiver(post_save, sender=settings.AUTH_USER_MODEL)
# def save_user_profile(sender, instance, **kwargs):
#     # Ensure profile is saved if user is saved (though OneToOneField usually handles this)
#     try:
#         instance.customer_profile.save()
#     except CustomerProfile.DoesNotExist:
#         # Handle case where profile might not exist yet (e.g., for existing users)
#         pass

# --- Invoice Model --- 

class Invoice(models.Model):
    """Represents an uploaded invoice PDF related to a vehicle/service."""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='invoices', verbose_name="Véhicule")
    # Optional link to a specific service event
    service_event = models.ForeignKey(ServiceEvent, null=True, blank=True, on_delete=models.SET_NULL, related_name='invoices', verbose_name="Intervention Associée")
    # Store the PDF file itself
    pdf_file = models.FileField(upload_to='invoices/%Y/%m/', verbose_name="Fichier PDF")
    # Store the final amount - use DecimalField for currency
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Montant Final (DT)")
    invoice_date = models.DateField(null=True, blank=True, verbose_name="Date de Facture")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'Upload")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='uploaded_invoices', verbose_name="Uploadé par")

    def __str__(self):
        return f"Invoice for {self.vehicle} - {self.uploaded_at.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-uploaded_at']
