from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, PasswordResetToken
from apps.clients.models import Client


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    employee_id = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=128, write_only=True)
    remember_me = serializers.BooleanField(default=False)
    
    def validate(self, attrs):
        employee_id = attrs.get('employee_id')
        password = attrs.get('password')
        
        if employee_id and password:
            user = authenticate(
                request=self.context.get('request'),
                username=employee_id,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid employee ID or password')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is deactivated')
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Both employee ID and password are required')
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    
    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'email', 'first_name', 'last_name', 
            'role', 'phone', 'client', 'is_active', 'last_login', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client', 'last_login', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate_password(self, value):
        """Validate password strength"""
        user = self.instance
        validate_password(value, user=user)
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness within client"""
        user = self.instance
        email = value.lower()
        
        if User.objects.filter(
            email=email, 
            client=user.client
        ).exclude(id=user.id).exists():
            raise serializers.ValidationError('Email already exists for this client')
        
        return email
    
    def to_representation(self, instance):
        """Custom representation with role-based fields"""
        data = super().to_representation(instance)
        data['role_display'] = instance.get_role_display()
        data['is_admin'] = instance.is_admin
        data['is_supervisor'] = instance.is_supervisor
        data['is_super_admin'] = instance.is_super_admin
        return data


class CreateUserSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (Admin only)"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'employee_id', 'email', 'first_name', 'last_name', 
            'password', 'password_confirm', 'role', 'phone', 'client'
        ]
    
    def validate_employee_id(self, value):
        """Validate employee ID uniqueness"""
        if User.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError('Employee ID already exists')
        return value
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        """Create user with encrypted password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = User.objects.get(email=value.lower())
            self.context['user'] = user
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        """Validate token and password confirmation"""
        token = attrs.get('token')
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError("Passwords don't match")
        
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token, 
                is_used=False
            )
            
            if reset_token.is_expired:
                raise serializers.ValidationError("Reset token has expired")
            
            self.context['reset_token'] = reset_token
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid reset token")
        
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
