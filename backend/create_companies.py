import os
import django
import sys
import random

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from account.models import MyUser
from company.models import Company

def create_companies():
    # Find a user to act as the owner
    user = MyUser.objects.first()
    if not user:
        print("No users found in the database. Creating a test user...")
        user = MyUser.objects.create_user(email='vendor@example.com', name='Test Vendor', password='password123')
    
    print(f"Using user: {user.email}")
    
    companies_data = [
        {
            'name': 'Tech Haven Electronics',
            'description': 'The best place for premium electronics and gadgets.',
            'email': 'contact@techhaven.com',
            'phone': '+1 555-1001',
            'website': 'https://techhaven.example.com',
            'address': '123 Tech Blvd, Silicon Valley, CA',
            'logo': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
            'banner': 'https://images.unsplash.com/photo-1531297172864-45d1b0a68d71?w=1200&q=80',
        },
        {
            'name': 'Gadget Galaxy Store',
            'description': 'Your one-stop shop for smartphones, tablets, and accessories.',
            'email': 'support@gadgetgalaxy.com',
            'phone': '+1 555-1002',
            'website': 'https://gadgetgalaxy.example.com',
            'address': '456 Innovation Way, Austin, TX',
            'logo': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&q=80',
            'banner': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
        },
        {
            'name': 'Fix It Masters',
            'description': 'Professional repair services and refurbished parts.',
            'email': 'hello@fixitmasters.com',
            'phone': '+1 555-1003',
            'website': 'https://fixitmasters.example.com',
            'address': '789 Repair Lane, New York, NY',
            'logo': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&q=80',
            'banner': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80',
        },
        {
            'name': 'Audio Visual Experts',
            'description': 'High-end home theater and audio equipment.',
            'email': 'sales@avexperts.com',
            'phone': '+1 555-1004',
            'website': 'https://avexperts.example.com',
            'address': '101 Sound Ave, Seattle, WA',
            'logo': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
            'banner': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=1200&q=80',
        },
        {
            'name': 'Smart Home Solutions',
            'description': 'Automate your life with our smart home devices.',
            'email': 'info@smarthome.example.com',
            'phone': '+1 555-1005',
            'website': 'https://smarthomesolutions.example.com',
            'address': '202 Future St, Boston, MA',
            'logo': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&q=80',
            'banner': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',
        }
    ]
    
    created_slugs = []
    
    for data in companies_data:
        company = Company.objects.create(
            owner=user,
            name=data['name'],
            description=data['description'],
            email=data['email'],
            phone=data['phone'],
            website=data['website'],
            address=data['address'],
            logo=data['logo'],
            banner=data['banner'],
        )
        print(f"Created company: {company.name} -> Slug: {company.slug}")
        created_slugs.append(company.slug)
        
    print("\n--- FRONTEND URLS ---")
    for slug in created_slugs:
        print(f"http://localhost:3000/companies/{slug}")

if __name__ == '__main__':
    create_companies()
