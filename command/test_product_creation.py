from rest_framework.test import APITestCase
from rest_framework import status
from account.models import MyUser
from efrontend.models import Product, Category
from django.urls import reverse

class ProductCreationTests(APITestCase):
    def setUp(self):
        self.admin_user = MyUser.objects.create_superuser(
            email='admin@neostore.com', 
            name='Admin', 
            password='password123', 
            is_admin=True,
            is_staff=True
        )
        self.category = Category.objects.create(name='Laptops', slug='laptops')
        self.url = reverse('admin-products-list')

    def test_create_product_with_camel_case_fields(self):
        """Test that the serializer correctly maps frontend camelCase fields to backend snake_case fields"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            "name": "New Laptop",
            "slug": "new-laptop",
            "category": "Laptops",
            "categorySlug": "laptops",
            "brand": "BrandX",
            "type": "Gaming",
            "price": "1500.00",
            "originalPrice": "1800.00",
            "discount": 15,
            "stockCount": 25,
            "inStock": True,
            "isNew": True,
            "isBestSeller": True,
            "isPopular": False,
            "isOffer": True,
            "freeShipping": True,
            "image": "http://example.com/image.jpg",
            "images": ["http://example.com/img1.jpg", "http://example.com/img2.jpg"],
            "model3D": "http://example.com/model.glb",
            "description": "A very powerful gaming laptop",
            "specs": ["CPU: i9", "RAM: 32GB"],
            "detailedSpecs": {"CPU": "i9", "RAM": "32GB"},
            "features": ["RGB Keyboard", "144Hz Screen"],
            "colors": [{"name": "Black", "hex": "#000000"}],
            "collections": ["New Arrivals"],
            "rating": 4.5,
            "reviews": 10
        }
        
        response = self.client.post(self.url, data, format='json')
        
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response Error: {response.data}")
            
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify in database
        product = Product.objects.get(slug='new-laptop')
        self.assertEqual(product.original_price, 1800.00)
        self.assertEqual(product.stock, 25)
        self.assertEqual(product.gallery, data['images'])
        self.assertEqual(product.model_3d, data['model3D'])
        self.assertTrue(product.is_best_seller)
        self.assertEqual(product.reviews_count, 10)
        self.assertEqual(product.category, self.category)
