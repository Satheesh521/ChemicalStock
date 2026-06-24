from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class ChemicalListView(APIView):
    """
    API endpoint for listing chemicals
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Mock data for now - replace with actual database queries
            mock_chemicals = [
                {
                    'id': 1,
                    'name': 'Sulfuric Acid',
                    'unit': 'kg',
                    'current_stock': 0.7002,
                    'reorder_level': 0.5,
                    'max_quantity': 10.0,
                    'danger_level': 'extreme',
                    'qr_code': 'QR001',
                    'is_active': True,
                    'stock_percentage': 7.002,
                    'total_in': 2.0,
                    'total_out': 1.2998,
                },
                {
                    'id': 2,
                    'name': 'Hydrochloric Acid',
                    'unit': 'kg',
                    'current_stock': 1.1234,
                    'reorder_level': 1.0,
                    'max_quantity': 15.0,
                    'danger_level': 'high',
                    'qr_code': 'QR002',
                    'is_active': True,
                    'stock_percentage': 7.489,
                    'total_in': 5.0,
                    'total_out': 3.8766,
                },
            ]
            
            return Response({
                'count': len(mock_chemicals),
                'results': mock_chemicals
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
