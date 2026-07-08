from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView, BrandListView, BrandDetailView, 
    ProductListView, ProductDetailView, HeroSettingView, OrderCreateView, 
    OrderTrackView, MyOrdersView, WishlistViewSet, ReviewViewSet, 
    StoreLocationView, AIRecommendationView, CurrentCompanyView, CollectionListView,
    RepairProductListView, RepairProductDetailView, ServiceTicketCreateView, MyServiceTicketsView,
    TicketTrackView, ServiceCategoryListView, ServiceCategoryDetailView
)

urlpatterns = [
    path('current-company/', CurrentCompanyView.as_view(), name='current-company'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),
    path('brands/', BrandListView.as_view(), name='brand-list'),
    path('brands/<slug:slug>/', BrandDetailView.as_view(), name='brand-detail'),
    path('collections/', CollectionListView.as_view(), name='collection-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:product_id>/reviews/', ReviewViewSet.as_view(), name='product-reviews'),
    path('hero-settings/', HeroSettingView.as_view(), name='hero-settings'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/track/<int:id>/', OrderTrackView.as_view(), name='order-track'),
    path('orders/my-orders/', MyOrdersView.as_view(), name='my-orders'),
    path('wishlist/', WishlistViewSet.as_view(), name='wishlist'),
    path('locations/', StoreLocationView.as_view(), name='store-locations'),
    path('ai-recommend/', AIRecommendationView.as_view(), name='ai-recommend'),
    # Repair & Service Center
    path('service-categories/', ServiceCategoryListView.as_view(), name='service-category-list'),
    path('service-categories/<uuid:pk>/', ServiceCategoryDetailView.as_view(), name='service-category-detail'),
    path('repair-products/', RepairProductListView.as_view(), name='repair-product-list'),
    path('repair-products/<uuid:pk>/', RepairProductDetailView.as_view(), name='repair-product-detail'),
    path('service-tickets/create/', ServiceTicketCreateView.as_view(), name='service-ticket-create'),
    path('service-tickets/my-tickets/', MyServiceTicketsView.as_view(), name='my-service-tickets'),
    path('service-tickets/track/<str:ticket_id>/', TicketTrackView.as_view(), name='service-ticket-track'),
]
