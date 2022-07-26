from celery import shared_task
from django.template.loader import render_to_string

from apps.core.email import send_mail


@shared_task(name='shopapi.send_order_details')
def send_order_details(email_address, uuid64, token, base_url):
    ctx = {
        'token': token,
        'uuid64': uuid64,
        'base_url': base_url,
        'order_url': f'{base_url}/{uuid64}/{token}'
    }
    email_text = render_to_string('shopapi/order_details.txt', ctx)
    email_html = render_to_string('shopapi/order_details.html', ctx)

    send_mail(
        recipients=[email_address],
        subject='Order #{InsertOrderNumber}',
        body_text=email_text,
        body_html=email_html
    )