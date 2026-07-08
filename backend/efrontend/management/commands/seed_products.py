from django.core.management.base import BaseCommand
from efrontend.models import Category, Product, HeroSetting, Brand
from company.models import Company
from account.models import MyUser
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seeds the database with 5 distinct companies with different IPs and products'

    def handle(self, *args, **kwargs):
        # Clean up existing products, hero settings, and companies
        self.stdout.write('Clearing existing inventory, users, and companies...')
        Product.objects.all().delete()
        HeroSetting.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Company.objects.all().delete()
        MyUser.objects.filter(role__in=['company_admin', 'superadmin', 'staff']).delete()

        # Create Django superuser admin accounts
        if not MyUser.objects.filter(email='admin@fixitall.com').exists():
            MyUser.objects.create_superuser(
                email='admin@fixitall.com',
                name='Admin User',
                password='adminpassword'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created: admin@fixitall.com / adminpassword'))

        if not MyUser.objects.filter(email='admin@gmail.com').exists():
            MyUser.objects.create_superuser(
                email='admin@gmail.com',
                name='Custom Admin',
                password='admin'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created: admin@gmail.com / admin'))

        # Define 5 Companies with distinct IP addresses, slugs, domains, and themes
        companies_data = [
            {
                "name": "Neo-Store Corporation",
                "slug": "neo-store",
                "ip_address": "127.0.0.1",
                "domain_name": "neo-store.local",
                "description": "Premium workflow computing and advanced monitors store.",
                "theme_color": "#6366f1",
                "theme_color_secondary": "#4f46e5",
                "plan": "enterprise",
                "admin_name": "Neo Admin",
                "admin_email": "admin@neostore.com",
            },
            {
                "name": "Quantum Electronics",
                "slug": "quantum-electronics",
                "ip_address": "127.0.0.2",
                "domain_name": "quantum-electronics.local",
                "description": "High-fidelity audio systems, cameras, and studio headphones.",
                "theme_color": "#ec4899",
                "theme_color_secondary": "#db2777",
                "plan": "pro",
                "admin_name": "Quantum Admin",
                "admin_email": "admin@quantum.com",
            },
            {
                "name": "Apex Tech Products",
                "slug": "apex-tech",
                "ip_address": "127.0.0.3",
                "domain_name": "apex-tech.local",
                "description": "Aesthetic smartwatches, fitness tracking, and wear technology.",
                "theme_color": "#3b82f6",
                "theme_color_secondary": "#2563eb",
                "plan": "pro",
                "admin_name": "Apex Admin",
                "admin_email": "admin@apex.com",
            },
            {
                "name": "Summit Gadgets",
                "slug": "summit-gadgets",
                "ip_address": "127.0.0.4",
                "domain_name": "summit-gadgets.local",
                "description": "State-of-the-art smartphones, tablets, and car accessories.",
                "theme_color": "#10b981",
                "theme_color_secondary": "#059669",
                "plan": "starter",
                "admin_name": "Summit Admin",
                "admin_email": "admin@summit.com",
            },
            {
                "name": "Horizon Devices",
                "slug": "horizon-devices",
                "ip_address": "127.0.0.5",
                "domain_name": "horizon-devices.local",
                "description": "Home automation, smart kitchen tools, and living accessories.",
                "theme_color": "#f59e0b",
                "theme_color_secondary": "#d97706",
                "plan": "free",
                "admin_name": "Horizon Admin",
                "admin_email": "admin@horizon.com",
            }
        ]

        company_map = {}
        for c_data in companies_data:
            admin_name = c_data["admin_name"]
            admin_email = c_data["admin_email"]
            admin_password = "password123"

            # Create the Django MyUser object
            owner_user = MyUser.objects.create_user(
                email=admin_email,
                name=admin_name,
                password=admin_password,
                role='company_admin',
                is_staff=True,
                is_active=True,
                email_verified=True,
                is_admin=True
            )

            c_data_copy = c_data.copy()
            c_data_copy["owner"] = owner_user
            c_data_copy["admin_password"] = admin_password

            comp = Company.objects.create(**c_data_copy)

            # Link back the company field to user
            owner_user.company = comp
            owner_user.save(update_fields=['company'])

            company_map[comp.slug] = comp
            self.stdout.write(self.style.SUCCESS(f'Created company "{comp.name}" with IP {comp.ip_address} and Admin {admin_email}'))

        # Seed Hero Banners for each company
        hero_data = {
            "neo-store": {
                "title": "Precision Tools for Modern Workflow",
                "subtitle": "Powering performance, built for every ambition. Explore our curated collection of premium electronics.",
                "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
            },
            "quantum-electronics": {
                "title": "Immerse Yourself in High Fidelity Audio",
                "subtitle": "Studio-grade headphones, cameras, and noise-cancelling equipment for pure acoustic clarity.",
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
            },
            "apex-tech": {
                "title": "Smart Tech for Your Active Lifestyle",
                "subtitle": "Track your progress, monitor fitness metrics, and elevate your personal performance.",
                "image": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&h=600&fit=crop",
            },
            "summit-gadgets": {
                "title": "Unrivaled Connectivity and Mobile Freedom",
                "subtitle": "Explore the next generation of smart tablets, phone systems, and high-speed car accessories.",
                "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop",
            },
            "horizon-devices": {
                "title": "Step Into the Smart Home of Tomorrow",
                "subtitle": "Intelligent kitchen tools, air purification systems, and robot vacuums for refined living.",
                "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop",
            }
        }

        for slug, h_info in hero_data.items():
            comp = company_map[slug]
            HeroSetting.objects.create(
                company=comp,
                title=h_info["title"],
                subtitle=h_info["subtitle"],
                image=h_info["image"],
                is_active=True,
                order=1
            )
            self.stdout.write(self.style.SUCCESS(f'Created hero banner for "{comp.name}"'))

        # Seed Categories (now specific to each company for better multi-tenant isolation)
        cat_map = {} # company_slug -> {cat_slug -> cat_obj}
        categories_data = [
            {"name": "Laptops & Computers", "slug": "laptops-computers", "icon": "💻"},
            {"name": "Computer Peripherals", "slug": "computer-peripherals", "icon": "🖱️"},
            {"name": "Audio | Headphones", "slug": "audio-headphones", "icon": "🎧"},
            {"name": "Cameras", "slug": "cameras", "icon": "📷"},
            {"name": "Mobiles | Tablets", "slug": "mobiles-tablets", "icon": "📱"},
            {"name": "Home | Kitchen", "slug": "home-kitchen", "icon": "🏠"},
            {"name": "Fitness | Health Care", "slug": "fitness-health", "icon": "💪"},
            {"name": "Car Accessories", "slug": "car-accessories", "icon": "🚗"},
            {"name": "Monitors", "slug": "monitors", "icon": "🖥️"},
        ]

        # Define 5 highly custom and premium products for each of the 5 companies
        products_by_company = {
            "neo-store": [
                {
                    "name": 'Dell UltraSharp 32" 4K USB-C Monitor',
                    "slug": "dell-ultrasharp-32-4k-monitor",
                    "category_slug": "monitors",
                    "brand": "Dell",
                    "price": 89900,
                    "original_price": 99900,
                    "discount": 10,
                    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
                    "specs": ["32\" 4K UHD", "IPS Black", "90W USB-C PD"],
                    "description": "Dell's top-tier professional design monitor featuring IPS Black technology for twice the contrast.",
                    "stock": 8,
                    "is_new": True,
                    "is_best_seller": True,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 52,
                },
                {
                    "name": "Dell XPS 13 Plus Developer Edition",
                    "slug": "dell-xps-13-plus-dev",
                    "category_slug": "laptops-computers",
                    "brand": "Dell",
                    "price": 184500,
                    "original_price": 199000,
                    "discount": 7,
                    "image": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop",
                    "specs": ["Intel Core i7-1360P", "32GB RAM", "1TB SSD"],
                    "description": "Sleek capacitive touch row design, zero-lattice keyboard, and stunning OLED borderless display.",
                    "stock": 5,
                    "is_new": True,
                    "is_popular": True,
                    "rating": 4.7,
                    "reviews_count": 29,
                },
                {
                    "name": "Satechi Premium USB-4 Dual-HDMI Dock",
                    "slug": "satechi-premium-usb4-dock",
                    "category_slug": "computer-peripherals",
                    "brand": "Satechi",
                    "price": 14900,
                    "image": "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=400&h=300&fit=crop",
                    "specs": ["Dual 4K HDMI", "10Gbps USB", "Gigabit Ethernet"],
                    "description": "Expand your workstation space with dual HDMI outputs, high-speed ports, and direct power delivery.",
                    "stock": 15,
                    "free_shipping": True,
                    "rating": 4.5,
                    "reviews_count": 14,
                },
                {
                    "name": "Apple MacBook Pro 16\" M3 Max",
                    "slug": "apple-macbook-pro-16-m3-max",
                    "category_slug": "laptops-computers",
                    "brand": "Apple",
                    "price": 349900,
                    "original_price": 379900,
                    "discount": 8,
                    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
                    "specs": ["Apple M3 Max", "48GB Unified RAM", "1TB SSD"],
                    "description": "The ultimate power laptop for professional developers, editors, and engineers with standard 16-inch Liquid Retina XDR display.",
                    "stock": 4,
                    "is_new": True,
                    "rating": 4.9,
                    "reviews_count": 42,
                },
                {
                    "name": "Logitech MX Master 3S Wireless Mouse",
                    "slug": "logitech-mx-master-3s-mouse",
                    "category_slug": "computer-peripherals",
                    "brand": "Logitech",
                    "price": 11900,
                    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&h=300&fit=crop",
                    "specs": ["8K DPI Tracking", "Quiet Clicks", "MagSpeed Scroll"],
                    "description": "Logitech's flagship ergonomic productivity mouse designed for seamless multi-device control and silent operation.",
                    "stock": 35,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 96,
                }
            ],
            "quantum-electronics": [
                {
                    "name": "Sony WH-1000XM5 Wireless Headphones",
                    "slug": "sony-wh1000xm5-headphones",
                    "category_slug": "audio-headphones",
                    "brand": "Sony",
                    "price": 34900,
                    "original_price": 39900,
                    "discount": 12,
                    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
                    "specs": ["Auto NC Optimizer", "30-Hr Battery", "Multipoint Connect"],
                    "description": "Industry-leading active noise cancelling with dual processors and crystal-clear hands-free calling.",
                    "stock": 25,
                    "is_best_seller": True,
                    "free_shipping": True,
                    "rating": 4.9,
                    "reviews_count": 182,
                },
                {
                    "name": "Sony Alpha 7 IV Full-Frame Camera",
                    "slug": "sony-alpha-7-iv-camera",
                    "category_slug": "cameras",
                    "brand": "Sony",
                    "price": 249000,
                    "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
                    "specs": ["33MP Exmor R", "4K 60p Video", "Real-time AF"],
                    "description": "The perfect hybrid photo-video camera offering professional autofocus performance and premium color science.",
                    "stock": 3,
                    "is_new": True,
                    "rating": 4.8,
                    "reviews_count": 34,
                },
                {
                    "name": "Bose SoundLink Revolve+ II Bluetooth Speaker",
                    "slug": "bose-soundlink-revolve-ii",
                    "category_slug": "audio-headphones",
                    "brand": "Bose",
                    "price": 29900,
                    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
                    "specs": ["360° Sound", "17-Hr Playtime", "Water Resistant IP55"],
                    "description": "Deep, loud, and immersive portable Bluetooth speaker delivering true 360-degree coverage.",
                    "stock": 18,
                    "is_popular": True,
                    "rating": 4.6,
                    "reviews_count": 47,
                },
                {
                    "name": "Bose QuietComfort Ultra Wireless Headphones",
                    "slug": "bose-quietcomfort-ultra",
                    "category_slug": "audio-headphones",
                    "brand": "Bose",
                    "price": 37900,
                    "original_price": 42900,
                    "discount": 11,
                    "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
                    "specs": ["Immersive Spatial Audio", "World-class NC", "24-Hr Battery"],
                    "description": "Bose's ultimate noise-cancelling headphones featuring groundbreaking custom spatial audio for elite acoustic realism.",
                    "stock": 12,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 55,
                },
                {
                    "name": "GoPro HERO12 Black Action Camera",
                    "slug": "gopro-hero-12-black",
                    "category_slug": "cameras",
                    "brand": "GoPro",
                    "price": 44900,
                    "image": "https://images.unsplash.com/photo-1565849906660-ae47e0998f86?w=400&h=300&fit=crop",
                    "specs": ["5.3K60 Video", "HDR Photo & Video", "HyperSmooth 6.0"],
                    "description": "Unmatched action camera performance delivering rugged durability, 5.3K video resolution, and industry-standard stabilization.",
                    "stock": 15,
                    "is_new": True,
                    "rating": 4.7,
                    "reviews_count": 39,
                }
            ],
            "apex-tech": [
                {
                    "name": "Apple Watch Ultra 2 Titanium",
                    "slug": "apple-watch-ultra-2",
                    "category_slug": "fitness-health",
                    "brand": "Apple",
                    "price": 89900,
                    "image": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=300&fit=crop",
                    "specs": ["Titanium Case", "Up to 72-Hr Battery", "Precision GPS"],
                    "description": "The ultimate adventure and endurance sports smartwatch featuring a stunning 3000-nits Always-On Retina screen.",
                    "stock": 7,
                    "is_new": True,
                    "is_best_seller": True,
                    "free_shipping": True,
                    "rating": 4.9,
                    "reviews_count": 63,
                },
                {
                    "name": "Garmin Fenix 7 Pro Sapphire Solar",
                    "slug": "garmin-fenix-7-pro-solar",
                    "category_slug": "fitness-health",
                    "brand": "Garmin",
                    "price": 79900,
                    "original_price": 84900,
                    "discount": 5,
                    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=300&fit=crop",
                    "specs": ["Solar Charging", "LED Flashlight", "Heart Rate Sensor"],
                    "description": "Multisport solar-powered watch with robust navigation maps, health tracking metrics, and tactical capabilities.",
                    "stock": 4,
                    "is_popular": True,
                    "rating": 4.7,
                    "reviews_count": 42,
                },
                {
                    "name": "Fitbit Charge 6 Advanced Fitness Tracker",
                    "slug": "fitbit-charge-6-tracker",
                    "category_slug": "fitness-health",
                    "brand": "Fitbit",
                    "price": 14900,
                    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=300&fit=crop",
                    "specs": ["Built-in GPS", "ECG App", "Google Maps Integration"],
                    "description": "Advanced health tracker that keeps you motivated with premium heart rate monitoring and Google utilities.",
                    "stock": 30,
                    "free_shipping": True,
                    "rating": 4.3,
                    "reviews_count": 89,
                },
                {
                    "name": "Samsung Galaxy Watch 6 Classic",
                    "slug": "samsung-galaxy-watch-6-classic",
                    "category_slug": "fitness-health",
                    "brand": "Samsung",
                    "price": 36900,
                    "original_price": 39900,
                    "discount": 7,
                    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
                    "specs": ["Rotating Bezel", "Body Composition", "Sleep Coaching"],
                    "description": "Samsung's classic premium smartwatch design featuring a physical rotating bezel and comprehensive health coaching metrics.",
                    "stock": 10,
                    "rating": 4.6,
                    "reviews_count": 31,
                },
                {
                    "name": "Theragun PRO 5th Gen Massage Gun",
                    "slug": "theragun-pro-5th-gen",
                    "category_slug": "fitness-health",
                    "brand": "Theragun",
                    "price": 59900,
                    "image": "https://images.unsplash.com/photo-1519828785180-f4f9be7a4c43?w=400&h=300&fit=crop",
                    "specs": ["QuietForce QX150 Motor", "OLED Screen", "5 Attachments"],
                    "description": "The ultimate professional-grade deep tissue percussive therapy device to accelerate athletic recovery and relieve stress.",
                    "stock": 8,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 27,
                }
            ],
            "summit-gadgets": [
                {
                    "name": "Samsung Galaxy S24 Ultra 5G",
                    "slug": "samsung-galaxy-s24-ultra",
                    "category_slug": "mobiles-tablets",
                    "brand": "Samsung",
                    "price": 129900,
                    "original_price": 139900,
                    "discount": 7,
                    "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop",
                    "specs": ["200MP Camera", "Snapdragon 8 Gen 3", "Built-in S-Pen"],
                    "description": "Experience elite mobile power with Galaxy AI, a sleek titanium exterior, and unprecedented night photography.",
                    "stock": 12,
                    "is_new": True,
                    "is_best_seller": True,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 114,
                },
                {
                    "name": "Xiaomi Pad 6 Pro Tablet",
                    "slug": "xiaomi-pad-6-pro",
                    "category_slug": "mobiles-tablets",
                    "brand": "Xiaomi",
                    "price": 38900,
                    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
                    "specs": ["144Hz WQHD+", "Snapdragon 8+ Gen 1", "8600mAh Battery"],
                    "description": "Super-responsive tablet perfect for digital gaming, creative drawing, and portable movie entertainment.",
                    "stock": 20,
                    "is_popular": True,
                    "rating": 4.5,
                    "reviews_count": 37,
                },
                {
                    "name": "Anker Magnetic Wireless Power Bank 10K",
                    "slug": "anker-magnetic-powerbank-10k",
                    "category_slug": "car-accessories",
                    "brand": "Anker",
                    "price": 4900,
                    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=400&h=300&fit=crop",
                    "specs": ["10000mAh", "Strong Magnetic Grip", "USB-C Fast Charging"],
                    "description": "Equipped with a foldable kickstand, this portable charger securely powers your smartphone while on the go.",
                    "stock": 50,
                    "free_shipping": True,
                    "rating": 4.6,
                    "reviews_count": 92,
                },
                {
                    "name": "Apple iPad Air 10.9\" M1",
                    "slug": "apple-ipad-air-10-9-m1",
                    "category_slug": "mobiles-tablets",
                    "brand": "Apple",
                    "price": 59900,
                    "original_price": 64900,
                    "discount": 7,
                    "image": "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&h=300&fit=crop",
                    "specs": ["Apple M1 Chip", "Liquid Retina", "64GB Storage"],
                    "description": "Thin, light, and powerful iPad featuring the revolutionary M1 chip, Center Stage camera, and full Apple Pencil support.",
                    "stock": 15,
                    "rating": 4.7,
                    "reviews_count": 48,
                },
                {
                    "name": "Anker Magnetic Wireless Car Charger",
                    "slug": "anker-magnetic-car-charger",
                    "category_slug": "car-accessories",
                    "brand": "Anker",
                    "price": 3900,
                    "image": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=300&fit=crop",
                    "specs": ["Strong MagSafe Grip", "360° Rotation", "15W Fast Charge"],
                    "description": "Ultra-secure air vent magnetic car mount that safely holds and fast-charges your phone during drives.",
                    "stock": 40,
                    "free_shipping": True,
                    "rating": 4.5,
                    "reviews_count": 61,
                }
            ],
            "horizon-devices": [
                {
                    "name": "Dyson V15 Detect Cordless Vacuum",
                    "slug": "dyson-v15-detect-vacuum",
                    "category_slug": "home-kitchen",
                    "brand": "Dyson",
                    "price": 74900,
                    "original_price": 79900,
                    "discount": 6,
                    "image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop",
                    "specs": ["Laser Dust Detection", "Piezo Sensor", "60-Min Run Time"],
                    "description": "The most intelligent cordless vacuum reveal microscopic dust particles for the ultimate deep cleaning experience.",
                    "stock": 6,
                    "is_new": True,
                    "is_best_seller": True,
                    "free_shipping": True,
                    "rating": 4.9,
                    "reviews_count": 41,
                },
                {
                    "name": "Xiaomi Smart Air Purifier 4 Pro",
                    "slug": "xiaomi-air-purifier-4-pro",
                    "category_slug": "home-kitchen",
                    "brand": "Xiaomi",
                    "price": 19900,
                    "image": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=300&fit=crop",
                    "specs": ["CADR 500m³/h", "Triple Filtration", "OLED Touch Display"],
                    "description": "High-efficiency filter cleans air, eliminates odor, and releases negative ions for active forest-fresh air.",
                    "stock": 14,
                    "is_popular": True,
                    "rating": 4.7,
                    "reviews_count": 73,
                },
                {
                    "name": "Philips Premium Airfryer XXL",
                    "slug": "philips-airfryer-xxl",
                    "category_slug": "home-kitchen",
                    "brand": "Philips",
                    "price": 24900,
                    "image": "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400&h=300&fit=crop",
                    "specs": ["Fat Removal Tech", "Smart Sensing", "7.3L Large Capacity"],
                    "description": "Cook delicious crispy meals with up to 90% less fat using high-speed dynamic air circulation.",
                    "stock": 10,
                    "free_shipping": True,
                    "rating": 4.8,
                    "reviews_count": 59,
                },
                {
                    "name": "Roborock S8 Pro Ultra Robot Vacuum",
                    "slug": "roborock-s8-pro-ultra",
                    "category_slug": "home-kitchen",
                    "brand": "Roborock",
                    "price": 139900,
                    "original_price": 149900,
                    "discount": 6,
                    "image": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=400&h=300&fit=crop",
                    "specs": ["6000Pa Suction", "RockDock Ultra", "VibraRise 2.0 Mopping"],
                    "description": "The peak of robot vacuum technology featuring completely hands-free self-washing, self-drying, and self-emptying dock.",
                    "stock": 5,
                    "is_new": True,
                    "rating": 4.9,
                    "reviews_count": 34,
                },
                {
                    "name": "Philips Hue Color Ambiance Starter Kit",
                    "slug": "philips-hue-color-starter-kit",
                    "category_slug": "home-kitchen",
                    "brand": "Philips",
                    "price": 15900,
                    "image": "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=400&h=300&fit=crop",
                    "specs": ["16 Million Colors", "Hue Bridge Included", "Voice Control"],
                    "description": "Transform your living space with millions of dynamic colors and sync with your favorite movies, music, and games.",
                    "stock": 25,
                    "free_shipping": True,
                    "rating": 4.7,
                    "reviews_count": 81,
                }
            ]
        }

        # Seed products for each company
        for company_slug, products in products_by_company.items():
            comp = company_map[company_slug]
            
            # Create categories for this company
            comp_cats = {}
            for cd in categories_data:
                cat, _ = Category.objects.get_or_create(
                    company=comp,
                    slug=cd['slug'],
                    defaults={'name': cd['name'], 'icon': cd['icon']}
                )
                comp_cats[cd['slug']] = cat

            for p_info in products:
                cat_slug = p_info.pop('category_slug')
                category = comp_cats.get(cat_slug)
                brand_str = p_info.pop('brand', '')
                
                brand_obj, _ = Brand.objects.get_or_create(
                    company=comp,
                    slug=slugify(brand_str),
                    defaults={'name': brand_str}
                )
                
                p_info['category'] = category
                p_info['brand'] = brand_obj
                p_info['brand_name'] = brand_str
                p_info['company'] = comp

                product = Product.objects.create(**p_info)
                self.stdout.write(self.style.SUCCESS(f'Created product "{product.name}" for company "{comp.name}"'))

        # Seed five staff members (one per company) with all model permissions
        from django.contrib.auth.models import Permission
        all_perms = Permission.objects.all()

        staff_data = [
            {"email": "staff@neostore.com", "name": "Neo Staff", "company_slug": "neo-store"},
            {"email": "staff@quantum.com", "name": "Quantum Staff", "company_slug": "quantum-electronics"},
            {"email": "staff@apex.com", "name": "Apex Staff", "company_slug": "apex-tech"},
            {"email": "staff@summit.com", "name": "Summit Staff", "company_slug": "summit-gadgets"},
            {"email": "staff@horizon.com", "name": "Horizon Staff", "company_slug": "horizon-devices"},
        ]

        for s_info in staff_data:
            comp = company_map[s_info["company_slug"]]
            staff_user = MyUser.objects.create_user(
                email=s_info["email"],
                name=s_info["name"],
                password="password123",
                role='staff',
                is_staff=True,
                is_active=True,
                email_verified=True
            )
            staff_user.company = comp
            staff_user.user_permissions.set(all_perms)
            staff_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created staff member "{staff_user.name}" with permissions for "{comp.name}"'))

        # Seed special "gminle" (Gemini AI Assistant) global staff user with all model permissions
        gminle_user = MyUser.objects.create_user(
            email="gminle@fixitall.com",
            name="Gminle AI Assistant",
            password="password123",
            role='staff',
            is_staff=True,
            is_active=True,
            email_verified=True
        )
        gminle_user.user_permissions.set(all_perms)
        gminle_user.save()
        self.stdout.write(self.style.SUCCESS('Created special Gminle AI Assistant staff user (gminle@fixitall.com / password123) with permissions'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded all 5 companies, 25 products, 5 company staff, and the Gminle AI staff!'))
