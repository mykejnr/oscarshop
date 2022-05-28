from unittest.mock import patch, ANY

from django.contrib.auth import get_user_model, get_user, authenticate
from django.urls import reverse
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator

from rest_framework.test import APITestCase
from rest_framework import status

from userapi import views

User = get_user_model()

class SignupTestCase(APITestCase):

    def test_signup(self):
        data = {
            'first_name': "Michaelxxx",
            'last_name': "Mensahxxx",
            "email": "email@test.com",
            "password": "Password",
            "confirm_password": "Password",
        }
        self.client.post(reverse('signup'), data=data)

        self.assertEqual(
            User.objects.get(email=data['email']).last_name,
            data['last_name']
        )

    def test_error_on_wrong_2nd_password(self):
        data = {
            'first_name': "Michaelxxx",
            'last_name': "Mensahxxx",
            "email": "email@test.com",
            "password": "Password",
            "confirm_password": "Wrong_Password",
        }
        res = self.client.post(reverse('signup'), data=data)

        self.assertEqual(
            res.status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_log_user_in_on_signup(self):
        data = {
            'first_name': "James",
            'last_name': "Madison",
            "email": "email@test.com",
            "password": "Password",
            "confirm_password": "Password",
        }
        self.client.post(reverse('signup'), data=data)

        user = get_user(self.client)
        self.assertTrue(user.is_authenticated)

    def test_error_on_duplicate_email(self):
        data = {
            'first_name': "Michaelxxx",
            'last_name': "Mensahxxx",
            "email": "duplicate@test.com",
            "password": "Password",
            "confirm_password": "Password",
        }
        self.client.post(reverse('signup'), data=data)
        response = self.client.post(reverse('signup'), data=data)

        self.assertTrue(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertEqual(
            response.json()['email'][0],
            "This email address is used by another user."
        )

class LoginTestCase(APITestCase):

    def test_login(self):
        data = {
            'email': 'mykejnr@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        self.client.post(reverse('login'), data)

        user = get_user(self.client)
        self.assertTrue(user.is_authenticated)

    def test_return_401_login_failed(self):
        data = {
            'email': 'nonexistent@testmail.com',
            'password': "testPaswrord"
        }

        response = self.client.post(reverse('login'), data)

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_return_400_failed_data_validation(self):
        data = {
            'email': 'incorect_email',
            'password': "testPaswrord"
        }

        response = self.client.post(reverse('login'), data)

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )


class LogoutTestCase(APITestCase):

    def test_logout(self):
        data = {
            'email': 'mykejnr@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        # first login user 
        self.client.post(reverse('login'), data)
        user = get_user(self.client)

        self.assertTrue(user.is_authenticated)

        # logout
        self.client.post(reverse('logout'))

        user = get_user(self.client)
        self.assertFalse(user.is_authenticated)


class ResetPasswordTestCase(APITestCase):
    def test_invockes_function_to_send_email(self):
        data = {
            'email': 'toreset@testmail.com',
            'password': "testPaswrord"
        }
        uid = '13kiwdkSkdfkHel323Sd'
        token = '123488293003972003949920'
        user = User.objects.create_user(email=data['email'], password=data['password'])

        with patch("userapi.views.send_reset_email.delay") as email_mock, \
            patch("userapi.views.urlsafe_base64_encode") as encode_mock, \
            patch.object(views.default_token_generator, 'make_token') as token_mock:

            encode_mock.return_value = uid
            token_mock.return_value = token
            data.pop('password')
            self.client.post(reverse('reset_password'), data)

        encode_mock.assert_called_with(force_bytes(data['email']))
        token_mock.assert_called_with(user)

        # email_mock.assert_called_with(response.wsgi_request, uid, token)
        email_mock.assert_called_with(ANY, uid, token)

    @patch("userapi.views.send_reset_email")
    def test_return_404_email_dosent_exit(self, mock_meth):
        data = {'email': 'nonExistEmail@mike.com'}
        response = self.client.post(reverse('reset_password'), data)

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )

    @patch("userapi.views.send_reset_email")
    def test_return_400_wrong_post_data(self, mock_meth):
        data = {'unknownkey': 'mykejnr4@gmail.com'}
        response = self.client.post(reverse('reset_password'), data)

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )


class ConfirmResetTestCase(APITestCase):

    def test_resets_password(self):
        data = {
            'email': 'confirmreset@testmail.com',
            'password': "testPaswrord"
        }
        user = User.objects.create_user(email=data['email'], password=data['password'])
        uuid = urlsafe_base64_encode(force_bytes(data['email']))
        token = default_token_generator.make_token(user)

        with patch("userapi.views.send_reset_email"), \
            patch("userapi.views.urlsafe_base64_encode") as encode_mock, \
            patch.object(views.default_token_generator, 'make_token') as token_mock:
            # We need to use a real uuid and token so that it can
            # verified later
            encode_mock.return_value = uuid
            token_mock.return_value = token
            # THe url endpoint expect just an email
            data.pop('password')
            self.client.post(reverse('reset_password'), data)

        reset_data = {
            'password': 'jKo3UIEse35k_',
            'uuid': encode_mock.return_value,
            'token': token_mock.return_value
        }

        response = self.client.post(reverse('confirm_reset'), reset_data)
        user = get_user(self.client)
        # logs user out after reset
        self.assertFalse(user.is_authenticated)

        data['password'] = reset_data['password']
        response = self.client.post(reverse('login'), data)

        user = authenticate(
            response.request,
            email = data['email'],
            password = data['password']
        )

        self.assertIsNotNone(user)
        self.assertTrue(user.is_authenticated)

    def test_reject_wrong_uuid(self):
        data = {
            'email': 'confirmreset@testmail.com',
            'password': "testPaswrord"
        }
        user = User.objects.create_user(email=data['email'], password=data['password'])
        token = default_token_generator.make_token(user)

        reset_data = {
            'password': 'jKo3UIEse35k_',
            'uuid': urlsafe_base64_encode(force_bytes('fakeEmail@mail.com')),
            'token': token,
        }

        with patch("userapi.views.send_reset_email"), \
            patch.object(views.default_token_generator, 'make_token') as token_mock:
            token_mock.return_value = token

        response = self.client.post(reverse('confirm_reset'), reset_data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_reject_wrong_token(self):
        data = {
            'email': 'confirmreset@testmail.com',
            'password': "testPaswrord"
        }
        uuid = urlsafe_base64_encode(force_bytes(data['email']))

        reset_data = {
            'password': 'jKo3UIEse35k_',
            'uuid': uuid,
            'token': 'SomewRonGToken',
        }

        with patch("userapi.views.send_reset_email"), \
            patch("userapi.views.urlsafe_base64_encode") as encode_mock:
            encode_mock.return_value = uuid

        response = self.client.post(reverse('confirm_reset'), reset_data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class ChangePasswordTestCase(APITestCase):
    def test_changes_password(self):
        data = {
            'email': 'changepwd@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        self.client.post(reverse('login'), data)

        change_data = {
            'old_password': data['password'],
            'new_password': 'new-password',
            'confirm_password': 'new-password',
        }

        response = self.client.post(reverse('change_password'), change_data)

        user = authenticate(
            response.request,
            email = data['email'],
            password = change_data['new_password']
        )

        self.assertIsNotNone(user)
        self.assertTrue(user.is_authenticated)

    def test_reject_passwords_dont_match(self):
        data = {
            'email': 'unmatch@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        self.client.post(reverse('login'), data)

        change_data = {
            'old_password': data['password'],
            'new_password': 'new-password',
            'confirm_password': 'wrong-password',
        }

        response = self.client.post(reverse('change_password'), change_data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_rejects_invalid_data(self):
        data = {
            'email': 'unmatch@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        self.client.post(reverse('login'), data)

        change_data = {
            'password': data['password'], #invalid key
            'new_password': 'new-password',
            'confirm_password': 'new-password',
        }

        response = self.client.post(reverse('change_password'), change_data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_log_user_out_after_reset(self):
        data = {
            'email': 'logout@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])

        self.client.post(reverse('login'), data)

        change_data = {
            'old_password': data['password'], #invalid key
            'new_password': 'new-password',
            'confirm_password': 'new-password',
        }

        self.client.post(reverse('change_password'), change_data)

        user = get_user(self.client)
        self.assertFalse(user.is_authenticated)



class UpdateUserTestCase(APITestCase):
    def test_update(self):
        data = {
            'email': 'updateuser@testmail.com',
            'password': "testPaswrord"
        }
        User.objects.create_user(email=data['email'], password=data['password'])
        self.client.post(reverse('login'), data)

        update_data = {
            'first_name': "Michelle",
            'last_name': 'Jonathan'
        }

        self.client.post(reverse('update_user'), update_data)

        user: User = User.objects.get(email=data['email'])

        self.assertEqual(user.first_name, update_data['first_name'])
        self.assertEqual(user.last_name, update_data['last_name'])


class GetUserTestCase(APITestCase):
    def test_get_user(self):
        loginData = {
            'email': 'getUser@testmail.com',
            'password': "testGetUserPaswrord",
        }
        data = {
            'first_name': 'Jonathan',
            'last_name': 'Borris'
        }
        data.update(loginData)

        User.objects.create_user(**data)

        self.client.post(reverse('login'), loginData)
        response = self.client.get(reverse('getuser'))

        data.pop('password')
        self.assertDictEqual(
            response.json(), data
        )

    def test_reject_un_auth_user(self):
        # no user is logged in
        response = self.client.get(reverse('getuser'))
        self.assertEqual(
            status.HTTP_403_FORBIDDEN,
            response.status_code
        )