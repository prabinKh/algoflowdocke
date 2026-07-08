from django.core.management.base import BaseCommand
from company.models import Company
from account.models import MyUser
from eadmin.models import StaffRole, StaffMember

class Command(BaseCommand):
    help = 'Seeds one customer and one staff user for Apex Tech Products'

    def handle(self, *args, **kwargs):
        try:
            comp = Company.objects.get(slug='apex-tech')
        except Company.DoesNotExist:
            self.stdout.write(self.style.ERROR('Company "apex-tech" does not exist. Please run seed_products first.'))
            return

        # 1. Create or reset customer@apex.com
        MyUser.objects.filter(email='customer@apex.com').delete()
        customer = MyUser.objects.create_user(
            email='customer@apex.com',
            name='Apex Customer',
            password='password123',
            role='customer',
            company=comp,
            email_verified=True,
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('Seeded customer: customer@apex.com / password123'))

        # 2. Create or reset staff@apex.com
        MyUser.objects.filter(email='staff@apex.com').delete()
        staff_user = MyUser.objects.create_user(
            email='staff@apex.com',
            name='Apex Staff',
            password='password123',
            role='staff',
            company=comp,
            is_staff=True,
            email_verified=True,
            is_active=True
        )

        # Create a default role if not exists
        role, _ = StaffRole.objects.get_or_create(
            name='Store Manager',
            company=comp,
            defaults={'description': 'Manages daily store operations'}
        )

        # Link StaffMember profile
        StaffMember.objects.filter(user=staff_user).delete()
        StaffMember.objects.create(
            user=staff_user,
            company=comp,
            role=role,
            is_active=True
        )

        self.stdout.write(self.style.SUCCESS('Seeded staff: staff@apex.com / password123 with StaffMember profile'))
