from django.core.management.base import BaseCommand
from company.models import Company, FooterSettings
from efrontend.models import StoreLocation

class Command(BaseCommand):
    help = 'Seeds footer settings and store locations for Darz'

    def handle(self, *args, **kwargs):
        comp = Company.objects.filter(slug='darz').first()
        if not comp:
            self.stdout.write(self.style.ERROR('Company "darz" not found.'))
            return

        # 1. Footer Settings
        footer, created = FooterSettings.objects.get_or_create(
            company=comp,
            defaults={
                "company_name": "algoflow-e",
                "email": "contact@algoflow-e.com",
                "opening_hours_weekday": "Sun - Fri: 10AM - 7:30PM",
                "opening_hours_weekend": "Saturday: 11AM - 6PM",
                "show_store_locations": True
            }
        )
        if not created:
            footer.company_name = "algoflow-e"
            footer.email = "contact@algoflow-e.com"
            footer.opening_hours_weekday = "Sun - Fri: 10AM - 7:30PM"
            footer.opening_hours_weekend = "Saturday: 11AM - 6PM"
            footer.save()
            self.stdout.write(self.style.SUCCESS('Footer settings updated.'))
        else:
            self.stdout.write(self.style.SUCCESS('Footer settings created.'))

        # 2. Store Locations
        locations_data = [
            {"name": "Jawalakhel", "address": "Norkhang Complex | Next to Standard Chartered Bank", "phone": "9801200105", "order": 1},
            {"name": "Maitighar", "address": "D&D Complex | Opposite To St. Xaviers College", "phone": "9801200104", "order": 2},
            {"name": "New Road", "address": "Sasa Complex | Opposite To NMB Bank", "phone": "9801200106", "order": 3},
            {"name": "Putalisadak", "address": "IT Plaza | Opposite To Kathmandu Plaza", "phone": "9801200108", "order": 4},
            {"name": "Pokhara", "address": "Courtyard at Nadipur", "phone": "9801200103", "order": 5},
            {"name": "Lazimpat", "address": "Opposite of Trisara", "phone": "9801200102", "order": 6},
        ]

        # Clear existing locations to avoid duplicates if re-running
        StoreLocation.objects.filter(company=comp).delete()

        for loc in locations_data:
            StoreLocation.objects.create(
                company=comp,
                name=loc["name"],
                address=loc["address"],
                phone=loc["phone"],
                order=loc["order"]
            )
            self.stdout.write(self.style.SUCCESS(f'Location "{loc["name"]}" created.'))

        self.stdout.write(self.style.SUCCESS('Footer and locations seeding successfully!'))
