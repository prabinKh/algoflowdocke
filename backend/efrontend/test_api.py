from rest_framework.test import APITestCase
from rest_framework import status
from efrontend.models import Category, Brand, Product
from django.urls import reverse

class StoreAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.brand = Brand.objects.create(name='TestBrand', slug='testbrand')
        self.product = Product.objects.create(
            name='Test Phone',
            slug='test-phone',
            brand=self.brand,
            price=500.00,
            category=self.category,
            stock=10,
            in_stock=True
        )
        self.product_list_url = reverse('product-list')
        self.category_list_url = reverse('category-list')

    def test_get_products(self):
        response = self.client.get(self.product_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Phone')

    def test_get_categories(self):
        response = self.client.get(self.category_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Electronics')

    def test_create_order(self):
        url = reverse('order-create')
        data = {
            'customerName': 'John Doe',
            'customerEmail': 'john@example.com',
            'totalAmount': 500.00,
            'items': [
                {'productId': self.product.id, 'quantity': 1, 'price': 500.00}
            ],
            'shippingAddress': {
                'address': '123 Main St',
                'city': 'Kathmandu',
                'phone': '1234567890'
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['full_name'], 'John Doe')
