from rest_framework import views, status, generics
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from company.models import Company
from efrontend.models import Order, Product
from .serializers import CompanyStatsSerializer, CreateCompanySerializer
from .permissions import IsSuperAdmin

User = get_user_model()


class SuperAdminDashboardView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_companies = Company.objects.count()
        active_companies = Company.objects.filter(is_active=True).count()
        new_this_month = Company.objects.filter(created_at__gte=month_start).count()
        total_revenue = Order.objects.filter(status='delivered').aggregate(
            total=Sum('total_amount'))['total'] or 0
        total_orders = Order.objects.count()
        total_products = Product.objects.count()
        total_users = User.objects.filter(role='customer').count()

        # Revenue by month (last 6)
        monthly = []
        for i in range(5, -1, -1):
            m_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(
                day=1, hour=0, minute=0, second=0)
            m_end = (m_start + timedelta(days=32)).replace(day=1)
            rev = Order.objects.filter(
                status='delivered', created_at__gte=m_start, created_at__lt=m_end
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            monthly.append({'month': m_start.strftime('%b %Y'), 'revenue': float(rev)})

        # Top companies by revenue
        top_companies = []
        for c in Company.objects.filter(is_active=True)[:10]:
            top_companies.append({
                'id': c.id, 'name': c.name, 'slug': c.slug,
                'revenue': c.total_revenue, 'orders': c.order_count,
            })
        top_companies.sort(key=lambda x: x['revenue'], reverse=True)

        return Response({
            'total_companies': total_companies,
            'active_companies': active_companies,
            'new_this_month': new_this_month,
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'total_products': total_products,
            'total_users': total_users,
            'monthly_revenue': monthly,
            'top_companies': top_companies[:5],
        })


class SuperAdminCompanyListCreateView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        qs = Company.objects.all().select_related('owner')
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(name__icontains=search)
        plan = request.query_params.get('plan', '')
        if plan:
            qs = qs.filter(plan=plan)
        active = request.query_params.get('active', '')
        if active == 'true':
            qs = qs.filter(is_active=True)
        elif active == 'false':
            qs = qs.filter(is_active=False)

        serializer = CompanyStatsSerializer(qs, many=True)
        return Response({'companies': serializer.data, 'count': qs.count()})

    def post(self, request):
        serializer = CreateCompanySerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            company = result['company']
            company_data = CompanyStatsSerializer(company).data
            return Response({
                'success': True,
                'message': f'Company "{company.name}" created successfully.',
                'company': company_data,
                'credentials': {
                    'email': result['admin_user'].email,
                    'password': result['generated_password'],
                    'login_url': f'/store/{company.slug}/admin/',
                },
            }, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)


class SuperAdminCompanyDetailView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def _get_company(self, pk):
        try:
            return Company.objects.select_related('owner').get(pk=pk)
        except Company.DoesNotExist:
            return None

    def get(self, request, pk):
        company = self._get_company(pk)
        if not company:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyStatsSerializer(company)
        # Include admin user info
        data = serializer.data
        if company.owner:
            data['admin_user'] = {
                'id': str(company.owner.id),
                'email': company.owner.email,
                'name': company.owner.name,
                'role': company.owner.role,
                'is_active': company.owner.is_active,
            }
        return Response(data)

    def patch(self, request, pk):
        company = self._get_company(pk)
        if not company:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyStatsSerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Sync is_active to owner user if changed
            if 'is_active' in request.data and company.owner:
                company.owner.is_active = request.data['is_active']
                company.owner.save(update_fields=['is_active'])
            return Response({'success': True, 'company': serializer.data})
        return Response({'success': False, 'errors': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        company = self._get_company(pk)
        if not company:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Soft delete
        company.is_active = False
        company.save(update_fields=['is_active'])
        if company.owner:
            company.owner.is_active = False
            company.owner.save(update_fields=['is_active'])
        return Response({'success': True, 'message': 'Company deactivated.'})


class SuperAdminToggleCompanyView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        company.is_active = not company.is_active
        company.save(update_fields=['is_active'])
        if company.owner:
            company.owner.is_active = company.is_active
            company.owner.save(update_fields=['is_active'])
        return Response({
            'success': True,
            'is_active': company.is_active,
            'message': f'Company {"activated" if company.is_active else "deactivated"}.',
        })


class SuperAdminUserListView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        role = request.query_params.get('role', '')
        qs = User.objects.select_related('company')
        if role:
            qs = qs.filter(role=role)
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(email__icontains=search)

        users = [{
            'id': str(u.id),
            'email': u.email,
            'name': u.name,
            'role': u.role,
            'is_active': u.is_active,
            'email_verified': u.email_verified,
            'company': u.company.name if u.company else None,
            'company_slug': u.company.slug if u.company else None,
            'created_at': u.created_at.isoformat(),
        } for u in qs[:200]]
        return Response({'users': users, 'count': qs.count()})
