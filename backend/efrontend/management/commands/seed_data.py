from django.core.management.base import BaseCommand
from django.utils.text import slugify
from account.models import MyUser
from efrontend.models import Category, Product, HeroSetting, StoreLocation
from eadmin.models import ChatSession, ChatMessage, ServiceTicket
import random

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # 1. Create Superuser if not exists
        if not MyUser.objects.filter(email='admin@fixitall.com').exists():
            MyUser.objects.create_superuser(
                email='admin@fixitall.com',
                name='Admin User',
                password='adminpassword'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created: admin@fixitall.com / adminpassword'))

        # 2. Create Categories
        categories_data = [
            {'name': 'Smartphones', 'icon': 'Smartphone', 'image': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'},
            {'name': 'Laptops', 'icon': 'Laptop', 'image': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'},
            {'name': 'Tablets', 'icon': 'Tablet', 'image': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'},
            {'name': 'Accessories', 'icon': 'Headphones', 'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'},
        ]

        categories = []
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slugify(cat_data['name']),
                    'icon': cat_data['icon'],
                    'image': cat_data['image'],
                    'description': f"High quality {cat_data['name']} and repair services."
                }
            )
            categories.append(cat)
            if created:
                self.stdout.write(f"Created category: {cat.name}")

        # 3. Create Products
        products_data = [
            {
                'name': 'iPhone 15 Pro',
                'brand': 'Apple',
                'price': 999.00,
                'category': categories[0],
                'image': 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
                'description': 'The latest iPhone with titanium design and A17 Pro chip.'
            },
            {
                'name': 'MacBook Air M2',
                'brand': 'Apple',
                'price': 1199.00,
                'category': categories[1],
                'image': 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?w=800',
                'description': 'Redesigned MacBook Air with the power of M2 chip.'
            },
            {
                'name': 'Galaxy S23 Ultra',
                'brand': 'Samsung',
                'price': 1199.00,
                'category': categories[0],
                'image': 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=800',
                'description': 'Samsung flagship with 200MP camera and S Pen.'
            },
            {
                'name': 'iPad Pro 12.9',
                'brand': 'Apple',
                'price': 1099.00,
                'category': categories[2],
                'image': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
                'description': 'The ultimate iPad experience with M2 chip and Liquid Retina XDR display.'
            }
        ]

        for prod_data in products_data:
            prod, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults={
                    'slug': slugify(prod_data['name']),
                    'brand': prod_data['brand'],
                    'price': prod_data['price'],
                    'category': prod_data['category'],
                    'image': prod_data['image'],
                    'description': prod_data['description'],
                    'stock': 10,
                    'in_stock': True,
                    'is_new': True
                }
            )
            if created:
                self.stdout.write(f"Created product: {prod.name}")

        # 4. Create Hero Settings
        HeroSetting.objects.get_or_create(
            title='Expert Electronics Repair',
            defaults={
                'subtitle': 'Fast, reliable repair services for all your devices.',
                'image': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200',
                'link': '/service-center',
                'is_active': True,
                'order': 1
            }
        )

        # 5. Create Store Locations
        StoreLocation.objects.get_or_create(
            name='FixItAll Kathmandu',
            defaults={
                'address': 'New Road, Kathmandu',
                'city': 'Kathmandu',
                'phone': '01-4220000',
                'email': 'kathmandu@fixitall.com',
                'latitude': 27.7007,
                'longitude': 85.3123,
                'opening_hours': {'Mon-Fri': '10 AM - 7 PM', 'Sat': '11 AM - 5 PM'}
            }
        )

        # 6. Create a Sample Chat Session
        user = MyUser.objects.first()
        if user:
            session, created = ChatSession.objects.get_or_create(
                user=user,
                user_id_str=str(user.id),
                defaults={
                    'user_name': user.name,
                    'user_email': user.email,
                    'status': 'active'
                }
            )
            if created:
                ChatMessage.objects.create(
                    session=session,
                    sender='user',
                    text='Hello, I have a problem with my laptop screen.'
                )
                ChatMessage.objects.create(
                    session=session,
                    sender='assistant',
                    text='Hello! I can certainly help with that. What seems to be the issue with the screen?'
                )
                self.stdout.write("Created sample chat session and messages.")

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
