import os
import django
import sys

# Setup Django environment aa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from account.models import MyUser

def create_users():
    users_to_create = [
        {"email": "staff1@gmail.com", "password": "password123", "first_name": "Staff", "last_name": "One", "is_staff": True},
        {"email": "staff2@gmail.com", "password": "password123", "first_name": "Staff", "last_name": "Two", "is_staff": True},
        {"email": "customer1@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "One", "is_staff": False},
        {"email": "customer2@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "Two", "is_staff": False},
        {"email": "customer3@gmail.com", "password": "password123", "first_name": "Customer", "last_name": "Three", "is_staff": False},
    ]

    from company.models import Company
    
    logitech = Company.objects.filter(slug='logitech').first()

    for user_data in users_to_create:
        email = user_data["email"]
        if not MyUser.objects.filter(email=email).exists():
            user = MyUser.objects.create_user(
                email=email,
                password=user_data["password"],
                name=f"{user_data['first_name']} {user_data['last_name']}",
                company=logitech
            )
            user.is_staff = user_data["is_staff"]
            user.save()
            print(f"Created user: {email} (Staff: {user.is_staff}, Company: {logitech.name if logitech else 'None'})")
        else:
            # Update existing user to belong to logitech if not already
            user = MyUser.objects.get(email=email)
            if logitech and user.company != logitech:
                user.company = logitech
                user.save()
                print(f"Updated user {email} to belong to {logitech.name}")
            else:
                print(f"User already exists and matches: {email}")

if __name__ == "__main__":
    create_users()
