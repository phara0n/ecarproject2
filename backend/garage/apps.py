from django.apps import AppConfig


class GarageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'garage'

    def ready(self):
        # Import signals here to ensure they are connected when the app is ready.
        import garage.signals
