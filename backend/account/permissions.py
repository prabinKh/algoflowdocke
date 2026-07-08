from rest_framework import permissions
from account.models import User

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to Super Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == User.Role.SUPER_ADMIN or request.user.is_superuser)
        )

class IsCompanyAdmin(permissions.BasePermission):
    """
    Allows access only to Company Admins who belong to the current request company.
    """
    def has_permission(self, request, view):
        # Basic role check
        is_admin_role = (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == User.Role.COMPANY_ADMIN
        )
        
        # Verify company match if request.company is set by middleware
        # Note: If request.company is None, it means the tenant couldn't be identified.
        if is_admin_role and request.company:
            return request.user.company == request.company
            
        return False

class IsCompanyUser(permissions.BasePermission):
    """
    Generic permission for any user belonging to the current company.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.company and 
            request.user.company == request.company
        )
