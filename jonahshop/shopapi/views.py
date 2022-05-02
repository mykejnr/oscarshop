from oscar.core.loading import get_model
from oscar.apps.basket.models import Basket as OscarBasket, Line as OscarLine

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.reverse import reverse

from shopapi.serializers import (
    BasketSerializer,
    ProductSerializer,
    AddProductSerializer
)
# Create your views here.


Product = get_model('catalogue', 'Product')


class ProductViewSet(viewsets.ModelViewSet):
    # .browserble() and .base_query() do the following respectively...
    # ...Get parent products only, and apply select related and prefetch related
    # ... See oscar.core.catalogue.managers.ProductQuerySet
    queryset = Product.objects.browsable().base_queryset()
    serializer_class = ProductSerializer


class BasketViewSet(
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet):

    serializer_class = BasketSerializer

    def get_object(self):
        basket = self.context['request'].basket
        return basket

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def add_product(self, request):
        serializer = AddProductSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vd = serializer.validated_data
        product = Product.objects.get(pk=vd['product_id'])

        basket: OscarBasket = request.basket
        line, created = basket.add(product, vd['quantity'])

        basket_url = self.reverse_action('detail', args=[basket.id], request=request)

        return Response({
            'basket': basket_url,
            'total_price': basket.total_excl_tax,
            'total_quantity': basket.num_items,
            'line': {
                'id': line.id,
                'line_ref': line.line_reference,
                'created': created,
                'quantity': line.quantity,
                'product_id': line.product.id
            }
        })