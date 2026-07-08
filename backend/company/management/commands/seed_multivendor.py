from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils.text import slugify
from django.db import transaction
from company.models import Company
from efrontend.models import Product, Category, Brand
from eadmin.models import StaffRole, StaffMember
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with exactly 5 unique e-commerce companies, their categories, brands, products, admin and staff accounts.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Wiping existing multivendor companies, products, staff, and relevant accounts..."))
        
        # Determine emails to clean up
        seeded_emails = [
            "nexus-admin@electronexus.com", "nexus-staff@electronexus.com",
            "cart-admin@freshcart.com", "cart-staff@freshcart.com",
            "style-admin@voguestyle.com", "style-staff@voguestyle.com",
            "glow-admin@glowcosmetics.com", "glow-staff@glowcosmetics.com",
            "cafe-admin@aromacup.com", "cafe-staff@aromacup.com",
        ]
        
        # Safe Delete
        Product.objects.all().delete()
        Category.objects.all().delete()
        Brand.objects.all().delete()
        StaffMember.objects.all().delete()
        StaffRole.objects.all().delete()
        Company.objects.all().delete()
        User.objects.filter(email__in=seeded_emails).delete()

        # Let's outline the dataset
        companies_data = [
            {
                "name": "ElectroNexus",
                "slug": "electronexus",
                "category": "Electronics & Technology",
                "description": "High-end premium tech devices, computer hardware, smart devices and premium mobile gadgets.",
                "admin_email": "nexus-admin@electronexus.com",
                "admin_name": "Nexus Admin",
                "admin_password": "NexusAdmin2026!",
                "staff_email": "nexus-staff@electronexus.com",
                "staff_name": "Nexus Staff",
                "staff_password": "NexusStaff2026!",
                "theme_color": "#0f172a",
                "theme_color_secondary": "#3b82f6",
                "logo": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=200&h=200&q=80",
                "banner": "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1200&h=400&q=80",
                "categories": [
                    {"name": "Computers", "slug": "computers", "icon": "💻"},
                    {"name": "Phones & Tablets", "slug": "phones-tablets", "icon": "📱"},
                    {"name": "Audio Accessories", "slug": "audio-accessories", "icon": "🎧"}
                ],
                "brands": ["NexusPRO", "AeroLuxe"],
                "products": [
                    {
                        "name": "NexusBook Pro X1",
                        "category_slug": "computers",
                        "brand_name": "NexusPRO",
                        "price": 1299.99,
                        "discount": 10,
                        "description": "The peak of performance with 32GB RAM, 1TB NVMe, and advanced thermal cooling.",
                        "image": "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 25,
                        "is_best_seller": True
                    },
                    {
                        "name": "NexusPhone 17 Ultra",
                        "category_slug": "phones-tablets",
                        "brand_name": "NexusPRO",
                        "price": 999.99,
                        "discount": 5,
                        "description": "Unmatched speed, stunning 120Hz micro-bezel display, and a 200MP camera lens.",
                        "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 42,
                        "is_new": True
                    },
                    {
                        "name": "AeroSound Wireless Buds",
                        "category_slug": "audio-accessories",
                        "brand_name": "AeroLuxe",
                        "price": 149.99,
                        "discount": 15,
                        "description": "Immersive Active Noise Cancellation paired with 40-hour deep battery longevity.",
                        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 120,
                        "is_popular": True
                    },
                    {
                        "name": "ProGlide Mechanical Keyboard",
                        "category_slug": "audio-accessories",
                        "brand_name": "NexusPRO",
                        "price": 89.99,
                        "discount": 0,
                        "description": "Tactual mechanical satisfaction with customizable RGB profiles and hot-swappable switches.",
                        "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 65,
                        "is_new": True
                    },
                    {
                        "name": "NexusCharge 100W Power Station",
                        "category_slug": "audio-accessories",
                        "brand_name": "NexusPRO",
                        "price": 59.99,
                        "discount": 20,
                        "description": "Speed charger supporting simultaneous multi-device powering with safety thermal controls.",
                        "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 18,
                        "is_offer": True
                    }
                ]
            },
            {
                "name": "FreshCart",
                "slug": "freshcart",
                "category": "Grocery & Food",
                "description": "Farm-fresh daily organic produce, whole grain bakeries, vitamins, and premium kitchen pantry essentials.",
                "admin_email": "cart-admin@freshcart.com",
                "admin_name": "Cart Admin",
                "admin_password": "CartAdmin2026!",
                "staff_email": "cart-staff@freshcart.com",
                "staff_name": "Cart Staff",
                "staff_password": "CartStaff2026!",
                "theme_color": "#15803d",
                "theme_color_secondary": "#22c55e",
                "logo": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&h=200&q=80",
                "banner": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&h=400&q=80",
                "categories": [
                    {"name": "Fresh Fruits", "slug": "fresh-fruits", "icon": "🍎"},
                    {"name": "Organic Dairy", "slug": "organic-dairy", "icon": "🥛"},
                    {"name": "Bakery & Grains", "slug": "bakery-grains", "icon": "🍞"}
                ],
                "brands": ["OrganicFields", "HarvestCrisp"],
                "products": [
                    {
                        "name": "Fresh Honeycrisp Apples",
                        "category_slug": "fresh-fruits",
                        "brand_name": "OrganicFields",
                        "price": 4.99,
                        "discount": 0,
                        "description": "Sweet, exceptionally crisp locally-sourced organic Honeycrisp apples (1kg bag).",
                        "image": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 250,
                        "is_best_seller": True
                    },
                    {
                        "name": "Organic Grass-Fed Whole Milk 1L",
                        "category_slug": "organic-dairy",
                        "brand_name": "OrganicFields",
                        "price": 3.49,
                        "discount": 0,
                        "description": "Pasteurized grass-fed organic cow milk with absolute natural cream and high calcium.",
                        "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 150,
                        "is_popular": True
                    },
                    {
                        "name": "Artesian Sourdough Bread Loaf",
                        "category_slug": "bakery-grains",
                        "brand_name": "HarvestCrisp",
                        "price": 5.99,
                        "discount": 5,
                        "description": "Wild-fermented artesian sourdough loaf baked freshly at sunrise with clean grains.",
                        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 80,
                        "is_new": True
                    },
                    {
                        "name": "Harvest Granola Oats & Berries",
                        "category_slug": "bakery-grains",
                        "brand_name": "HarvestCrisp",
                        "price": 6.49,
                        "discount": 12,
                        "description": "Crisp toasted rolled oats merged gracefully with dehydrated blueberries and local honey.",
                        "image": "https://images.unsplash.com/photo-1517881917431-13488d537140?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 110,
                        "is_best_seller": True
                    },
                    {
                        "name": "Extra Virgin Olive Oil (500ml)",
                        "category_slug": "bakery-grains",
                        "brand_name": "OrganicFields",
                        "price": 12.99,
                        "discount": 0,
                        "description": "First cold-pressed raw premium Andalusian olives packing intense peppery nuances.",
                        "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 95,
                        "is_popular": True
                    }
                ]
            },
            {
                "name": "VogueStyle",
                "slug": "voguestyle",
                "category": "Clothing & Fashion",
                "description": "Timeless contemporary fashion, designer outerwear, premium raw denim, and elegant everyday apparel.",
                "admin_email": "style-admin@voguestyle.com",
                "admin_name": "Style Admin",
                "admin_password": "StyleAdmin2026!",
                "staff_email": "style-staff@voguestyle.com",
                "staff_name": "Style Staff",
                "staff_password": "StyleStaff2026!",
                "theme_color": "#7c2d12",
                "theme_color_secondary": "#ea580c",
                "logo": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=200&h=200&q=80",
                "banner": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&h=400&q=80",
                "categories": [
                    {"name": "Men's Fashion", "slug": "mens-fashion", "icon": "👕"},
                    {"name": "Women's Wear", "slug": "womens-wear", "icon": "👗"},
                    {"name": "Bags & Footwear", "slug": "bags-footwear", "icon": "👟"}
                ],
                "brands": ["VogueGold", "UrbanThreads"],
                "products": [
                    {
                        "name": "Tailored Wool Trench Coat",
                        "category_slug": "womens-wear",
                        "brand_name": "VogueGold",
                        "price": 189.99,
                        "discount": 15,
                        "description": "Double-breasted luxurious heavyweight wool trench coat offering exquisite silhouette refinement.",
                        "image": "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 30,
                        "is_best_seller": True
                    },
                    {
                        "name": "Classic Raw Denim Slim Jeans",
                        "category_slug": "mens-fashion",
                        "brand_name": "UrbanThreads",
                        "price": 79.99,
                        "discount": 0,
                        "description": "Authentic Japanese raw selvedge denim designed to fade uniquely to your posture.",
                        "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 85,
                        "is_popular": True
                    },
                    {
                        "name": "Merino Cable Knit Sweater",
                        "category_slug": "womens-wear",
                        "brand_name": "VogueGold",
                        "price": 95.00,
                        "discount": 10,
                        "description": "Breathable, high-grade organic merino wool knit sweater with classic rustic cable braids.",
                        "image": "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 50,
                        "is_new": True
                    },
                    {
                        "name": "Full-Grain Leather Chelsea Boots",
                        "category_slug": "bags-footwear",
                        "brand_name": "VogueGold",
                        "price": 149.99,
                        "discount": 0,
                        "description": "Handcrafted premium Chelsea boots boasting dual pull tabs and sturdy vulcanized rubber soles.",
                        "image": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 45,
                        "is_popular": True
                    },
                    {
                        "name": "Minimalist Everyday Canvas Tote",
                        "category_slug": "bags-footwear",
                        "brand_name": "UrbanThreads",
                        "price": 29.99,
                        "discount": 25,
                        "description": "Rugged water-repellent canvas tote with triple-stitched leather reinforcement rings and zip pockets.",
                        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 110,
                        "is_offer": True
                    }
                ]
            },
            {
                "name": "GlowCosmetics",
                "slug": "glowcosmetics",
                "category": "Cosmetics & Beauty",
                "description": "Clean, vegan, cruelty-free face serums, luxurious botanical hair conditioners, and gorgeous organic makeup.",
                "admin_email": "glow-admin@glowcosmetics.com",
                "admin_name": "Glow Admin",
                "admin_password": "GlowAdmin2026!",
                "staff_email": "glow-staff@glowcosmetics.com",
                "staff_name": "Glow Staff",
                "staff_password": "GlowStaff2026!",
                "theme_color": "#db2777",
                "theme_color_secondary": "#f43f5e",
                "logo": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&h=200&q=80",
                "banner": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&h=400&q=80",
                "categories": [
                    {"name": "Facial Serums", "slug": "facial-serums", "icon": "🧪"},
                    {"name": "Shampoos & Bodywash", "slug": "shampoos-bodywash", "icon": "🧴"},
                    {"name": "Luxe Cosmetics", "slug": "luxe-cosmetics", "icon": "💅"}
                ],
                "brands": ["PureGlow", "FloraVibe"],
                "products": [
                    {
                        "name": "Hydrating Hyaluronic Acid Serum",
                        "category_slug": "facial-serums",
                        "brand_name": "PureGlow",
                        "price": 28.00,
                        "discount": 5,
                        "description": "Ultra-lightweight formula locking in absolute hydration with 2% pure hyaluronic crystals.",
                        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 140,
                        "is_popular": True
                    },
                    {
                        "name": "Argan Oil Restoring Conditioner",
                        "category_slug": "shampoos-bodywash",
                        "brand_name": "FloraVibe",
                        "price": 19.50,
                        "discount": 0,
                        "description": "Organic cold-pressed Moroccan Argan Oil to soothe split ends and lock in brilliant sheen.",
                        "image": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 80,
                        "is_new": True
                    },
                    {
                        "name": "Moisturizing Cream Rose edition",
                        "category_slug": "facial-serums",
                        "brand_name": "PureGlow",
                        "price": 42.00,
                        "discount": 8,
                        "description": "Calming rose distillate base combined with Vitamin E to form a protective natural daily barrier.",
                        "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 65,
                        "is_best_seller": True
                    },
                    {
                        "name": "Matte Liquid Lipstick Crimson Red",
                        "category_slug": "luxe-cosmetics",
                        "brand_name": "PureGlow",
                        "price": 16.00,
                        "discount": 0,
                        "description": "Smudge-proof matte intensity lasting 18 hours, nourished with softening botanical almond oils.",
                        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 210,
                        "is_new": True
                    },
                    {
                        "name": "Gentle Foaming Daily Cleanser",
                        "category_slug": "shampoos-bodywash",
                        "brand_name": "FloraVibe",
                        "price": 14.99,
                        "discount": 20,
                        "description": "pH balanced organic foaming tea tree face wash to deep clean without exhausting your natural skin barrier.",
                        "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 120,
                        "is_offer": True
                    }
                ]
            },
            {
                "name": "AromaCup",
                "slug": "aromacup",
                "category": "Cafes & Coffee Shops",
                "description": "Imported high-altitude micro-lot roasted coffee beans, artisanal brewing supplies, and freshly-made pastries.",
                "admin_email": "cafe-admin@aromacup.com",
                "admin_name": "Cafe Admin",
                "admin_password": "CafeAdmin2026!",
                "staff_email": "cafe-staff@aromacup.com",
                "staff_name": "Cafe Staff",
                "staff_password": "CafeStaff2026!",
                "theme_color": "#451a03",
                "theme_color_secondary": "#854d0e",
                "logo": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&h=200&q=80",
                "banner": "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&h=400&q=80",
                "categories": [
                    {"name": "Gourmet Beans", "slug": "gourmet-beans", "icon": "☕"},
                    {"name": "Artisan Brew Gear", "slug": "artisan-brew-gear", "icon": "🏺"},
                    {"name": "Pastries & Snacks", "slug": "pastries-snacks", "icon": "🥐"}
                ],
                "brands": ["AromaPremium", "BrewCraft"],
                "products": [
                    {
                        "name": "Ethiopian Sidamo Roast Beans",
                        "category_slug": "gourmet-beans",
                        "brand_name": "AromaPremium",
                        "price": 18.99,
                        "discount": 0,
                        "description": "Single-origin medium light roasted whole-bean coffee featuring bright floral jasmine and lemon notes (250g bag).",
                        "image": "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 160,
                        "is_best_seller": True
                    },
                    {
                        "name": "Classic Double Espresso Blend",
                        "category_slug": "gourmet-beans",
                        "brand_name": "AromaPremium",
                        "price": 14.50,
                        "discount": 5,
                        "description": "Rich, chocolatey and deeply sweet espresso bean blend. Absolute thick golden crema guaranteed.",
                        "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 200,
                        "is_popular": True
                    },
                    {
                        "name": "Artisan Copper French Press",
                        "category_slug": "artisan-brew-gear",
                        "brand_name": "BrewCraft",
                        "price": 45.00,
                        "discount": 10,
                        "description": "Heavy duty heat-resistant borosilicate glass server inside elegant vintage copper metal armor plating.",
                        "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 35,
                        "is_new": True
                    },
                    {
                        "name": "Artisanal Almond Croissants",
                        "category_slug": "pastries-snacks",
                        "brand_name": "BrewCraft",
                        "price": 11.99,
                        "discount": 0,
                        "description": "4-pack of triple-baked buttery croissants stuffed of sweet frangipane almond cream.",
                        "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 40,
                        "is_best_seller": True
                    },
                    {
                        "name": "Precision Gooseneck Kettle",
                        "category_slug": "artisan-brew-gear",
                        "brand_name": "BrewCraft",
                        "price": 89.99,
                        "discount": 15,
                        "description": "Electric quick-heating matte black kettle featuring 1-degree temperature precision dial controls.",
                        "image": "https://images.unsplash.com/photo-1594222040212-32a2223835bd?auto=format&fit=crop&w=600&h=450&q=80",
                        "stock": 25,
                        "is_popular": True
                    }
                ]
            }
        ]

        companies_created = []

        # Ensure Vendor Groups exist
        vendor_group, _ = Group.objects.get_or_create(name='Vendors')

        for data in companies_data:
            self.stdout.write(self.style.HTTP_INFO(f"Seeding brand space for: {data['name']}"))
            
            # --- 1. CREATE THE COMPANY ---
            company = Company.objects.create(
                name=data["name"],
                slug=data["slug"],
                category=data["category"],
                description=data["description"],
                logo=data["logo"],
                banner=data["banner"],
                email=data["admin_email"],
                phone="555-0311-2026",
                ip_address=f"127.0.0.{len(companies_created) + 1}",
                theme_color=data["theme_color"],
                theme_color_secondary=data["theme_color_secondary"],
                admin_name=data["admin_name"],
                admin_email=data["admin_email"],
                admin_password=data["admin_password"]
            )
            companies_created.append(company)

            # --- 2. CREATE THE REGISTERED ADMIN USER ---
            admin_user = User.objects.create_user(
                email=data["admin_email"],
                name=data["admin_name"],
                password=data["admin_password"],
                role="company_admin",
                company=company,
                is_admin=True,
                is_staff=True,
                email_verified=True
            )
            
            # Hook the owner foreign key to the company
            company.owner = admin_user
            company.save()

            self.stdout.write(self.style.SUCCESS(f"  -> Created Admin: {data['admin_email']} (Password: {data['admin_password']})"))

            # --- 3. CREATE STAFF ROLE ---
            staff_role, _ = StaffRole.objects.get_or_create(
                company=company,
                name="Sales Associate",
                defaults={
                    "description": "Handles retail sales, Point of Sale, and inventory tracking.",
                    "permissions": ["view_pos", "create_pos", "view_products", "view_orders"]
                }
            )

            # --- 4. CREATE THE REGISTERED STAFF USER ---
            staff_user = User.objects.create_user(
                email=data["staff_email"],
                name=data["staff_name"],
                password=data["staff_password"],
                role="staff",
                company=company,
                is_admin=False,
                is_staff=True,
                email_verified=True
            )

            # Create the StaffMember profile mapping
            StaffMember.objects.create(
                company=company,
                user=staff_user,
                role=staff_role,
                is_active=True
            )
            
            self.stdout.write(self.style.SUCCESS(f"  -> Created Staff: {data['staff_email']} (Password: {data['staff_password']})"))

            # --- 5. SEED CATEGORIES AND BRANDS ---
            category_map = {}
            for cat_item in data["categories"]:
                cat, _ = Category.objects.get_or_create(
                    slug=f"{data['slug']}-{cat_item['slug']}",
                    defaults={
                        "name": cat_item["name"],
                        "icon": cat_item["icon"],
                        "description": f"Seeded category {cat_item['name']} for {data['name']}",
                        "is_active": True
                    }
                )
                category_map[cat_item["slug"]] = cat

            brand_map = {}
            for b_name in data["brands"]:
                br_slug = slugify(f"{data['slug']}-{b_name}")
                brand, _ = Brand.objects.get_or_create(
                    slug=br_slug,
                    defaults={
                        "name": b_name,
                        "description": f"Official vendor brand {b_name} of {data['name']}",
                        "is_active": True
                    }
                )
                brand_map[b_name] = brand

            # --- 6. SEED PRODUCTS ---
            for p_item in data["products"]:
                cat_obj = category_map.get(p_item["category_slug"])
                brand_obj = brand_map.get(p_item["brand_name"])
                
                Product.objects.create(
                    company=company,
                    name=p_item["name"],
                    slug=slugify(p_item["name"]),
                    category=cat_obj,
                    brand=brand_obj,
                    brand_name=p_item["brand_name"],
                    price=p_item["price"],
                    discount=p_item["discount"],
                    original_price=p_item["price"],
                    description=p_item["description"],
                    image=p_item["image"],
                    stock=p_item["stock"],
                    in_stock=True,
                    is_new=p_item.get("is_new", False),
                    is_best_seller=p_item.get("is_best_seller", False),
                    is_popular=p_item.get("is_popular", False),
                    is_offer=p_item.get("is_offer", False),
                    rating=random.uniform(4.2, 5.0),
                    reviews_count=random.randint(5, 45)
                )
            
            self.stdout.write(self.style.SUCCESS(f"  -> Added {len(data['products'])} highly tailored products to {data['name']}."))

        self.stdout.write(self.style.SUCCESS("\n=================================================================="))
        self.stdout.write(self.style.SUCCESS("MULTI-VENDOR PLATFORM SEEDING SUCCESSFULLY COMPLETE!"))
        self.stdout.write(self.style.SUCCESS("All 5 companies loaded instantly with premium catalogs and credentials."))
        self.stdout.write(self.style.SUCCESS("=================================================================="))

