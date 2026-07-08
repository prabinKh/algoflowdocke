from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def _send_email(subject, body, to_email):
        """Base method to send email"""
        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
                to=[to_email]
            )
            email.send(fail_silently=False)
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_verification_email(user, token):
        """Send email verification link"""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = "Verify Your Email Address"
        body = f"""
Hello {user.name},

Thank you for registering! Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
The Team
        """.strip()
        
        return EmailService._send_email(subject, body, user.email)
    
    @staticmethod
    def send_password_reset_email(user, token):
        """Send password reset link"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Password Reset Request"
        body = f"""
Hello {user.name},

You have requested to reset your password. Click the link below to reset your password:

{reset_url}

This link will expire in 2 hours.

If you did not request this, please ignore this email and your password will remain unchanged.

Best regards,
The Team
        """.strip()
        
        return EmailService._send_email(subject, body, user.email)
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email after verification"""
        subject = "Welcome to Our Platform!"
        body = f"""
Hello {user.name},

Welcome! Your email has been verified and your account is now active.

You can now log in and start using our platform.

Best regards,
The Team
        """.strip()
        
        return EmailService._send_email(subject, body, user.email)
    
    @staticmethod
    def send_password_changed_email(user):
        """Send notification email after password change"""
        subject = "Password Changed Successfully"
        body = f"""
Hello {user.name},

Your password has been changed successfully.

If you did not make this change, please contact us immediately.

Best regards,
The Team
        """.strip()
        
        return EmailService._send_email(subject, body, user.email)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Get user agent from request"""
    return request.META.get('HTTP_USER_AGENT', '')