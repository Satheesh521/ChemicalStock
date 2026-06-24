from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.clients.models import Client


class User(AbstractUser):
    """Custom User model with multi-tenancy support"""
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('super_admin', 'Super Admin'),
    ]
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text="Groups this user belongs to"
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text="Specific permissions for this user"
    )
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='users',
        help_text="Client/tenant this user belongs to"
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='supervisor',
        help_text="User role and permission level"
    )
    employee_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Employee ID for login"
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Phone number for notifications"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this user account is active"
    )
    last_login_ip = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of last login"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['email', 'client']
    
    class Meta:
        db_table = 'auth_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee_id} - {self.get_full_name() or self.email}"
    
    @property
    def is_admin(self):
        return self.role == 'admin' or self.role == 'super_admin'
    
    @property
    def is_supervisor(self):
        return self.role == 'supervisor'
    
    @property
    def is_super_admin(self):
        return self.role == 'super_admin'


class PasswordResetToken(models.Model):
    """Password reset tokens for users"""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reset_tokens'
    )
    token = models.CharField(
        max_length=255, 
        unique=True
    )
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'auth_password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.employee_id} - {self.token[:8]}..."
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class UserSession(models.Model):
    """Track user sessions for audit purposes"""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sessions'
    )
    session_key = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'auth_user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.employee_id} - {self.ip_address}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
