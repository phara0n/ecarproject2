from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, PermissionDenied, NotAuthenticated
from django.utils.translation import gettext_lazy as _ # For potential future i18n setup

# Basic dictionary for known error string translations
# This will need to be expanded significantly
FRENCH_ERRORS = {
    # Default DRF / Django validation
    "This field is required.": "Ce champ est obligatoire.",
    "Enter a valid email address.": "Entrez une adresse e-mail valide.",
    "Ensure this value has at least {min_length} characters (it has {current_length}).": 
        "Assurez-vous que cette valeur comporte au moins {min_length} caractères (elle en a {current_length}).",
    "Passwords must match.": "Les deux mots de passe ne correspondent pas.", # Example from RegisterSerializer
    # Authentication
    "Authentication credentials were not provided.": "Les informations d'authentification n'ont pas été fournies.",
    "Invalid token.": "Jeton invalide.",
    "Token is invalid or expired": "Le jeton est invalide ou a expiré",
    "User not found": "Utilisateur non trouvé",
    "No active account found with the given credentials": "Aucun compte actif trouvé avec les informations d'identification fournies",
    # Permissions
    "You do not have permission to perform this action.": "Vous n'avez pas la permission d'effectuer cette action.",
    # Custom Validation (add messages from our validators/serializers)
    "Registration number must be in Tunisian format (e.g., 123TU1234 or RS123456).": 
        "Le numéro d'immatriculation doit être au format tunisien (ex: 123TU1234 ou RS123456).",
    "Phone number must be in Tunisian format (e.g., +216 20 123 456).": 
        "Le numéro de téléphone doit être au format tunisien (ex: +216 20 123 456).",
    "Mileage must be a positive number.": "Le kilométrage doit être un nombre positif.",
    "You can only add records for your own vehicles.": "Vous ne pouvez ajouter un relevé que pour vos propres véhicules.",
    # Generic
    "Invalid input.": "Entrée invalide."
}

def translate_drf_error(error_detail):
    """Recursively translate DRF error messages/details."""
    if isinstance(error_detail, list):
        return [translate_drf_error(item) for item in error_detail]
    elif isinstance(error_detail, dict):
        return {key: translate_drf_error(value) for key, value in error_detail.items()}
    elif isinstance(error_detail, str):
        # Attempt direct translation
        translated = FRENCH_ERRORS.get(error_detail, error_detail)
        # Attempt translation for formatted strings (like min_length)
        # This is basic, more complex formatting might need specific handling
        if '{min_length}' in error_detail and translated == error_detail: # Only if direct lookup failed
             key_pattern = "Ensure this value has at least {min_length} characters (it has {current_length})."
             if key_pattern in FRENCH_ERRORS:
                 try:
                     # Extract numbers (simple parsing, might break)
                     parts = error_detail.split(' ')
                     min_len = parts[6]
                     cur_len = parts[-2].replace(').','')
                     translated = FRENCH_ERRORS[key_pattern].format(min_length=min_len, current_length=cur_len)
                 except (IndexError, ValueError):
                     pass # Keep original if parsing fails
        return translated
    else:
        return error_detail # Keep non-string types as is


def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now, override the response data with French messages if possible
    if response is not None:
        print(f"DEBUG: Original error data: {response.data}") # Log original
        
        if isinstance(response.data, dict):
            # Standard DRF validation errors are dicts {field: [messages]} or {non_field_errors: [...]} 
            # or simple {detail: message}
            translated_data = translate_drf_error(response.data)
            response.data = translated_data
        elif isinstance(response.data, list):
             # Sometimes errors are lists of strings
             response.data = translate_drf_error(response.data)

        print(f"DEBUG: Translated error data: {response.data}") # Log translated
        
        # Potentially modify structure here later to match {error: {code:..., message:...}}
        # For now, just translate the messages within the existing structure.

    return response 