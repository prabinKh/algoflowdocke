from django.core.management.base import BaseCommand
from efrontend.models import Category, Product, Brand
from company.models import Company
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Manually creates a new category, brand, and product for Darz company'

    def handle(self, *args, **kwargs):
        # 1. Get the Darz company
        company_slug = "darz"
        try:
            comp = Company.objects.get(slug=company_slug)
        except Company.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Company "{company_slug}" does not exist.'))
            return

        # 2. Create a NEW Category
        cat_name = "Smart Accessories"
        cat_slug = slugify(cat_name)
        category, created = Category.objects.get_or_create(
            company=comp,
            slug=cat_slug,
            defaults={
                "name": cat_name,
                "icon": "⌚",
                "description": "Smart watches, bands and accessories."
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Category "{cat_name}" created.'))
        else:
            self.stdout.write(f'Category "{cat_name}" already exists.')

        # 3. Create a NEW Brand
        brand_name = "Z-Tech"
        brand_slug = slugify(brand_name)
        brand, created = Brand.objects.get_or_create(
            company=comp,
            slug=brand_slug,
            defaults={
                "name": brand_name,
                "description": "High-quality tech accessories."
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Brand "{brand_name}" created.'))
        else:
            self.stdout.write(f'Brand "{brand_name}" already exists.')

        # 4. Create a NEW Product
        product_name = "Z-Tech Watch Series 1"
        product_slug = slugify(f"darz-{product_name}")
        product, created = Product.objects.get_or_create(
            company=comp,
            slug=product_slug,
            defaults={
                "name": product_name,
                "category": category,
                "brand": brand,
                "brand_name": brand_name,
                "description": "A stylish and functional smart watch for everyday use.",
                "price": 299.99,
                "stock": 50,
                "rating": 4.5,
                "reviews_count": 12,
                "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
                "is_active": True,
                "in_stock": True,
                "specs": [
                    "Heart Rate Monitor",
                    "Water Resistant",
                    "7-day Battery Life"
                ]
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Product "{product_name}" created.'))
        else:
            self.stdout.write(f'Product "{product_name}" already exists.')

        self.stdout.write(self.style.SUCCESS('Manual data seeding completed successfully!'))
