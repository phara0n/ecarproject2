# Generated by Django 5.2 on 2025-04-09 19:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garage', '0006_invoice'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='initial_mileage',
            field=models.PositiveIntegerField(default=0, verbose_name='Kilométrage Initial'),
            preserve_default=False,
        ),
    ]
