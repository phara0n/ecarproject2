from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, MileageRecordViewSet, ServiceTypeViewSet, 
    ServiceEventViewSet, PredictionRuleViewSet, ServicePredictionViewSet,
    InvoiceViewSet, CustomerListView, UserViewSet
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
router.register(r'users', UserViewSet, basename='user')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # Add URL for listing customers (admins only) FIRST
    path('users/customers/', CustomerListView.as_view(), name='customer-list'),
    # Include router URLs AFTER specific paths
    path('', include(router.urls)),
] 