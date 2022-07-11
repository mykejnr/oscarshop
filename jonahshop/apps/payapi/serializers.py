from rest_framework import serializers


class PaymentMethodSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=128, required=True)
    name = serializers.CharField(max_length=128, required=True)
    description = serializers.CharField(max_length=128, required=True)
    icon = serializers.CharField(max_length=128, required=True)
