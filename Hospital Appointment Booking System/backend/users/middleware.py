import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._body = request.body # Cache body

    def process_response(self, request, response):
        if not request.path.startswith('/api/'):
            return response

        # Don't log if it's not a modifying action unless it's an error
        if request.method in ['GET', 'OPTIONS', 'HEAD'] and response.status_code < 400:
            return response

        user = request.user if request.user.is_authenticated else None
        
        # Determine resource and action
        path_parts = [p for p in request.path.strip('/').split('/') if p]
        resource_type = path_parts[1] if len(path_parts) > 1 else 'unknown'
        resource_id = path_parts[2] if len(path_parts) > 2 else ''
        
        action = f"{request.method} {request.path}"
        status = 'SUCCESS' if response.status_code < 400 else 'FAILED'
        
        ip_address = request.META.get('REMOTE_ADDR')
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
            
        try:
            AuditLog.objects.create(
                user=user,
                action=action,
                ip_address=ip_address,
                resource_type=resource_type,
                resource_id=resource_id,
                status=status,
                details=f"Status code: {response.status_code}"
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            
        return response
