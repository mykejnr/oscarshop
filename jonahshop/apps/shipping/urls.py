from django.urls import path

from apps.shipping import views


urlpatterns = [
    path("methods/", views.shipping_methods, name='shipping_methods'),
]
