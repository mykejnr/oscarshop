from oscar.core.loading import get_model
from oscar.apps.partner.strategy import Selector
from oscar.core.thumbnails import get_thumbnailer

from rest_framework import serializers

from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes


class ProductSerializer(serializers.HyperlinkedModelSerializer):
    price = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def __init__(self, *args,  **kwargs):
        super().__init__(*args, **kwargs)
        self.strategy = Selector().strategy()

    class Meta:
        model = get_model('catalogue', 'Product')
        fields= [
            'url', 'id', 'title', 'rating', 'price', 'availability', 'is_parent', 'image',
        ]

    def get_purchase_info(self, obj):
        if obj.is_parent:
            return self.strategy.fetch_for_parent(product=obj)
        return self.strategy.fetch_for_product(product=obj)

    def get_price(self, obj) -> float:
        return self.get_purchase_info(obj).price.excl_tax

    def get_availability(self, obj) -> bool:
        return self.get_purchase_info(obj).availability.is_available_to_buy

    @extend_schema_field(OpenApiTypes.URI)
    def get_image(self, obj):
        source = obj.primary_image().original
        thumbnail = get_thumbnailer().generate_thumbnail(source, size="200x200")
        request = self.context.get('request')# request.build_absolute_uri()
        return request.build_absolute_uri(thumbnail.url)


class AddProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class BasketSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_model('basket', 'Basket')
        fields= [
            'id', 'owner', 'status',
        ]