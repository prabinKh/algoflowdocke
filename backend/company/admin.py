from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import Company, CompanyGalleryImage, FooterSettings
from fixitall_backend.admin_site import fixitall_admin
from efrontend.models import (
    Product, Order, Category, Brand, HeroSetting, StoreLocation, Wishlist, Review, AIRecommendation
)
from eadmin.models import (
    POSSale, ServiceTicket, UserActivity, CategoryFeature, ChatSession, StaffMember, ContactMessage, StaffRole
)

User = get_user_model()


class CompanyGalleryImageInline(admin.TabularInline):
    model = CompanyGalleryImage
    extra = 1

class FooterSettingsInline(admin.StackedInline):
    model = FooterSettings
    can_delete = False
    max_num = 1

class ProductInline(admin.TabularInline):
    model = Product
    fields = ('name', 'price', 'stock', 'is_active')
    extra = 0
    show_change_link = True

class OrderInline(admin.TabularInline):
    model = Order
    fields = ('order_id', 'full_name', 'total_amount', 'status', 'created_at')
    readonly_fields = ('order_id', 'full_name', 'total_amount', 'status', 'created_at')
    extra = 0
    show_change_link = True

class CategoryInline(admin.TabularInline):
    model = Category
    fields = ('name', 'slug', 'is_active')
    extra = 0
    show_change_link = True

class BrandInline(admin.TabularInline):
    model = Brand
    fields = ('name', 'slug', 'is_active')
    extra = 0
    show_change_link = True

class POSSaleInline(admin.TabularInline):
    model = POSSale
    fields = ('transaction_id', 'order', 'staff', 'created_at')
    readonly_fields = ('transaction_id', 'order', 'staff', 'created_at')
    extra = 0
    show_change_link = True

class ServiceTicketInline(admin.TabularInline):
    model = ServiceTicket
    fields = ('ticket_id', 'customer_name', 'status', 'priority', 'created_at')
    readonly_fields = ('ticket_id', 'customer_name', 'status', 'priority', 'created_at')
    extra = 0
    show_change_link = True

class ChatSessionInline(admin.TabularInline):
    model = ChatSession
    fields = ('user_name', 'user_email', 'status', 'unread_admin_count', 'updated_at')
    readonly_fields = ('user_name', 'user_email', 'status', 'unread_admin_count', 'updated_at')
    extra = 0
    show_change_link = True

class StaffMemberInline(admin.TabularInline):
    model = StaffMember
    fields = ('user', 'role', 'is_active')
    extra = 0
    show_change_link = True

class UserActivityInline(admin.TabularInline):
    model = UserActivity
    fields = ('user', 'action', 'timestamp')
    readonly_fields = ('user', 'action', 'timestamp')
    extra = 0

class HeroSettingInline(admin.StackedInline):
    model = HeroSetting
    extra = 0

class StoreLocationInline(admin.TabularInline):
    model = StoreLocation
    fields = ('name', 'address', 'phone')
    extra = 0
    show_change_link = True

class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    show_change_link = True

class CategoryFeatureInline(admin.TabularInline):
    model = CategoryFeature
    extra = 0
    show_change_link = True

class WishlistInline(admin.TabularInline):
    model = Wishlist
    extra = 0
    show_change_link = True

class AIRecommendationInline(admin.TabularInline):
    model = AIRecommendation
    extra = 0
    show_change_link = True

class ContactMessageInline(admin.TabularInline):
    model = ContactMessage
    extra = 0
    show_change_link = True

class StaffRoleInline(admin.TabularInline):
    model = StaffRole
    extra = 0
    show_change_link = True

