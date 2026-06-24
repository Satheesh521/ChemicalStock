from django.db import models
from django.core.validators import RegexValidator


class Client(models.Model):
    """Multi-tenant client model"""
    
    id = models.AutoField(primary_key=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('suspended', 'Suspended'),
        ('cancelled', 'Cancelled'),
    ]
    
    SUBSCRIPTION_TIER_CHOICES = [
        ('basic', 'Basic'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]
    
    name = models.CharField(
        max_length=200, 
        unique=True,
        help_text="Company or organization name"
    )
    contact_email = models.EmailField(
        help_text="Primary contact email"
    )
    contact_phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Primary contact phone"
    )
    address = models.TextField(
        blank=True, 
        null=True,
        help_text="Physical address"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='trial'
    )
    subscription_tier = models.CharField(
        max_length=20, 
        choices=SUBSCRIPTION_TIER_CHOICES, 
        default='basic'
    )
    max_users = models.PositiveIntegerField(
        default=5,
        help_text="Maximum number of users allowed"
    )
    max_chemicals = models.PositiveIntegerField(
        default=100,
        help_text="Maximum number of chemicals allowed"
    )
    storage_limit_gb = models.PositiveIntegerField(
        default=5,
        help_text="Storage limit in GB"
    )
    trial_ends_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Trial period end date"
    )
    subscription_renews_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Next subscription renewal date"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this client account is active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_trial_expired(self):
        """Check if trial period has expired"""
        if self.status == 'trial' and self.trial_ends_at:
            from django.utils import timezone
            return timezone.now() > self.trial_ends_at
        return False
    
    @property
    def user_count(self):
        """Get current number of users"""
        return self.users.filter(is_active=True).count()
    
    @property
    def chemical_count(self):
        """Get current number of chemicals"""
        return self.chemicals.count()
    
    @property
    def storage_used_gb(self):
        """Calculate storage used (placeholder for now)"""
        # This would be calculated from actual file storage
        return 0  # Placeholder


class ClientSettings(models.Model):
    """Client-specific settings"""
    
    id = models.AutoField(primary_key=True)
    
    client = models.OneToOneField(
        Client, 
        on_delete=models.CASCADE, 
        related_name='settings'
    )
    company_logo = models.ImageField(
        upload_to='client_logos/',
        null=True, 
        blank=True,
        help_text="Company logo"
    )
    timezone = models.CharField(
        max_length=50, 
        default='UTC',
        help_text="Default timezone for the client"
    )
    date_format = models.CharField(
        max_length=20, 
        default='YYYY-MM-DD',
        help_text="Preferred date format"
    )
    currency = models.CharField(
        max_length=3, 
        default='USD',
        help_text="Default currency"
    )
    low_stock_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=5.00,
        help_text="Default low stock threshold in kg"
    )
    expiry_warning_days = models.PositiveIntegerField(
        default=30,
        help_text="Days before expiry to send warning"
    )
    email_notifications = models.BooleanField(
        default=True,
        help_text="Enable email notifications"
    )
    whatsapp_notifications = models.BooleanField(
        default=False,
        help_text="Enable WhatsApp notifications"
    )
    auto_backup = models.BooleanField(
        default=True,
        help_text="Enable automatic data backup"
    )
    backup_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
        ],
        default='daily',
        help_text="Backup frequency"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'client_settings'
        verbose_name = 'Client Settings'
        verbose_name_plural = 'Client Settings'
    
    def __str__(self):
        return f"{self.client.name} - Settings"


class ClientSubscription(models.Model):
    """Track client subscription history"""
    
    id = models.AutoField(primary_key=True)
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    tier = models.CharField(
        max_length=20, 
        choices=Client.SUBSCRIPTION_TIER_CHOICES
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Monthly subscription price"
    )
    currency = models.CharField(
        max_length=3, 
        default='USD'
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
        ],
        default='monthly'
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'client_subscriptions'
        verbose_name = 'Client Subscription'
        verbose_name_plural = 'Client Subscriptions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.client.name} - {self.tier} ({self.starts_at} to {self.ends_at})"
