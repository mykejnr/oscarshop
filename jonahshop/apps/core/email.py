from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings

# from .models import ClientMessage

def _get_conn(username=None, password=None):
    """Get email connection using auth paramethers"""
    return get_connection(
        username=username or settings.DEFAULT_FROM_EMAIL,
        password=password or settings.EMAIL_HOST_PASSWORD,
    )


def send_mail(
    recipients: list, subject, body_text,
    body_html = None, sender: str = settings.DEFAULT_FROM_EMAIL,
    connection=None
    ):
    """
    Sends email message to a given list of receipients

    :param recipients: A list of email addresses
    :param subject: Subject of email
    :param body_text: Text verson of the email message
    :param body_email: (Optional) Email verson of the email message
    :param sender: Email address of sender, defaults to django settings.DEFAULT_FROM_EMAIL
    :param connection: Django email connection object, if a diffrent ``sender`` is given, then
        a connection object initialized with the crendentials of the given `sender` must be provided
    
    :return: ``None``
    """
    alts = [(body_html, "text/html")] if body_html else []

    email_message = EmailMultiAlternatives(
        subject,
        body_text,
        sender,
        recipients,
        connection=connection or _get_conn(),
        alternatives=alts
    )

    email_message.send()


# def send_client_message(message_id, receipient=None):
#     """
#     Foward an email message sent by a client from within the
#     public website to the admins email inbox. This function is normally
#     expected to be called by a background task runner

#     See more at :doc:`../modules/client-email`

#     :param message_id: Value of the primary key (id) field to retrieve a ``ClientMessage`` Object
#     :param receipient: an email address of an admin. **Note:** that this is required. The optional
#         argument ``None`` is there to project the function signature (from breaking other code)

#     :return: ``None``
#     """
#     # if receipient is none, email for site admins has not
#     # been set in the admin interface. so there is no email
#     # address to foward this message to
#     if not receipient:
#         return

#     message = ClientMessage.objects.get(pk=message_id)

#     send_mail(
#         [receipient],
#         message.subject,
#         message.message,
#         sender=f'{message.name} <{message.email}>'
#     )