class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'slug', 'storefront_url', 'owner', 'category', 'plan', 'is_active', 'product_count_display', 'order_count_display', 'total_revenue_display', 'created_at'
    )
    list_filter = ('category', 'plan', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'admin_email', 'owner__email', 'owner__name')
    readonly_fields = ('created_at', 'updated_at', 'owner', 'domain_name', 'product_count_display', 'order_count_display', 'total_revenue_display')
    
    inlines = [
        CompanyGalleryImageInline, 
        FooterSettingsInline,
        StaffMemberInline,
        StaffRoleInline,
        HeroSettingInline, 
        CategoryInline, 
        BrandInline,
        CategoryFeatureInline,
        ProductInline, 
        OrderInline, 
        POSSaleInline, 
        ServiceTicketInline,
        ChatSessionInline, 
        StoreLocationInline,
        ContactMessageInline,
        WishlistInline,
        ReviewInline,
        AIRecommendationInline,
        UserActivityInline
    ]
    date_hierarchy = 'created_at'
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-created_at',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'description', 'logo', 'banner', 'domain_name')
        }),
        ('Branding', {
            'fields': ('theme_color', 'theme_color_secondary')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'address', 'website')
        }),
        ('Vendor Admin Credentials', {
            'description': 'Creates a company admin who can sign in at /signin and access /admin.',
            'fields': ('admin_name', 'admin_email', 'admin_password', 'owner')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def storefront_url(self, obj):
        if not obj.slug:
            return '-'
        url = f'http://{obj.slug}.localhost:3000'
        return format_html('<a href="{}" target="_blank">{}</a>', url, url)

    storefront_url.short_description = 'Store URL'

    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj=obj, change=change, **kwargs)
        if 'admin_password' in form.base_fields:
            form.base_fields['admin_password'].required = False
            form.base_fields['admin_password'].help_text = 'Leave blank to keep the current password.'
        return form

    def save_model(self, request, obj, form, change):
        form_data = getattr(form, 'cleaned_data', None) or {}
        admin_name = (form_data.get('admin_name') if form_data else None) or (obj.admin_name or '').strip()
        admin_email = (form_data.get('admin_email') if form_data else None) or (obj.admin_email or '').strip().lower()
        admin_password = (form_data.get('admin_password') if form_data else None) or (obj.admin_password or '').strip()

        if isinstance(admin_name, str):
            admin_name = admin_name.strip()
        if isinstance(admin_email, str):
            admin_email = admin_email.strip().lower()
        if isinstance(admin_password, str):
            admin_password = admin_password.strip()

        if not getattr(obj, 'admin_name', None) and admin_name:
            obj.admin_name = admin_name
        if not getattr(obj, 'admin_email', None) and admin_email:
            obj.admin_email = admin_email
        if admin_password:
            obj.admin_password = admin_password

        super().save_model(request, obj, form, change)

        if admin_email and admin_password:
            self._sync_company_admin(obj, admin_name, admin_email, admin_password)

    def _sync_company_admin(self, company, admin_name, admin_email, admin_password):
        user = company.owner

        if user is None:
            existing = User.objects.filter(email=admin_email).first()
            if existing:
                user = existing
            else:
                user = User.objects.create_user(
                    email=admin_email,
                    name=admin_name or admin_email.split('@')[0],
                    password=admin_password,
                    role='company_admin',
                    is_staff=True,
                    is_admin=True,
                    is_active=True,
                    email_verified=True,
                )
        else:
            if admin_name:
                user.name = admin_name
            user.role = 'company_admin'
            user.is_staff = True
            user.is_admin = True
            user.is_active = True
            user.email_verified = True

        if admin_password:
            user.set_password(admin_password)

        user.company = company
        user.save()

        company.owner = user
        company.admin_name = admin_name or user.name
        company.admin_email = admin_email
        company.admin_password = admin_password
        company.save(update_fields=['owner', 'admin_name', 'admin_email', 'admin_password'])

    def product_count_display(self, obj):
        try:
            return obj.product_count
        except Exception:
            return 0

    product_count_display.short_description = 'Products'
    product_count_display.admin_order_field = 'product_count'

    def order_count_display(self, obj):
        try:
            return obj.order_count
        except Exception:
            return 0

    order_count_display.short_description = 'Orders'
    order_count_display.admin_order_field = 'order_count'

    def total_revenue_display(self, obj):
        try:
            return f"{obj.total_revenue:.2f}"
        except Exception:
            return '0.00'

    total_revenue_display.short_description = 'Revenue'
    total_revenue_display.admin_order_field = 'total_revenue'


try:
    fixitall_admin.register(Company, CompanyAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(CompanyGalleryImage)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(FooterSettings)
except admin.sites.AlreadyRegistered:
    pass
