from django.core.management.base import BaseCommand
from efrontend.models import Order, OrderItem, Product
from company.models import Company
from django.utils import timezone
import random
import uuid

class Command(BaseCommand):
    help = 'Seeds orders from various cities in Nepal for Darz electronics'

    def handle(self, *args, **kwargs):
        comp = Company.objects.filter(slug='darz').first()
        if not comp:
            self.stdout.write(self.style.ERROR('Company "darz" not found. Run seed_darz first.'))
            return

        products = list(Product.objects.filter(company=comp))
        if not products:
            self.stdout.write(self.style.ERROR('No products found for "darz". Run seed_darz first.'))
            return

        nepal_cities = [
            'Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 
            'Birganj', 'Butwal', 'Dharan', 'Dhangadhi', 'Janakpur'
        ]

        for city in nepal_cities:
            # Create 1-5 orders per city
            num_orders = random.randint(1, 5)
            for i in range(num_orders):
                order_id = f'ORD-NEP-{city[:3].upper()}-{random.randint(1000, 9999)}'
                # Get a product first
                product = random.choice(products)
                quantity = random.randint(1, 2)
                total = product.price * quantity
                
                order = Order.objects.create(
                    company=comp,
                    order_id=order_id,
                    full_name=f'Customer from {city}',
                    email=f'user.{random.randint(10, 99)}@nepal.com',
                    phone='9841' + str(random.randint(100000, 999999)),
                    address=f'{random.randint(1, 100)} Street, {city}',
                    city=city,
                    country='Nepal',
                    total_amount=total,
                    status='delivered',
                    payment_status='completed',
                    payment_method='cod'
                )
                
                # Add the item
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    name=product.name,
                    price=product.price,
                    quantity=quantity
                )
            
            self.stdout.write(self.style.SUCCESS(f'Created {num_orders} orders for {city}'))

        self.stdout.write(self.style.SUCCESS('Nepal city orders seeded successfully!'))
