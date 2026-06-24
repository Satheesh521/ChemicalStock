import time
from django.utils.deprecation import MiddlewareMixin
from .utils import log_audit_action, log_system_error, get_client_ip


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log all API requests for audit purposes
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.start_time = time.time()
    
    def process_request(self, request):
        """Process incoming request"""
        request.start_time = time.time()
        request._audit_start_time = self.start_time
        return None
    
    def process_response(self, request, response):
        """Process outgoing response"""
        try:
            # Calculate execution time
            if hasattr(request, 'start_time'):
                execution_time = int((time.time() - request.start_time) * 1000)
            else:
                execution_time = int((time.time() - request._audit_start_time) * 1000)
            
            # Skip logging for static files and health checks
            path = request.path
            if (path.startswith('/static/') or 
                path.startswith('/media/') or 
                path == '/health/' or
                path.startswith('/api/docs/')):
                return response
            
            # Skip logging for OPTIONS requests
            if request.method == 'OPTIONS':
                return response
            
            # Get user from request if authenticated
            user = getattr(request, 'user', None)
            
            # Determine action based on HTTP method and path
            action = self._determine_action(request)
            
            # Log the request
            if user and action:
                log_audit_action(
                    user=user,
                    action=action,
                    description=f"{request.method} {request.path}",
                    table_name=self._get_table_name(request),
                    request=request,
                    execution_time_ms=execution_time,
                    success=response.status_code < 400,
                    module_name=request.resolver_match.app_name if hasattr(request, 'resolver_match') else '',
                    function_name=request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else ''
                )
            elif not user and request.path.startswith('/api/'):
                # Log unauthenticated API access attempts
                log_audit_action(
                    user=None,
                    action='UNAUTHORIZED_ACCESS',
                    description=f"Unauthorized access attempt: {request.method} {request.path}",
                    table_name='',
                    request=request,
                    priority='high',
                    module_name=request.resolver_match.app_name if hasattr(request, 'resolver_match') else '',
                    function_name=request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else ''
                )
        
        except Exception as e:
            # Log middleware errors
            log_system_error(
                level='ERROR',
                message=f"Audit middleware error: {str(e)}",
                module_name='audit.middleware',
                function_name='process_response',
                exception_type=type(e).__name__,
                request=request
            )
        
        return response
    
    def _determine_action(self, request):
        """Determine audit action based on request method and path"""
        method = request.method
        path = request.path
        
        # Map HTTP methods to actions
        method_actions = {
            'GET': 'VIEW',
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE'
        }
        
        base_action = method_actions.get(method, 'UNKNOWN')
        
        # Get resource type from path
        if '/api/v1/chemicals/' in path:
            resource = 'CHEMICAL'
        elif '/api/v1/inventory/' in path:
            resource = 'STOCK'
        elif '/api/v1/vendors/' in path:
            resource = 'VENDOR'
        elif '/api/v1/reports/' in path:
            resource = 'REPORT'
        elif '/api/v1/auth/' in path:
            resource = 'AUTH'
        else:
            resource = 'UNKNOWN'
        
        # Combine resource and action
        if resource != 'UNKNOWN' and base_action != 'UNKNOWN':
            return f"{resource}_{base_action}"
        
        return base_action
    
    def _get_table_name(self, request):
        """Get database table name from request path"""
        path = request.path
        
        if '/api/v1/chemicals/' in path:
            return 'chemicals'
        elif '/api/v1/inventory/' in path:
            return 'stock_transactions'
        elif '/api/v1/vendors/' in path:
            return 'vendors'
        elif '/api/v1/reports/' in path:
            return 'reports'
        elif '/api/v1/auth/' in path:
            return 'auth_users'
        else:
            return ''
