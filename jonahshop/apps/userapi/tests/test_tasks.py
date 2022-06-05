from unittest.mock import patch
from django.test import TestCase

from apps.userapi import tasks # Module with our thing to test
# from app import decorators  # Module with the decorator we need to replace
import imp  # Library to help us reload our UUT module


class SendResetEmail(TestCase):
    def setUp(self):
        # Do cleanup first so it is ready if an exception is raised
        def kill_patches():  # Create a cleanup callback that undoes our patches
            patch.stopall()  # Stops all patches started with start()
            imp.reload(tasks)  # Reload our UUT module which restores the original decorator

        self.addCleanup(kill_patches)  # We want to make sure this is run so we do this in addCleanup instead of tearDown

        patch('celery.shared_task', lambda *x, **y: lambda f: f).start()  # The lambda makes our decorator into a pass-thru. Also, don't forget to call start()          

        imp.reload(tasks)

    def test_calls_send_mail(self):
        email_string = "Email message"
        uuid = 'wwexkwERE38idw0skdi'
        token = 'SERSdieX800lXwere'

        base_url = 'http://test.com'
        email = 'mykejnr4@gmail.com'

        with patch('apps.userapi.tasks.send_mail') as mail_mock, \
            patch('apps.userapi.tasks.render_to_string') as render_mock:
            render_mock.return_value = email_string
            tasks.send_reset_email(
                email, uuid, token, base_url)

        render_mock.assert_called_with(
            'userapi/email_reset_password.html',
            {
                'token': token,
                'uuid64': uuid,
                'base_url': base_url,
                'reset_url': f'{base_url}/{uuid}/{token}'
            }
        )

        mail_mock.assert_called_with(
            recipients=[email],
            subject='Reset password',
            body_text=email_string,
            body_html=email_string,
        )


class SendChangeEmailTestCase(TestCase):
    def setUp(self):
        # Do cleanup first so it is ready if an exception is raised
        def kill_patches():  # Create a cleanup callback that undoes our patches
            patch.stopall()  # Stops all patches started with start()
            imp.reload(tasks)  # Reload our UUT module which restores the original decorator

        self.addCleanup(kill_patches)  # We want to make sure this is run so we do this in addCleanup instead of tearDown

        patch('celery.shared_task', lambda *x, **y: lambda f: f).start()  # The lambda makes our decorator into a pass-thru. Also, don't forget to call start()          

        imp.reload(tasks)

    def test_calls_send_mail(self):
        email_string = "Email message"
        uuid = 'wwexkwERE38idw0skdi'
        token = 'SERSdieX800lXwere'

        base_url = 'http://test.com'
        email = 'mykejnr4@gmail.com'

        with patch('apps.userapi.tasks.send_mail') as mail_mock, \
            patch('apps.userapi.tasks.render_to_string') as render_mock:
            render_mock.return_value = email_string
            tasks.send_change_email_message(
                email, uuid, token, base_url
            )

        render_mock.assert_called_with(
            'userapi/change_email.html',
            {
                'token': token,
                'uuid64': uuid,
                'base_url': base_url,
                'reset_url': f'{base_url}/{uuid}/{token}'
            }
        )

        mail_mock.assert_called_with(
            recipients=[email],
            subject='Change email address',
            body_text=email_string,
            body_html=email_string,
        )