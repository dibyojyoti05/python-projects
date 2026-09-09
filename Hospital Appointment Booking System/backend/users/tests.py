from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class UserAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient_user = User.objects.create_user(
            email='testpatient@example.com',
            password='TestPassword123!',
            first_name='Test',
            last_name='Patient',
            role=User.Role.PATIENT
        )

    def test_user_registration(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newuser@example.com',
            'password': 'StrongPassword123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'PATIENT'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

    def test_user_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'testpatient@example.com',
            'password': 'TestPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_invalid_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'testpatient@example.com',
            'password': 'WrongPassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
