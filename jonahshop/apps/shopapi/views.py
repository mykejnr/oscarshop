from time import sleep
from oscar.core.loading import get_model, get_class
from oscar.apps.basket.models import Basket as OscarBasket, Line as OscarLine

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.shopapi.serializers import (
    BasketSerializer,
    ProductSerializer,
    AddProductSerializer,
    LineSerializer,
    CheckoutSerializer,
    OrderSerializer
)
# Create your views here.


Product = get_model('catalogue', 'Product')
Basket = get_model('basket', 'Basket')
Order = get_model('order', 'Order')
OrderPlacementMixin = get_class("checkout.mixins", "OrderPlacementMixin")


class ProductViewSet(viewsets.ModelViewSet):
    # .browserble() and .base_query() do the following respectively...
    # ...Get parent products only, and apply select related and prefetch related
    # ... See oscar.core.catalogue.managers.ProductQuerySet
    queryset = Product.objects.browsable().base_queryset()
    serializer_class = ProductSerializer


class BasketViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet):

    serializer_class = BasketSerializer

    def get_object(self):
        basket = self.context['request'].basket
        return basket

    def list(self, request):
        """
        Normally you would expect the 'list' action to respond with a
        list of baskets...
        But in this case, it seems normal to return the basket assocciated
        with the current session or auth user for the url

        http://example.com/api/basket/

        Therefore pointing to this url will return the basket associated 
        to the current session or auth user.

        NB: We haven't encountered a use case for getting a list of basket
        but if we do, we will provide a custom action and it's url for it
        """
        return self.retrieve(request)

    def retrieve(self, request, pk=None):
        """
        Get a basket with a list of lines asscocited with it
        """
        if pk is not None:
            # A client specilly requested for a specific basket
            if not request.user.is_authenticated:
                # annonimous user can not request for a specifit basket
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            basket: OscarBasket = Basket.objects.get(pk=pk)
            #TODO a Test auth user retreives someone elses basket
            if basket.owner != request.user:
                # You cannot request for someone else's basket
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        else:
            # Else use the basket associated with request,
            # (session or auth user's) basket
            basket: OscarBasket = request.basket

        if basket.id is None:
            # The session basket hasn't been created (commited) for the
            # user yet (aka. no lines attached)
            return Response(status=status.HTTP_204_NO_CONTENT)

        ctx = {'request': request}
        basket_ser = BasketSerializer(basket, context=ctx)
        line_ser = LineSerializer(
            basket.all_lines(), context=ctx, many=True)

        data = basket_ser.data
        data['lines'] = line_ser.data

        return Response(data)

    @action(detail=False, methods=['post'])
    def add_product(self, request):
        product_ser = AddProductSerializer(data=request.data)

        if not product_ser.is_valid():
            return Response(
                product_ser.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vd = product_ser.validated_data
        product = Product.objects.get(pk=vd['product_id'])

        basket: OscarBasket = request.basket
        line, created = basket.add(product, vd['quantity'])

        ctx = {'request': request}
        basket_ser = BasketSerializer(basket, context=ctx)
        line_ser = LineSerializer(line, context=ctx)

        data = basket_ser.data
        data['is_line_created'] = created
        data['line'] = line_ser.data

        return Response(data)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        sleep(5)
        ctx = {'request': request}
        cser = CheckoutSerializer(data=request.data, context=ctx)

        if not cser.is_valid():
            return Response(cser.errors, status=status.HTTP_400_BAD_REQUEST)

        oser = OrderSerializer(cser.save(), context=ctx)
        return Response(oser.data)


class OrderViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet):

    queryset = Order.objects