from rest_framework.response import Response
from rest_framework.decorators import api_view
from apps.shipping.repository import Repository
from apps.shipping.serializers.method import ShippingMethodSerialzer


repository = Repository()


@api_view(['POST'])
def shipping_methods(request):
    ctx = {'request': request}
    methods = repository.get_shipping_methods(request.basket)
    mser = ShippingMethodSerialzer(methods, many=True, context=ctx)
    return Response(mser.data)