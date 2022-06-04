from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializes auth User model
    """
    class Meta:
        model = User
        fields= [
            'email',
            'first_name',
            'last_name',
        ]
        read_only_fields = ['email']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, max_length=100)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ConfirmReseSerializer(serializers.Serializer):
    def __init__(self, instance=None, data=..., **kwargs):
        self.request = kwargs.pop('request')
        self.user = None
        super().__init__(instance, data, **kwargs)

    uuid = serializers.CharField(required=True, max_length=100)
    token = serializers.CharField(required=True, max_length=100)
    password = serializers.CharField(required=True, max_length=100)

    def validate_uuid(self, value):

        try:
            email = urlsafe_base64_decode(value).decode()
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Incorrect uuid")
        except:
            raise serializers.ValidationError("Bad uuid")

        return value
        
    def validate_token(self, value):
        if not default_token_generator.check_token(self.user, value):
            msg = "Token is incorrect, has already been used, or has expired."
            raise serializers.ValidationError(msg)
        return value


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            User.objects.all(),
            message="This email address is used by another user."
        )]
    )
    password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_confirm_password(self, value):
        if value != self.initial_data['password']:
            raise serializers.ValidationError("Passwords do no match")
        return value

    @property
    def validated_data(self):
        vd = super().validated_data
        vd.pop("confirm_password")
        return vd


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, max_length=100)
    new_password = serializers.CharField(required=True, max_length=100)
    confirm_password = serializers.CharField(required=True, max_length=100)

    def __init__(self, instance=None, data=..., **kwargs):
        self.request = kwargs.pop('request')
        self.user: User = self.request.user
        super().__init__(instance, data, **kwargs)

    def validate_old_password(self, value):
        if self.user.check_password(self.initial_data['old_password']):
            return value
        raise serializers.ValidationError("Password incorrect.")

    def validate_confirm_password(self, value):
        if value != self.initial_data['new_password']:
            raise serializers.ValidationError("Passwords do no match")
        return value