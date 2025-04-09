from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from dateutil.relativedelta import relativedelta # For adding months/years
from datetime import datetime, timedelta # Import timedelta

from .models import MileageRecord, ServiceEvent, ServiceType, PredictionRule, ServicePrediction, Vehicle


def calculate_avg_daily_km(vehicle):
    """Calculates average daily KM based on first and last mileage record."""
    first_record = MileageRecord.objects.filter(vehicle=vehicle).order_by('recorded_at').first()
    last_record = MileageRecord.objects.filter(vehicle=vehicle).order_by('-recorded_at').first()

    if not first_record or not last_record or first_record.id == last_record.id:
        return 0 # Not enough data

    delta_km = last_record.mileage - first_record.mileage
    # Ensure we compare date parts only to avoid issues with timezones/DST if using full datetime
    delta_days = (last_record.recorded_at.date() - first_record.recorded_at.date()).days

    if delta_days <= 0 or delta_km < 0: # Avoid division by zero and negative averages
        return 0 
        
    avg_km = delta_km / delta_days
    print(f"DEBUG: Avg daily KM for vehicle {vehicle.id}: {avg_km:.2f} (from {delta_km}km / {delta_days}days)")
    return avg_km

def update_predictions_for_vehicle(vehicle):
    """Recalculates service predictions using rules and estimated daily KM for date."""
    print(f"DEBUG: Updating predictions for vehicle {vehicle.id}...") 
    
    active_rules = PredictionRule.objects.filter(is_active=True).select_related('service_type')
    latest_mileage_record = MileageRecord.objects.filter(vehicle=vehicle).order_by('-recorded_at').first()
    
    # Calculate average daily KM once for the vehicle
    avg_daily_km = calculate_avg_daily_km(vehicle)

    current_mileage = latest_mileage_record.mileage if latest_mileage_record else vehicle.initial_mileage
    current_date = timezone.now().date()

    for rule in active_rules:
        service_type = rule.service_type
        last_service_event = ServiceEvent.objects.filter(
            vehicle=vehicle, 
            service_type=service_type
        ).order_by('-event_date', '-mileage_at_service').first()

        base_mileage = vehicle.initial_mileage
        base_date = vehicle.created_at.date()
        if last_service_event:
            base_mileage = last_service_event.mileage_at_service
            base_date = last_service_event.event_date

        # 1. Calculate Predicted Mileage (Rule-Based)
        rule_predicted_mileage = base_mileage + rule.interval_km

        # 2. Calculate Predicted Date based on Rule Months (if applicable)
        rule_predicted_date = None
        if rule.interval_months:
            if isinstance(base_date, datetime):
                 base_date = base_date.date()
            rule_predicted_date = base_date + relativedelta(months=rule.interval_months)
            # Ensure prediction date is not in the past relative to current date
            if rule_predicted_date < current_date:
                rule_predicted_date = current_date 

        # 3. Estimate Predicted Date based on Average Daily KM
        estimated_mileage_date = None
        if avg_daily_km > 0:
            km_remaining = rule_predicted_mileage - current_mileage
            if km_remaining > 0:
                try:
                    days_remaining = int(km_remaining / avg_daily_km) 
                    estimated_mileage_date = current_date + timedelta(days=days_remaining)
                except OverflowError:
                     print(f"DEBUG: OverflowError calculating days remaining for vehicle {vehicle.id}, service {service_type.id}")
                     estimated_mileage_date = None # Or handle very large numbers differently
            else:
                # Mileage target is already met or passed
                estimated_mileage_date = current_date 
        
        print(f"DEBUG: V:{vehicle.id} S:{service_type.id} - RuleDate:{rule_predicted_date}, EstDate:{estimated_mileage_date}")

        # 4. Choose Final Predicted Date (Earliest of the valid estimates)
        possible_dates = [d for d in [rule_predicted_date, estimated_mileage_date] if d is not None]
        final_predicted_date = min(possible_dates) if possible_dates else None
        
        print(f"DEBUG: V:{vehicle.id} S:{service_type.id} - FinalDate:{final_predicted_date}")

        # 5. Update or Create Prediction
        prediction, created = ServicePrediction.objects.update_or_create(
            vehicle=vehicle,
            service_type=service_type,
            defaults={
                'predicted_due_mileage': rule_predicted_mileage,
                'predicted_due_date': final_predicted_date, # Use the chosen date
                'prediction_source': 'RULE',
            }
        )
        status = "created" if created else "updated"
        print(f"DEBUG: Prediction for '{service_type.name}' V:{vehicle.id} {status}. Due Mileage: {rule_predicted_mileage}, Due Date: {final_predicted_date}")

# Connect the signal handlers

@receiver(post_save, sender=MileageRecord)
def mileage_record_saved_handler(sender, instance, created, **kwargs):
    """When a MileageRecord is saved, update predictions for the vehicle."""
    print("--- MileageRecord SIGNAL HANDLER FIRED ---") # ADDED FOR DEBUG
    print(f"DEBUG: MileageRecord saved for vehicle {instance.vehicle.id}, triggering prediction update.")
    update_predictions_for_vehicle(instance.vehicle)

@receiver(post_save, sender=ServiceEvent)
def service_event_saved_handler(sender, instance, created, **kwargs):
    """When a ServiceEvent is saved, potentially create the first MileageRecord
       if none exists, and then update predictions for the vehicle."""
    print("--- ServiceEvent SIGNAL HANDLER FIRED ---")

    # If this is the first time this event is saved AND no other mileage record exists
    if created and not MileageRecord.objects.filter(vehicle=instance.vehicle).exists():
        print(f"DEBUG: First ServiceEvent for Vehicle {instance.vehicle.id} and no existing MileageRecords. Creating one.")
        MileageRecord.objects.create(
            vehicle=instance.vehicle,
            mileage=instance.mileage_at_service,
            recorded_at=instance.event_date, # Use service date for the record date
            recorded_by=instance.vehicle.owner, # Assume owner initiated? Or link to mechanic?
            source='SERVICE' # Add 'SERVICE' to choices if desired
        )
        # Note: Saving this new MileageRecord will trigger the mileage_record_saved_handler,
        # which will then call update_predictions_for_vehicle. So we might not need the line below.
        # However, calling it directly ensures it runs even if the nested signal fails for some reason.

    print(f"DEBUG: ServiceEvent saved for vehicle {instance.vehicle.id}, triggering prediction update.")
    update_predictions_for_vehicle(instance.vehicle)

# Note: Need to add 'SERVICE' to SOURCE_CHOICES in MileageRecord model if using it.

# Optional: Add handlers for when PredictionRules are changed or ServiceTypes are created/deleted
# if needed to trigger recalculations or cleanup. 