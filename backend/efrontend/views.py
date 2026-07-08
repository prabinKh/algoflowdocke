from django.db.models import Q
from rest_framework import generics, permissions, filters, views, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Brand, Product, Order, OrderItem, HeroSetting, Wishlist, Review, StoreLocation, AIRecommendation, Collection
from eadmin.models import ServiceTicket, RepairProduct, ServiceCategory, ServiceBrand
from .serializers import (
    CategorySerializer, BrandSerializer, ProductSerializer, OrderSerializer,
    HeroSettingSerializer, WishlistSerializer, ReviewSerializer,
    StoreLocationSerializer, AIRecommendationSerializer, CollectionSerializer,
    StoreRepairProductSerializer, StoreServiceTicketSerializer,
    StoreServiceCategorySerializer, StoreServiceBrandSerializer
)


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return Category.objects.none()
        
        # Only show active categories
        qs = Category.objects.filter(is_active=True, company=company_obj).prefetch_related('brands')
        return qs.order_by('order', 'name')


class CategoryDetailView(generics.RetrieveAPIView):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

    def get_queryset(self):
        from company.models import Company
        qs = Category.objects.filter(is_active=True)
        company_obj = Company.resolve_from_request(self.request, fallback=False)

        user = getattr(self.request, 'user', None)
        is_admin_user = bool(
            user and getattr(user, 'is_authenticated', False) and (
                getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'role', None) in ('superadmin', 'company_admin', 'staff')
            )
        )

        if company_obj and not is_admin_user:
            qs = qs.filter(products__company=company_obj, products__is_active=True).distinct()
        return qs


class BrandListView(generics.ListCreateAPIView):
    serializer_class = BrandSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return Brand.objects.none()
            
        queryset = Brand.objects.filter(is_active=True, company=company_obj)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)
        return queryset.distinct()

    def perform_create(self, serializer):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        serializer.save(company=company)


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all().select_related('category', 'brand', 'company')
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'brand', 'is_new', 'is_best_seller', 'in_stock']
    search_fields = ['name', 'brand', 'description']
    ordering_fields = ['price', 'created_at', 'rating']

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return Product.objects.none()
            
        queryset = super().get_queryset().filter(company=company_obj)
        
        # Hide products that are in 'end_stock' state (out of stock for > 1 day)
        # Unless user is an admin
        user = getattr(self.request, 'user', None)
        is_admin_user = bool(
            user and getattr(user, 'is_authenticated', False) and (
                getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'role', None) in ('superadmin', 'company_admin', 'staff')
            )
        )
        if not is_admin_user:
            from django.utils import timezone
            from datetime import timedelta
            one_day_ago = timezone.now() - timedelta(days=1)
            
            # Hide if is_end_stock is True OR if it has been out of stock for more than 1 day
            queryset = queryset.filter(
                is_active=True
            ).exclude(
                Q(is_end_stock=True) | 
                Q(out_of_stock_since__lt=one_day_ago, stock__lte=0)
            )

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
            
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

    def get_queryset(self):
        from company.models import Company
        from django.utils import timezone
        from datetime import timedelta
        
        user = getattr(self.request, 'user', None)
        is_admin_user = bool(
            user and getattr(user, 'is_authenticated', False) and (
                getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'role', None) in ('superadmin', 'company_admin', 'staff')
            )
        )
        
        qs = Product.objects.all()
        if not is_admin_user:
            one_day_ago = timezone.now() - timedelta(days=1)
            qs = qs.filter(is_active=True).exclude(
                Q(is_end_stock=True) | 
                Q(out_of_stock_since__lt=one_day_ago, stock__lte=0)
            )
        return qs


class HeroSettingView(generics.ListAPIView):
    serializer_class = HeroSettingSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return HeroSetting.objects.none()
        return HeroSetting.objects.filter(is_active=True, company=company_obj).order_by('order')


