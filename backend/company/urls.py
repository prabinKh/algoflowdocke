from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, FooterSettingsViewSet, StoreLocationViewSet

router = DefaultRouter()
router.register(r'footer', FooterSettingsViewSet, basename='company-footer')
router.register(r'locations', StoreLocationViewSet, basename='company-locations')
router.register(r'', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
]
