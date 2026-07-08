"""Shared multi-tenant helpers for company-scoped auth and APIs."""
from company.models import Company


def resolve_tenant(request, *, fallback=False):
    """Resolve the active company from host, headers, or query params."""
    return Company.resolve_from_request(request, fallback=fallback)


def user_belongs_to_tenant(user, tenant):
    """Return True if the user may access this tenant's storefront/admin."""
    if not user or not getattr(user, 'is_authenticated', False) or not user.is_authenticated:
        return True
    if user.is_superuser or getattr(user, 'role', None) == 'superadmin':
        return True
    if not tenant:
        return True
    if not user.company_id:
        return False
    return user.company_id == tenant.id


def tenant_access_error(user, tenant):
    if not tenant:
        return None
    if user_belongs_to_tenant(user, tenant):
        return None
    tenant_name = tenant.name
    if user.company:
        return (
            f'This account belongs to {user.company.name}. '
            f'Please sign in at {user.company.slug}.localhost:3000/signin'
        )
    return f'You do not have access to {tenant_name}.'
