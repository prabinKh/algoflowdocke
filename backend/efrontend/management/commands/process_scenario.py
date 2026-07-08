from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from efrontend.models import Product, Order, OrderItem, Category, Brand
from eadmin.models import POSSale
from company.models import Company
from django.utils import timezone
import uuid
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Simulates a user ordering a product and admin processing it via POS'

    def handle(self, *args, **kwargs):
        company_slug = "darz"
        try:
            comp = Company.objects.get(slug=company_slug)
        except Company.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Company "{company_slug}" does not exist.'))
            return

        # 1. Create a Normal User
        user_email = f"customer_{random.randint(100, 999)}@example.com"
        user_name = "John Doe"
        user, created = User.objects.get_or_create(
            email=user_email,
            defaults={
                "name": user_name,
                "role": "customer",
                "company": comp,
                "is_active": True
            }
        )
        if created:
            user.set_password("password123")
            user.save()
            self.stdout.write(self.style.SUCCESS(f'User "{user_email}" created.'))
        else:
            self.stdout.write(f'User "{user_email}" already exists.')

        # 2. Get a Product
        product = Product.objects.filter(company=comp).first()
        if not product:
            self.stdout.write(self.style.ERROR('No products found for this company. Run manual_add first.'))
            return

        # 3. Create an Order
        order_uid = str(uuid.uuid4())
        order = Order.objects.create(
            company=comp,
            user=user,
            full_name=user_name,
            email=user_email,
            phone="1234567890",
            address="123 Main St",
            city="Colombo",
            country="Sri Lanka",
            subtotal=product.price,
            total_amount=product.price,
            status='pending',
            payment_status='pending',
            payment_method='cod'
        )
        self.stdout.write(self.style.SUCCESS(f'Order {order.order_id} created for user.'))

        # Create Order Item
        OrderItem.objects.create(
            order=order,
            product=product,
            name=product.name,
            price=product.price,
            quantity=1
        )

        # 4. Admin Confirms the Order (Update status)
        order.status = 'processing'
        order.payment_status = 'completed'
        order.save()
        self.stdout.write(self.style.SUCCESS(f'Admin: Order {order.order_id} status updated to Processing and Payment Completed.'))

        # 5. POS Billing (Create POSSale)
        pos_transaction_id = f"POS-{random.randint(100000, 999999)}"
        pos_sale = POSSale.objects.create(
            company=comp,
            order=order,
            transaction_id=pos_transaction_id,
            # For simplicity, assuming the first admin or staff of the company processed it
            staff=User.objects.filter(company=comp, is_staff=True).first()
        )
        self.stdout.write(self.style.SUCCESS(f'POS: Billing completed. Transaction ID: {pos_transaction_id}'))

        # Set order as delivered (Final admin step)
        order.status = 'delivered'
        order.save()
        self.stdout.write(self.style.SUCCESS(f'Admin: Order {order.order_id} status updated to Delivered.'))

        self.stdout.write(self.style.SUCCESS('Scenario successfully simulated!'))
