from django.db import models
from django.core.validators import MinValueValidator
from apps.chemicals.models import Chemical
from apps.clients.models import Client


class Vendor(models.Model):
    """Supplier/Vendor management"""
    
    id = models.AutoField(primary_key=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
        ('blacklisted', 'Blacklisted'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='vendors'
    )
    name = models.CharField(
        max_length=200,
        help_text="Vendor company name"
    )
    contact_person = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Primary contact person"
    )
    email = models.EmailField(
        blank=True, 
        null=True,
        help_text="Vendor email address"
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Vendor phone number"
    )
    address = models.TextField(
        blank=True, 
        null=True,
        help_text="Vendor physical address"
    )
    website = models.URLField(
        blank=True, 
        null=True,
        help_text="Vendor website"
    )
    tax_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Tax identification number"
    )
    license_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Business license number"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True, 
        blank=True,
        help_text="Vendor rating (1-5)"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes about vendor"
    )
    is_preferred = models.BooleanField(
        default=False,
        help_text="Mark as preferred vendor"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_vendors'
    )
    
    class Meta:
        db_table = 'vendors'
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['name']
        unique_together = [['client', 'name']]
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['client', 'is_preferred']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


class VendorPricing(models.Model):
    """Vendor-specific pricing for chemicals"""
    
    id = models.AutoField(primary_key=True)
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='vendor_pricings'
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        related_name='pricings'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='vendor_pricings'
    )
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Price per unit"
    )
    unit = models.CharField(
        max_length=10, 
        choices=Chemical.UNIT_CHOICES
    )
    min_order_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Minimum order quantity"
    )
    max_order_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        null=True, 
        blank=True,
        help_text="Maximum order quantity"
    )
    lead_time_days = models.PositiveIntegerField(
        default=7,
        help_text="Lead time in days"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this pricing is currently active"
    )
    valid_from = models.DateField(
        help_text="Price validity start date"
    )
    valid_until = models.DateField(
        null=True, 
        blank=True,
        help_text="Price validity end date"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Pricing notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendor_pricings'
        verbose_name = 'Vendor Pricing'
        verbose_name_plural = 'Vendor Pricings'
        unique_together = [['vendor', 'chemical', 'valid_from']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chemical', 'unit_price']),
            models.Index(fields=['vendor', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.vendor.name} - {self.chemical.name} ({self.unit_price}/{self.unit})"
    
    @property
    def is_valid(self):
        """Check if pricing is currently valid"""
        from django.utils import timezone
        today = timezone.now().date()
        return (
            self.is_active and 
            self.valid_from <= today and 
            (not self.valid_until or self.valid_until >= today)
        )


class PurchaseOrder(models.Model):
    """Purchase order management"""
    
    id = models.AutoField(primary_key=True)
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('acknowledged', 'Acknowledged'),
        ('approved', 'Approved'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='purchase_orders'
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        related_name='purchase_orders'
    )
    order_number = models.CharField(
        max_length=100, 
        unique=True,
        help_text="Purchase order number"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='medium'
    )
    order_date = models.DateField(
        help_text="Date order was placed"
    )
    expected_delivery_date = models.DateField(
        help_text="Expected delivery date"
    )
    actual_delivery_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Actual delivery date"
    )
    subtotal = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Order subtotal"
    )
    tax_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        help_text="Tax amount"
    )
    shipping_cost = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        help_text="Shipping cost"
    )
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Total order amount"
    )
    currency = models.CharField(
        max_length=3, 
        default='USD',
        help_text="Order currency"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Order notes"
    )
    internal_notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Internal notes"
    )
    attachment = models.FileField(
        upload_to='purchase_orders/',
        null=True, 
        blank=True,
        help_text="Purchase order attachment"
    )
    is_emailed = models.BooleanField(
        default=False,
        help_text="Whether PO has been emailed to vendor"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_purchase_orders'
    )
    approved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_purchase_orders'
    )
    
    class Meta:
        db_table = 'purchase_orders'
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['vendor', 'order_date']),
            models.Index(fields=['client', 'order_date']),
        ]
    
    def __str__(self):
        return f"PO-{self.order_number} ({self.vendor.name})"
    
    @property
    def is_overdue(self):
        """Check if order is overdue"""
        if self.status in ['sent', 'acknowledged', 'approved'] and self.expected_delivery_date:
            from django.utils import timezone
            return timezone.now().date() > self.expected_delivery_date
        return False


class PurchaseOrderItem(models.Model):
    """Individual items in a purchase order"""
    
    id = models.AutoField(primary_key=True)
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='purchase_order_items'
    )
    purchase_order = models.ForeignKey(
        PurchaseOrder, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='purchase_order_items'
    )
    vendor_pricing = models.ForeignKey(
        VendorPricing, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='purchase_order_items'
    )
    quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Ordered quantity"
    )
    unit = models.CharField(
        max_length=10, 
        choices=Chemical.UNIT_CHOICES
    )
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Price per unit"
    )
    total_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        help_text="Total price for this item"
    )
    batch_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Expected batch number"
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Expected expiry date"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Item notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'purchase_order_items'
        verbose_name = 'Purchase Order Item'
        verbose_name_plural = 'Purchase Order Items'
        ordering = ['chemical']
        unique_together = [['purchase_order', 'chemical']]
    
    def __str__(self):
        return f"{self.chemical.name} ({self.quantity} {self.unit})"
    
    def save(self, *args, **kwargs):
        """Calculate total price automatically"""
        if self.quantity and self.unit_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
