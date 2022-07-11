from django.urls import re_path

from apps.payapi import consumers

# why not 'ws/' prefix instead of 'wbs/'? setupProxy.js in
# react development messes up when 'ws' is use instead of
# 'wbx`
websocket_urlpatterns = [
    re_path(r'wbs/pay/$', consumers.PaymentConsumer.as_asgi()),
]