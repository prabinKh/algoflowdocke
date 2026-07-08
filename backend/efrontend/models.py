from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from company.models import Company
import uuid

User = get_user_model()

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='categories', db_index=True, null=True, blank=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    subcategories = models.JSONField(default=list, blank=True)
    brand_list = models.JSONField(default=list, blank=True)
    sections = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['order', 'name']
        unique_together = ('company', 'slug')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='brands', db_index=True, null=True, blank=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    categories = models.ManyToManyField(Category, related_name='brands', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('company', 'slug')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products', db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    brand_name = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    specs = models.JSONField(default=list, blank=True)
    detailed_specs = models.JSONField(default=dict, blank=True)
    features = models.JSONField(default=list, blank=True)
    colors = models.JSONField(default=list, blank=True)
    collections = models.JSONField(default=list, blank=True)
    details = models.TextField(blank=True)
    key_specifications = models.JSONField(default=list, blank=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.IntegerField(default=0)
    
    image = models.URLField(blank=True, null=True)
    gallery = models.JSONField(default=list, blank=True)
    model_3d = models.URLField(blank=True, null=True)
    
    stock = models.IntegerField(default=0, db_index=True)
    in_stock = models.BooleanField(default=True, db_index=True)
    out_of_stock_since = models.DateTimeField(null=True, blank=True, db_index=True)
    is_end_stock = models.BooleanField(default=False, db_index=True)
    free_shipping = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_offer = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    is_popular = models.BooleanField(default=False)
    
    rating = models.FloatField(default=0)
    reviews_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'slug')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['company', 'created_at']),
        ]

    def __str__(self):
        return f'{self.name} ({self.company.name})'

    def save(self, *args, **kwargs):
        from django.utils import timezone
        if not self.slug:
            self.slug = slugify(self.name)
        
        if self.stock > 0:
            self.in_stock = True
            self.out_of_stock_since = None
            self.is_end_stock = False
        else:
            self.in_stock = False
            if not self.out_of_stock_since:
                self.out_of_stock_since = timezone.now()
            
            # Check if it has been out of stock for more than 1 day
            if self.out_of_stock_since and (timezone.now() - self.out_of_stock_since).days >= 1:
                self.is_end_stock = True
        
        super().save(*args, **kwargs)


class Order(models.Model):
    STATUS_CHOICES = [
        ('new', 'New Order'),
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('process_conform', 'PC (Process Conform)'),
        ('cancelled', 'Cancelled'),
        ('process_dont_conform', 'PDC (Don\'t Conform)'),
        ('returned', 'Returned'),
    ]
    PAYMENT_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('cod', 'Cash on Delivery'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uid = models.CharField(max_length=50, unique=True, db_index=True)
    order_id = models.CharField(max_length=50, unique=True, db_index=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='orders', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    full_name = models.CharField(max_length=255)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='new', db_index=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, blank=True)
    
    source = models.CharField(max_length=50, blank=True)
    customer_type = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'created_at']),
            models.Index(fields=['user', 'company']),
        ]

    def __str__(self):
        return f'Order {self.order_id} - {self.company.name}'

    def save(self, *args, **kwargs):
        if not self.uid:
            import uuid
            self.uid = str(uuid.uuid4())
        if not self.order_id:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            import random
            self.order_id = f'ORD{timestamp}{random.randint(1000, 9999)}'
        
        # Stock management logic
        if self.pk:
            try:
                old_order = Order.objects.get(pk=self.pk)
                if old_order.status != 'process_conform' and self.status == 'process_conform':
                    for item in self.items.all():
                        if item.product:
                            item.product.stock -= item.quantity
                            item.product.save()
            except Order.DoesNotExist:
                pass
        elif self.status == 'process_conform':
            # This is for orders created via POS or direct API with 'process_conform' status
            # We can't access self.items yet because it's not saved. 
            # We might need to handle this in the view for creation.
            pass
            
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_id_str = models.CharField(max_length=36, blank=True)
    name = models.CharField(max_length=255)
    image = models.URLField(blank=True, null=True)
    features = models.JSONField(default=dict, blank=True)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.name} (x{self.quantity})'

    def save(self, *args, **kwargs):
        if self.product:
            self.product_id_str = str(self.product.id)
        super().save(*args, **kwargs)


class Collection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='available_collections', null=True, blank=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name


class HeroSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='hero_setting', null=True, blank=True)
    title = models.CharField(max_length=255, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    cta_text = models.CharField(max_length=100, blank=True, default='Shop Now')
    cta_link = models.CharField(max_length=255, blank=True, default='/products')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'Hero - {self.company.name if self.company else "Platform"}'


class Wishlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='wishlists', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f'{self.user.email} - {self.product.name}'


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.name} - {self.rating}★ by {self.user.email}'


class StoreLocation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='store_locations')
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return f'{self.name} - {self.company.name}'


class AIRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='ai_recommendations', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    query = models.TextField(blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    reasoning = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Rec for {self.user.email if self.user else "Guest"} at {self.company.name if self.company else "Unknown"}'
