from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import MyUser, Note
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('account:register')
        self.login_url = reverse('account:login')
        self.profile_url = reverse('account:profile')
        self.check_auth_url = reverse('account:check_auth')
        self.note_list_url = reverse('account:note_list_create')

        self.user_data = {
            "email": "testuser@example.com",
            "name": "Test User",
            "password": "securepassword123",
            "password2": "securepassword123"
        }
        self.user = User.objects.create_user(
            email="existing@example.com",
            name="Existing User",
            password="existingpassword123"
        )

    def test_user_registration(self):
        """Test user can register via the registration endpoint"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', response.data['user'])
        self.assertEqual(response.data['user']['email'], self.user_data['email'])

    def test_user_registration_duplicate_email(self):
        """Test registration fails with a duplicate email"""
        duplicate_data = {
            "email": "existing@example.com",
            "name": "Duplicate User",
            "password": "somepassword123",
            "password2": "somepassword123"
        }
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test registered user can log in and retrieve tokens"""
        login_data = {
            "email": "existing@example.com",
            "password": "existingpassword123"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_authenticated_user_profile(self):
        """Test fetching and updating profile works for authenticated users"""
        self.client.force_authenticate(user=self.user)
        # Fetch profile
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], self.user.email)

        # Update profile
        update_data = {"name": "Updated Name"}
        response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['name'], "Updated Name")
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Updated Name")

    def test_check_auth_status(self):
        """Test authentication check endpoint detects state correctly"""
        # Unauthenticated
        response = self.client.get(self.check_auth_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.check_auth_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['authenticated'])
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_notes_crud_for_owner(self):
        """Test note creation and retrieval is properly constrained to the owner"""
        self.client.force_authenticate(user=self.user)
        note_data = {"title": "My Note", "description": "This is a test note."}
        
        # Create note
        response = self.client.post(self.note_list_url, note_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "My Note")
        note_id = response.data['id']

        # List notes
        response = self.client.get(self.note_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Fetch detail
        detail_url = reverse('account:note_detail', kwargs={'pk': note_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], "This is a test note.")
