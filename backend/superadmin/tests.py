from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from company.models import Company

User = get_user_model()

class SuperAdminAPITests(APITestCase):
    def setUp(self):
        # Create a superadmin user
        self.superadmin = User.objects.create_superuser(
            email="super@fixitall.com",
            name="Super Admin",
            password="superpassword123"
        )
        
        # Create a regular customer
        self.customer = User.objects.create_user(
            email="cust@example.com",
            name="Customer One",
            password="custpassword123",
            role="customer"
        )

        # Create a sample company
        self.company = Company.objects.create(
            name="Test SuperCompany",
            slug="test-supercompany",
            is_active=True
        )

        self.dashboard_url = reverse('superadmin-dashboard')
        self.companies_url = reverse('superadmin-companies')
        self.users_url = reverse('superadmin-users')

    def test_dashboard_requires_superadmin(self):
        """Test that only superusers/superadmins can view the dashboard stats"""
        # Unauthenticated
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Logged in as regular customer
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Logged in as superadmin
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_companies', response.data)
        self.assertIn('active_companies', response.data)

    def test_list_companies(self):
        """Test listing existing tenant companies"""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(self.companies_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('companies', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_create_company(self):
        """Test creating a new tenant company via the superadmin panel"""
        self.client.force_authenticate(user=self.superadmin)
        payload = {
            "name": "New Horizons",
            "slug": "new-horizons",
            "email": "info@newhorizons.com",
            "admin_email": "horizons-admin@test.com",
            "admin_name": "Horizons Admin"
        }
        response = self.client.post(self.companies_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['company']['name'], "New Horizons")
        self.assertIn('credentials', response.data)
        
        # Verify the company was stored in database
        self.assertTrue(Company.objects.filter(slug="new-horizons").exists())

    def test_toggle_company(self):
        """Test toggling the activation status of a company"""
        self.client.force_authenticate(user=self.superadmin)
        url = reverse('superadmin-company-toggle', kwargs={'pk': self.company.pk})
        
        # Toggle from True to False
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertFalse(self.company.is_active)

    def test_list_users(self):
        """Test listing global users in the multi-tenant system"""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        # We have superadmin, customer
        self.assertEqual(response.data['count'], 2)
