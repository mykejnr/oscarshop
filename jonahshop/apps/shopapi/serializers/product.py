from oscar.core.loading import get_model, get_class
from rest_framework import serializers

from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from apps.core.mixins import ProductImageMixin


Selector = get_class('partner.strategy', 'Selector')
Product = get_model('catalogue', 'Product')


class ProductSerializer(serializers.HyperlinkedModelSerializer, ProductImageMixin):
    price = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def __init__(self, *args,  **kwargs):
        super().__init__(*args, **kwargs)
        self.strategy = Selector().strategy()

    class Meta:
        model = Product
        fields= [
            'url', 'id', 'title', 'rating', 'price', 'availability', 'is_parent', 'image',
        ]

    @property
    def request(self):
        return self.context.get('request')

    def get_purchase_info(self, obj):
        if obj.is_parent:
            return self.strategy.fetch_for_parent(product=obj)
        return self.strategy.fetch_for_product(product=obj)

    def get_price(self, obj) -> float:
        return self.get_purchase_info(obj).price.excl_tax

    def get_availability(self, obj) -> bool:
        return self.get_purchase_info(obj).availability.is_available_to_buy

    @extend_schema_field(OpenApiTypes.URI)
    def get_image(self, obj: Product):
        return self.get_primary_image(obj)
