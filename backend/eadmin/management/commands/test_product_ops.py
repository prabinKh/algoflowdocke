from django.core.management.base import BaseCommand
from efrontend.models import Product, Category
from django.utils.text import slugify
import time

class Command(BaseCommand):
    help = 'Tests product creation, update, and deletion'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- Starting Product Ops Test ---'))

        # 1. Get or create a category
        category, created = Category.objects.get_or_create(
            name="Test Category",
            defaults={'slug': 'test-category'}
        )
        if created:
            self.stdout.write(f'Created category: {category.name}')

        # 2. Create a product
        product_name = f"Test Product {int(time.time())}"
        product_slug = slugify(product_name)
        
        try:
            product = Product.objects.create(
                name=product_name,
                slug=product_slug,
                category=category,
                brand="Test Brand",
                price=99.99,
                image="https://picsum.photos/200",
                description="Testing management command creation"
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created product: {product.name} (ID: {product.id})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create product: {e}'))
            return

        # 3. Update the product
        try:
            new_name = f"{product_name} (Updated)"
            product.name = new_name
            product.price = 149.99
            product.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated product to: {product.name} with price {product.price}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to update product: {e}'))

        # 4. Delete the product
        try:
            product_id = product.id
            product.delete()
            
            # Verify deletion
            exists = Product.objects.filter(id=product_id).exists()
            if not exists:
                self.stdout.write(self.style.SUCCESS('Successfully deleted product and verified it is gone.'))
            else:
                self.stdout.write(self.style.ERROR('Failed to delete product! It still exists.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to delete product: {e}'))

        self.stdout.write(self.style.SUCCESS('--- Product Ops Test Completed Successfully ---'))
