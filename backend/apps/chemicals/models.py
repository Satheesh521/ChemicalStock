from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.clients.models import Client


class ChemicalCategory(models.Model):
    """Chemical categories for organization"""
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='chemical_categories'
    )
    name = models.CharField(
        max_length=100,
        help_text="Category name"
    )
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Category description"
    )
    color = models.CharField(
        max_length=7, 
        default='#007bff',
        help_text="Color code for UI display"
    )
    icon = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Icon name or emoji"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chemical_categories'
        verbose_name = 'Chemical Category'
        verbose_name_plural = 'Chemical Categories'
        unique_together = [['client', 'name']]
        ordering = ['name']
    
    def __str__(self):
        return f"{self.client.name} - {self.name}"


class Chemical(models.Model):
    """Main chemical inventory model"""
    
    UNIT_CHOICES = [
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
        ('mg', 'Milligrams'),
        ('l', 'Liters'),
        ('ml', 'Milliliters'),
    ]
    
    DANGER_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('extreme', 'Extreme'),
    ]
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='chemicals'
    )
    category = models.ForeignKey(
        ChemicalCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='chemicals'
    )
    name = models.CharField(
        max_length=200,
        help_text="Chemical name"
    )
    cas_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="CAS registry number"
    )
    formula = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Chemical formula"
    )
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Chemical description"
    )
    unit = models.CharField(
        max_length=10, 
        choices=UNIT_CHOICES, 
        default='kg'
    )
    current_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Current stock quantity"
    )
    reorder_level = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Reorder when quantity falls below this level"
    )
    max_quantity = models.DecimalField(
        max_digits=15, 
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Maximum safe storage quantity"
    )
    unit_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Cost per unit"
    )
    danger_level = models.CharField(
        max_length=20, 
        choices=DANGER_LEVEL_CHOICES, 
        default='medium'
    )
    storage_location = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Physical storage location"
    )
    qr_code = models.CharField(
        max_length=255, 
        unique=True,
        help_text="Unique QR code for scanning"
    )
    barcode = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Barcode number"
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Expiry date of this batch"
    )
    manufacture_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Manufacture date"
    )
    batch_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Batch or lot number"
    )
    supplier = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Supplier name"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this chemical is currently in use"
    )
    requires_sds = models.BooleanField(
        default=True,
        help_text="Whether Safety Data Sheet is required"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_chemicals'
    )
    
    class Meta:
        db_table = 'chemicals'
        verbose_name = 'Chemical'
        verbose_name_plural = 'Chemicals'
        unique_together = [['client', 'qr_code']]
        ordering = ['name']
        indexes = [
            models.Index(fields=['client', 'name']),
            models.Index(fields=['client', 'qr_code']),
            models.Index(fields=['client', 'current_quantity']),
            models.Index(fields=['client', 'expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.current_quantity} {self.unit})"
    
    @property
    def is_low_stock(self):
        """Check if chemical is below reorder level"""
        return self.current_quantity <= self.reorder_level
    
    @property
    def is_expired(self):
        """Check if chemical has expired"""
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False
    
    @property
    def is_expiring_soon(self):
        """Check if chemical expires within warning period"""
        if self.expiry_date:
            from apps.clients.models import ClientSettings
            try:
                settings = self.client.settings
                warning_days = settings.expiry_warning_days
            except:
                warning_days = 30
            
            days_until_expiry = (self.expiry_date - timezone.now().date()).days
            return 0 <= days_until_expiry <= warning_days
        return False
    
    @property
    def stock_percentage(self):
        """Calculate stock percentage of max quantity"""
        if self.max_quantity > 0:
            return (self.current_quantity / self.max_quantity) * 100
        return 0
    
    @property
    def total_value(self):
        """Calculate total value of current stock"""
        return self.current_quantity * self.unit_cost
    
    def save(self, *args, **kwargs):
        """Generate QR code if not exists"""
        if not self.qr_code:
            import uuid
            self.qr_code = str(uuid.uuid4())
        super().save(*args, **kwargs)


class ChemicalImage(models.Model):
    """Images for chemicals"""
    
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(
        upload_to='chemical_images/',
        help_text="Chemical image"
    )
    caption = models.CharField(
        max_length=200, 
        blank=True, 
        null=True
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary image for display"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chemical_images'
        verbose_name = 'Chemical Image'
        verbose_name_plural = 'Chemical Images'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.chemical.name} - Image"


class SafetyDataSheet(models.Model):
    """Safety Data Sheets (SDS/MSDS)"""
    
    chemical = models.ForeignKey(
        Chemical, 
        on_delete=models.CASCADE, 
        related_name='safety_sheets'
    )
    title = models.CharField(
        max_length=200,
        help_text="SDS document title"
    )
    file = models.FileField(
        upload_to='safety_sheets/',
        help_text="SDS PDF file"
    )
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    version = models.CharField(
        max_length=20,
        help_text="SDS version number"
    )
    effective_date = models.DateField(
        help_text="Date SDS became effective"
    )
    danger_level = models.CharField(
        max_length=20,
        choices=Chemical.DANGER_LEVEL_CHOICES,
        help_text="Danger level classification"
    )
    handling_instructions = models.TextField(
        help_text="Safe handling instructions"
    )
    first_aid = models.TextField(
        help_text="First aid measures"
    )
    storage_requirements = models.TextField(
        help_text="Storage requirements"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sds'
    )
    
    class Meta:
        db_table = 'safety_data_sheets'
        verbose_name = 'Safety Data Sheet'
        verbose_name_plural = 'Safety Data Sheets'
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.chemical.name} - SDS {self.version}"
