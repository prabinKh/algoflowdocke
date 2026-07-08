from rest_framework.test import APITestCase
from rest_framework import status
from account.models import MyUser
from django.urls import reverse

class AdminAPITests(APITestCase):
    def setUp(self):
        self.admin_user = MyUser.objects.create_superuser(email='admin@example.com', name='Admin', password='password123', is_admin=True)
        self.normal_user = MyUser.objects.create_user(email='user@example.com', name='User', password='password123')
        self.stats_url = reverse('admin-stats')

    def test_admin_access_stats(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)

    def test_normal_user_denied_stats(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_denied_stats(self):
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
