from company.models import Company
from company.tenant_utils import resolve_tenant


class TenantMiddleware:
    """
    Attach request.company for every API request.
    Identification order matches Company.resolve_from_request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.company = None

        if getattr(request, 'user', None) and request.user.is_authenticated:
            if hasattr(request.user, 'company') and request.user.company:
                request.company = request.user.company

        if not request.company:
            request.company = resolve_tenant(request, fallback=False)

        response = self.get_response(request)
        return response
