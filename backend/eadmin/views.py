from rest_framework import viewsets, permissions, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import UserActivity, POSSale, ServiceTicket, ContactMessage, CategoryFeature, ChatSession, ChatMessage, StaffRole, StaffMember, \
    RepairProduct, RepairProductBrand, RepairCommonIssue, ServiceableItem, ServiceCategory, ServiceBrand
from efrontend.models import Product, Order, Category, Brand, Collection
from account.models import User
from .serializers import (
    UserActivitySerializer, AdminProductSerializer, AdminOrderSerializer,
    CustomerSerializer, POSSaleSerializer, ServiceTicketSerializer,
    ContactMessageSerializer, CategoryFeatureSerializer,
    ChatSessionSerializer, ChatMessageSerializer,
    StaffRoleSerializer, StaffMemberSerializer, AdminBrandSerializer,
    RepairProductSerializer, RepairProductBrandSerializer, RepairCommonIssueSerializer,
    ServiceableItemSerializer, ServiceCategorySerializer, ServiceBrandSerializer
)
from .tasks import generate_ai_response
from efrontend.serializers import HeroSettingSerializer, CategorySerializer, CollectionSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_staff or request.user.is_superuser or
            request.user.role in ('superadmin', 'company_admin', 'staff')
        )


def get_company_filter(request):
    """Return company filter dict for querysets based on logged-in user."""
    user = request.user
    if not user or not user.is_authenticated:
        tenant = getattr(request, 'company', None)
        if tenant:
            return {'company': tenant}
        return {}
    if user.role == 'superadmin' or user.is_superuser:
        company_id = request.query_params.get('company')
        if company_id:
            return {'company_id': company_id}
        tenant = getattr(request, 'company', None)
        if tenant:
            return {'company': tenant}
        return {}
    if user.company:
        return {'company': user.company}
    tenant = getattr(request, 'company', None)
    if tenant:
        return {'company': tenant}
    return {}


def resolve_company_for_user(request):
    """Resolve a company object for the current user/request."""
    user = request.user
    from company.models import Company
    
    if user and user.is_authenticated:
        if (user.role == 'superadmin' or user.is_superuser):
            company_id = request.query_params.get('company')
            if company_id:
                try:
                    return Company.objects.get(id=company_id)
                except (Company.DoesNotExist, ValueError):
                    pass
            
            # If no company in query, try header
            slug = request.headers.get('X-Company-Slug') or request.META.get('HTTP_X_COMPANY_SLUG')
            if slug:
                comp = Company.objects.filter(slug=slug).first()
                if comp:
                    return comp
                    
        if user.company:
            return user.company
    
    # Fall back to resolving by host header or other methods
    company = Company.resolve_from_request(request)
    
    # If still not found and we are in AI Studio / Dev, or just as absolute fallback for superadmin
    if not company and user and user.is_authenticated and (user.role == 'superadmin' or user.is_superuser):
        company = Company.objects.first()
        
    return company


class DashboardStatsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        cf = get_company_filter(request)

        total_sales = Order.objects.filter(status='process_conform', **cf).aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        this_month_sales = Order.objects.filter(
            status='process_conform', created_at__gte=month_start, **cf
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        last_month_sales = Order.objects.filter(
            status='process_conform', created_at__gte=last_month_start, created_at__lt=month_start, **cf
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        total_orders = Order.objects.filter(**cf).count()
        pending_orders = Order.objects.filter(status='pending', **cf).count()
        total_products = Product.objects.filter(**cf).count()
        low_stock_products = Product.objects.filter(stock__lt=10, **cf).count()

        if cf:
            total_customers = User.objects.filter(
                role='customer', company=request.user.company
            ).count() if request.user.company else 0
        else:
            total_customers = User.objects.filter(role='customer').count()

        recent_orders = Order.objects.filter(**cf).order_by('-created_at')[:5]
        recent_orders_data = [{
            'id': o.id, 'orderId': o.order_id, 'customerName': o.full_name,
            'customerEmail': o.email, 'totalAmount': float(o.total_amount),
            'status': o.status, 'createdAt': o.created_at.isoformat(),
        } for o in recent_orders]

        monthly_revenue = []
        six_months_ago = now - timedelta(days=180)
        revenue_map = {
            item['month']: item['total_rev'] 
            for item in Order.objects.filter(status='process_conform', created_at__gte=six_months_ago, **cf)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total_rev=Sum('total_amount'))
        }
        
        for i in range(6, -1, -1):
            m_start = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i * 30)).replace(day=1)
            rev = revenue_map.get(m_start.date(), 0) or 0
            monthly_revenue.append({'month': m_start.strftime('%b %Y'), 'revenue': float(rev)})

        top_products = (
            Order.objects.filter(status='process_conform', **cf)
            .values('items__product__id', 'items__product__name', 'items__name')
            .annotate(total_qty=Sum('items__quantity'), total_rev=Sum('items__price'))
            .order_by('-total_qty')[:5]
        )

        sales_growth = 0
        if last_month_sales:
            sales_growth = round(((float(this_month_sales) - float(last_month_sales)) / float(last_month_sales)) * 100, 1)

        return Response({
            'total_sales': float(total_sales),
            'this_month_sales': float(this_month_sales),
            'sales_growth': sales_growth,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_customers': total_customers,
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'recent_orders': recent_orders_data,
            'monthly_revenue': monthly_revenue,
            'top_products': list(top_products),
        })


