from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Only platform super-admins (role='superadmin' or is_superuser=True)."""
    message = 'You must be a super admin to access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'superadmin' or request.user.is_superuser)
        )


class IsCompanyAdmin(BasePermission):
    """User must be a company admin belonging to a company."""
    message = 'You must be a company admin to access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'company_admin' and
            request.user.company is not None
        )


class IsCompanyStaff(BasePermission):
    """User is staff or admin of their company."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('company_admin', 'staff') and
            request.user.company is not None
        )


class IsAdminOrCompanyAdmin(BasePermission):
    """Super-admin OR company-admin."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.role == 'superadmin' or
            request.user.is_superuser or
            (request.user.role == 'company_admin' and request.user.company is not None) or
            request.user.is_staff
        )
