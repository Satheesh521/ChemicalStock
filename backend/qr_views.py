from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_qr_code(request):
    """
    Validate QR code data and return chemical information
    QR Code formats supported:
    1. CHEM:Name|Batch|Quantity|Unit|Expiry|Vendor|SafetyLevel
    2. JSON format with chemical details
    """
    try:
        qr_data = request.data.get('qr_data', '')
        
        if not qr_data:
            return Response(
                {'error': 'QR code data is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse QR code data
        chemical_data = parse_qr_code(qr_data)
        
        # Validate chemical data
        validation_result = validate_chemical_data(chemical_data)
        
        if not validation_result['valid']:
            return Response(
                {'error': validation_result['error']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For demo purposes, return success with parsed data
        return Response({
            'valid': True,
            'chemical': None,  # Would fetch from database in real app
            'qr_data': chemical_data,
            'message': 'QR code validated successfully'
        })
            
    except Exception as e:
        logger.error(f"QR code validation error: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def parse_qr_code(qr_data):
    """Parse different QR code formats"""
    
    # Format 1: Custom chemical format
    if qr_data.startswith('CHEM:'):
        parts = qr_data[5:].split('|')
        return {
            'name': parts[0] if parts[0] else 'Unknown Chemical',
            'batch_number': parts[1] if len(parts) > 1 else 'N/A',
            'quantity': float(parts[2]) if len(parts) > 2 and parts[2] else 0,
            'unit': parts[3] if len(parts) > 3 else 'kg',
            'expiry_date': parts[4] if len(parts) > 4 else None,
            'vendor': parts[5] if len(parts) > 5 else None,
            'safety_level': parts[6] if len(parts) > 6 else 'medium',
            'qr_code': qr_data,
        }
    
    # Format 2: JSON format
    try:
        if qr_data.startswith('{') and qr_data.endswith('}'):
            parsed = json.loads(qr_data)
            return {
                'name': parsed.get('name') or parsed.get('chemicalName') or 'Unknown Chemical',
                'batch_number': parsed.get('batchNumber') or parsed.get('batch') or 'N/A',
                'quantity': float(parsed.get('quantity', 0)),
                'unit': parsed.get('unit', 'kg'),
                'expiry_date': parsed.get('expiryDate') or parsed.get('expiry'),
                'vendor': parsed.get('vendor'),
                'safety_level': parsed.get('safetyLevel') or parsed.get('danger') or 'medium',
                'qr_code': qr_data,
            }
    except json.JSONDecodeError:
        pass
    
    # Format 3: Simple text - assume it's chemical name
    return {
        'name': qr_data,
        'batch_number': f'QR-{datetime.now().timestamp()}',
        'quantity': 0,
        'unit': 'kg',
        'expiry_date': None,
        'vendor': None,
        'safety_level': 'medium',
        'qr_code': qr_data,
    }

def validate_chemical_data(data):
    """Validate chemical data from QR code"""
    
    if not data.get('name') or data['name'] == 'Unknown Chemical':
        return {'valid': False, 'error': 'Missing chemical name'}
    
    if not data.get('quantity') or data['quantity'] <= 0:
        return {'valid': False, 'error': 'Invalid quantity'}
    
    valid_units = ['kg', 'g', 'mg', 'l', 'ml']
    if data.get('unit') not in valid_units:
        return {'valid': False, 'error': f'Invalid unit. Must be one of: {", ".join(valid_units)}'}
    
    # Check expiry date if provided
    if data.get('expiry_date'):
        try:
            expiry = datetime.strptime(data['expiry_date'], '%Y-%m-%d')
            if expiry < datetime.now():
                return {'valid': False, 'error': 'Chemical has expired'}
        except ValueError:
            return {'valid': False, 'error': 'Invalid expiry date format. Use YYYY-MM-DD'}
    
    return {'valid': True}

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_stock_from_qr(request):
    """
    Add stock entry from QR code data
    Creates chemical if it doesn't exist
    """
    try:
        data = request.data
        
        # Required fields
        required_fields = ['chemicalName', 'quantity', 'unit']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # For demo purposes, just return success
        # In real app, would save to database
        return Response({
            'success': True,
            'message': f'Successfully added {data["quantity"]} {data["unit"]} of {data["chemicalName"]}',
            'stock_entry': {
                'id': 'demo-' + str(int(datetime.now().timestamp())),
                'chemical_name': data['chemicalName'],
                'quantity': data['quantity'],
                'unit': data['unit'],
                'batch_number': data.get('batchNumber', ''),
                'vendor': data.get('vendor', ''),
                'entry_date': data.get('entryDate', datetime.now().strftime('%Y-%m-%d')),
                'operator': request.user.username,
            }
        })
        
    except Exception as e:
        logger.error(f"Add stock from QR error: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_qr_code(request, chemical_id):
    """
    Generate QR code data for a chemical
    Returns QR code string that can be used to create QR code image
    """
    try:
        # For demo purposes, generate sample QR data
        chemical_name = f"Chemical-{chemical_id}"
        batch_number = f"BATCH-{chemical_id}"
        quantity = 50
        unit = 'kg'
        expiry_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
        vendor = 'Demo Vendor'
        safety_level = 'medium'
        
        # Create QR code data in custom format
        qr_data = f"CHEM:{chemical_name}|{batch_number}|{quantity}|{unit}|{expiry_date}|{vendor}|{safety_level}"
        
        return Response({
            'qr_data': qr_data,
            'chemical': {
                'id': chemical_id,
                'name': chemical_name,
                'batch_number': batch_number,
                'current_stock': quantity,
                'unit': unit,
                'expiry_date': expiry_date,
                'safety_level': safety_level,
            },
            'format': 'CHEM:Name|Batch|Quantity|Unit|Expiry|Vendor|SafetyLevel'
        })
        
    except Exception as e:
        logger.error(f"Generate QR code error: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qr_scan_history(request):
    """
    Get history of QR code scans for the user
    """
    try:
        # For demo purposes, return sample history
        sample_history = [
            {
                'id': '1',
                'chemical_name': 'Sulfuric Acid',
                'quantity': 50,
                'unit': 'kg',
                'batch_number': 'BATCH-001',
                'vendor': 'ChemCorp',
                'entry_date': '2024-01-15',
                'operator': request.user.username,
                'qr_code': 'CHEM:Sulfuric Acid|BATCH-001|50|kg|2024-12-31|ChemCorp|high',
                'created_at': '2024-01-15T10:30:00Z',
            },
            {
                'id': '2',
                'chemical_name': 'Acetone',
                'quantity': 25,
                'unit': 'l',
                'batch_number': 'BATCH-002',
                'vendor': 'LabSupply',
                'entry_date': '2024-01-14',
                'operator': request.user.username,
                'qr_code': '{"name":"Acetone","quantity":25,"unit":"l","vendor":"LabSupply"}',
                'created_at': '2024-01-14T14:20:00Z',
            }
        ]
        
        return Response({
            'history': sample_history,
            'total_scans': len(sample_history)
        })
        
    except Exception as e:
        logger.error(f"QR scan history error: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