@method_decorator(csrf_exempt, name='dispatch')
class AdminProductViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = Product.objects.filter(**cf).select_related('category', 'brand', 'company').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(brand__name__icontains=search))
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        if not company:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Company context could not be resolved."})
        serializer.save(company=company)


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        # Optimized with select_related and prefetch_related to prevent N+1 queries
        qs = Order.objects.filter(**cf).select_related('user', 'company').prefetch_related('items', 'items__product').order_by('-created_at')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        exclude_status = self.request.query_params.get('exclude_status')
        if exclude_status:
            statuses = exclude_status.split(',')
            qs = qs.exclude(status__in=statuses)
            
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            qs = qs.filter(payment_status=payment_status)
            
        return qs

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()
        if 'paymentStatus' in data:
            data['payment_status'] = data.pop('paymentStatus')
        if 'paymentMethod' in data:
            data['payment_method'] = data.pop('paymentMethod')
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if 'payment_status' in data:
            instance.payment_status = data['payment_status']
        if 'status' in data:
            instance.status = data['status']
        instance.save()
        return Response(AdminOrderSerializer(instance).data)


class CustomerListView(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.company and not (user.is_superuser or user.role == 'superadmin'):
            return User.objects.filter(
                role='customer', company=user.company
            ).annotate(order_count=Count('orders'), total_spent=Sum('orders__total_amount'))
        return User.objects.filter(role='customer').annotate(
            order_count=Count('orders'), total_spent=Sum('orders__total_amount')
        )

    def get_permissions(self):
        if self.action in ['retrieve', 'sync_cart', 'sync_wishlist']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_object(self):
        pk = self.kwargs.get('pk')
        email = self.request.query_params.get('email') or ''
        try:
            import uuid as _uuid
            uid_val = _uuid.UUID(str(pk))
            user = User.objects.get(id=uid_val)
            return user
        except (ValueError, User.DoesNotExist):
            pass
        try:
            user = User.objects.get(firebase_uid=pk)
            return user
        except User.DoesNotExist:
            pass
        if email:
            try:
                user = User.objects.get(email=email)
                return user
            except User.DoesNotExist:
                pass
        safe_email = email if email and '@' in email else f'guest_{str(pk)[:8]}@guest.local'
        safe_name = email.split('@')[0] if email and '@' in email else 'Guest'
        try:
            user, _ = User.objects.get_or_create(
                firebase_uid=str(pk),
                defaults={'email': safe_email, 'name': safe_name}
            )
        except Exception:
            from rest_framework.exceptions import NotFound
            raise NotFound(detail='Customer not found')
        return user

    @action(detail=True, methods=['post'], url_path='sync_cart', permission_classes=[permissions.AllowAny])
    def sync_cart(self, request, pk=None):
        user = self.get_object()
        user.cart_items = request.data.get('cartItems', [])
        user.save(update_fields=['cart_items', 'updated_at'])
        return Response({'success': True, 'cartItems': user.cart_items})

    @action(detail=True, methods=['post'], url_path='sync_wishlist', permission_classes=[permissions.AllowAny])
    def sync_wishlist(self, request, pk=None):
        user = self.get_object()
        user.wishlist_items = request.data.get('wishlistItems', [])
        user.save(update_fields=['wishlist_items', 'updated_at'])
        return Response({'success': True, 'wishlistItems': user.wishlist_items})


@method_decorator(csrf_exempt, name='dispatch')
class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = UserActivity.objects.all().select_related('user').order_by('-timestamp')
    serializer_class = UserActivitySerializer

    def get_authenticators(self):
        if getattr(self, 'action', None) == 'create':
            return []
        return super().get_authenticators()

    def get_permissions(self):
        action = getattr(self, 'action', None)
        if action == 'create':
            return [permissions.AllowAny()]
        if action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        queryset = UserActivity.objects.filter(**cf).select_related('user').order_by('-timestamp')
        if self.request.user.is_authenticated and not (
            self.request.user.is_admin or self.request.user.is_staff or
            self.request.user.role in ('company_admin', 'superadmin')
        ):
            return queryset.filter(user=self.request.user)
        uid = self.request.query_params.get('uid')
        if uid:
            try:
                import uuid as _uuid
                uid_as_uuid = _uuid.UUID(str(uid))
                queryset = queryset.filter(Q(user__firebase_uid=uid) | Q(user__id=uid_as_uuid))
            except ValueError:
                queryset = queryset.filter(user__firebase_uid=uid)
        return queryset


class POSSaleViewSet(viewsets.ModelViewSet):
    serializer_class = POSSaleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        order_cf = {f'order__{k}': v for k, v in cf.items()}
        # Optimized with select_related and prefetch_related for faster serialization
        return POSSale.objects.filter(**order_cf).select_related('order', 'processed_by').prefetch_related('order__items').order_by('-sale_date')


@method_decorator(csrf_exempt, name='dispatch')
class AdminContactMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return ContactMessage.objects.filter(**cf).order_by('-created_at')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCategoryFeatureViewSet(viewsets.ModelViewSet):
    queryset = CategoryFeature.objects.all().select_related('category')
    serializer_class = CategoryFeatureSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def list(self, request, *args, **kwargs):
        cf = get_company_filter(request)
        features = CategoryFeature.objects.filter(is_active=True, **cf).select_related('category')
        grouped = {}
        for f in features:
            slug = f.category.slug
            if slug not in grouped:
                grouped[slug] = {'id': slug, 'categorySlug': slug, 'categoryName': f.category.name, 'features': []}
            grouped[slug]['features'].append(f.feature_name)
        return Response(list(grouped.values()))

    def create(self, request, *args, **kwargs):
        data = request.data
        category_slug = data.get('categorySlug') or data.get('category_slug') or data.get('categoryName', '').lower().replace(' ', '-')
        features_list = data.get('features', [])
        category_name = data.get('categoryName') or category_slug
        
        company = resolve_company_for_user(request)
        
        cat = Category.objects.filter(slug=category_slug, company=company).first()
        if not cat:
            cat = Category.objects.create(name=category_name, slug=category_slug, company=company)
        
        if 'features' in data:
            features_list = data.get('features', [])
            existing = list(CategoryFeature.objects.filter(category=cat, company=company).values_list('feature_name', flat=True))
            for feature_name in features_list:
                if feature_name not in existing:
                    CategoryFeature.objects.create(category=cat, feature_name=feature_name, company=company)
            CategoryFeature.objects.filter(category=cat, company=company).exclude(feature_name__in=features_list).delete()
            return Response({'id': category_slug, 'categorySlug': category_slug, 'categoryName': category_name, 'features': features_list}, status=status.HTTP_201_CREATED)
        else:
            feature_name = data.get('feature_name') or data.get('featureName', '')
            if not feature_name:
                return Response({'error': 'feature_name required'}, status=400)
            obj, created = CategoryFeature.objects.get_or_create(category=cat, feature_name=feature_name, company=company)
            return Response(CategoryFeatureSerializer(obj).data, status=status.HTTP_201_CREATED if created else 200)

    @action(detail=False, methods=['post', 'put'], url_path='update-features')
    def update_features(self, request):
        return self.create(request)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return Category.objects.filter(**cf).order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        if not company:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Company context could not be resolved."})
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class AdminBrandViewSet(viewsets.ModelViewSet):
    serializer_class = AdminBrandSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return Brand.objects.filter(**cf).order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        if not company:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Company context could not be resolved."})
        serializer.save(company=company)


class UploadView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.files.storage import default_storage
        folder = request.data.get('path', 'uploads')
        # Ensure we use exactly the specified filename from path if it ends with one
        path_segments = folder.split('/')
        if '.' in path_segments[-1]: # If last segment is a filename
            file_name = path_segments.pop()
            folder = '/'.join(path_segments)
        else:
            file_name = f.name
            
        save_path = default_storage.save(f'{folder}/{file_name}', f)
        url = f'/media/{save_path}'
        return Response({'url': url})


class UploadModelView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.files.storage import default_storage
        save_path = default_storage.save(f'models/{f.name}', f)
        url = f'/media/{save_path}'
        return Response({'url': url})


@method_decorator(csrf_exempt, name='dispatch')
class AdminHeroSettingViewSet(viewsets.ModelViewSet):
    serializer_class = HeroSettingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return __import__('efrontend.models', fromlist=['HeroSetting']).HeroSetting.objects.filter(**cf).order_by('order')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)

    def create(self, request, *args, **kwargs):
        HeroSetting = __import__('efrontend.models', fromlist=['HeroSetting']).HeroSetting
        cf = get_company_filter(request)
        existing = HeroSetting.objects.filter(**cf).first()
        data = request.data.copy()
        if 'description' in data and 'subtitle' not in data:
            data['subtitle'] = data['description']
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReportsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cf = get_company_filter(request)
        report_type = request.query_params.get('type', 'sales')
        if report_type == 'sales_by_category':
            data = list(Order.objects.filter(status='process_conform', **cf).values(
                'items__product__category__name'
            ).annotate(total_sales=Sum('items__price'), total_orders=Count('id', distinct=True)))
        elif report_type == 'sales_by_brand':
            data = list(Order.objects.filter(status='process_conform', **cf).values(
                'items__product__brand__name'
            ).annotate(total_sales=Sum('items__price'), total_orders=Count('id', distinct=True)))
        elif report_type == 'sales_by_city':
            # Optionally filter by nepal if the user specifically wants that
            country = request.query_params.get('country')
            city_cf = cf.copy()
            if country:
                city_cf['country__iexact'] = country
            data = list(Order.objects.filter(status='process_conform', **city_cf).values(
                'city'
            ).annotate(total_sales=Sum('total_amount'), total_orders=Count('id'))
            .order_by('-total_sales'))
        elif report_type == 'sales_by_country':
            data = list(Order.objects.filter(status='process_conform', **cf).values(
                'country'
            ).annotate(total_sales=Sum('total_amount'), total_orders=Count('id'))
            .order_by('-total_sales'))
        elif report_type == 'sales_by_product':
            data = list(Order.objects.filter(status='process_conform', **cf).values(
                'items__product__name', 'items__name'
            ).annotate(
                total_sales=Sum('items__price'), total_quantity=Sum('items__quantity'),
                total_orders=Count('id', distinct=True)
            ).order_by('-total_sales')[:20])
        elif report_type == 'sales_by_status':
            data = list(Order.objects.filter(**cf).values('status').annotate(count=Count('id')))
        elif report_type == 'stock_report':
            data = list(Product.objects.filter(**cf).values('name', 'brand', 'stock', 'category__name').order_by('stock'))
        else:
            data = {'error': 'Invalid report type'}
        return Response(data)


