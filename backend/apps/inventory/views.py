from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import StockTransaction
from apps.chemicals.models import Chemical
from apps.clients.models import Client

class StockEntryView(APIView):
    """
    API endpoint for adding stock entries from QR scanner
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['chemicalName', 'batchNumber', 'quantity']
            for field in required_fields:
                if not data.get(field):
                    return Response(
                        {'error': f'{field} is required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get or create chemical
            chemical, created = Chemical.objects.get_or_create(
                name=data.get('chemicalName'),
                defaults={
                    'unit': data.get('unit', 'kg'),
                    'current_stock': 0,
                    'reorder_level': 1.0,
                    'max_quantity': 100.0,
                    'is_active': True,
                }
            )
            
            # Get or create default client
            client, created = Client.objects.get_or_create(
                name='Default Client',
                defaults={
                    'email': 'default@example.com',
                    'phone': '0000000000',
                    'is_active': True,
                }
            )
            
            # Create stock transaction record
            stock_transaction = StockTransaction.objects.create(
                client=client,
                chemical=chemical,
                transaction_type='in',
                quantity=float(data.get('quantity', 0)),
                unit=data.get('unit', 'kg'),
                batch_number=data.get('batchNumber'),
                expiry_date=data.get('expiryDate') or None,
                supplier=data.get('vendor', ''),
                storage_location=data.get('location', ''),
                notes=data.get('notes', ''),
                timestamp=timezone.now()
            )
            
            # Update chemical stock
            chemical.current_stock += stock_transaction.quantity
            chemical.save()
            
            return Response(
                {
                    'message': 'Stock entry saved to database successfully',
                    'data': {
                        'id': stock_transaction.id,
                        'chemical_name': chemical.name,
                        'batch_number': stock_transaction.batch_number,
                        'quantity': stock_transaction.quantity,
                        'unit': stock_transaction.unit,
                        'created_at': stock_transaction.created_at.isoformat(),
                        'current_stock': chemical.current_stock
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'Database error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
