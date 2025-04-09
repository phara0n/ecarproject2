"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Import the new registration view
from garage.views import RegisterView 
from django.contrib.auth import views as auth_views # Import auth views

# Imports for serving media files during development
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# --- drf-yasg Schema View Setup --- 
schema_view = get_schema_view(
   openapi.Info(
      title="ECAR Garage API",
      default_version='v1',
      description="API pour la gestion du système ECAR Garage, incluant véhicules, clients, services et prédictions.",
      terms_of_service="/terms/",
      contact=openapi.Contact(email="contact@ecar.tn"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1 URLs
    path('api/v1/register/', RegisterView.as_view(), name='register'), # Add registration URL
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/', include('garage.urls')), # Include garage app resource URLs
    # Password Reset URLs (using Django's built-in views)
    path('password-reset/',
         auth_views.PasswordResetView.as_view(template_name='password_reset/form.html', email_template_name='password_reset/email.html', subject_template_name='password_reset/subject.txt'),
         name='password_reset'),
    path('password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='password_reset/done.html'),
         name='password_reset_done'),
    path('reset/<uidb64>/<token>/', # This path matches the link sent in the email
         auth_views.PasswordResetConfirmView.as_view(template_name='password_reset/confirm.html'),
         name='password_reset_confirm'),
    path('reset/done/',
         auth_views.PasswordResetCompleteView.as_view(template_name='password_reset/complete.html'),
         name='password_reset_complete'),
    # Swagger / OpenAPI URLs
    path('swagger<format>/\.json|\.yaml', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # Add other app URLs or API versions here later
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