class StaffRoleViewSet(viewsets.ModelViewSet):
    serializer_class = StaffRoleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return StaffRole.objects.filter(**cf).order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


class StaffMemberViewSet(viewsets.ModelViewSet):
    serializer_class = StaffMemberSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = StaffMember.objects.filter(**cf)
        role_id = self.request.query_params.get('role')
        if role_id:
            qs = qs.filter(role_id=role_id)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return Collection.objects.filter(**cf).order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        collection_name = instance.name
        company = instance.company
        
        # Clean up products that have this collection name in their JSONField
        from efrontend.models import Product
        # Filter products by company if company exists
        products_qs = Product.objects.all()
        if company:
            products_qs = products_qs.filter(company=company)
            
        # We need to filter by products containing the collection name in the list
        # For SQLite/Postgres we use different lookups but __contains for JSONField works in both usually
        # or we manually filter
        for product in products_qs:
            if isinstance(product.collections, list) and collection_name in product.collections:
                product.collections.remove(collection_name)
                product.save()
        
        return super().destroy(request, *args, **kwargs)


@method_decorator(csrf_exempt, name='dispatch')
class RepairProductViewSet(viewsets.ModelViewSet):
    serializer_class = RepairProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = RepairProduct.objects.filter(**cf).prefetch_related('brands', 'issues')
        
        # Frontend filtering
        if not IsAdminUser().has_permission(self.request, self):
            qs = qs.filter(status='active')
        
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(brands__brand_name__icontains=search)).distinct()
            
        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(category=category)
            
        return qs.order_by('name')

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)

    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        product = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['active', 'inactive']:
            product.status = new_status
            product.save()
            return Response({'status': product.status})
        return Response({'error': 'Invalid status'}, status=400)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        cf = get_company_filter(request)
        qs = RepairProduct.objects.filter(**cf)
        return Response({
            'total_products': qs.count(),
            'active_products': qs.filter(status='active').count(),
            'inactive_products': qs.filter(status='inactive').count(),
            'total_brands': RepairProductBrand.objects.filter(product__company=resolve_company_for_user(request)).count()
        })


