from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
import logging
from django.contrib.auth import get_user_model

User = get_user_model()

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads token from cookies
    instead of Authorization header
    """
    
    def authenticate(self, request):
        """
        Try to authenticate using access token from cookies
        """
        try:
            # Get access token from cookie
            access_token = request.COOKIES.get('access_token')
            logger.debug(f"Access token from cookie: {access_token}")
            
            if not access_token:
                logger.debug("No access token found in cookies")
                return None
            
            # Validate token
            validated_token = self.get_validated_token(access_token)
            logger.debug(f"Validated token: {validated_token}")
            
            # Get user from token
            user = self.get_user(validated_token)
            logger.debug(f"User from token: {user}")
            
            # Check if user is active
            if not user.is_active:
                logger.debug(f"User {user.email} is not active")
                raise AuthenticationFailed('User account is disabled.')
            
            # Check if email is verified (skip for superusers)
            if not user.email_verified and not user.is_superuser:
                logger.debug(f"User {user.email} email not verified")
                raise AuthenticationFailed('Email not verified.')
            
            logger.debug(f"Authentication successful for user: {user.email}")
            return (user, validated_token)
            
        except AuthenticationFailed as e:
            logger.warning(f"Authentication failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None