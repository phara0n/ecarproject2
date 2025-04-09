# Generated by Django 5.2 on 2025-04-09 18:40

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garage', '0002_servicetype_serviceevent_serviceprediction_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='vehicle',
            options={'ordering': ['owner', 'make', 'model'], 'verbose_name': 'Véhicule', 'verbose_name_plural': 'Véhicules'},
        ),
        migrations.AddField(
            model_name='vehicle',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='vehicles', to=settings.AUTH_USER_MODEL, verbose_name='Propriétaire'),
            preserve_default=False,
        ),
    ]
