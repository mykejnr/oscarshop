from unicodedata import name
from celery import shared_task
from django.template.loader import render_to_string

from apps.core.email import send_mail


@shared_task(name='userapi.send_reset_email')
def send_reset_email(email_address, uuid64, token, base_url):
    ctx = {
        'token': token,
        'uuid64': uuid64,
        'base_url': base_url,
        'reset_url': f'{base_url}/{uuid64}/{token}'
    }
    email_text = render_to_string('userapi/email_reset_password.txt', ctx)
    email_html = render_to_string('userapi/email_reset_password.html', ctx)

    send_mail(
        recipients=[email_address],
        subject="Reset password",
        body_text=email_text,
        body_html=email_html
    )


@shared_task(name='userapi.send_change_email_message')
def send_change_email_message(email_address, uuid64, token, base_url):
    ctx = {
        'token': token,
        'uuid64': uuid64,
        'base_url': base_url,
        'reset_url': f'{base_url}/{uuid64}/{token}'
    }
    email_text = render_to_string('userapi/change_email.txt', ctx)
    email_html = render_to_string('userapi/change_email.html', ctx)

    send_mail(
        recipients=[email_address],
        subject="Change email address",
        body_text=email_text,
        body_html=email_html
    )