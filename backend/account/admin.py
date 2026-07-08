from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.urls import reverse
from django.utils.html import format_html
from .models import MyUser, LoginAttempt, Note
from fixitall_backend.admin_site import fixitall_admin


class MyUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'company', 'role', 'chat_history_link', 'is_admin', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    list_filter = ('company', 'role', 'is_admin', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('email', 'name', 'firebase_uid', 'company__name')
    ordering = ('-created_at',)
    list_editable = ('is_admin', 'is_staff', 'is_active')
    readonly_fields = ('created_at', 'updated_at', 'last_login', 'id')

    def chat_history_link(self, obj):
        # Filter ChatSession by the authenticated user ForeignKey
        url = reverse('admin:eadmin_chatsession_changelist') + f'?user__id__exact={obj.id}'
        return format_html('<a class="button" style="background-color: #6366f1; color: white; padding: 3px 8px; border-radius: 4px; text-decoration: none;" href="{}">View Chat History</a>', url)
    chat_history_link.short_description = 'Chat history'

    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        ('Personal Info', {'fields': ('name', 'username', 'phone_number', 'firebase_uid')}),
        ('Tenant', {'fields': ('company', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_admin', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Data', {'fields': ('cart_items', 'wishlist_items')}),
        ('Dates', {'fields': ('created_at', 'updated_at', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'is_staff', 'is_admin', 'company', 'role'),
        }),
    )


class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('email', 'ip_address', 'successful', 'attempted_at', 'user_agent')
    list_filter = ('successful', 'attempted_at')
    search_fields = ('email', 'ip_address')
    readonly_fields = ('attempted_at',)


class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'created_at')
    search_fields = ('title', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')


# Register with custom admin site
fixitall_admin.register(MyUser, MyUserAdmin)
fixitall_admin.register(LoginAttempt, LoginAttemptAdmin)
fixitall_admin.register(Note, NoteAdmin)