class OrderCreateView(views.APIView):
    """
    Accept frontend order format:
    {
      uid, items: [{productId, name, price, quantity, image, features}],
      totalAmount, subtotal, tax, discount,
      shippingAddress: {address, city, phone, country},
      customerName, customerEmail, status, paymentStatus, paymentMethod,
      source, orderId, customerType
    }
    """
    permission_classes = (permissions.AllowAny,)

    PAYMENT_STATUS_ALIASES = {
        'unpaid': 'pending',
        'paid': 'completed',
        'complete': 'completed',
        'completed': 'completed',
    }

    PAYMENT_METHOD_ALIASES = {
        'cash': 'cod',
        'cash on delivery': 'cod',
        'cod': 'cod',
    }

    def _normalize_payment_status(self, value):
        valid = {c[0] for c in Order.PAYMENT_CHOICES}
        raw = str(value or 'pending').lower().strip()
        mapped = self.PAYMENT_STATUS_ALIASES.get(raw, raw)
        return mapped if mapped in valid else 'pending'

    def _normalize_payment_method(self, value):
        valid = {c[0] for c in Order.PAYMENT_METHOD_CHOICES}
        raw = str(value or 'cod').lower().strip()
        mapped = self.PAYMENT_METHOD_ALIASES.get(raw, raw)
        return mapped if mapped in valid else 'cod'

    def _normalize_features(self, value):
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, list):
            return {'items': value}
        return {}

    def _resolve_user(self, request, data):
        if request.user.is_authenticated:
            return request.user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        uid_param = data.get('uid')
        if uid_param:
            user = User.objects.filter(id=uid_param).first()
            if user:
                return user
        email = (data.get('customerEmail') or '').strip().lower()
        if email:
            return User.objects.filter(email=email).first()
        return None

    def _find_product(self, product_id, company=None):
        if not product_id:
            return None
        qs = Product.objects.filter(Q(id=product_id) | Q(slug=product_id))
        if company:
            qs = qs.filter(company=company)
        return qs.select_related('company').first()

    def post(self, request):
        from django.db import transaction
        from company.models import Company
        import uuid

        try:
            data = request.data
            shipping = data.get('shippingAddress') or data.get('shipping') or {}
            items = data.get('items') or []
            if not items:
                return Response({'error': 'Order items are required'}, status=status.HTTP_400_BAD_REQUEST)

            user = self._resolve_user(request, data)
            tenant_company = Company.resolve_from_request(request, fallback=False)

            if user and tenant_company and user.company_id:
                if user.company_id != tenant_company.id and user.role not in ('superadmin',) and not user.is_superuser:
                    return Response(
                        {
                            'error': (
                                f'Your account is registered with {user.company.name}. '
                                f'Please shop and checkout at {user.company.slug}.localhost:3000'
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            payment_status = self._normalize_payment_status(data.get('paymentStatus'))
            payment_method = self._normalize_payment_method(data.get('paymentMethod'))
            order_status = data.get('status', 'new')
            if order_status not in {c[0] for c in Order.STATUS_CHOICES}:
                order_status = 'new'

            uid = uuid.uuid4().hex[:30]
            company_items_map = {}

            # Batch fetch products
            product_ids = [item.get('productId') or item.get('product_id') for item in items]
            products = Product.objects.filter(Q(id__in=product_ids) | Q(slug__in=product_ids)).select_related('company')
            product_map = {str(p.id): p for p in products}
            product_map.update({str(p.slug): p for p in products})

            for item in items:
                product_id = str(item.get('productId') or item.get('product_id'))
                product = product_map.get(product_id)
                company = product.company if product and product.company else None

                if not company and tenant_company:
                    product = self._find_product(product_id, company=tenant_company) or product
                    company = tenant_company

                if not company and user and getattr(user, 'company', None):
                    company = user.company
                    if product_id and not product:
                        product = self._find_product(product_id, company=company)

                if not company:
                    return Response(
                        {
                            'error': (
                                f'Could not determine store for product "{product_id}". '
                                'Please add items from a valid store listing.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                item['_product'] = product
                company_id = company.id
                if company_id not in company_items_map:
                    company_items_map[company_id] = {
                        'company': company,
                        'items': [],
                        'subtotal': 0,
                    }

                company_items_map[company_id]['items'].append(item)
                company_items_map[company_id]['subtotal'] += float(item.get('price', 0)) * int(item.get('quantity', 1))

            created_orders = []
            base_order_id = (data.get('orderId') or '').strip() or None

            with transaction.atomic():
                for idx, group in enumerate(company_items_map.values()):
                    subtotal = group['subtotal']
                    
                    # Generate a unique order_id if not provided
                    cur_order_id = base_order_id
                    if not cur_order_id:
                        from datetime import datetime
                        import random
                        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                        cur_order_id = f'ORD{timestamp}{random.randint(1000, 9999)}'
                    
                    if len(company_items_map) > 1:
                        cur_order_id = f"{cur_order_id}-{idx + 1}"
                        order_uid = f"{uid}-{idx + 1}"
                    else:
                        order_uid = uid

                    order = Order.objects.create(
                        user=user,
                        company=group['company'],
                        uid=order_uid,
                        order_id=cur_order_id,
                        email=(data.get('customerEmail') or (user.email if user else '')).strip(),
                        full_name=data.get('customerName') or (user.name if user else 'Customer'),
                        address=shipping.get('address', ''),
                        city=shipping.get('city', ''),
                        country=shipping.get('country', 'Nepal'),
                        phone=shipping.get('phone', ''),
                        subtotal=subtotal,
                        tax=float(data.get('tax') or 0),
                        discount=float(data.get('discount') or 0),
                        total_amount=subtotal + float(data.get('tax') or 0) - float(data.get('discount') or 0),
                        status=order_status,
                        payment_status=payment_status,
                        payment_method=payment_method,
                        source=data.get('source') or 'store',
                        customer_type=data.get('customerType') or 'registered',
                    )
                    created_orders.append(order)

                    for line in group['items']:
                        product = line.get('_product')
                        line_image = line.get('image') or (product.image if product else '') or ''
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            product_id_str=str(product.id) if product else str(line.get('productId', '')),
                            name=line.get('name') or (product.name if product else 'Product'),
                            image=line_image,
                            features=self._normalize_features(line.get('features')),
                            quantity=int(line.get('quantity', 1)),
                            price=float(line.get('price', 0)),
                        )
                        
                        # Decrement stock if status is process_conform
                        if order_status == 'process_conform' and product:
                            product.stock -= int(line.get('quantity', 1))
                            product.save()

            if not created_orders:
                return Response({'error': 'No orders were created.'}, status=status.HTTP_400_BAD_REQUEST)

            return Response(OrderSerializer(created_orders[0]).data, status=status.HTTP_201_CREATED)

        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception('Order creation failed')
            return Response(
                {'error': 'Failed to create order.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderTrackView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        pk = self.kwargs.get('id')
        try:
            return Order.objects.get(id=pk)
        except Order.DoesNotExist:
            return Order.objects.get(order_id=pk)


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


class WishlistViewSet(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        from company.models import Company
        company = Company.resolve_from_request(request)
        wishlist = Wishlist.objects.filter(user=request.user)
        if company:
            wishlist = wishlist.filter(company=company)
        serializer = WishlistSerializer(wishlist, many=True)
        return Response(serializer.data)

    def post(self, request):
        from company.models import Company
        company = Company.resolve_from_request(request)
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user, 
            product=product,
            company=company or product.company
        )
        if not created:
            wishlist_item.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'})


class ReviewViewSet(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        from company.models import Company
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        company = Company.resolve_from_request(request)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        data = request.data.copy()
        data['product'] = product_id
        data['user'] = request.user.id
        
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save(company=company or product.company)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreLocationView(generics.ListAPIView):
    serializer_class = StoreLocationSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return StoreLocation.objects.none()
        return StoreLocation.objects.filter(company=company_obj)


class AIRecommendationView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        from company.models import Company
        company = Company.resolve_from_request(request)
        if not company:
            return Response({'error': 'Company context is required.'}, status=400)
            
        query = request.data.get('query', '')
        
        products_qs = Product.objects.filter(company=company)
        products = products_qs[:20]
        product_list = [{'name': p.name, 'brand': p.brand_name or str(p.brand), 'price': float(p.price), 'category': p.category.name if p.category else 'Misc'} for p in products]
        
        rec = AIRecommendation.objects.create(
            user=request.user if request.user.is_authenticated else None,
            company=company,
            query=query,
            recommendations=product_list[:5],
            reasoning=f'Found {len(product_list)} matching products for your query.'
        )
        from .serializers import AIRecommendationSerializer
        return Response(AIRecommendationSerializer(rec).data)


class CurrentCompanyView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        from company.models import Company
        from company.serializers import CompanyPublicSerializer
        company = Company.resolve_from_request(request)
        if company:
            return Response(CompanyPublicSerializer(company).data)
        return Response({'detail': 'No company active'}, status=status.HTTP_404_NOT_FOUND)


class CollectionListView(generics.ListAPIView):
    serializer_class = CollectionSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company_obj = Company.resolve_from_request(self.request)
        if not company_obj:
            return Collection.objects.none()
        return Collection.objects.filter(is_active=True, company=company_obj).order_by('name')


class ServiceCategoryListView(generics.ListAPIView):
    serializer_class = StoreServiceCategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        if not company:
            return ServiceCategory.objects.none()
        return ServiceCategory.objects.filter(is_active=True, company=company).prefetch_related('brands')


class ServiceCategoryDetailView(generics.RetrieveAPIView):
    serializer_class = StoreServiceCategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        if not company:
            return ServiceCategory.objects.none()
        return ServiceCategory.objects.filter(is_active=True, company=company).prefetch_related('brands')


class RepairProductListView(generics.ListAPIView):
    serializer_class = StoreRepairProductSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        if not company:
            return RepairProduct.objects.none()
        return RepairProduct.objects.filter(status='active', company=company).prefetch_related('brands', 'issues')


class RepairProductDetailView(generics.RetrieveAPIView):
    serializer_class = StoreRepairProductSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        if not company:
            return RepairProduct.objects.none()
        return RepairProduct.objects.filter(status='active', company=company).prefetch_related('brands', 'issues')


class ServiceTicketCreateView(generics.CreateAPIView):
    serializer_class = StoreServiceTicketSerializer
    permission_classes = (permissions.AllowAny,)


class MyServiceTicketsView(generics.ListAPIView):
    serializer_class = StoreServiceTicketSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ServiceTicket.objects.filter(user=self.request.user)


class TicketTrackView(generics.RetrieveAPIView):
    serializer_class = StoreServiceTicketSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'ticket_id'

    def get_queryset(self):
        return ServiceTicket.objects.all()
