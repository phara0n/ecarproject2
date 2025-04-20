#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecarproject.settings')
django.setup()

from garage.models import ServiceEvent
from datetime import datetime, date

print("ServiceEvents avec problème:")
count = 0
fixed = 0

for se in ServiceEvent.objects.all():
    d = se.event_date
    if isinstance(d, date) and not isinstance(d, datetime):
        count += 1
        print(f"ID {se.id}: {d} ({type(d).__name__})")
        
        # Correction
        se.event_date = datetime.combine(d, datetime.min.time())
        se.save(update_fields=['event_date'])
        fixed += 1
        print(f"  → Corrigé: {se.event_date} ({type(se.event_date).__name__})")

print(f"Total: {count} problème(s) trouvé(s), {fixed} corrigé(s)")
print("Redémarrez le serveur Django pour appliquer les changements.") 