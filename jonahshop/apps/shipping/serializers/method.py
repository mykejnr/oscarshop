from rest_framework import serializers
from apps.shipping.methods import Base as Method
from oscar.core import prices


class ShippingMethodSerialzer(serializers.Serializer):
    code = serializers.CharField(max_length=128, required=True)
    name = serializers.CharField(max_length=128, required=True)
    description = serializers.CharField(max_length=128, required=True)
    price = serializers.SerializerMethodField()

    @property
    def request(self):
        return self.context['request']

    @property
    def basket(self):
        return self.request.basket

    def get_price(self, obj: Method):
        px: prices.Price = obj.calculate(self.basket)
        return px.excl_tax