@method_decorator(csrf_exempt, name='dispatch')
class RepairProductBrandViewSet(viewsets.ModelViewSet):
    serializer_class = RepairProductBrandSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        company = resolve_company_for_user(self.request)
        qs = RepairProductBrand.objects.filter(product__company=company)
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        product = serializer.validated_data.get('product')
        user = self.request.user
        is_super = user and (user.role == 'superadmin' or user.is_superuser)
        if not is_super and product.company != company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add brands to products belonging to your company.")
        serializer.save()


@method_decorator(csrf_exempt, name='dispatch')
class ServiceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return ServiceCategory.objects.filter(**cf)

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        if not company:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Company context could not be resolved."})
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class ServiceBrandViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceBrandSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        category_id = self.request.query_params.get('category_id')
        company = resolve_company_for_user(self.request)
        qs = ServiceBrand.objects.filter(category__company=company)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        category = serializer.validated_data.get('category')
        user = self.request.user
        is_super = user and (user.role == 'superadmin' or user.is_superuser)
        if not is_super and category.company != company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add brands to categories belonging to your company.")
        serializer.save()


@method_decorator(csrf_exempt, name='dispatch')
class AdminServiceCenterSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceableItemSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        return ServiceableItem.objects.filter(**cf)

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        serializer.save(company=company)


