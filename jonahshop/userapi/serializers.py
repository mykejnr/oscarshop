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
    uuid = serializers.CharField(required=True, max_length=100)
    token = serializers.CharField(required=True, max_length=100)
    password = serializers.CharField(required=True, max_length=100)


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

    def validate_confirm_password(self, value):
        if value != self.initial_data['new_password']:
            raise serializers.ValidationError("Passwords do no match")
        return value