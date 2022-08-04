from rest_framework import serializers
from oscar.core.loading import get_model


ShippingAddress = get_model("order", "ShippingAddress")


valDict = {'required': True, 'allow_blank': False}
class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            'first_name', 'last_name', 'phone_number', 'state',
            'line4', 'line1', 'country', 'postcode', 'notes'
        ]
        extra_kwargs = {
            'first_name': valDict,
            'last_name': valDict,
            'phone_number': valDict,
            'state': valDict,
            'line4': valDict,
            'line1': valDict,
        }
