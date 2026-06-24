from django.urls import path
from . import qr_views

app_name = 'qr_stock'

urlpatterns = [
    # QR Code Validation and Stock Entry
    path('validate-qr/', qr_views.validate_qr_code, name='validate_qr_code'),
    path('add-stock-from-qr/', qr_views.add_stock_from_qr, name='add_stock_from_qr'),
    
    # QR Code Generation
    path('generate-qr/<int:chemical_id>/', qr_views.generate_qr_code, name='generate_qr_code'),
    
    # QR Scan History
    path('scan-history/', qr_views.qr_scan_history, name='qr_scan_history'),
    
    # Stock Entry with QR (alternative endpoint)
    path('stock-entry-qr/', qr_views.add_stock_from_qr, name='stock_entry_qr'),
]
