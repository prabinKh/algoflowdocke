from django.test import TestCase
from efrontend.models import Product, Category, Brand
from .serializers import AdminProductSerializer
from decimal import Decimal

class AdminProductSerializerTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Laptops", slug="laptops")
        self.brand = Brand.objects.create(name="Apple", slug="apple")

    def test_serializer_with_ids(self):
        """Test that serializer accepts IDs for brand and category"""
        data = {
            "name": "MacBook Pro",
            "slug": "macbook-pro",
            "category": self.category.id,
            "brand": self.brand.id,
            "price": "1999.99",
            "image": "http://example.com/img.jpg",
            "description": "Powerful laptop"
        }
        serializer = AdminProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
        self.assertEqual(product.category, self.category)
        self.assertEqual(product.brand, self.brand)

    def test_serializer_with_strings(self):
        """Test that serializer accepts names/slugs for brand and category"""
        data = {
            "name": "MacBook Air",
            "slug": "macbook-air",
            "category": "laptops", # slug
            "brand": "Apple",      # name
            "price": "999.99",
            "image": "http://example.com/img.jpg",
            "description": "Thin laptop"
        }
        serializer = AdminProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
        self.assertEqual(product.category, self.category)
        self.assertEqual(product.brand, self.brand)

    def test_serializer_with_new_brand_name(self):
        """Test that serializer handles brand names that don't exist yet"""
        data = {
            "name": "New Phone",
            "slug": "new-phone",
            "category": "laptops",
            "brand": "NonExistentBrand",
            "price": "499.99",
            "image": "http://example.com/img.jpg",
            "description": "Unknown brand phone"
        }
        serializer = AdminProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
        self.assertEqual(product.brand, None)
        self.assertEqual(product.brand_name, "NonExistentBrand")

    def test_price_max_digits(self):
        """Test that larger prices are now accepted (up to 12 digits total)"""
        data = {
            "name": "Luxury Yacht",
            "slug": "luxury-yacht",
            "category": self.category.id,
            "brand": self.brand.id,
            "price": "99999999.99", # 8 digits before decimal
            "image": "http://example.com/img.jpg",
            "description": "Very expensive"
        }
        serializer = AdminProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        # Test 9 digits before decimal (should now work with max_digits=12)
        data["price"] = "123456789.99"
        serializer = AdminProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from account.models import MyUser
from company.models import Company
from .models import StaffRole, POSSale, UserActivity

class AdminAPITests(APITestCase):
    def setUp(self):
        # Create a company
        self.company = Company.objects.create(name="Apex Corp", slug="apex-corp")
        
        # Create Admin user
        self.admin_user = MyUser.objects.create_user(
            email="admin@apex.com", 
            name="Apex Admin",
            password="adminpassword123",
            role="company_admin",
            company=self.company
        )
        self.admin_user.is_admin = True
        self.admin_user.save()

        # Create regular user (non-admin)
        self.regular_user = MyUser.objects.create_user(
            email="user@apex.com",
            name="Apex User",
            password="userpassword123",
            role="customer"
        )

        self.category = Category.objects.create(name="Gadgets", slug="gadgets")
        self.brand = Brand.objects.create(name="ApexBrand", slug="apexbrand")
        self.product = Product.objects.create(
            name="Apex Widget",
            slug="apex-widget",
            brand=self.brand,
            category=self.category,
            price=99.99,
            company=self.company,
            stock=100
        )

        self.stats_url = reverse('admin-stats')
        self.reports_url = reverse('admin-reports')

    def test_dashboard_stats_requires_admin(self):
        """Test that DashboardStatsView denies access to regular users and accepts admin users"""
        # Unauthenticated
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated as regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticated as admin user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('totalSales', response.data)
        self.assertIn('totalProducts', response.data)

    def test_admin_reports_endpoint(self):
        """Test ReportsView with different report types"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test default/sales report
        response = self.client.get(self.reports_url + '?type=sales')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test stock report
        response = self.client.get(self.reports_url + '?type=stock')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_pos_sale_creation(self):
        """Test POS checkout sale can be created and updates product inventory"""
        pos_url = reverse('admin-pos-list')
        self.client.force_authenticate(user=self.admin_user)

        payload = {
            "items": [
                {
                    "product_id": str(self.product.id),
                    "quantity": 5,
                    "price": 99.99
                }
            ],
            "total_amount": 499.95,
            "payment_method": "Cash",
            "cash_received": 500.00,
            "change_given": 0.05
        }

        response = self.client.post(pos_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['payment_method'], 'Cash')

        # Check stock deduction
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 95)

    def test_service_ticket_requires_auth(self):
        """Test that ServiceTicket creation requires authentication"""
        url = reverse('admin-service-tickets-list')
        payload = {
            "category": "Laptop",
            "brand": "Dell",
            "model": "XPS",
            "description": "Broken hinge"
        }
        
        # Unauthenticated
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], "Laptop")
        self.assertEqual(response.data['user'], str(self.regular_user.id))
