from oscar.core.loading import get_model

from rest_framework import serializers


Order = get_model('order', 'Order')
ShippingAddress = get_model("order", "ShippingAddress")
BillingAddress = get_model("order", "BillingAddress")

class OrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields= [
            'id',
            'url',
            'number',
            'basket',
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
        ]