from unittest.mock import patch, MagicMock
from django.test import TestCase

from userapi import tasks # Module with our thing to test
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

        class FakeUser:
            email = 'mykejnr4@gmail.com'

        class FakeRequest:
            user = FakeUser()
            def build_absolute_uri(self, p):
                return 'http://uuuu.com'

        request = FakeRequest()


        with patch('userapi.tasks.send_mail') as mail_mock, \
            patch('userapi.tasks.render_to_string') as render_mock:
            render_mock.return_value = email_string
            tasks.send_reset_email(request, uuid, token)

        render_mock.assert_called_with(
            'userapi/email_reset_password.html',
            {
                'token': token,
                'uuid64': uuid,
                'base_url': request.build_absolute_uri('/'),
                'reset_url': f'{request.build_absolute_uri("/")}/{uuid}/{token}'
            }
        )

        mail_mock.assert_called_with(
            recipients=[request.user.email],
            subject='Reset password',
            body_text=email_string,
            body_html=email_string,
        )
