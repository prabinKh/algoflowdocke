from django.core.management.base import BaseCommand
from django.utils.text import slugify
from account.models import MyUser
from efrontend.models import Category, Product, Order, OrderItem, HeroSetting
from eadmin.models import ServiceTicket, CategoryFeature
import random


class Command(BaseCommand):
    help = 'Seed initial data: admin user, categories, products, orders'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # ── Admin User ──────────────────────────────────────────
        admin_email = 'admin@gmail.com'
        if not MyUser.objects.filter(email=admin_email).exists():
            admin = MyUser.objects.create_superuser(
                email=admin_email,
                name='Admin',
                password='admin',
            )
            admin.is_admin = True
            admin.is_staff = True
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'  Admin user created: {admin_email} / admin'))
        else:
            self.stdout.write(f'  Admin user already exists: {admin_email}')

        # ── Categories ───────────────────────────────────────────
        categories_data = [
            {'name': 'Laptops', 'slug': 'laptops', 'icon': '💻', 'brands': ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS']},
            {'name': 'Mobiles', 'slug': 'mobiles', 'icon': '📱', 'brands': ['Samsung', 'Apple', 'OnePlus', 'Xiaomi']},
            {'name': 'Monitors', 'slug': 'monitors', 'icon': '🖥️', 'brands': ['LG', 'Samsung', 'Dell', 'ASUS']},
            {'name': 'Accessories', 'slug': 'accessories', 'icon': '🎧', 'brands': ['Logitech', 'Sony', 'JBL', 'boAt']},
            {'name': 'Desktops', 'slug': 'desktops', 'icon': '🖥️', 'brands': ['Dell', 'HP', 'Apple', 'Lenovo']},
            {'name': 'Tablets', 'slug': 'tablets', 'icon': '📟', 'brands': ['Apple', 'Samsung', 'Xiaomi']},
        ]
        cats = {}
        for c in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=c['slug'],
                defaults={'name': c['name'], 'icon': c['icon'], 'brands': c['brands']}
            )
            cats[c['slug']] = cat
            if created:
                self.stdout.write(f'  Category: {c["name"]}')

        # ── Products ────────────────────────────────────────────
        products_data = [
            {
                'category': 'laptops', 'name': 'MacBook Pro 14"', 'brand': 'Apple',
                'price': 199999, 'original_price': 239999, 'discount': 17,
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202301?wid=904&hei=840&fmt=jpeg&qlt=90',
                'description': 'Powerful laptop with M3 Pro chip', 'stock': 15, 'in_stock': True, 'is_new': True,
                'specs': ['M3 Pro chip', '18GB RAM', '512GB SSD', '14-inch Liquid Retina display'],
                'rating': 4.9, 'reviews_count': 245,
            },
            {
                'category': 'laptops', 'name': 'Dell XPS 15', 'brand': 'Dell',
                'price': 149999, 'original_price': 179999, 'discount': 17,
                'image': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
                'description': 'Premium Windows laptop with OLED display', 'stock': 8, 'in_stock': True, 'is_best_seller': True,
                'specs': ['Intel Core i7-13700H', '16GB DDR5', '512GB NVMe SSD', '15.6" OLED 3.5K'],
                'rating': 4.7, 'reviews_count': 189,
            },
            {
                'category': 'mobiles', 'name': 'iPhone 15 Pro', 'brand': 'Apple',
                'price': 134900, 'original_price': 149900, 'discount': 10,
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg',
                'description': 'Pro-grade iPhone with titanium design', 'stock': 25, 'in_stock': True, 'is_new': True, 'is_popular': True,
                'specs': ['A17 Pro chip', '48MP camera', 'Titanium design', 'USB-C'],
                'rating': 4.8, 'reviews_count': 512,
            },
            {
                'category': 'mobiles', 'name': 'Samsung Galaxy S24 Ultra', 'brand': 'Samsung',
                'price': 129999, 'original_price': 149999, 'discount': 13,
                'image': 'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-ultra-s928-sm-s928bzkcins-thumb-539573242',
                'description': 'Ultimate Android flagship with S Pen', 'stock': 20, 'in_stock': True, 'is_best_seller': True,
                'specs': ['Snapdragon 8 Gen 3', '12GB RAM', '256GB storage', '200MP camera'],
                'rating': 4.7, 'reviews_count': 389,
            },
            {
                'category': 'monitors', 'name': 'LG UltraWide 34"', 'brand': 'LG',
                'price': 49999, 'original_price': 59999, 'discount': 17,
                'image': 'https://images.unsplash.com/photo-1527443224154-c4a573d5f5ec?w=500',
                'description': 'Curved ultrawide monitor for professionals', 'stock': 12, 'in_stock': True,
                'specs': ['34" IPS curved', '3440x1440 resolution', '144Hz refresh rate', 'USB-C 65W'],
                'rating': 4.6, 'reviews_count': 156,
            },
            {
                'category': 'accessories', 'name': 'Sony WH-1000XM5', 'brand': 'Sony',
                'price': 29990, 'original_price': 34990, 'discount': 14,
                'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
                'description': 'Industry-leading noise canceling headphones', 'stock': 30, 'in_stock': True, 'is_popular': True,
                'specs': ['30hr battery', 'Industry-best ANC', 'Multipoint connection', 'Quick Charge'],
                'rating': 4.8, 'reviews_count': 678,
            },
            {
                'category': 'accessories', 'name': 'Logitech MX Master 3S', 'brand': 'Logitech',
                'price': 9999, 'original_price': 12999, 'discount': 23,
                'image': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
                'description': 'Advanced wireless mouse for creators', 'stock': 50, 'in_stock': True, 'free_shipping': True,
                'specs': ['8000 DPI', 'USB-C charging', 'Bluetooth + USB Receiver', 'Customizable buttons'],
                'rating': 4.7, 'reviews_count': 234,
            },
            {
                'category': 'tablets', 'name': 'iPad Pro 12.9"', 'brand': 'Apple',
                'price': 109900, 'original_price': 119900, 'discount': 8,
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spacegray-202210?wid=940&hei=1112&fmt=png-alpha',
                'description': 'The ultimate iPad with M2 chip', 'stock': 18, 'in_stock': True,
                'specs': ['M2 chip', '12.9" Liquid Retina XDR', 'Apple Pencil 2 support', 'WiFi 6E'],
                'rating': 4.9, 'reviews_count': 312,
            },
        ]

        products = []
        for p in products_data:
            slug = slugify(p['name'])
            # ensure unique slug
            base_slug = slug
            n = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{n}"
                n += 1

            product, created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    'category': cats[p['category']],
                    'name': p['name'],
                    'brand': p['brand'],
                    'price': p['price'],
                    'original_price': p.get('original_price', p['price']),
                    'discount': p.get('discount', 0),
                    'image': p['image'],
                    'description': p['description'],
                    'stock': p['stock'],
                    'in_stock': p.get('in_stock', True),
                    'is_new': p.get('is_new', False),
                    'is_best_seller': p.get('is_best_seller', False),
                    'is_popular': p.get('is_popular', False),
                    'is_offer': p.get('is_offer', False),
                    'free_shipping': p.get('free_shipping', False),
                    'specs': p.get('specs', []),
                    'features': p.get('specs', []),
                    'rating': p.get('rating', 0),
                    'reviews_count': p.get('reviews_count', 0),
                }
            )
            products.append(product)
            if created:
                self.stdout.write(f'  Product: {p["name"]}')

        # ── Category Features ────────────────────────────────────
        features_data = {
            'laptops': ['Processor', 'RAM', 'Storage', 'Display', 'Battery Life', 'GPU', 'OS', 'Weight'],
            'mobiles': ['Processor', 'RAM', 'Storage', 'Camera', 'Battery', 'Display', 'OS', '5G'],
            'monitors': ['Resolution', 'Refresh Rate', 'Panel Type', 'Size', 'Ports', 'Response Time'],
            'accessories': ['Connectivity', 'Battery', 'Color', 'Compatibility', 'Warranty'],
            'tablets': ['Processor', 'RAM', 'Storage', 'Display', 'Battery', 'Connectivity'],
        }
        for slug, feats in features_data.items():
            cat = cats.get(slug)
            if cat:
                for feat in feats:
                    CategoryFeature.objects.get_or_create(category=cat, feature_name=feat, defaults={'is_active': True})

        # ── Sample Orders ────────────────────────────────────────
        admin_user = MyUser.objects.filter(email=admin_email).first()
        order_names = ['John Doe', 'Jane Smith', 'Ramesh Kumar', 'Priya Sharma', 'Alex Johnson']
        statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered']

        for i, (name, status) in enumerate(zip(order_names, statuses)):
            if Order.objects.count() >= 5:
                break
            product = products[i % len(products)]
            qty = random.randint(1, 3)
            total = float(product.price) * qty
            order = Order.objects.create(
                user=admin_user,
                uid=str(admin_user.id),
                order_id=f'ORD-{100000 + i}',
                email=f'{name.lower().replace(" ", "")}@example.com',
                full_name=name,
                address=f'{10 + i} Main Street',
                city='Kathmandu',
                phone=f'+977 98{random.randint(10000000, 99999999)}',
                subtotal=total,
                tax=total * 0.1,
                total_amount=total * 1.1,
                status=status,
                payment_status='paid' if status == 'delivered' else 'unpaid',
                payment_method='card',
                source='store',
            )
            OrderItem.objects.create(
                order=order,
                product=product,
                product_id_str=str(product.id),
                name=product.name,
                image=product.image,
                quantity=qty,
                price=product.price,
            )
            self.stdout.write(f'  Order: {order.order_id} for {name}')

        # ── Hero Settings ────────────────────────────────────────
        if not HeroSetting.objects.exists():
            HeroSetting.objects.create(
                title='Next-Gen Tech at Your Fingertips',
                subtitle='Discover the latest laptops, mobiles, and accessories at unbeatable prices.',
                image='https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400',
                link='/products',
                is_active=True,
                order=1,
            )
            self.stdout.write('  Hero setting created')

        self.stdout.write(self.style.SUCCESS('\nSeeding complete! Login: admin@gmail.com / admin'))
