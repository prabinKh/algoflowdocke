from django.db import models
from django.contrib.auth import get_user_model
from company.models import Company
from efrontend.models import Product, Order
import uuid

User = get_user_model()


class UserActivity(models.Model):
    ACTIVITY_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view_product', 'View Product'),
        ('add_to_cart', 'Add to Cart'),
        ('place_order', 'Place Order'),
        ('write_review', 'Write Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='activities', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTIVITY_CHOICES)
    path = models.CharField(max_length=255, blank=True, default='')
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    screen_resolution = models.CharField(max_length=50, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['company', 'timestamp']),
        ]

    def __str__(self):
        return f'{self.user.email if self.user else "Guest"} - {self.action}'


class POSSale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='pos_sales', db_index=True, null=True, blank=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='pos_sale')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'POS - {self.transaction_id}'


class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='service_categories', db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    logo_url = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['order', 'name']
        unique_together = ('company', 'name')

    def __str__(self):
        return f'{self.name} - {self.company.name}'


class ServiceBrand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='brands')
    name = models.CharField(max_length=100)
    logo_url = models.CharField(max_length=255, blank=True, default='')
    supported_models = models.JSONField(default=list, blank=True)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ('category', 'name')

    def __str__(self):
        return f'{self.name} ({self.category.name})'


class ServiceTicket(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')]
    DELIVERY_CHOICES = [
        ('pickup', 'Home Pickup'),
        ('drop_off', 'Drop Off'),
        ('walk_in', 'Walk In')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='service_tickets', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    service_brand = models.ForeignKey(ServiceBrand, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    
    # Media Info
    media = models.JSONField(default=dict, blank=True) # { "images": [...], "video": "..." }
    
    # Status Management
    status_history = models.JSONField(default=list, blank=True) # [ { "status": "...", "timestamp": "...", "note": "..." } ]
    ticket_id = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Customer Info
    customer_name = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    email = models.CharField(max_length=150, blank=True, default='')
    
    # Device Info
    category = models.CharField(max_length=200, blank=True, default='')
    brand_name = models.CharField(max_length=200, blank=True, default='')
    model = models.CharField(max_length=200, blank=True, default='')
    serial_number = models.CharField(max_length=200, blank=True, default='')
    purchase_date = models.CharField(max_length=50, blank=True, default='')
    
    # Issue Info
    issues = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, default='')
    issue_started = models.CharField(max_length=50, blank=True, default='')
    
    # Service Info
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='drop_off')
    service_type = models.CharField(max_length=50, default='standard')
    warranty_status = models.CharField(max_length=50, blank=True, default='')
    
    # Pickup Info
    pickup_address = models.TextField(blank=True, default='')
    pickup_date = models.DateField(null=True, blank=True)
    pickup_time = models.CharField(max_length=50, blank=True, default='')
    
    # Legacy/Misc
    attachments = models.JSONField(default=list, blank=True)
    contact_channel = models.CharField(max_length=100, blank=True, default='')
    current_location = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f'{self.ticket_id} - {self.customer_name or self.category}'

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            import random
            import string
            prefix = "FIX"
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            self.ticket_id = f"{prefix}-{random_str}"
        super().save(*args, **kwargs)


class ContactMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='contact_messages', db_index=True, null=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} - {self.email}'


class CategoryFeature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='category_features', db_index=True, null=True, blank=True)
    category = models.ForeignKey('efrontend.Category', on_delete=models.CASCADE, related_name='features')
    feature_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('company', 'category', 'feature_name')

    def __str__(self):
        return f'{self.category.name} - {self.feature_name}'


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='chat_sessions', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_id_str = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    user_email = models.CharField(max_length=255, blank=True, default='')
    user_name = models.CharField(max_length=255, blank=True, default='Guest')
    status = models.CharField(max_length=20, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_chats')
    last_message = models.TextField(blank=True)
    unread_admin_count = models.IntegerField(default=0)
    unread_user_count = models.IntegerField(default=0)
    last_message_time = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_time']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', '-last_message_time']),
            models.Index(fields=['user_id_str']),
        ]

    def __str__(self):
        return f'Chat {self.id} - {self.company.name}'


class ChatMessage(models.Model):
    SENDER_CHOICES = [('user', 'User'), ('admin', 'Admin'), ('assistant', 'Assistant')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    text = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    msg_type = models.CharField(max_length=50, default='text', blank=True)
    status = models.CharField(max_length=50, default='sent', blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f'{self.sender}: {self.text[:50]}'


class StaffRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='staff_roles', db_index=True, null=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'name')

    def __str__(self):
        return f'{self.name} - {self.company.name if self.company else "Platform"}'


class StaffMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='staff_members', db_index=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.ForeignKey(StaffRole, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'user')

    def __str__(self):
        return f'{self.user.email} - {self.role.name if self.role else "No Role"}'


class ServiceableItem(models.Model):
    TYPE_CHOICES = [('category', 'Category'), ('brand', 'Brand')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='serviceable_items', db_index=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'type', 'name')
        ordering = ['type', 'name']

    def __str__(self):
        return f'{self.name} ({self.type})'


class RepairProduct(models.Model):
    CATEGORY_CHOICES = [
        ('Laptop & Computer', 'Laptop & Computer'),
        ('Mobile & Tablet', 'Mobile & Tablet'),
        ('TV & Display', 'TV & Display'),
        ('CCTV & Security', 'CCTV & Security'),
        ('Audio & Speaker', 'Audio & Speaker'),
        ('Printer & Scanner', 'Printer & Scanner'),
        ('Gaming Console', 'Gaming Console'),
        ('Other Electronics', 'Other Electronics'),
    ]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    PICKUP_CHOICES = [('yes', 'Yes'), ('no', 'No'), ('partial', 'Partial')]
    PRIORITY_CHOICES = [('normal', 'Normal'), ('high', 'High'), ('express', 'Express')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='repair_products', db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, default='')
    image_url = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    sla_days = models.CharField(max_length=50, blank=True, default='')
    starting_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    repair_warranty = models.CharField(max_length=50, blank=True, default='')
    home_pickup = models.CharField(max_length=20, choices=PICKUP_CHOICES, default='no')
    express_available = models.BooleanField(default=False)
    technician_type = models.CharField(max_length=80, blank=True, default='')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('company', 'name')

    def __str__(self):
        return f'{self.name} - {self.company.name}'


class RepairProductBrand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(RepairProduct, on_delete=models.CASCADE, related_name='brands')
    brand_name = models.CharField(max_length=80)
    brand_logo_url = models.CharField(max_length=255, blank=True, default='')
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['brand_name']
        unique_together = ('product', 'brand_name')

    def __str__(self):
        return f'{self.brand_name} for {self.product.name}'


class RepairCommonIssue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(RepairProduct, on_delete=models.CASCADE, related_name='issues')
    issue_name = models.CharField(max_length=120)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['issue_name']
        unique_together = ('product', 'issue_name')

    def __str__(self):
        return f'{self.issue_name} for {self.product.name}'

