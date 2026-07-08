import os
import django
import uuid
import random
from datetime import datetime

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fixitall_backend.settings")
django.setup()

from account.models import MyUser as User
from company.models import Company
from efrontend.models import Product, Order, OrderItem
from eadmin.models import UserActivity, POSSale

def run_flow():
    print("====================================================")
    print("STARTING BULK END-TO-END DEMO FLOW FOR 5 TENANTS")
    print("====================================================")
    
    companies = Company.objects.all()
    if not companies.exists():
        print("No companies found! Please make sure seed_products has run.")
        return
        
    for company in companies:
        print(f"\n---> Routing to Tenant Company: {company.name} ({company.slug})")
        
        # 1. Normal User (Customer) Accounts Setup
        cust_email = f"customer@{company.slug}.com"
        customer, created = User.objects.get_or_create(
            email=cust_email,
            defaults={
                'name': f"{company.name} Guest",
                'role': 'customer',
                'company': company,
                'is_active': True,
                'email_verified': True
            }
        )
        if created:
            customer.set_password("password123")
            customer.save()
            print(f"   [Customer] Created: {cust_email} (password: password123)")
        else:
            print(f"   [Customer] Existing: {cust_email}")

        # Find a product of this company to buy
        products = Product.objects.filter(company=company)
        if not products.exists():
            print(f"   [Warning] No products found for {company.name}! Skipping orders.")
            continue
            
        product = random.choice(products)
        print(f"   [Product Picked] {product.name} (Price: ${product.price})")

        # 2. Simulate User Sign-in and Navigation Activity
        print("   [Activity] Simulating Customer sign in and product interaction...")
        UserActivity.objects.create(
            company=company,
            user=customer,
            action="login",
            ip_address=company.ip_address or "127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            details={"platform": "Web", "timestamp": str(datetime.now())}
        )

        UserActivity.objects.create(
            company=company,
            user=customer,
            action="view_product",
            ip_address=company.ip_address or "127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            details={
                "product_id": str(product.id),
                "product_name": product.name,
                "price": float(product.price)
            }
        )

        UserActivity.objects.create(
            company=company,
            user=customer,
            action="add_to_cart",
            ip_address=company.ip_address or "127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            details={"product_id": str(product.id), "quantity": 1}
        )

        # 3. Simulate placing an Order
        print("   [Order] Simulating Checkout & Placing Order...")
        subtotal = float(product.price)
        tax = round(subtotal * 0.08, 2)
        total = subtotal + tax

        order = Order.objects.create(
            company=company,
            user=customer,
            full_name=customer.name,
            email=customer.email,
            phone="+1-555-0199",
            address="123 Shopping Avenue",
            city="Tech City",
            country="United States",
            subtotal=subtotal,
            tax=tax,
            discount=0.00,
            total_amount=total,
            status="pending",
            payment_status="completed",
            payment_method="credit_card",
            source="storefront",
            customer_type="registered"
        )

        OrderItem.objects.create(
            order=order,
            product=product,
            product_id_str=str(product.id),
            name=product.name,
            quantity=1,
            price=product.price
        )

        UserActivity.objects.create(
            company=company,
            user=customer,
            action="place_order",
            ip_address=company.ip_address or "127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            details={"order_id": order.order_id, "amount": total}
        )
        print(f"   [Order Created] ID: {order.order_id}, Total: ${total}")

        # 4. Simulate Staff processing the pending Order
        staff_user = User.objects.filter(company=company, role='staff').first()
        if not staff_user:
            staff_user = User.objects.filter(role='staff').first()
            
        print(f"   [Staff Task] Simulating staff user '{staff_user.email if staff_user else 'None'}' processing Order...")
        
        # Shift Order states
        order.status = 'processing'
        order.save()
        print("      - Transited Order Status: pending -> processing")
        
        order.status = 'shipped'
        order.save()
        print("      - Transited Order Status: processing -> shipped")

        order.status = 'delivered'
        order.save()
        print("      - Transited Order Status: shipped -> delivered")

        # 5. Simulate point of sale (POS) tasks handled by administrative staff
        print("   [POS Sale] Generating checkout transaction on cashier interface...")
        pos_order = Order.objects.create(
            company=company,
            user=None, # Walk-in Guest
            full_name="POS Retail Guest",
            email=f"guest_{company.slug}@fixitall.com",
            phone="N/A",
            address="Retail Store Register #1",
            city="In-Store",
            country="Local",
            subtotal=subtotal,
            tax=0.00,
            discount=0.00,
            total_amount=subtotal,
            status="delivered",
            payment_status="completed",
            payment_method="cod", # Cash/In-store
            source="pos",
            customer_type="retail"
        )
        
        OrderItem.objects.create(
            order=pos_order,
            product=product,
            product_id_str=str(product.id),
            name=product.name,
            quantity=1,
            price=product.price
        )

        pos_sale = POSSale.objects.create(
            order=pos_order,
            staff=staff_user,
            transaction_id=f"TX-{company.slug.upper().replace('-', '')}-{random.randint(100000, 999999)}"
        )
        print(f"   [POS Sale Processed] Transaction ID: {pos_sale.transaction_id}")

    print("\n====================================================")
    print("SUCCESS: 5 Tenants simulated completely!")
    print("====================================================")

if __name__ == "__main__":
    run_flow()
