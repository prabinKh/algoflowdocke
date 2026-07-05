from types import SimpleNamespace
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from company.admin import CompanyAdmin
from company.models import Company
from efrontend.models import Product, Category, Order

User = get_user_model()

class MultiVendorTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Ensure category
        self.category = Category.objects.create(name="Tech", slug="tech")
        
        # User 1 & Company 1
        self.user1 = User.objects.create_user(username="vendor1", email="v1@test.com", password="pwd", name="Vendor 1")
        self.company1 = Company.objects.create(name="Company A", owner=self.user1, slug="company-a")
        
        # Products for Company 1
        self.c1_p1 = Product.objects.create(name="C1 P1", slug="c1-p1", company=self.company1, category=self.category, price=10, image="http://img")
        self.c1_p2 = Product.objects.create(name="C1 P2", slug="c1-p2", company=self.company1, category=self.category, price=20, image="http://img")

        # User 2 & Company 2
        self.user2 = User.objects.create_user(username="vendor2", email="v2@test.com", password="pwd", name="Vendor 2")
        self.company2 = Company.objects.create(name="Company B", owner=self.user2, slug="company-b")
        
        # Products for Company 2
        self.c2_p1 = Product.objects.create(name="C2 P1", slug="c2-p1", company=self.company2, category=self.category, price=30, image="http://img")
        self.c2_p2 = Product.objects.create(name="C2 P2", slug="c2-p2", company=self.company2, category=self.category, price=40, image="http://img")

    def test_global_products_list(self):
        """Test that global endpoint returns all products across all companies."""
        response = self.client.get('/api/store/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming pagination or standard list
        data = response.data
        if 'results' in data:
            data = data['results']
        self.assertEqual(len(data), 4)

    def test_company_specific_products_list(self):
        """Test that ?company=<slug> filters products correctly."""
        # Query Company A
        response1 = self.client.get('/api/store/products/?company=company-a')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        data1 = response1.data.get('results', response1.data) if isinstance(response1.data, dict) else response1.data
        self.assertEqual(len(data1), 2)
        slugs1 = [p['slug'] for p in data1]
        self.assertIn("c1-p1", slugs1)
        self.assertNotIn("c2-p1", slugs1)

        # Query Company B
        response2 = self.client.get('/api/store/products/?company=company-b')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        data2 = response2.data.get('results', response2.data) if isinstance(response2.data, dict) else response2.data
        self.assertEqual(len(data2), 2)
        slugs2 = [p['slug'] for p in data2]
        self.assertIn("c2-p1", slugs2)
        self.assertNotIn("c1-p1", slugs2)

    def test_checkout_split_order(self):
        """Test that a checkout with items from different companies splits into multiple orders."""
        payload = {
            "orderId": "TEST-ORDER-1",
            "customerName": "Test Customer",
            "customerEmail": "customer@example.com",
            "shipping": {"address": "123 Main", "city": "NYC", "phone": "123"},
            "items": [
                {"productId": str(self.c1_p1.id), "quantity": 1, "price": 10},
                {"productId": str(self.c2_p1.id), "quantity": 2, "price": 30}
            ]
        }
        
        response = self.client.post('/api/store/orders/create/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Assert two separate orders were created
        orders = Order.objects.all()
        self.assertEqual(orders.count(), 2)

        # Verify Order 1 belongs to Company A
        order_c1 = orders.get(company=self.company1)
        self.assertEqual(order_c1.subtotal, 10)
        self.assertEqual(order_c1.items.count(), 1)

        # Verify Order 2 belongs to Company B
        order_c2 = orders.get(company=self.company2)
        self.assertEqual(order_c2.subtotal, 60) # 2 quantity * 30
        self.assertEqual(order_c2.items.count(), 1)

    def test_company_admin_credentials_are_created_from_form_data(self):
        """The admin save hook should create the company owner from form-cleaned credentials."""
        admin = CompanyAdmin(Company, None)
        request = SimpleNamespace(user=self.user1)
        obj = Company(name="Build Co", slug="build-co")
        form = SimpleNamespace(cleaned_data={
            'admin_name': 'Vendor Admin',
            'admin_email': 'vendor@example.com',
            'admin_password': 'VendorSecret123!',
        })

        admin.save_model(request, obj, form, False)

        user = User.objects.get(email='vendor@example.com')
        self.assertTrue(user.check_password('VendorSecret123!'))
        self.assertEqual(user.company, obj)
        self.assertEqual(obj.owner, user)
