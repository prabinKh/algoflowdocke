from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import MyUser, Note, EmailVerificationToken, PasswordResetToken
from .utils import EmailService
from django.utils import timezone
from datetime import timedelta
import secrets


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with email verification"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )

    class Meta:
        model = MyUser
        fields = ['email', 'name', 'username', 'password', 'password2']
        extra_kwargs = {
            'email': {'required': True},
            'name': {'required': True},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if MyUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value.lower()
    
    def validate_name(self, value):
        """Validate name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long."
            )
        return value.strip()

    def validate_username(self, value):
        if not value or not value.strip():
            return None
        username = value.strip()
        if MyUser.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username
    
    def validate(self, data):
        """Validate passwords match and meet requirements"""
        password = data.get('password')
        password2 = data.get('password2')
        
        if password != password2:
            raise serializers.ValidationError({
                'password2': 'Passwords do not match.'
            })
        
        # Use Django's password validators
        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return data
    
    def create(self, validated_data):
        """Create user and send verification email"""
        validated_data.pop('password2')
        username = validated_data.pop('username', None)
        company = self.context.get('company')

        user = MyUser.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            is_active=True,
            email_verified=True,
            role='customer',
            company=company,
        )
        if username:
            user.username = username
            user.save(update_fields=['username'])
        
        # Generate verification token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Send verification email
        EmailService.send_verification_email(user, token)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Authenticate user"""
        email = data.get('email', '').lower()
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError(
                'Email and password are required.'
            )
        
        # Check if user exists
        try:
            user = MyUser.objects.get(email=email)
        except MyUser.DoesNotExist:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )
        
        # Check if email is verified
        if not user.email_verified:
            raise serializers.ValidationError(
                'Please verify your email before logging in. Check your inbox for the verification link.'
            )
        
        # Authenticate
        user = authenticate(email=email, password=password)
        
        if not user:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                'This account has been deactivated.'
            )
        
        data['user'] = user
        return data


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""
    
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        """Validate verification token"""
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(
                token=value
            )
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError(
                'Invalid verification token.'
            )
        
        if not token_obj.is_valid():
            if token_obj.is_used:
                raise serializers.ValidationError(
                    'This verification link has already been used.'
                )
            else:
                raise serializers.ValidationError(
                    'This verification link has expired. Please request a new one.'
                )
        
        return token_obj
    
    def save(self):
        """Verify user email"""
        token_obj = self.validated_data['token']
        user = token_obj.user
        
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        
        token_obj.make_as_used()
        
        return user


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resending verification email"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = MyUser.objects.get(email__iexact=value)
        except MyUser.DoesNotExist:
            raise serializers.ValidationError(
                'No account found with this email address.'
            )
        
        if user.email_verified:
            raise serializers.ValidationError(
                'This email is already verified.'
            )
        
        return user
    
    def save(self):
        """Send new verification email"""
        user = self.validated_data['email']
        
        # Invalidate old tokens
        EmailVerificationToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Generate new token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Send email
        EmailService.send_verification_email(user, token)
        
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = MyUser.objects.get(email__iexact=value)
        except MyUser.DoesNotExist:
            # Don't reveal if email exists
            return value.lower()
        
        if not user.email_verified:
            raise serializers.ValidationError(
                'Please verify your email first.'
            )
        
        return user
    
    def save(self):
        """Send password reset email"""
        user_or_email = self.validated_data['email']
        
        # If email doesn't exist, silently succeed (security best practice)
        if isinstance(user_or_email, str):
            return None
        
        user = user_or_email
        
        # Invalidate old tokens
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Generate new token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=2)
        
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Send email
        EmailService.send_password_reset_email(user, token)
        
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        min_length=8
    )
    password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_token(self, value):
        """Validate reset token"""
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(
                token=value
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError(
                'Invalid reset token.'
            )
        
        if not token_obj.is_valid():
            if token_obj.is_used:
                raise serializers.ValidationError(
                    'This reset link has already been used.'
                )
            else:
                raise serializers.ValidationError(
                    'This reset link has expired. Please request a new one.'
                )
        
        return token_obj
    
    def validate(self, data):
        """Validate passwords match"""
        password = data.get('password')
        password2 = data.get('password2')
        
        if password != password2:
            raise serializers.ValidationError({
                'password2': 'Passwords do not match.'
            })
        
        # Use Django's password validators
        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return data
    
    def save(self):
        """Reset user password"""
        token_obj = self.validated_data['token']
        user = token_obj.user
        password = self.validated_data['password']
        
        user.set_password(password)
        user.save(update_fields=['password'])

        # Mark this token as used
        token_obj.make_as_used()

        # Invalidate all other reset tokens
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).exclude(id=token_obj.id).update(is_used=True)

        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password (when logged in)"""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        min_length=8
    )
    password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        
        if not user.check_password(value):
            raise serializers.ValidationError(
                'Current password is incorrect.'
            )
        
        return value
    
    def validate(self, data):
        """Validate new passwords match"""
        password = data.get('password')
        password2 = data.get('password2')
        
        if password != password2:
            raise serializers.ValidationError({
                'password2': 'Passwords do not match.'
            })
        
        # Use Django's password validators
        try:
            validate_password(password, user=self.context['request'].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return data
    
    def save(self):
        """Change user password"""
        user = self.context['request'].user
        password = self.validated_data['password']
        
        user.set_password(password)
        user.save(update_fields=['password'])
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""

    class Meta:
        model = MyUser
        fields = ['id', 'email', 'name', 'email_verified', 'is_staff', 'is_superuser', 'created_at', 'last_login']
        read_only_fields = ['id', 'email', 'email_verified', 'is_staff', 'is_superuser', 'created_at', 'last_login']


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for notes"""
    
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'description', 'owner', 'owner_email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'owner_email', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create note with current user as owner"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)