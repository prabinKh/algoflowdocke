from rest_framework import serializers
from .models import Category, Brand, Product, Order, OrderItem, HeroSetting, Wishlist, Review, StoreLocation, AIRecommendation, Collection
from eadmin.models import ServiceTicket, RepairProduct, RepairProductBrand, RepairCommonIssue, ServiceCategory, ServiceBrand


class CategorySerializer(serializers.ModelSerializer):
    brands = serializers.JSONField(source='brand_list', required=False)
    related_brands = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name', source='brands')

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon', 'description', 'image', 'is_active', 'order', 'brands', 'related_brands', 'subcategories', 'sections')


class BrandSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        write_only=True,
        source='categories'
    )
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'description', 'logo', 'categories', 'category_ids', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('slug', 'created_at', 'updated_at')


class ProductSerializer(serializers.ModelSerializer):
    categorySlug = serializers.ReadOnlyField(source='category.slug')
    category_name = serializers.ReadOnlyField(source='category.name')
    brand_name = serializers.ReadOnlyField(source='brand.name')
    brand_slug = serializers.ReadOnlyField(source='brand.slug')
    stockCount = serializers.IntegerField(source='stock', read_only=True)
    inStock = serializers.BooleanField(source='in_stock', read_only=True)
    isNew = serializers.BooleanField(source='is_new', read_only=True)
    isOffer = serializers.BooleanField(source='is_offer', read_only=True)
    isBestSeller = serializers.BooleanField(source='is_best_seller', read_only=True)
    isPopular = serializers.BooleanField(source='is_popular', read_only=True)
    isEndStock = serializers.BooleanField(source='is_end_stock', read_only=True)
    outOfStockSince = serializers.DateTimeField(source='out_of_stock_since', read_only=True, allow_null=True)
    freeShipping = serializers.BooleanField(source='free_shipping', read_only=True)
    originalPrice = serializers.DecimalField(source='original_price', max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    reviewsCount = serializers.IntegerField(source='reviews_count', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    detailedSpecs = serializers.JSONField(source='detailed_specs', required=False)
    keySpecifications = serializers.JSONField(source='key_specifications', required=False)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'category', 'categorySlug', 'category_name',
            'brand', 'brand_name', 'brand_slug', 'type', 'price', 'originalPrice', 'original_price', 'discount',
            'image', 'gallery', 'model_3d', 'description', 'details', 'specs', 'detailedSpecs', 'keySpecifications', 'features',
            'colors', 'collections', 'stock', 'stockCount', 'in_stock', 'inStock', 'isEndStock', 'outOfStockSince',
            'is_new', 'isNew', 'is_best_seller', 'isBestSeller', 'is_popular', 'isPopular',
            'is_offer', 'isOffer', 'free_shipping', 'freeShipping',
            'rating', 'reviews_count', 'reviewsCount', 'createdAt',
        )


class OrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source='product_id_str', read_only=True)
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'productId', 'product_id_str', 'product_name', 'name', 'image', 'features', 'quantity', 'price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customerName = serializers.CharField(source='full_name', read_only=True)
    customerEmail = serializers.EmailField(source='email', read_only=True)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    shippingAddress = serializers.SerializerMethodField()
    paymentStatus = serializers.CharField(source='payment_status', read_only=True)
    paymentMethod = serializers.CharField(source='payment_method', read_only=True)
    orderId = serializers.CharField(source='order_id', read_only=True)
    customerType = serializers.CharField(source='customer_type', read_only=True)

    def get_shippingAddress(self, obj):
        return {
            'address': obj.address,
            'city': obj.city,
            'phone': obj.phone
        }

    class Meta:
        model = Order
        fields = (
            'id', 'uid', 'orderId', 'order_id', 'customerName', 'customerEmail',
            'email', 'full_name', 'phone', 'address', 'city', 'country',
            'items', 'subtotal', 'tax', 'discount', 'total_amount', 'totalAmount',
            'status', 'paymentStatus', 'payment_status', 'paymentMethod', 'payment_method',
            'source', 'customerType', 'customer_type', 'notes',
            'shippingAddress', 'createdAt', 'updatedAt',
        )


class HeroSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSetting
        fields = '__all__'


class WishlistSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'user', 'product', 'product_details', 'added_at')


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.name')

    class Meta:
        model = Review
        fields = ('id', 'product', 'user', 'user_name', 'rating', 'comment', 'created_at')


class StoreLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLocation
        fields = '__all__'


class AIRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendation
        fields = '__all__'


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ('id', 'name', 'is_active', 'created_at')


class StoreRepairCommonIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairCommonIssue
        fields = ('id', 'issue_name', 'base_price')


class StoreRepairProductBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairProductBrand
        fields = ('id', 'brand_name', 'brand_logo_url', 'is_popular')


class StoreRepairProductSerializer(serializers.ModelSerializer):
    brands = StoreRepairProductBrandSerializer(many=True, read_only=True)
    issues = StoreRepairCommonIssueSerializer(many=True, read_only=True)

    class Meta:
        model = RepairProduct
        fields = (
            'id', 'name', 'category', 'description', 'image_url', 
            'sla_days', 'starting_price', 'repair_warranty', 
            'home_pickup', 'express_available', 'technician_type', 
            'priority', 'brands', 'issues'
        )


class StoreServiceBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceBrand
        fields = ('id', 'name', 'logo_url', 'supported_models', 'is_popular')


class StoreServiceCategorySerializer(serializers.ModelSerializer):
    brands = StoreServiceBrandSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'description', 'logo_url', 'brands', 'order')


class StoreServiceTicketSerializer(serializers.ModelSerializer):
    ticketId = serializers.CharField(source='ticket_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = ServiceTicket
        fields = '__all__'
        read_only_fields = ('company', 'ticket_id', 'created_at', 'updated_at', 'status', 'status_history', 'assigned_to', 'priority')

    def create(self, validated_data):
        from company.models import Company
        request = self.context.get('request')
        company = Company.resolve_from_request(request)
        
        if not company:
             raise serializers.ValidationError("Company context is required.")
             
        validated_data['company'] = company
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
            
        return super().create(validated_data)
