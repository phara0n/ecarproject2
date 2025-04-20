from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Vehicle, MileageRecord, ServiceType, ServiceEvent, 
    PredictionRule, ServicePrediction, CustomerProfile, Invoice # Import CustomerProfile and Invoice
)

# --- Inline Admin for Customer Profile --- 

class CustomerProfileInline(admin.StackedInline):
    """Defines an inline admin descriptor for CustomerProfile model,
    which acts a bit like a singleton"""
    model = CustomerProfile
    can_delete = False # Don't allow deleting the profile from the User page
    verbose_name_plural = 'Profil Client'
    fk_name = 'user'

# --- Define a new User admin --- 

class UserAdmin(BaseUserAdmin):
    inlines = (CustomerProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_phone_number')
    list_select_related = ('customer_profile',) # Optimize query

    # Method to display phone number in list view
    def get_phone_number(self, instance):
        try:
            return instance.customer_profile.phone_number
        except CustomerProfile.DoesNotExist:
            return None
    get_phone_number.short_description = 'Téléphone' # Column header

# Re-register UserAdmin
admin.site.unregister(User) # Unregister base User admin
admin.site.register(User, UserAdmin) # Register new User admin with inline profile


# --- Existing Model Admins --- 

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('make', 'model', 'registration_number', 'owner', 'initial_mileage', 'year', 'updated_at')
    list_filter = ('make', 'year', 'owner')
    search_fields = ('make', 'model', 'registration_number', 'vin', 'owner__username', 'owner__email')
    raw_id_fields = ('owner',)

@admin.register(MileageRecord)
class MileageRecordAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'mileage', 'recorded_at', 'source', 'recorded_by')
    list_filter = ('source', 'recorded_at', 'vehicle__make', 'vehicle__owner') # Filter by owner
    search_fields = ('vehicle__registration_number', 'vehicle__make', 'vehicle__model', 'vehicle__owner__username')
    raw_id_fields = ('vehicle', 'recorded_by')
    readonly_fields = ('recorded_at',)

@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'default_interval_km', 'default_interval_months')
    search_fields = ('name', 'description')

@admin.register(ServiceEvent)
class ServiceEventAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'service_type', 'event_date', 'mileage_at_service')
    list_filter = ('service_type', 'event_date', 'vehicle__make')
    search_fields = ('vehicle__registration_number', 'vehicle__make', 'vehicle__model', 'service_type__name', 'notes')
    raw_id_fields = ('vehicle', 'service_type')
    date_hierarchy = 'event_date'

@admin.register(PredictionRule)
class PredictionRuleAdmin(admin.ModelAdmin):
    list_display = ('service_type', 'interval_km', 'interval_months', 'is_active')
    list_filter = ('is_active', 'service_type')
    search_fields = ('service_type__name',)
    raw_id_fields = ('service_type',)

@admin.register(ServicePrediction)
class ServicePredictionAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'service_type', 'predicted_due_date', 'predicted_due_mileage', 'prediction_source')
    list_filter = ('prediction_source', 'service_type', 'vehicle__make')
    search_fields = ('vehicle__registration_number', 'vehicle__make', 'vehicle__model', 'service_type__name')
    raw_id_fields = ('vehicle', 'service_type')
    readonly_fields = ('generated_at',)

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'final_amount', 'invoice_date', 'uploaded_at', 'uploaded_by', 'pdf_file')
    list_filter = ('vehicle__owner', 'vehicle__make', 'invoice_date', 'uploaded_at')
    search_fields = ('vehicle__registration_number', 'vehicle__make', 'final_amount', 'uploaded_by__username')
    raw_id_fields = ('vehicle', 'service_event', 'uploaded_by')
    readonly_fields = ('uploaded_at',)
    date_hierarchy = 'invoice_date'

# Alternatively, simple registration:
# admin.site.register(Vehicle)
# admin.site.register(MileageRecord)
# admin.site.register(ServiceType)
# admin.site.register(ServiceEvent)
# admin.site.register(PredictionRule)
# admin.site.register(ServicePrediction)
