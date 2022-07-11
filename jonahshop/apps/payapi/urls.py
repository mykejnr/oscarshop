from django.urls import path

from apps.payapi import views


urlpatterns = [
    path("methods/", views.payment_methods, name='payment_methods'),
]
