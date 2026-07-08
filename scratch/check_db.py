import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from efrontend.models import Category, Brand, Product

print("--- Categories ---")
for cat in Category.objects.all():
    print(f"ID: {cat.id}, Name: {cat.name}, Slug: {cat.slug}, Brands (JSON): {cat.brands}")

print("\n--- Brands ---")
for brand in Brand.objects.all():
    print(f"ID: {brand.id}, Name: {brand.name}, Slug: {brand.slug}, Categories: {[c.name for c in brand.categories.all()]}")

print("\n--- Products ---")
print(f"Total Products: {Product.objects.count()}")
