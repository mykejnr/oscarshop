from oscar.core.loading import get_model

from rest_framework import viewsets

from shopapi.serializers import ProductSerializer
# Create your views here.


class ProductViewSet(viewsets.ModelViewSet):
    Product = get_model('catalogue', 'Product')
    # .browserble() and .base_query() do the following respectively...
    # ...Get parent products only, and apply select related and prefetch related
    # ... See oscar.core.catalogue.managers.ProductQuerySet
    queryset = Product.objects.browsable().base_queryset()
    serializer_class = ProductSerializer