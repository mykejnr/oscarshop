from decimal import Decimal
from oscar.core.loading import get_model

from rest_framework import serializers

from .product import ProductSerializer


class AddProductSerializer(serializers.Serializer):
    """
    Serializer purposely for validating data sent in from
    the client side to add product to basket
    """
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class BasketProductSerializer(ProductSerializer):
    """
    We are overiding 'ProductSerializer' to remove some fields
    """
    class Meta:
        model = get_model('catalogue', 'Product')
        fields= [
            'url', 'id', 'title', 'price', 'image',
        ]


class LineSerializer(serializers.ModelSerializer):
    product = BasketProductSerializer()

    class Meta:
        model = get_model("basket", "Line")
        fields = [
            'id', 'line_reference', 'quantity', 'product'
        ]


class BasketSerializer(serializers.HyperlinkedModelSerializer):
    total_price = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()

    class Meta:
        model = get_model('basket', 'Basket')
        fields= [
            'url', 'id', 'status', 'total_price', 'total_quantity'
        ]

    def get_total_price(self, obj) -> Decimal:
        return obj.total_excl_tax

    def get_total_quantity(self, obj) -> int:
        return  obj.num_items