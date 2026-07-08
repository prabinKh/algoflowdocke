from django.contrib import admin
from .models import (
    Category, Brand, Product, Order, OrderItem,
    HeroSetting, Wishlist, Review, StoreLocation, AIRecommendation,
)
from fixitall_backend.admin_site import fixitall_admin


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_id_str', 'name', 'image', 'quantity', 'price')


class VendorRestrictedAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(company__owner=request.user)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "company" and not request.user.is_superuser:
            from company.models import Company
            kwargs["queryset"] = Company.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and getattr(obj, 'company', None) is None:
            from company.models import Company
            companies = Company.objects.filter(owner=request.user)
            if companies.exists():
                obj.company = companies.first()
        super().save_model(request, obj, form, change)

class CategoryAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'slug', 'icon')
    list_filter = ('company', 'is_active')
    search_fields = ('name', 'slug', 'company__name')
    prepopulated_fields = {'slug': ('name',)}


class ProductAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'brand', 'category', 'price', 'stock', 'in_stock', 'is_new', 'rating', 'created_at')
    list_filter = ('company', 'category', 'brand', 'in_stock', 'is_new', 'is_best_seller', 'is_popular', 'is_offer')
    search_fields = ('name', 'brand', 'description', 'company__name')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('price', 'stock', 'in_stock')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


class BrandAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'slug', 'is_active', 'created_at')
    list_filter = ('company', 'is_active')
    search_fields = ('name', 'slug', 'company__name')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')


class OrderAdmin(VendorRestrictedAdmin):
    list_display = ('order_id', 'company', 'full_name', 'email', 'total_amount', 'status', 'payment_status', 'payment_method', 'source', 'created_at')
    list_filter = ('company', 'status', 'payment_status', 'payment_method', 'source', 'created_at')
    search_fields = ('order_id', 'full_name', 'email', 'phone', 'company__name')
    list_editable = ('status', 'payment_status')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OrderItemInline]
    ordering = ('-created_at',)


class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'name', 'quantity', 'price')
    search_fields = ('name', 'order__order_id')


class HeroSettingAdmin(VendorRestrictedAdmin):
    list_display = ('title', 'company', 'is_active', 'order')
    list_filter = ('company', 'is_active')
    list_editable = ('is_active', 'order')


class WishlistAdmin(VendorRestrictedAdmin):
    list_display = ('user', 'company', 'product', 'added_at')
    list_filter = ('company', 'added_at')
    search_fields = ('user__email', 'product__name', 'company__name')
    readonly_fields = ('added_at',)


class ReviewAdmin(VendorRestrictedAdmin):
    list_display = ('product', 'company', 'user', 'rating', 'created_at')
    list_filter = ('company', 'rating', 'created_at')
    search_fields = ('product__name', 'user__email', 'comment', 'company__name')
    readonly_fields = ('created_at',)


class StoreLocationAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'address', 'phone')
    list_filter = ('company',)
    search_fields = ('name', 'address', 'company__name')


class AIRecommendationAdmin(VendorRestrictedAdmin):
    list_display = ('company', 'user', 'query', 'created_at')
    list_filter = ('company', 'created_at')
    search_fields = ('user__email', 'query', 'company__name')
    readonly_fields = ('created_at',)


# Register all with custom admin site
try:
    fixitall_admin.register(Category, CategoryAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(Brand, BrandAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(Product, ProductAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(Order, OrderAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(OrderItem, OrderItemAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(HeroSetting, HeroSettingAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(Wishlist, WishlistAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(Review, ReviewAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(StoreLocation, StoreLocationAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(AIRecommendation, AIRecommendationAdmin)
except admin.sites.AlreadyRegistered:
    pass
