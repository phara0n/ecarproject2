import json
from rest_framework.renderers import JSONRenderer
from rest_framework.utils.serializer_helpers import ReturnDict, ReturnList
from django.utils import timezone

class CustomJSONRenderer(JSONRenderer):
    """Custom renderer to enforce {data, error, metadata} structure."""
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context['response']
        status_code = response.status_code
        view = renderer_context['view']

        response_data = {
            'metadata': {
                'timestamp': timezone.now().isoformat(),
            },
            'data': None,
            'error': None
        }

        # Check for errors based on status code
        is_error = status_code >= 400

        if is_error:
            # Use the translated error data prepared by our custom exception handler
            response_data['error'] = data 
            # Optionally, add an error code based on exception type if available
            # exc = context.get('exception') if context else None 
            # if exc: response_data['error'][_get_error_code(exc)] ...
        else:
            # Handle successful responses
            if isinstance(data, (ReturnDict, dict)) and 'results' in data and hasattr(view, 'paginator') and view.paginator is not None:
                 # Paginated data
                 response_data['data'] = data.get('results')
                 response_data['metadata']['pagination'] = {
                     'count': data.get('count'),
                     'next': data.get('next'),
                     'previous': data.get('previous'),
                 }
            elif data is not None:
                 # Non-paginated successful data or single object
                 response_data['data'] = data
            # Handle cases like 204 No Content where data might be None

        # Ensure correct handling for 204 No Content
        if status_code == 204:
            return super().render(None, accepted_media_type, renderer_context)

        # Return the structured response, rendered as JSON by the parent class
        return super().render(response_data, accepted_media_type, renderer_context)

# Helper to get a basic error code (can be expanded)
# def _get_error_code(exc):
#     from rest_framework.exceptions import APIException
#     if isinstance(exc, APIException):
#         return exc.__class__.__name__ # e.g., "ValidationError", "PermissionDenied"
#     return "ServerError" 