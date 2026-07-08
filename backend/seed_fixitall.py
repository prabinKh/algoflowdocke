import os
import django
import random
from django.utils.text import slugify

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from company.models import Company
from account.models import MyUser as User
from efrontend.models import Category, Brand, Product, Collection
from eadmin.models import ServiceCategory

def seed_fixitall():
    print("🚀 Starting FixItAll seeding script...")
    
    # 1. Ensure a Company exists
    company = Company.objects.filter(slug="logitech").first()
    if not company:
        company = Company.objects.first()
    
    if not company:
        company = Company.objects.create(
            name="Logitech Hub",
            slug="logitech",
            theme_color="#00b2ef",
            email="admin@logitech.com"
        )
        print(f"Created company: {company.name}")
    else:
        print(f"Using company: {company.name}")

    # 2. Ensure test user is Super Admin for the company
    test_email = "algoflownono1264@gmail.com"
    user = User.objects.filter(email=test_email).first()
    if user:
        user.is_superuser = True
        user.is_staff = True
        user.is_admin = True
        user.role = 'superadmin'
        if not user.company:
            user.company = company
        user.save()
        print(f"✅ Updated test user permissions: {test_email}")
    else:
        # Create it if it doesn't exist
        user = User.objects.create_superuser(
            email=test_email,
            name="Super User",
            password="password123",
            company=company
        )
        print(f"✅ Created test superuser: {test_email}")

    # 3. Create/Resolve Brand
    brand, _ = Brand.objects.get_or_create(
        company=company,
        slug="logitech-brand",
        defaults={"name": "Logitech"}
    )

    # 4. Create 5 Categories and 5 Brands each
    categories_data = [
        {"name": "Laptops", "icon": "💻"},
        {"name": "Smartphones", "icon": "📱"},
        {"name": "Tablets", "icon": "📟"},
        {"name": "Smartwatches", "icon": "⌚"},
        {"name": "Audio & Headphones", "icon": "🎧"},
    ]

    for cat_data in categories_data:
        cat_slug = slugify(cat_data['name'])
        category, created = Category.objects.get_or_create(
            company=company,
            slug=cat_slug,
            defaults={
                "name": cat_data['name'],
                "icon": cat_data['icon'],
                "description": f"High quality {cat_data['name']}"
            }
        )
        if created:
            print(f"Created category: {category.name}")
        
        # Create 5 exclusive brands for this category
        for i in range(1, 6):
            b_name = f"{cat_data['name']} Brand {i}"
            b_slug = slugify(f"{cat_slug}-brand-{i}")
            brand_obj, b_created = Brand.objects.get_or_create(
                company=company,
                slug=b_slug,
                defaults={"name": b_name}
            )
            brand_obj.categories.add(category)
            if b_created:
                print(f"  Created brand: {brand_obj.name}")

        # Create 5 products for this category (keeping previous logic but using one of the new brands)
        for i in range(1, 6):
            p_name = f"{cat_data['name']} Pro {i}"
            # Pick a brand for this product (cycle through the 5 category brands)
            prod_brand_slug = slugify(f"{cat_slug}-brand-{((i-1) % 5) + 1}")
            prod_brand = Brand.objects.get(company=company, slug=prod_brand_slug)
            
            Product.objects.get_or_create(
                company=company,
                slug=slugify(f"{cat_slug}-{i}"),
                defaults={
                    "name": p_name,
                    "category": category,
                    "brand": prod_brand,
                    "brand_name": prod_brand.name,
                    "price": random.randint(100, 2000),
                    "description": f"Premium {p_name} with amazing features.",
                    "stock": random.randint(10, 100),
                    "image": f"https://picsum.photos/seed/{cat_slug}{i}/400/300",
                    "in_stock": True,
                    "is_active": True
                }
            )
        print(f"✅ Added 5 brands and 5 products to {category.name}")

    # 5. Service Categories and Service Brands
    service_categories_data = [
        "Computer Repair",
        "Mobile Repair",
        "Home Audio Setup",
        "Console Repair",
        "CCTV Installation"
    ]

    for sc_name in service_categories_data:
        service_category, created = ServiceCategory.objects.get_or_create(
            company=company,
            name=sc_name,
            defaults={
                "description": f"Expert {sc_name} services",
                "is_active": True
            }
        )
        if created:
            print(f"Created service category: {service_category.name}")
        
        from eadmin.models import ServiceBrand
        for i in range(1, 6):
            ServiceBrand.objects.get_or_create(
                category=service_category,
                name=f"{sc_name} Brand {i}",
                defaults={
                    "is_active": True,
                    "supported_models": ["Model A", "Model B", "Model C"]
                }
            )
        print(f"✅ Added 5 service brands to {service_category.name}")

    # 6. Repair Products (optional but good for completeness)
    from eadmin.models import RepairProduct, RepairProductBrand, RepairCommonIssue
    repair_data = [
        ("MacBook Pro", "Laptop & Computer"),
        ("iPhone 15", "Mobile & Tablet"),
        ("PS5", "Gaming Console"),
        ("Sony Bravia", "TV & Display"),
        ("Bose System", "Audio & Speaker")
    ]

    for rp_name, rp_cat in repair_data:
        repair_product, created = RepairProduct.objects.get_or_create(
            company=company,
            name=rp_name,
            defaults={
                "category": rp_cat,
                "status": "active",
                "starting_price": random.randint(50, 200),
                "home_pickup": "yes"
            }
        )
        if created:
            for i in range(1, 6):
                RepairProductBrand.objects.create(
                    product=repair_product,
                    brand_name=f"Brand {i}"
                )
                RepairCommonIssue.objects.create(
                    product=repair_product,
                    issue_name=f"Issue {i}",
                    base_price=random.randint(20, 100)
                )
            print(f"Created repair product: {repair_product.name} with brands and issues")

    print("✨ FixItAll seeding complete!")

if __name__ == "__main__":
    seed_fixitall()
