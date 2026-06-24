from django.db import models
from apps.clients.models import Client


class AuditLog(models.Model):
    """Audit trail for all system actions"""
    
    id = models.AutoField(primary_key=True)
    
    ACTION_CHOICES = [
        # Authentication
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('PASSWORD_CHANGE', 'Password Change'),
        ('PASSWORD_RESET', 'Password Reset'),
        
        # User Management
        ('USER_CREATE', 'User Create'),
        ('USER_UPDATE', 'User Update'),
        ('USER_DELETE', 'User Delete'),
        ('USER_ACTIVATE', 'User Activate'),
        ('USER_DEACTIVATE', 'User Deactivate'),
        
        # Chemical Management
        ('CHEMICAL_CREATE', 'Chemical Create'),
        ('CHEMICAL_UPDATE', 'Chemical Update'),
        ('CHEMICAL_DELETE', 'Chemical Delete'),
        ('CHEMICAL_IMPORT', 'Chemical Import'),
        ('CHEMICAL_EXPORT', 'Chemical Export'),
        
        # Inventory Management
        ('STOCK_IN', 'Stock In'),
        ('STOCK_OUT', 'Stock Out'),
        ('STOCK_ADJUST', 'Stock Adjustment'),
        ('STOCK_COUNT', 'Stock Count'),
        ('STOCK_TRANSFER', 'Stock Transfer'),
        
        # Vendor Management
        ('VENDOR_CREATE', 'Vendor Create'),
        ('VENDOR_UPDATE', 'Vendor Update'),
        ('VENDOR_DELETE', 'Vendor Delete'),
        ('PO_CREATE', 'Purchase Order Create'),
        ('PO_UPDATE', 'Purchase Order Update'),
        ('PO_DELETE', 'Purchase Order Delete'),
        ('PO_APPROVE', 'Purchase Order Approve'),
        ('PO_SEND', 'Purchase Order Send'),
        
        # Reports
        ('REPORT_GENERATE', 'Report Generate'),
        ('REPORT_EXPORT', 'Report Export'),
        
        # Settings
        ('SETTINGS_UPDATE', 'Settings Update'),
        ('BACKUP_CREATE', 'Backup Create'),
        ('BACKUP_RESTORE', 'Backup Restore'),
        
        # System
        ('SYSTEM_ERROR', 'System Error'),
        ('SYSTEM_WARNING', 'System Warning'),
        ('DATA_IMPORT', 'Data Import'),
        ('DATA_EXPORT', 'Data Export'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='audit_logs'
    )
    user = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(
        max_length=50, 
        choices=ACTION_CHOICES
    )
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='medium'
    )
    description = models.TextField(
        help_text="Detailed description of the action"
    )
    table_name = models.CharField(
        max_length=100, 
        help_text="Database table name affected"
    )
    record_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Primary key of affected record"
    )
    old_values = models.JSONField(
        null=True, 
        blank=True,
        help_text="Previous values before change"
    )
    new_values = models.JSONField(
        null=True, 
        blank=True,
        help_text="New values after change"
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of the request"
    )
    user_agent = models.TextField(
        blank=True, 
        null=True,
        help_text="User agent string"
    )
    module_name = models.CharField(
        max_length=100, 
        help_text="Django app/module name"
    )
    function_name = models.CharField(
        max_length=100, 
        help_text="Function or view name"
    )
    execution_time_ms = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Execution time in milliseconds"
    )
    success = models.BooleanField(
        default=True,
        help_text="Whether the action was successful"
    )
    error_message = models.TextField(
        blank=True, 
        null=True,
        help_text="Error message if action failed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['client', 'user']),
            models.Index(fields=['client', 'action']),
            models.Index(fields=['client', 'priority']),
            models.Index(fields=['module_name', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.user or 'System'} ({self.created_at})"
    
    @property
    def action_display_short(self):
        """Get short action display"""
        return self.get_action_display().replace('_', ' ').title()


class SystemLog(models.Model):
    """System-level logging for errors and warnings"""
    
    LOG_LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='system_logs'
    )
    level = models.CharField(
        max_length=20, 
        choices=LOG_LEVEL_CHOICES, 
        default='INFO'
    )
    message = models.TextField(
        help_text="Log message"
    )
    module_name = models.CharField(
        max_length=100, 
        help_text="Module where the log originated"
    )
    function_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Function name"
    )
    line_number = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Line number of code"
    )
    exception_type = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Exception type name"
    )
    stack_trace = models.TextField(
        blank=True, 
        null=True,
        help_text="Full stack trace"
    )
    user = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='system_logs'
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address"
    )
    user_agent = models.TextField(
        blank=True, 
        null=True,
        help_text="User agent"
    )
    request_data = models.JSONField(
        null=True, 
        blank=True,
        help_text="Request data (sanitized)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'level']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['level', 'created_at']),
            models.Index(fields=['module_name', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.level} - {self.module_name} ({self.created_at})"


class DataBackup(models.Model):
    """Track data backup operations"""
    
    BACKUP_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('scheduled', 'Scheduled'),
        ('auto', 'Automatic'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='data_backups'
    )
    backup_type = models.CharField(
        max_length=20, 
        choices=BACKUP_TYPE_CHOICES, 
        default='manual'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    file_path = models.CharField(
        max_length=500, 
        blank=True, 
        null=True,
        help_text="Backup file path"
    )
    file_size = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Backup file size in bytes"
    )
    tables_included = models.JSONField(
        help_text="List of tables included in backup"
    )
    record_count = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Total number of records backed up"
    )
    compression_ratio = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Compression ratio"
    )
    started_at = models.DateTimeField(
        null=True, 
        blank=True
    )
    completed_at = models.DateTimeField(
        null=True, 
        blank=True
    )
    duration_seconds = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Backup duration in seconds"
    )
    error_message = models.TextField(
        blank=True, 
        null=True,
        help_text="Error message if backup failed"
    )
    created_by = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_backups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'data_backups'
        verbose_name = 'Data Backup'
        verbose_name_plural = 'Data Backups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['backup_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_backup_type_display()} - {self.created_at}"
    
    @property
    def duration_display(self):
        """Get human-readable duration"""
        if self.duration_seconds:
            if self.duration_seconds < 60:
                return f"{self.duration_seconds}s"
            elif self.duration_seconds < 3600:
                return f"{self.duration_seconds // 60}m {self.duration_seconds % 60}s"
            else:
                hours = self.duration_seconds // 3600
                minutes = (self.duration_seconds % 3600) // 60
                return f"{hours}h {minutes}m"
        return "N/A"
