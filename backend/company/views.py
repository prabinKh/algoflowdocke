from rest_framework import viewsets, permissions, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Company, CompanyGalleryImage, FooterSettings
from efrontend.models import StoreLocation
from .serializers import CompanySerializer, CompanyPublicSerializer, FooterSettingsSerializer, StoreLocationSerializer

User = get_user_model()


class FooterSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = FooterSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_authenticated or not self.request.user.company:
            return FooterSettings.objects.none()
        return FooterSettings.objects.filter(company=self.request.user.company)

    @action(detail=False, methods=['GET', 'PATCH'])
    def current(self, request):
        if not request.user.company:
            return Response({'detail': 'No company.'}, status=404)
        footer, created = FooterSettings.objects.get_or_create(company=request.user.company)
        if request.method == 'PATCH':
            serializer = self.get_serializer(footer, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        serializer = self.get_serializer(footer)
        return Response(serializer.data)


class StoreLocationViewSet(viewsets.ModelViewSet):
    serializer_class = StoreLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_authenticated or not self.request.user.company:
            return StoreLocation.objects.none()
        return StoreLocation.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'public_info']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Company.objects.filter(is_active=True).prefetch_related('gallery_images')

    def perform_create(self, serializer):
        from django.contrib.auth.models import Group, Permission
        user = self.request.user
        serializer.save(owner=user)
        if not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        vendor_group, created = Group.objects.get_or_create(name='Vendors')
        user.groups.add(vendor_group)

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def my_companies(self, request):
        companies = Company.objects.filter(owner=request.user).prefetch_related('gallery_images')
        serializer = self.get_serializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'], permission_classes=[permissions.AllowAny], url_path='public')
    def public_info(self, request, slug=None):
        try:
            company = Company.objects.get(slug=slug, is_active=True)
        except Company.DoesNotExist:
            return Response({'detail': 'Store not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyPublicSerializer(company)
        return Response(serializer.data)


class CompanyProfileView(views.APIView):
    """Company admin can view/update their own company profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'No company associated.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanySerializer(company)
        return Response(serializer.data)

    def patch(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'No company associated.'}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in ('company_admin', 'superadmin') and not request.user.is_superuser:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'company': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class StoreInfoView(views.APIView):
    """Public endpoint: GET /api/store/<slug>/info/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            company = Company.objects.get(slug=slug, is_active=True)
        except Company.DoesNotExist:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyPublicSerializer(company)
        return Response(serializer.data)
