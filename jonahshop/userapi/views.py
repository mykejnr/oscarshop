from django.contrib.auth import get_user_model, login, authenticate, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from userapi.serializers import (
    ActivateEmailSerializer,
    ChangeEmailSerializer,
    ChangePasswordSerializer,
    ConfirmReseSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    SignupSerializer,
    UserSerializer
)

from userapi.tasks import send_reset_email, send_change_email_message
from userapi.token import ChangeEmailTokenGenerator


User = get_user_model()


def _login_user(request, user):
    login(request, user, 'django.contrib.auth.backends.ModelBackend')


@api_view(["POST"])
def signup(request):
    ctx = {'request': request}
    signup_ser = SignupSerializer(data=request.data, context=ctx)

    if not signup_ser.is_valid():
        return Response(
            signup_ser.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(**signup_ser.validated_data)
    _login_user(request, user)

    return Response(UserSerializer(user).data)


@api_view(['POST'])
def signin(request):
    login_ser = LoginSerializer(data=request.data)

    if not login_ser.is_valid():
        return Response(
            login_ser.errors, status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(
        request,
        email = login_ser.validated_data['email'],
        password = login_ser.validated_data['password']
    )

    if user is None:
        data = {'message': 'Login Failed. Incorrect email or passwrod.'}
        return Response(
            data, status=status.HTTP_401_UNAUTHORIZED
        )

    _login_user(request, user)
    return Response(UserSerializer(user).data)


@api_view(['POST'])
def reset_password(request):
    reset_ser = ResetPasswordSerializer(data=request.data)
    if not reset_ser.is_valid():
        return Response(reset_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    em = reset_ser.validated_data['email']
    try:
        user = User.objects.get(email=em)
    except User.DoesNotExist:
        return Response(
            {'message': f'No user with the email "{em}" exists'},
            status=status.HTTP_404_NOT_FOUND
        )

    uid = urlsafe_base64_encode(force_bytes(user.email))
    token = default_token_generator.make_token(user)

    base_url = request.build_absolute_uri('/reset-password')
    send_reset_email.delay(user.email, uid, token, base_url) # celery task

    msg = f"A message with a link to reset your password has been sent to {em}"
    return Response({'message': msg})


@api_view(['POST'])
def confirm_password_reset(request):
    c_ser = ConfirmReseSerializer(data=request.data, request=request)
    if not c_ser.is_valid():
        return Response(c_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    c_ser.user.set_password(c_ser.validated_data['password'])
    c_ser.user.save()

    return Response()


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def getuser(request):
    """
    Get the auth user for the current session
    """
    user_ser = UserSerializer(request.user)
    return Response(user_ser.data)


@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def signout(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    c_ser = ChangePasswordSerializer(data=request.data, request=request)
    if not c_ser.is_valid():
        return Response(c_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    user: User = request.user
    user.set_password(c_ser.validated_data['new_password'])
    user.save()

    return Response()


@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def update_user(request):
    u_ser = UserSerializer(request.user, data=request.data)

    if not u_ser.is_valid():
        return Response(u_ser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    u_ser.save()
    return Response(u_ser.data)


@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def change_email(request):
    c_ser = ChangeEmailSerializer(data=request.data, request=request)
    if not c_ser.is_valid():
        return Response(c_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    em = c_ser.validated_data['new_email']
    token_gen = ChangeEmailTokenGenerator(em)

    uid = urlsafe_base64_encode(force_bytes(em))
    token = token_gen.make_token(request.user)

    base_url = request.build_absolute_uri('/change-email')
    send_change_email_message.delay(em, uid, token, base_url) # celery task

    msg = f"A message with a link to confirm your new email has been sent to {em}."
    msg = f"{msg} Your old email address will remain unchanged until you confirm the new one."
    return Response({'message': msg})


@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def activate_email(request):
    a_ser = ActivateEmailSerializer(data=request.data, request=request)
    if not a_ser.is_valid():
        print(a_ser.errors)
        return Response(a_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    request.user.email = a_ser.validated_data['new_email']
    request.user.save()

    return Response()