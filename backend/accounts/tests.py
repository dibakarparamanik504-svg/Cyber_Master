from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from .models import UserProfile


User = get_user_model()


class AccountAuthenticationTests(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.csrf_url = reverse('auth-csrf')
        self.signup_url = reverse('auth-signup')
        self.login_url = reverse('auth-login')
        self.logout_url = reverse('auth-logout')
        self.me_url = reverse('auth-me')

    def csrf_headers(self):
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, 200)
        return {'HTTP_X_CSRFTOKEN': response.data['csrfToken']}

    def test_signup_creates_hashed_user_profile_and_session(self):
        response = self.client.post(
            self.signup_url,
            {
                'name': 'Ada Lovelace',
                'email': 'Ada@example.com',
                'phone': '555-0101',
                'password': 'T7!a-secure-and-unique-passphrase',
                'passwordConfirmation': 'T7!a-secure-and-unique-passphrase',
            },
            format='json',
            **self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['user']['email'], 'ada@example.com')
        user = User.objects.get(username='ada@example.com')
        self.assertTrue(user.check_password('T7!a-secure-and-unique-passphrase'))
        self.assertNotEqual(user.password, 'T7!a-secure-and-unique-passphrase')
        self.assertEqual(user.profile.full_name, 'Ada Lovelace')
        self.assertEqual(user.profile.phone, '555-0101')
        self.assertEqual(self.client.get(self.me_url).status_code, 200)

    def test_signup_rejects_missing_csrf_token(self):
        response = self.client.post(
            self.signup_url,
            {
                'name': 'Ada Lovelace',
                'email': 'ada@example.com',
                'password': 'T7!a-secure-and-unique-passphrase',
                'passwordConfirmation': 'T7!a-secure-and-unique-passphrase',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.exists())

    def test_signup_rejects_password_mismatch_and_duplicate_email(self):
        payload = {
            'name': 'Ada Lovelace',
            'email': 'ada@example.com',
            'password': 'T7!a-secure-and-unique-passphrase',
            'passwordConfirmation': 'a-different-password',
        }
        mismatch_response = self.client.post(
            self.signup_url,
            payload,
            format='json',
            **self.csrf_headers(),
        )
        self.assertEqual(mismatch_response.status_code, 400)
        self.assertFalse(User.objects.exists())

        payload['passwordConfirmation'] = payload['password']
        self.client.post(
            self.signup_url,
            payload,
            format='json',
            **self.csrf_headers(),
        )
        duplicate_response = self.client.post(
            self.signup_url,
            payload,
            format='json',
            **self.csrf_headers(),
        )

        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(User.objects.count(), 1)

    def test_login_logout_and_profile_require_session_authentication(self):
        user = User.objects.create_user(
            username='ada@example.com',
            email='ada@example.com',
            password='T7!a-secure-and-unique-passphrase',
        )
        UserProfile.objects.create(user=user, full_name='Ada Lovelace')

        anonymous_response = self.client.get(self.me_url)
        self.assertEqual(anonymous_response.status_code, 403)

        login_response = self.client.post(
            self.login_url,
            {
                'email': 'ADA@example.com',
                'password': 'T7!a-secure-and-unique-passphrase',
            },
            format='json',
            **self.csrf_headers(),
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(self.client.get(self.me_url).data['user']['name'], 'Ada Lovelace')

        logout_response = self.client.post(
            self.logout_url,
            {},
            format='json',
            HTTP_X_CSRFTOKEN=login_response.data['csrfToken'],
        )
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(self.client.get(self.me_url).status_code, 403)

    def test_login_uses_generic_error_for_invalid_credentials(self):
        response = self.client.post(
            self.login_url,
            {'email': 'unknown@example.com', 'password': 'wrong-password'},
            format='json',
            **self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data['detail'], 'Invalid email or password.')

    def test_login_requires_csrf_token(self):
        response = self.client.post(
            self.login_url,
            {'email': 'ada@example.com', 'password': 'wrong-password'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
