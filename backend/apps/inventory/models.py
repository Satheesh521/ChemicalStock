from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.chemicals.models import Chemical
from apps.clients.models import Client


class StockTransaction(models.Model):
    """Track all stock IN and OUT transactions"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
        ('transfer', 'Transfer'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='stock_transactions'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20, 
        choices=TRANSACTION_TYPE_CHOICES
    )
    quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Quantity of transaction"
    )
    unit = models.CharField(
        max_length=10, 
        choices=Chemical.UNIT_CHOICES
    )
    unit_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Cost per unit at time of transaction"
    )
    reference_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Purchase order or reference number"
    )
    batch_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Batch/lot number"
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Expiry date for this batch"
    )
    supplier = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Supplier name"
    )
    storage_location = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Storage location"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Transaction notes"
    )
    timestamp = models.DateTimeField(
        help_text="Transaction timestamp"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_transactions'
    )
    
    class Meta:
        db_table = 'stock_transactions'
        verbose_name = 'Stock Transaction'
        verbose_name_plural = 'Stock Transactions'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['client', 'chemical']),
            models.Index(fields=['client', 'transaction_type']),
            models.Index(fields=['client', 'timestamp']),
            models.Index(fields=['chemical', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.chemical.name} ({self.quantity} {self.unit})"
    
    @property
    def total_cost(self):
        """Calculate total cost of transaction"""
        if self.unit_cost:
            return self.quantity * self.unit_cost
        return 0
    
    def save(self, *args, **kwargs):
        """Set timestamp if not provided"""
        if not self.timestamp:
            self.timestamp = timezone.now()
        super().save(*args, **kwargs)


class StockAdjustment(models.Model):
    """Stock level adjustments for corrections"""
    
    ADJUSTMENT_TYPE_CHOICES = [
        ('correction', 'Correction'),
        ('damage', 'Damage'),
        ('theft', 'Theft'),
        ('expiry', 'Expiry'),
        ('return', 'Return'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='stock_adjustments'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='adjustments'
    )
    adjustment_type = models.CharField(
        max_length=20, 
        choices=ADJUSTMENT_TYPE_CHOICES
    )
    previous_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        help_text="Quantity before adjustment"
    )
    new_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        help_text="Quantity after adjustment"
    )
    adjustment_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        help_text="Amount of adjustment (can be negative)"
    )
    reason = models.TextField(
        help_text="Reason for adjustment"
    )
    approved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_adjustments',
        help_text="Manager who approved this adjustment"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_adjustments'
    )
    
    class Meta:
        db_table = 'stock_adjustments'
        verbose_name = 'Stock Adjustment'
        verbose_name_plural = 'Stock Adjustments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'chemical']),
            models.Index(fields=['client', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.chemical.name} - {self.get_adjustment_type_display()} ({self.adjustment_amount})"


class StockAlert(models.Model):
    """Low stock and expiry alerts"""
    
    ALERT_TYPE_CHOICES = [
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('expiring_soon', 'Expiring Soon'),
        ('expired', 'Expired'),
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
        related_name='stock_alerts'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='alerts'
    )
    alert_type = models.CharField(
        max_length=20, 
        choices=ALERT_TYPE_CHOICES
    )
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    message = models.TextField(
        help_text="Alert message"
    )
    current_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        null=True, 
        blank=True
    )
    threshold_value = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        null=True, 
        blank=True
    )
    days_until_expiry = models.IntegerField(
        null=True, 
        blank=True
    )
    is_acknowledged = models.BooleanField(
        default=False,
        help_text="Whether alert has been acknowledged"
    )
    acknowledged_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(
        null=True, 
        blank=True
    )
    is_resolved = models.BooleanField(
        default=False,
        help_text="Whether alert has been resolved"
    )
    resolved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stock_alerts'
        verbose_name = 'Stock Alert'
        verbose_name_plural = 'Stock Alerts'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['client', 'alert_type']),
            models.Index(fields=['client', 'is_acknowledged']),
            models.Index(fields=['client', 'is_resolved']),
        ]
    
    def __str__(self):
        return f"{self.chemical.name} - {self.get_alert_type_display()}"
    
    def acknowledge(self, user):
        """Acknowledge alert"""
        self.is_acknowledged = True
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save()
    
    def resolve(self, user):
        """Resolve alert"""
        self.is_resolved = True
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()


class StockCount(models.Model):
    """Physical stock count records"""
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='stock_counts'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='stock_counts'
    )
    counted_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)]
    )
    system_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        help_text="System quantity at time of count"
    )
    variance = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        help_text="Difference between counted and system quantity"
    )
    variance_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Variance as percentage"
    )
    count_date = models.DateField(
        help_text="Date of physical count"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Notes about the count"
    )
    approved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='approved_stock_counts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_stock_counts'
    )
    
    class Meta:
        db_table = 'stock_counts'
        verbose_name = 'Stock Count'
        verbose_name_plural = 'Stock Counts'
        ordering = ['-count_date']
        unique_together = [['client', 'chemical', 'count_date']]
        indexes = [
            models.Index(fields=['client', 'count_date']),
            models.Index(fields=['chemical', 'count_date']),
        ]
    
    def __str__(self):
        return f"{self.chemical.name} - Count {self.count_date}"
    
    def save(self, *args, **kwargs):
        """Calculate variance automatically"""
        if self.system_quantity:
            self.variance = self.counted_quantity - self.system_quantity
            if self.system_quantity > 0:
                self.variance_percentage = (self.variance / self.system_quantity) * 100
        super().save(*args, **kwargs)
