
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from eadmin.models import ChatSession, ChatMessage
from efrontend.models import Order
from company.models import FooterSettings, StoreLocation

User = get_user_model()

class Command(BaseCommand):
    help = 'Verifies the seeded data for footer and chats'

    def handle(self, *args, **kwargs):
        self.stdout.write("--- Verifying Seeded Data ---")
        
        # 1. Verify Users
        user_count = User.objects.filter(username__startswith='customer_').count()
        self.stdout.write(f"Customer Users: {user_count} (Expected: 5)")
        
        # 2. Verify Chat Sessions
        session_count = ChatSession.objects.count()
        self.stdout.write(f"Chat Sessions: {session_count}")
        
        # 3. Verify Messages
        msg_count = ChatMessage.objects.count()
        self.stdout.write(f"Chat Messages: {msg_count} (Expected: >= 50)")
        
        # 4. Verify Footer
        footer_exists = FooterSettings.objects.exists()
        self.stdout.write(f"Footer Settings Created: {footer_exists}")
        
        # 5. Verify Locations
        loc_count = StoreLocation.objects.count()
        self.stdout.write(f"Store Locations: {loc_count} (Expected: >= 6)")
        
        if user_count >= 5 and msg_count >= 50 and footer_exists and loc_count >= 6:
            self.stdout.write(self.style.SUCCESS("All test checks passed successfully!"))
        else:
            self.stdout.write(self.style.ERROR("Some test checks failed."))
