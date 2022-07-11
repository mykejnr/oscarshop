from oscar.core.loading import get_model, get_class

from rest_framework.response import Response
from rest_framework.decorators import api_view

from apps.payapi.serializers import PaymentMethodSerializer
from apps.payapi.paymethods import PaymentMethods
from apps.payapi.momo import Momo


Order = get_model('order', 'Order')


@api_view(['POST'])
def payment_methods(request):
    ctx = {'request': request}
    paymethods = PaymentMethods().methods()
    pser = PaymentMethodSerializer(paymethods, many=True, context=ctx)
    return Response(pser.data)