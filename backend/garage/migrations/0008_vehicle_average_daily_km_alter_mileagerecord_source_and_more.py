# Generated by Django 5.2 on 2025-04-11 20:57

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garage', '0007_vehicle_initial_mileage'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='average_daily_km',
            field=models.FloatField(blank=True, default=None, null=True, verbose_name='Moyenne Kilométrage Journalier (km/jour)'),
        ),
        migrations.AlterField(
            model_name='mileagerecord',
            name='source',
            field=models.CharField(choices=[('CUSTOMER', 'Client'), ('ADMIN', 'Admin'), ('MECHANIC', 'Mécanicien'), ('INITIAL', 'Initial'), ('SERVICE', 'Service')], default='ADMIN', max_length=10, verbose_name='Source'),
        ),
        migrations.AlterField(
            model_name='vehicle',
            name='registration_number',
            field=models.CharField(max_length=50, unique=True, validators=[django.core.validators.RegexValidator(message="Le numéro d'immatriculation doit être au format tunisien (ex: 123TU1234 ou RS123456).", regex='^(?:(?:\\d{1,3}[Tt][Uu]\\d{1,4})|(?:[Rr][Ss]\\d+))$')], verbose_name="Numéro d'immatriculation"),
        ),
    ]
