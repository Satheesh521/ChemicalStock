from django.utils import timezone
from .models import AuditLog, SystemLog
import json
import traceback


def log_audit_action(user, action, description="", table_name="", record_id="", 
                   old_values=None, new_values=None, request=None, 
                   priority="medium", execution_time_ms=None, 
                   success=True, error_message="", module_name="", function_name=""):
    """
    Log an audit action to the database
    
    Args:
        user: User object who performed the action
        action: Action type from AuditLog.ACTION_CHOICES
        description: Human-readable description of the action
        table_name: Database table affected
        record_id: Primary key of affected record
        old_values: Previous values before change (JSON serializable)
        new_values: New values after change (JSON serializable)
        request: HTTP request object for IP/user agent
        priority: Priority level (low, medium, high, critical)
        execution_time_ms: Execution time in milliseconds
        success: Whether the action was successful
        error_message: Error message if action failed
        module_name: Django app/module name
        function_name: Function or view name
    """
    try:
        # Get client from user
        client = user.client if user else None
        
        # Extract IP and user agent from request
        ip_address = None
        user_agent = None
        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create audit log entry
        AuditLog.objects.create(
            client=client,
            user=user,
            action=action,
            priority=priority,
            description=description,
            table_name=table_name,
            record_id=str(record_id) if record_id else "",
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            module_name=module_name,
            function_name=function_name,
            execution_time_ms=execution_time_ms,
            success=success,
            error_message=error_message,
            created_at=timezone.now()
        )
    except Exception as e:
        # Log to system logs if audit logging fails
        log_system_error(
            level='ERROR',
            message=f"Failed to log audit action: {str(e)}",
            module_name='audit.utils',
            function_name='log_audit_action',
            exception_type=type(e).__name__,
            stack_trace=traceback.format_exc()
        )


def log_system_error(level, message, module_name="", function_name="", 
                   user=None, request=None, exception_type="", 
                   stack_trace="", request_data=None):
    """
    Log a system error or warning
    
    Args:
        level: Log level from SystemLog.LOG_LEVEL_CHOICES
        message: Log message
        module_name: Module where error occurred
        function_name: Function where error occurred
        user: User object if applicable
        request: HTTP request object
        exception_type: Exception type name
        stack_trace: Full stack trace
        request_data: Request data (sanitized)
    """
    try:
        # Get client from user
        client = user.client if user else None
        
        # Extract IP and user agent from request
        ip_address = None
        user_agent = None
        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Sanitize request data
        sanitized_request_data = None
        if request_data:
            # Remove sensitive fields from request data
            sensitive_fields = ['password', 'token', 'secret', 'key']
            sanitized_request_data = {}
            for key, value in request_data.items():
                if key.lower() not in sensitive_fields:
                    sanitized_request_data[key] = value
        
        SystemLog.objects.create(
            client=client,
            level=level,
            message=message,
            module_name=module_name,
            function_name=function_name,
            exception_type=exception_type,
            stack_trace=stack_trace,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            request_data=sanitized_request_data,
            created_at=timezone.now()
        )
    except Exception as e:
        # Last resort: print to console
        print(f"CRITICAL: Failed to log system error: {str(e)}")
        print(f"Original error: {message}")


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def track_model_changes(old_instance, new_instance, user, request, action="UPDATE"):
    """
    Automatically track changes when a model is updated
    
    Args:
        old_instance: Model instance before changes
        new_instance: Model instance after changes
        user: User making the changes
        request: HTTP request object
        action: Action type (CREATE, UPDATE, DELETE)
    """
    try:
        model_name = old_instance.__class__.__name__
        table_name = old_instance._meta.db_table
        record_id = str(old_instance.pk)
        
        if action == "CREATE":
            description = f"Created {model_name.lower()}: {str(old_instance)}"
            new_values = model_to_dict(new_instance)
            old_values = None
            
        elif action == "DELETE":
            description = f"Deleted {model_name.lower()}: {str(old_instance)}"
            old_values = model_to_dict(old_instance)
            new_values = None
            
        else:  # UPDATE
            changes = {}
            old_dict = model_to_dict(old_instance)
            new_dict = model_to_dict(new_instance)
            
            for field in old_dict:
                if old_dict[field] != new_dict.get(field):
                    changes[field] = {
                        'old': old_dict[field],
                        'new': new_dict[field]
                    }
            
            if changes:
                description = f"Updated {model_name.lower()}: {str(old_instance)} - Changes: {json.dumps(changes)}"
                old_values = changes
                new_values = changes
            else:
                return  # No changes to track
        
        log_audit_action(
            user=user,
            action=getattr(AuditLog, action),
            description=description,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            request=request,
            module_name=old_instance.__class__.__module__,
            function_name='track_model_changes'
        )
    except Exception as e:
        log_system_error(
            level='ERROR',
            message=f"Failed to track model changes: {str(e)}",
            module_name='audit.utils',
            function_name='track_model_changes',
            exception_type=type(e).__name__,
            stack_trace=traceback.format_exc()
        )


