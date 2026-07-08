from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from company.models import Company
from eadmin.models import ChatSession, ChatMessage
from efrontend.models import Product
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates 5 users and 50 chat messages with admin replies'

    def handle(self, *args, **kwargs):
        comp = Company.objects.filter(slug='darz').first()
        if not comp:
            self.stdout.write(self.style.ERROR('Company "darz" not found.'))
            return

        products = list(Product.objects.filter(company=comp))
        admin_user = User.objects.filter(is_staff=True).first()
        
        questions = [
            "What is the warranty period for this product?",
            "Is there a discount for bulk orders?",
            "How long does delivery take to Pokhara?",
            "Does it come with all original accessories?",
            "Can I pay using eSewa on delivery?",
            "What are the technical specifications for the battery?",
            "Is there an exchange policy if I don't like it?",
            "Do you have this in other colors?",
            "Is this the latest version available?",
            "Can I visit your Jawalakhel branch to see it first?"
        ]

        answers = [
            "We offer a 1-year official brand warranty.",
            "Yes, for orders over 5 units, we provide a 10% discount.",
            "Delivery to Pokhara usually takes 2-3 business days.",
            "Yes, it includes the box, charger, and manual.",
            "Absolutely, we accept eSewa, Khalti, and Cash on Delivery.",
            "It features a 5000mAh high-density lithium-ion battery.",
            "We have a 7-day easy return policy for manufacturing defects.",
            "Currently, we have Black and Silver in stock.",
            "Yes, this is the 2024 updated model.",
            "Of course! Our Jawalakhel branch is open from 10 AM to 7:30 PM."
        ]

        for i in range(1, 6):
            username = f'customer_{i}'
            email = f'cust{i}@example.com'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'company': comp}
            )
            if created:
                user.set_password('password123')
                user.save()

            session = ChatSession.objects.create(
                company=comp,
                user=user,
                user_email=email,
                user_name=username,
                status='open'
            )

            for j in range(10):
                # User Question
                ChatMessage.objects.create(
                    session=session,
                    sender='user',
                    text=questions[j]
                )
                # Admin Reply
                ChatMessage.objects.create(
                    session=session,
                    sender='admin',
                    text=answers[j]
                )

            self.stdout.write(self.style.SUCCESS(f'Created chat history for {username}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded 5 users and 50 messages.'))