@method_decorator(csrf_exempt, name='dispatch')
class RepairCommonIssueViewSet(viewsets.ModelViewSet):
    serializer_class = RepairCommonIssueSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        company = resolve_company_for_user(self.request)
        qs = RepairCommonIssue.objects.filter(product__company=company)
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        company = resolve_company_for_user(self.request)
        product = serializer.validated_data.get('product')
        user = self.request.user
        is_super = user and (user.role == 'superadmin' or user.is_superuser)
        if not is_super and product.company != company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add issues to products belonging to your company.")
        serializer.save()


@method_decorator(csrf_exempt, name='dispatch')
class AdminServiceTicketViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceTicketSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def get_queryset(self):
        cf = get_company_filter(self.request)
        qs = ServiceTicket.objects.filter(**cf)
        
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(ticket_id__icontains=search) | 
                Q(customer_name__icontains=search) | 
                Q(phone__icontains=search)
            )
        
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
            
        return qs

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        try:
            import uuid
            uuid.UUID(str(lookup_value))
            return super().get_object()
        except (ValueError, AttributeError):
            # Try to lookup by ticket_id
            from django.shortcuts import get_object_or_404
            filter_kwargs = {'ticket_id': lookup_value}
            obj = get_object_or_404(queryset, **filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj

    def perform_create(self, serializer):
        # For public create, we need to associate it with the right company.
        # If company_id is provided in data, use it. Otherwise, try to find from product.
        company_id = self.request.data.get('company')
        product_id = self.request.data.get('product_id') or self.request.data.get('product')
        
        company = None
        if company_id:
            try:
                from company.models import Company
                company = Company.objects.get(id=company_id)
            except:
                pass
        elif product_id:
            try:
                product = RepairProduct.objects.get(id=product_id)
                company = product.company
            except:
                pass
        
        if not company:
            # Fallback for multi-tenant systems if not specified
            company = resolve_company_for_user(self.request)
            
        serializer.save(company=company)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def seed_test_data(self, request):
        import uuid
        import random
        from company.models import Company
        
        company = resolve_company_for_user(request)
        if not company:
            company = Company.objects.first()
            
        customers = [
            ('John Doe', 'john@example.com', '+1234567890'),
            ('Jane Smith', 'jane@example.com', '+0987654321'),
            ('Mike Ross', 'mike@example.com', '+1122334455'),
            ('Rachel Zane', 'rachel@example.com', '+5544332211'),
            ('Harvey Specter', 'harvey@example.com', '+9988776655')
        ]
        
        models = ['iPhone 15', 'Galaxy S23', 'MacBook Air', 'iPad Pro', 'Pixel 8']
        statuses = ['pending', 'submitted', 'in_progress', 'completed', 'cancelled']
        
        created_count = 0
        for i in range(5):
            name, email, phone = customers[i]
            ticket = ServiceTicket.objects.create(
                company=company,
                ticket_id=f"TEST-{uuid.uuid4().hex[:6].upper()}",
                customer_name=name,
                email=email,
                phone=phone,
                model=models[i],
                brand_name=random.choice(['Apple', 'Samsung', 'Google']),
                description=f"Automated test ticket for {models[i]}",
                status=statuses[i],
                service_type='repair',
                delivery_method='walk_in'
            )
            created_count += 1
            
        return Response({'status': 'success', 'created': created_count})
