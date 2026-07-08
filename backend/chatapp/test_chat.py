from rest_framework.test import APITestCase
from rest_framework import status
from account.models import MyUser
from eadmin.models import ChatSession
from django.urls import reverse

class ChatAPITests(APITestCase):
    def setUp(self):
        from company.models import Company
        self.company = Company.objects.create(name='Test Company', slug='test-company')
        self.user = MyUser.objects.create_user(email='test@example.com', name='Test User', password='password123', company=self.company)
        self.session_list_url = reverse('chat-sessions-list')
        self.message_list_url = reverse('chat-messages-list')

    def test_create_chat_session(self):
        data = {
            'user_id_str': 'guest_123',
            'user_name': 'Guest User',
            'user_email': 'guest@example.com',
            'status': 'active'
        }
        response = self.client.post(self.session_list_url + '?company=test-company', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user_name'], 'Guest User')
        
    def test_create_chat_message(self):
        session = ChatSession.objects.create(user_id_str='guest_123', user_name='Guest User', company=self.company)
        data = {
            'session': session.id,
            'sender': 'user',
            'text': 'Hello support'
        }
        response = self.client.post(self.message_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['text'], 'Hello support')
        
        # Verify session is updated
        session.refresh_from_db()
        self.assertEqual(session.last_message, 'Hello support')
        self.assertEqual(session.unread_admin_count, 1)
