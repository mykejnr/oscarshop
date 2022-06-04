from django.urls import path

from userapi import views

urlpatterns = [
    path("", views.getuser, name='getuser'),
    path("signup/", views.signup, name='signup'),
    path("login/", views.signin, name='login'),
    path("logout/", views.signout, name='logout'),
    path("reset_password/", views.reset_password, name='reset_password'),
    path("confirm_reset/", views.confirm_password_reset, name='confirm_reset'),
    path("change_password/", views.change_password, name='change_password'),
    path("update/", views.update_user, name='update_user'),
    path("change_email/", views.change_email, name='change_email'),
    path("activate_email/", views.activate_email, name='activate_email'),
]