def model_to_dict(instance):
    """
    Convert model instance to dictionary, excluding sensitive fields
    """
    data = {}
    for field in instance._meta.fields:
        field_name = field.name
        field_value = getattr(instance, field_name)
        
        # Skip sensitive fields
        if field_name in ['password', 'token', 'secret']:
            continue
        
        # Handle foreign keys
        if field_value and hasattr(field_value, '_meta'):
            data[field_name] = str(field_value)
        # Handle datetime objects
        elif hasattr(field_value, 'isoformat'):
            data[field_name] = field_value.isoformat()
        # Handle decimal objects
        elif hasattr(field_value, 'normalize'):
            data[field_name] = float(field_value)
        else:
            data[field_name] = field_value
    
    return data


class AuditContext:
    """
    Context manager for automatic audit logging
    """
    
    def __init__(self, user, request, action, description="", table_name="", record_id=""):
        self.user = user
        self.request = request
        self.action = action
        self.description = description
        self.table_name = table_name
        self.record_id = record_id
        self.start_time = timezone.now()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = timezone.now()
        execution_time = int((end_time - self.start_time).total_seconds() * 1000)
        
        if exc_type:
            # Exception occurred
            log_audit_action(
                user=self.user,
                action=self.action,
                description=f"{self.description} - FAILED: {str(exc_val)}",
                table_name=self.table_name,
                record_id=self.record_id,
                request=self.request,
                execution_time_ms=execution_time,
                success=False,
                error_message=str(exc_val),
                module_name=self.request.resolver_match.app_name if self.request else "",
                function_name=self.request.resolver_match.func.__name__ if self.request else ""
            )
        else:
            # Success
            log_audit_action(
                user=self.user,
                action=self.action,
                description=self.description,
                table_name=self.table_name,
                record_id=self.record_id,
                request=self.request,
                execution_time_ms=execution_time,
                success=True,
                module_name=self.request.resolver_match.app_name if self.request else "",
                function_name=self.request.resolver_match.func.__name__ if self.request else ""
            )


def log_login(user, request):
    """Log user login"""
    log_audit_action(
        user=user,
        action=AuditLog.LOGIN,
        description=f"User {user.employee_id} logged in",
        request=request,
        module_name='authentication',
        function_name='login_view'
    )


def log_logout(user, request):
    """Log user logout"""
    log_audit_action(
        user=user,
        action=AuditLog.LOGOUT,
        description=f"User {user.employee_id} logged out",
        request=request,
        module_name='authentication',
        function_name='logout_view'
    )


def log_stock_transaction(user, transaction, request):
    """Log stock transaction"""
    action_map = {
        'in': AuditLog.STOCK_IN,
        'out': AuditLog.STOCK_OUT,
        'adjustment': AuditLog.STOCK_ADJUST,
        'transfer': AuditLog.STOCK_TRANSFER,
    }
    
    log_audit_action(
        user=user,
        action=action_map.get(transaction.transaction_type, AuditLog.STOCK_ADJUST),
        description=f"Stock {transaction.transaction_type}: {transaction.chemical.name} ({transaction.quantity} {transaction.unit})",
        table_name='inventory.stocktransaction',
        record_id=transaction.pk,
        new_values={
            'quantity': str(transaction.quantity),
            'unit': transaction.unit,
            'chemical': transaction.chemical.name
        },
        request=request,
        module_name='inventory',
        function_name='stock_transaction'
    )
