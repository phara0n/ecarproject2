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
    TokenObtainPairView as BaseTokenObtainPairView,
    TokenRefreshView as BaseTokenRefreshView,
)
# Import the new registration view
from garage.views import RegisterView 
from django.contrib.auth import views as auth_views # Import auth views
from garage.views import CurrentUserView # Added import for CurrentUserView
from garage.views import IndexRedirectView # Import for root redirect view

# Imports for serving media files during development
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status

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

# --- Custom JWT Views with Swagger Documentation ---

@swagger_auto_schema(
    tags=['Authentification'],
    operation_summary="Obtenir les jetons JWT (Login)",
    operation_description=(
        "Authentifie un utilisateur avec son `username` et `password` et retourne des jetons JWT (access et refresh).\\n\\n"
        "Le jeton `access` est utilisé pour authentifier les requêtes API suivantes.\\n"
        "Le jeton `refresh` est utilisé pour obtenir un nouveau jeton `access` lorsque celui-ci expire (via `/api/v1/token/refresh/`)."
    ),
    # No explicit request_body needed, simplejwt serializer handles it
    # request_body=openapi.Schema(...), 
    responses={
        status.HTTP_200_OK: openapi.Response(
            description="Authentification réussie. Jetons JWT retournés.",
            examples={
                "application/json": {
                    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                }
            }
        ),
        status.HTTP_401_UNAUTHORIZED: openapi.Response(
            description="Échec de l'authentification. Identifiants invalides.",
            examples={
                "application/json": {
                    "detail": "Aucun compte actif trouvé avec les identifiants fournis"
                }
            }
        )
    }
)
class TokenObtainPairView(BaseTokenObtainPairView):
    """Custom view to add Swagger documentation to the JWT login endpoint."""
    pass # Inherits functionality, just adds docs

@swagger_auto_schema(
    tags=['Authentification'],
    operation_summary="Rafraîchir le jeton JWT access",
    operation_description=(
        "Utilise un jeton `refresh` valide pour obtenir un nouveau jeton `access`.\\n\\n"
        "Ceci est utile lorsque le jeton `access` a expiré mais que le jeton `refresh` est toujours valide."
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['refresh'],
        properties={
            'refresh': openapi.Schema(type=openapi.TYPE_STRING, description="Le jeton refresh valide.")
        }
    ),
    responses={
        status.HTTP_200_OK: openapi.Response(
            description="Nouveau jeton access généré.",
            examples={
                "application/json": {
                    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (nouveau jeton)"
                }
            }
        ),
        status.HTTP_401_UNAUTHORIZED: openapi.Response(
            description="Échec du rafraîchissement. Jeton refresh invalide ou expiré.",
            examples={
                "application/json": {
                    "detail": "Le jeton est invalide ou a expiré",
                    "code": "token_not_valid"
                }
            }
        )
    }
)
class TokenRefreshView(BaseTokenRefreshView):
    """Custom view to add Swagger documentation to the JWT refresh endpoint."""
    pass # Inherits functionality, just adds docs

# --- Main URL Patterns --- 

urlpatterns = [
    # Root URL - redirect to Swagger UI
    path('', IndexRedirectView.as_view(), name='index'),
    path('admin/', admin.site.urls),
    # API v1 URLs
    path('api/v1/register/', RegisterView.as_view(), name='register'), 
    # Use the custom views with docs
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/users/me/', CurrentUserView.as_view(), name='current-user'),
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
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # Add other app URLs or API versions here later
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
