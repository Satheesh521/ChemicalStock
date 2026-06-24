from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.settings import api_settings

from .models import User, PasswordResetToken, UserSession
from .serializers import (
    LoginSerializer, UserSerializer, CreateUserSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer
)
from apps.audit.utils import log_audit_action


@api_view(['POST'])
def login_view(request):
    """Login endpoint with JWT token generation"""
    serializer = LoginSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        remember_me = serializer.validated_data.get('remember_me', False)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Log user session
        UserSession.objects.create(
            user=user,
            session_key=refresh.access_token,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=timezone.now() + (
                timedelta(days=30) if remember_me else timedelta(hours=1)
            )
        )
        
        # Update last login
        user.last_login = timezone.now()
        user.last_login_ip = get_client_ip(request)
        user.save(update_fields=['last_login', 'last_login_ip'])
        
        # Log audit
        log_audit_action(
            user=user,
            action='LOGIN',
            details=f"User logged in from {get_client_ip(request)}",
            request=request
        )
        
        response_data = {
            'access': str(access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'expires_in': api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    try:
        # Invalidate user session
        UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).update(is_active=False)
        
        # Log audit
        log_audit_action(
            user=request.user,
            action='LOGOUT',
            details=f"User logged out from {get_client_ip(request)}",
            request=request
        )
        
        # Blacklist current token
        try:
            token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
            RefreshToken(token).blacklist()
        except:
            pass
        
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': 'Logout failed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def password_reset_request(request):
    """Request password reset via email"""
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = serializer.context.get('user')
        
        if user:
            # Generate reset token
            token = default_token_generator.make_token(user)
            reset_token = PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # Send email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            send_mail(
                'Password Reset Request',
                f'''
                Hello {user.first_name},
                
                You requested a password reset. Click the link below to reset your password:
                
                {reset_url}
                
                This link will expire in 24 hours.
                
                If you didn't request this, please ignore this email.
                ''',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        
        return Response({
            'message': 'If an account exists with this email, you will receive password reset instructions.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def password_reset_confirm(request):
    """Confirm password reset"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if serializer.is_valid():
        reset_token = serializer.context['reset_token']
        user = reset_token.user
        new_password = serializer.validated_data['password']
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        # Log audit
        log_audit_action(
            user=user,
            action='PASSWORD_RESET',
            details='Password reset completed via email',
            request=request
        )
        
        return Response({
            'message': 'Password reset successful. You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change password for authenticated user"""
    serializer = ChangePasswordSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        new_password = serializer.validated_data['new_password']
        request.user.set_password(new_password)
        request.user.save()
        
        # Log audit
        log_audit_action(
            user=request.user,
            action='PASSWORD_CHANGE',
            details='User changed password',
            request=request
        )
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    serializer = UserSerializer(
        request.user, 
        data=request.data, 
        partial=True
    )
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Log audit
        log_audit_action(
            user=user,
            action='PROFILE_UPDATE',
            details='User updated profile',
            request=request
        )
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_session(request):
    """Get current session info"""
    try:
        session = UserSession.objects.get(
            user=request.user,
            is_active=True,
            expires_at__gt=timezone.now()
        )
        
        return Response({
            'session_id': session.session_key,
            'expires_at': session.expires_at,
            'ip_address': session.ip_address,
        }, status=status.HTTP_200_OK)
    
    except UserSession.DoesNotExist:
        return Response(
            {'error': 'No active session'}, 
            status=status.HTTP_404_NOT_FOUND
        )


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
