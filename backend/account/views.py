from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django_ratelimit.decorators import ratelimit
import logging

from .models import MyUser, Note, LoginAttempt
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    NoteSerializer
)
from .utils import EmailService, get_client_ip, get_user_agent

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class UserRegistrationView(APIView):
    """
    Register a new user
    POST /api/account/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            from company.tenant_utils import resolve_tenant
            tenant = resolve_tenant(request, fallback=False)
            if not tenant:
                return Response({
                    'success': False,
                    'message': 'Please register from a company store URL (e.g. daraz.localhost:3000/signup).',
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = UserRegistrationSerializer(
                data=request.data,
                context={'company': tenant, 'request': request},
            )
            
            if serializer.is_valid():
                user = serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'user': {
                        'email': user.email,
                        'name': user.name
                    }
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred during registration. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailVerificationView(APIView):
    """
    Verify email address
    POST /api/auth/verify-email/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Verify the user's email using the provided token.
        On success, also issue JWT tokens and set them as cookies
        so the user is automatically logged in.
        """
        try:
            serializer = EmailVerificationSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.save()

                # Send welcome email
                EmailService.send_welcome_email(user)

                # Generate tokens and log the user in
                tokens = get_tokens_for_user(user)

                response = Response(
                    {
                        "success": True,
                        "message": "Email verified successfully! You are now logged in.",
                        "access": tokens["access"],
                        "refresh": tokens["refresh"],
                        "user": {
                            "id": str(user.id),
                            "email": user.email,
                            "name": user.name,
                            "email_verified": user.email_verified,
                            "is_staff": user.is_staff,
                            "is_superuser": user.is_superuser
                        },
                    },
                    status=status.HTTP_200_OK,
                )

                # Set cookies exactly like the login view
                response.set_cookie(
                    "access_token",
                    tokens["access"],
                    httponly=True,
                    secure=False,  # Set True in production with HTTPS
                    samesite="Lax",
                    max_age=1800,  # 30 minutes
                )

                response.set_cookie(
                    "refresh_token",
                    tokens["refresh"],
                    httponly=True,
                    secure=False,  # Set True in production with HTTPS
                    samesite="Lax",
                    max_age=86400,  # 24 hours
                )

                return response

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            logger.error(f"Email verification error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred during verification. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResendVerificationView(APIView):
    """
    Resend verification email
    POST /api/auth/resend-verification/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = ResendVerificationSerializer(data=request.data)
            
            if serializer.is_valid():
                user = serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Verification email sent! Please check your inbox.'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Resend verification error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that sets cookies"""
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        user = serializer.user

        from company.tenant_utils import resolve_tenant, tenant_access_error
        tenant = resolve_tenant(request, fallback=False)
        access_error = tenant_access_error(user, tenant)
        if access_error:
            return Response({
                'success': False,
                'message': access_error,
            }, status=status.HTTP_403_FORBIDDEN)
        
        tokens = get_tokens_for_user(user)
        
        # Create response
        response = Response({
            'success': True,
            'message': 'Login successful!',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.name,
                'email_verified': user.email_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_admin': user.is_admin,
                'role': user.role,
                'company': {
                    'id': str(user.company.id),
                    'slug': user.company.slug,
                    'name': user.company.name,
                    'theme_color': user.company.theme_color,
                    'category': user.company.category,
                } if user.company else None,
            }
        }, status=status.HTTP_200_OK)
        
        # Set cookies
        access_token = tokens['access']
        refresh_token = tokens['refresh']
        
        response.set_cookie(
            'access_token',
            access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=1800  # 30 minutes
        )
        
        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=86400  # 24 hours
        )
        
        return response


class CustomRefreshTokenView(TokenRefreshView):
    """Custom refresh token view that handles token refresh with cookies and rate limiting"""
    
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'No refresh token provided.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # First, let's validate the refresh token
            serializer = self.get_serializer(data={'refresh': refresh_token})
            
            try:
                serializer.is_valid(raise_exception=True)
            except TokenError as e:
                logger.warning(f"Token validation failed: {str(e)}")
                # Clear invalid cookies
                response = Response({
                    'success': False,
                    'message': 'Session expired. Please log in again.'
                }, status=status.HTTP_401_UNAUTHORIZED)
                response.delete_cookie('access_token')
                response.delete_cookie('refresh_token')
                return response
            
            # Create new access token
            access_token = serializer.validated_data.get('access')
            
            response = Response({
                'success': True,
                'message': 'Token refreshed successfully.'
            }, status=status.HTTP_200_OK)
            
            # Set new access token cookie
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite='Lax',
                max_age=1800  # 30 minutes
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Unexpected refresh error: {str(e)}")
            # Clear cookies on any unexpected error
            response = Response({
                'success': False,
                'message': 'Session expired. Please log in again.'
            }, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response


class LogoutView(APIView):
    """Logout view that clears cookies"""
    
    def post(self, request):
        response = Response({
            'success': True,
            'message': 'Logged out successfully.'
        }, status=status.HTTP_200_OK)
        
        # Clear cookies
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response


class PasswordResetRequestView(APIView):
    """
    Request password reset
    POST /api/auth/password-reset/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = PasswordResetRequestSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'If an account exists with this email, you will receive a password reset link.'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Password reset request error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset
    POST /api/auth/password-reset/confirm/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = PasswordResetConfirmSerializer(data=request.data)
            
            if serializer.is_valid():
                user = serializer.save()
                
                # Send confirmation email
                EmailService.send_password_changed_email(user)
                
                return Response({
                    'success': True,
                    'message': 'Password reset successfully! You can now log in with your new password.'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Password reset confirm error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """
    Change password (requires authentication)
    POST /api/auth/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                user = serializer.save()
                
                # Send confirmation email
                EmailService.send_password_changed_email(user)
                
                return Response({
                    'success': True,
                    'message': 'Password changed successfully!'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Change password error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(APIView):
    """
    Get user profile
    GET /api/auth/profile/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            serializer = UserProfileSerializer(request.user)
            return Response({
                'success': True,
                'user': serializer.data,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request):
        """Update user profile"""
        try:
            serializer = UserProfileSerializer(
                request.user,
                data=request.data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Profile updated successfully!',
                    'user': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Profile update error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IsAuthenticatedView(APIView):
    """
    Check if user is authenticated
    GET /api/auth/check/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from company.tenant_utils import resolve_tenant, tenant_access_error

        user = request.user
        tenant = resolve_tenant(request, fallback=False)
        access_error = tenant_access_error(user, tenant)
        if access_error:
            return Response({
                'authenticated': False,
                'message': access_error,
            }, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'authenticated': True,
            'tenant_slug': tenant.slug if tenant else None,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_admin': user.is_admin,
                'email_verified': user.email_verified,
                'role': user.role,
                'company': {
                    'id': str(user.company.id),
                    'slug': user.company.slug,
                    'name': user.company.name,
                    'theme_color': user.company.theme_color,
                    'category': user.company.category,
                } if user.company else None,
            }
        }, status=status.HTTP_200_OK)


# Note endpoints
class NoteListCreateView(generics.ListCreateAPIView):
    """
    List and create notes
    GET/POST /api/notes/
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Note.objects.filter(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Note creation error: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, delete note
    GET/PUT/DELETE /api/notes/<id>/
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Note.objects.filter(owner=self.request.user)