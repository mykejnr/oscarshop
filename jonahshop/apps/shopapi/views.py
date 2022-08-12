from collections import namedtuple
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

from oscar.core.loading import get_model, get_class
from oscar.apps.basket.models import Basket as OscarBasket
from oscar.apps.order.abstract_models import AbstractOrder

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from apps.shopapi.serializers import (
    BasketSerializer,
    ProductSerializer,
    AddProductSerializer,
    LineSerializer,
    CheckoutSerializer,
    OrderSerializer
)
from apps.core.token import simple_token
from apps.shopapi.tasks import send_order_details
from apps.shopapi.serializers.order import AnonymousOrderSerialer, OrderLineSerializer
from apps.shopapi.permissions import OrderViewPermission
# Create your views here.


Product = get_model('catalogue', 'Product')
Basket = get_model('basket', 'Basket')
Order = get_model('order', 'Order')
OrderPlacementMixin = get_class("checkout.mixins", "OrderPlacementMixin")


OrderCredentials = namedtuple('OrderCredentials', ['uuid', 'token'])

def generate_anonymous_order_credentials(order: AbstractOrder) -> OrderCredentials:
        uuid = urlsafe_base64_encode(force_bytes(order.number))
        token = simple_token.make_token(order.email)
        return OrderCredentials(uuid, token)


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
        ctx = {'request': request}
        cser = CheckoutSerializer(data=request.data, context=ctx)

        if not cser.is_valid():
            return Response(cser.errors, status=status.HTTP_400_BAD_REQUEST)

        order  = cser.save()
        oser = OrderSerializer(order, context=ctx)

        cred = generate_anonymous_order_credentials(order)

        base_url = request.build_absolute_uri('/order')
        send_order_details.delay(order.email, cred.uuid, cred.token, base_url) # celery task
        
        data = oser.data
        data['anonymous'] = {'uuid': cred.uuid, 'token': cred.token}

        return Response(data)


class OrderViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):

    permission_classes = [OrderViewPermission]
    serializer_class = OrderSerializer
    lookup_field = 'number'

    def get_queryset(self):
        qs = Order.objects.select_related('shipping_address')
        if self.action == 'list':
            # filter qs to only orders beloging to the current auth user
            qs = qs.filter(user=self.request.user)
        return  qs

    def retrieve(self, request, *args, **kwargs):
        return self.get_detail_response(self.get_object())

    @action(detail=False, methods=['post'])
    def anonymous(self, request):
        """
        Allows an unauthenticated user to request for an order, provided
        the request with the correct 'uuid' and 'token'
        The 'uuid' and 'token' was sent to the user's email during the 
        checkout stage.
        """
        aser = AnonymousOrderSerialer(data=request.data)
        if not aser.is_valid():
            return Response(aser.errors, status=status.HTTP_400_BAD_REQUEST)

        vd = aser.validated_data
        order_number = urlsafe_base64_decode(vd['uuid']).decode()

        try:
            order = self.get_queryset().get(number=order_number)
        except Order.DoesNotExist:
            msg = 'Order does not exist'
            return Response({'message': msg}, status=status.HTTP_404_NOT_FOUND)

        if not simple_token.check_token(order.email, vd['token']):
            msg = "Bad Token"
            return Response({'message': msg}, status=status.HTTP_403_FORBIDDEN)

        return self.get_detail_response(order)

    def get_detail_response(self, order: Order):
        """
        Return response for order detail view
        """
        ctx = {'request': self.request}
        # Retrieve lines associated with this order
        lines = order.lines.prefetch_related('product__images').all()
        order_data = OrderSerializer(order, context=ctx).data
        lines_data = OrderLineSerializer(lines, many=True, context=ctx).data
        order_data['lines'] = lines_data
        return Response(order_data)
        # self._lines = (
        #     self.lines
        #     .select_related('product', 'stockrecord')
        #     .prefetch_related(
        #         'attributes', 'product__images')
        #     .order_by(self._meta.pk.name))