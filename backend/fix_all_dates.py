#!/usr/bin/env python
import os
import django
import sys

# Configuration Django - corriger le chemin des paramètres
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from garage.models import ServiceEvent
from datetime import datetime, date

# Force la correction de tous les objets
FORCE_ALL = True

print("====== CORRECTION RADICALE DES DATES ======")
count = 0
fixed = 0

# D'abord, corrigeons tous les objets
for se in ServiceEvent.objects.all():
    try:
        d = se.event_date
        is_date_type = isinstance(d, date) and not isinstance(d, datetime)
        
        # Si c'est un date OU si on force la conversion de tous les objets
        if is_date_type or FORCE_ALL:
            count += 1
            old_type = type(d).__name__
            
            # Convertir en datetime (à minuit)
            if is_date_type:
                se.event_date = datetime.combine(d, datetime.min.time())
            else:
                # Assurons-nous que même les datetime sont corrects
                se.event_date = datetime.combine(d.date(), d.time() or datetime.min.time())
                
            se.save(update_fields=['event_date'])
            fixed += 1
            print(f"ID {se.id}: {d} ({old_type}) → {se.event_date} ({type(se.event_date).__name__})")
    except Exception as e:
        print(f"ERREUR sur ID {se.id}: {str(e)}")

print(f"\nTraité: {count} objets, Corrigé: {fixed} objets")

# Vérification finale
print("\n====== VÉRIFICATION FINALE ======")
for se in ServiceEvent.objects.all():
    d = se.event_date
    if isinstance(d, date) and not isinstance(d, datetime):
        print(f"ALERTE: ID {se.id} est toujours un objet date: {d} ({type(d).__name__})")
    else:
        print(f"OK: ID {se.id}: {d} ({type(d).__name__})")

print("\nTerminé. REDÉMARREZ LE SERVEUR DJANGO.") 