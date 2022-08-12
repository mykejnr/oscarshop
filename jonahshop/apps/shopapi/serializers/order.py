from oscar.core.loading import get_model
from oscar.apps.order.abstract_models import AbstractLine
from rest_framework import serializers

from apps.core.mixins import ProductImageMixin
from apps.shipping.serializers.address import ShippingAddressSerializer


Order = get_model('order', 'Order')
OrderLine = get_model('order', 'Line')
ShippingAddress = get_model("order", "ShippingAddress")
BillingAddress = get_model("order", "BillingAddress")


class OrderLineSerializer(serializers.ModelSerializer, ProductImageMixin):
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderLine
        fields = [
            'id',
            'title',
            'quantity',
            # unit prices
            'unit_price_incl_tax',
            'unit_price_excl_tax',
            # calculated prices (i.e unit px * quantity)
            'line_price_incl_tax',
            'line_price_excl_tax',
            # Price information before discounts are applied
            'line_price_before_discounts_incl_tax',
            'line_price_before_discounts_excl_tax',
            'image',
        ]

    @property
    def request(self):
        return self.context.get('request')

    def get_image(self, order_line: AbstractLine):
        # we that the caller of this serialzier retreived the insance (order_line)
        # together with the product and product images.
        # ie. the caller is expected to do OrderLine.prefetch_related(product__images)
        # This method will not be responsible for additional database hits is the stated
        # assumptions was not followed by the caller
        return self.get_primary_image(order_line.product)


class OrderSerializer(serializers.ModelSerializer):

    shipping_address = ShippingAddressSerializer()

    class Meta:
        model = Order
        fields= [
            'id',
            'number',
            'user',
            'currency',
            'total_incl_tax',
            'total_excl_tax',
            'shipping_incl_tax', 
            'shipping_excl_tax', 
            'shipping_method',
            'shipping_code',
            'status',
            'guest_email',
            'date_placed',
            'shipping_address'
        ]


class AnonymousOrderSerialer(serializers.Serializer):

    uuid = serializers.CharField(required=True, max_length=100)
    token = serializers.CharField(required=True, max_length=100)