from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .admin_site import fixitall_admin

urlpatterns = [
    path('django-admin/', fixitall_admin.urls),
    path('api/account/', include('account.urls')),
    path('api/store/', include('efrontend.urls')),
    path('api/admin/', include('eadmin.urls')),
    path('api/chat/', include('chatapp.urls')),
    path('api/companies/', include('company.urls')),
    path('api/superadmin/', include('superadmin.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
