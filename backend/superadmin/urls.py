from django.urls import path
from .views import (
    SuperAdminDashboardView,
    SuperAdminCompanyListCreateView,
    SuperAdminCompanyDetailView,
    SuperAdminToggleCompanyView,
    SuperAdminUserListView,
)

urlpatterns = [
    path('dashboard/', SuperAdminDashboardView.as_view(), name='superadmin-dashboard'),
    path('companies/', SuperAdminCompanyListCreateView.as_view(), name='superadmin-companies'),
    path('companies/<int:pk>/', SuperAdminCompanyDetailView.as_view(), name='superadmin-company-detail'),
    path('companies/<int:pk>/toggle/', SuperAdminToggleCompanyView.as_view(), name='superadmin-company-toggle'),
    path('users/', SuperAdminUserListView.as_view(), name='superadmin-users'),
]
