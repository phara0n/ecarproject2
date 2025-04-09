from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, MileageRecordViewSet, ServiceTypeViewSet, 
    ServiceEventViewSet, PredictionRuleViewSet, ServicePredictionViewSet,
    InvoiceViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'mileage-records', MileageRecordViewSet, basename='mileagerecord')
router.register(r'service-types', ServiceTypeViewSet, basename='servicetype')
router.register(r'service-events', ServiceEventViewSet, basename='serviceevent')
router.register(r'prediction-rules', PredictionRuleViewSet, basename='predictionrule')
router.register(r'service-predictions', ServicePredictionViewSet, basename='serviceprediction')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
] 