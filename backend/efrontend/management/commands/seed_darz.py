from django.core.management.base import BaseCommand
from efrontend.models import Category, Product, HeroSetting, Brand
from company.models import Company
from account.models import MyUser
from django.utils.text import slugify
import random

class Command(BaseCommand):
    help = 'Seeds a specific company "Darz Electronics" with 5 categories and 5 products each'

    def handle(self, *args, **kwargs):
        # 1. Create User for Darz
        admin_email = "admin@darz.com"
        if not MyUser.objects.filter(email=admin_email).exists():
            admin_user = MyUser.objects.create_user(
                email=admin_email,
                name="Darz Admin",
                password="password123",
                role='company_admin',
                is_staff=True,
                is_active=True,
                email_verified=True,
                is_admin=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created user: {admin_email}'))
        else:
            admin_user = MyUser.objects.get(email=admin_email)

        # 2. Create Company Darz
        company_slug = "darz"
        comp, created = Company.objects.get_or_create(
            slug=company_slug,
            defaults={
                "name": "Darz Electronics",
                "ip_address": "127.0.0.10",
                "domain_name": "darz.local",
                "description": "Premium electronics store with cutting-edge technology.",
                "theme_color": "#8b5cf6",
                "theme_color_secondary": "#7c3aed",
                "plan": "pro",
                "owner": admin_user,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created company: Darz Electronics'))
            admin_user.company = comp
            admin_user.save(update_fields=['company'])

        # 3. Create Hero Banner
        HeroSetting.objects.get_or_create(
            company=comp,
            defaults={
                "title": "Welcome to Darz Electronics",
                "subtitle": "Discover the future of technology today.",
                "image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=600&fit=crop",
                "cta_text": "Explore Now",
                "cta_link": "/products"
            }
        )

        # 4. Create 5 Categories
        categories_data = [
            {"name": "Performance Laptops", "slug": "performance-laptops", "icon": "💻"},
            {"name": "Ultra Smartphones", "slug": "ultra-smartphones", "icon": "📱"},
            {"name": "Smart Living", "slug": "smart-living", "icon": "🏠"},
            {"name": "Professional Cameras", "slug": "professional-cameras", "icon": "📷"},
            {"name": "Gaming Gear", "slug": "gaming-gear", "icon": "🎮"},
        ]

        # 5. Create 5 Products for each Category (25 total)
        brands = ["DarzPremium", "EliteTech", "NextGen", "Titan", "Vortex"]
        
        for cat_info in categories_data:
            cat_obj, _ = Category.objects.get_or_create(
                company=comp,
                slug=cat_info["slug"],
                defaults={"name": cat_info["name"], "icon": cat_info["icon"]}
            )
            
            for i in range(1, 6):
                p_name = f"{cat_info['name']} Model {chr(64+i)}"
                p_slug = slugify(f"darz-{cat_info['slug']}-{i}")
                
                brand_name = random.choice(brands)
                brand_obj, _ = Brand.objects.get_or_create(
                    company=comp,
                    slug=slugify(brand_name),
                    defaults={"name": brand_name}
                )
                
                Product.objects.get_or_create(
                    company=comp,
                    slug=p_slug,
                    defaults={
                        "name": p_name,
                        "category": cat_obj,
                        "brand": brand_obj,
                        "brand_name": brand_name,
                        "description": f"This is a high-performance {cat_info['name']} from Darz Electronics. Built for durability and style.",
                        "price": random.randint(500, 5000),
                        "stock": random.randint(10, 100),
                        "rating": round(random.uniform(4.0, 5.0), 1),
                        "reviews_count": random.randint(5, 50),
                        "image": f"https://images.unsplash.com/photo-{1500000000000 + random.randint(1, 999999)}?w=800&h=600&fit=crop",
                        "is_active": True,
                        "in_stock": True,
                    }
                )
                self.stdout.write(f'Created product: {p_name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded Darz Electronics with 25 products!'))
