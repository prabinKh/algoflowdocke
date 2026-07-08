from django.contrib import admin
from .models import (
    UserActivity, POSSale, ServiceTicket,
    ChatSession, ChatMessage, ContactMessage, CategoryFeature,
    StaffRole, StaffMember,
)
from fixitall_backend.admin_site import fixitall_admin


class VendorRestrictedAdmin(admin.ModelAdmin):
    """Admin base that restricts queryset and FK choices to companies owned by the user."""
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # If model has a direct 'company' field
        if 'company' in [f.name for f in self.model._meta.get_fields()]:
            return qs.filter(company__owner=request.user)
        # Fallback: return full queryset
        return qs

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'company' and not request.user.is_superuser:
            from company.models import Company
            kwargs['queryset'] = Company.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and hasattr(obj, 'company') and obj.company is None:
            from company.models import Company
            companies = Company.objects.filter(owner=request.user)
            if companies.exists():
                obj.company = companies.first()
        super().save_model(request, obj, form, change)


class UserActivityAdmin(VendorRestrictedAdmin):
    list_display = ('user', 'company', 'action', 'ip_address', 'timestamp')
    list_filter = ('company', 'action', 'timestamp')
    search_fields = ('user__email', 'ip_address', 'action')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'


class POSSaleAdmin(VendorRestrictedAdmin):
    list_display = ('invoice_number_display', 'order', 'company_display', 'cashier_display', 'payment_method_display', 'created_at')
    list_filter = ('company', 'order__payment_method', 'created_at')
    search_fields = ('transaction_id', 'staff__email', 'company__name')
    readonly_fields = ('created_at',)

    def invoice_number_display(self, obj):
        return obj.transaction_id
    invoice_number_display.short_description = 'Invoice Number'

    def cashier_display(self, obj):
        return obj.staff.email if obj.staff else "N/A"
    cashier_display.short_description = 'Cashier'

    def payment_method_display(self, obj):
        return obj.order.payment_method if obj.order else "N/A"
    payment_method_display.short_description = 'Payment Method'

    def company_display(self, obj):
        return obj.company.name if obj.company else 'N/A'
    company_display.short_description = 'Company'


class ServiceTicketAdmin(VendorRestrictedAdmin):
    list_display = ('ticket_id', 'company', 'user', 'customer_name', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('company', 'status', 'priority', 'created_at')
    search_fields = ('ticket_id', 'user__email', 'customer_name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status', 'priority')
    date_hierarchy = 'created_at'


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('timestamp', 'sender', 'text', 'msg_type', 'status')
    can_delete = False
    fields = ('sender', 'text', 'msg_type', 'status', 'timestamp')


class ChatSessionAdmin(VendorRestrictedAdmin):
    list_display = ('id_display', 'company', 'user_info', 'status', 'msg_count', 'updated_at')
    list_filter = ('company', 'status', 'created_at', 'updated_at')
    search_fields = ('user_email', 'email', 'user__email', 'user_name', 'user_id_str', 'id')
    inlines = [ChatMessageInline]
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)
    list_select_related = ('company', 'user')

    def id_display(self, obj):
        return str(obj.id)[:8]
    id_display.short_description = 'Session ID'

    def user_info(self, obj):
        from django.utils.html import format_html
        name = obj.user_name or (obj.user.username if obj.user else "Guest")
        email = obj.user_email or (obj.user.email if obj.user else obj.email)
        return format_html('<b>{}</b><br/><small>{}</small>', name, email)
    user_info.short_description = 'User/Guest'

    def msg_count(self, obj):
        return obj.messages.count()
    msg_count.short_description = 'Messages'


class ChatMessageAdmin(VendorRestrictedAdmin):
    list_display = ('session_info', 'company_display', 'sender_display', 'text_preview', 'timestamp')
    list_filter = ('session__company', 'sender', 'msg_type', 'timestamp')
    search_fields = ('text', 'session__user_email', 'session__user_name', 'session__user__email', 'session__user_id_str')
    readonly_fields = ('timestamp',)
    list_select_related = ('session', 'session__company', 'session__user')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(session__company__owner=request.user)

    def session_info(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        url = reverse('admin:eadmin_chatsession_change', args=[obj.session.id])
        name = obj.session.user_name or "Guest"
        return format_html('<a href="{}">Session {}... ({})</a>', url, str(obj.session.id)[:8], name)
    session_info.short_description = 'Session History'

    def sender_display(self, obj):
        from django.utils.html import format_html
        colors = {'user': 'blue', 'admin': 'green', 'assistant': 'purple'}
        color = colors.get(obj.sender, 'black')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.get_sender_display())
    sender_display.short_description = 'Sender'

    def company_display(self, obj):
        return obj.session.company.name
    company_display.short_description = 'Company'

    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Message'


class ContactMessageAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'email', 'subject', 'is_read', 'created_at')
    list_filter = ('company', 'is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_read',)


class CategoryFeatureAdmin(VendorRestrictedAdmin):
    list_display = ('category', 'company', 'feature_name', 'is_active')
    list_filter = ('company', 'category', 'is_active')
    search_fields = ('feature_name', 'category__name', 'company__name')
    list_editable = ('is_active',)


class StaffRoleAdmin(VendorRestrictedAdmin):
    list_display = ('name', 'company', 'description', 'created_at')
    list_filter = ('company',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)


class StaffMemberAdmin(VendorRestrictedAdmin):
    list_display = ('user', 'company', 'role', 'is_active', 'joined_at')
    list_filter = ('company', 'is_active', 'role')
    search_fields = ('user__email',)
    readonly_fields = ('joined_at',)


# Register all with custom admin site
try:
    fixitall_admin.register(UserActivity, UserActivityAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(POSSale, POSSaleAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(ServiceTicket, ServiceTicketAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(ChatSession, ChatSessionAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(ChatMessage, ChatMessageAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(ContactMessage, ContactMessageAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(CategoryFeature, CategoryFeatureAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(StaffRole, StaffRoleAdmin)
except admin.sites.AlreadyRegistered:
    pass

try:
    fixitall_admin.register(StaffMember, StaffMemberAdmin)
except admin.sites.AlreadyRegistered:
    pass
