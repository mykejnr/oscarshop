from django.test import tag, TestCase
from django.core import mail

from apps.core.email import send_mail
# from ..email import send_mail, send_client_message
# from ..models import ClientMessage


@tag('send_mail')
class SendMailTestCase(TestCase):
    
    def test_sends_email(self):
        mail.outbox.clear()

        message = "My email message"
        send_mail(
            ['myke@examplemail.com'],
            "Email subject",
            message
        )

        self.assertEqual(
            mail.outbox[0].body,
            message
        )

    def test_sends_with_correct_sender(self):
        mail.outbox.clear()

        sender = "mykejnr@gmail.com"
        send_mail(
            ['myke@examplemail.com'],
            "Email subject",
            "Body of message",
            sender=sender
        )

        self.assertEqual(
            mail.outbox[0].from_email,
            sender
        )

    def test_sends_with_correct_recipients(self):
        mail.outbox.clear()

        recps = ["mykejnr@gggmail.com", 'mames@somemail.com']

        send_mail(
            recps,
            "Email subject",
            "Body of message"
        )

        self.assertEqual(
            mail.outbox[0].recipients(),
            recps
        )

    def test_sends_with_html_version(self):
        mail.outbox.clear()

        recps = ["mykejnr@gggmail.com", 'mames@somemail.com']
        html = "<html>message</html>"

        send_mail(
            recps,
            "Email subject",
            "Body of message",
            html
        )

        regex = 'Content-Type: text/html; charset="utf-8"'
        self.assertRegex(str(mail.outbox[0].message()), regex)



# @tag('send_client_message')
# class SendClientMessageTestCase(StaticFilesTestCase):

#     def test_calls_send_mail(self):
#         receipient = "admin@adminmail.com"
#         args = {
#             'name': 'Michael Mensah',
#             'email': 'michael@mensah.com',
#             'subject': "Michael's Email Message",
#             'message': 'Message Bodh'
#         }
#         msg: ClientMessage = ClientMessage.objects.create(**args)

#         with patch('appwide.core.email.send_mail') as mail_mock:
#             send_client_message(msg.id, receipient)

#         mail_mock.assert_called_with(
#             [receipient],
#             msg.subject,
#             msg.message,
#             sender=f'{msg.name} <{msg.email}>'
#         )