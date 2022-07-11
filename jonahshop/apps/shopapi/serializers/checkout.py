from django.conf import settings
from django.utils.translation import gettext as _

from oscar.core.loading import get_model, get_class
from oscar.core import prices
from oscar.apps.checkout.mixins import OrderPlacementMixin as OscarOrderPlacementMixin
from oscar.apps.basket.abstract_models import AbstractBasket
from oscar.apps.shipping.methods import Base as ShippingMethod
from oscar.apps.payment.models import SourceType, Source

from rest_framework import serializers

from apps.shipping.methods import NoDeliveryRequired
from apps.shipping.repository import Repository
from apps.payapi.paymethods import PaymentMethods


Order = get_model('order', 'Order')
Basket: AbstractBasket = get_model('basket', 'Basket')
ShippingAddress = get_model("order", "ShippingAddress")
BillingAddress = get_model("order", "BillingAddress")

OrderPlacementMixin: OscarOrderPlacementMixin = get_class("checkout.mixins", "OrderPlacementMixin")
OrderTotalCalculator = get_class("checkout.calculators", "OrderTotalCalculator")


class PriceSerializer(serializers.Serializer):
    currency = serializers.CharField(
        max_length=12, default=settings.OSCAR_DEFAULT_CURRENCY, required=False
    )
    excl_tax = serializers.DecimalField(decimal_places=2, max_digits=12, required=True)
    incl_tax = serializers.DecimalField(decimal_places=2, max_digits=12, required=False)
    tax = serializers.DecimalField(decimal_places=2, max_digits=12, required=False)


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = "__all__"


class BillingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = "__all__"


class CheckoutSerializer(serializers.Serializer, OrderPlacementMixin):

    shipping_address = ShippingAddressSerializer(many=False, required=True)
    guest_email = serializers.EmailField(allow_blank=True, required=False)
    shipping_method = serializers.CharField(max_length=128, required=True) # code for shipping method
    payment_method = serializers.CharField(max_length=128, required=True)

    _shipping_method: ShippingMethod = NoDeliveryRequired()
    repository = Repository()

    @property
    def request(self):
        return self.context["request"]

    @property
    def basket(self) -> AbstractBasket:
        return self.request.basket

    def validate_shipping_method(self, value):
        self._shipping_method = self.repository.get_shipping_method(value, self.basket)
        if self._shipping_method is None:
            raise serializers.ValidationError(_('Shipping method is not applicable.'))
        return value

    def validate_payment_method(self, value):
        if not PaymentMethods().get(value):
            raise serializers.ValidationError(_('Invalid payment method.'))
        return value

    def validate(self, attrs):
        if not self.request.user.is_authenticated:
            if not attrs.get('guest_email', ''):
                message = _("Guest email is required for anonymous checkouts.")
                raise serializers.ValidationError({'guest_email': message})
        else:
            attrs['guest_email'] = '' # if user is authenticated, remove guest email
        # check for empty basket
        if self.basket.num_items <= 0:
            message = _("Cannot checkout an empty basket")
            raise serializers.ValidationError(message)
        return attrs

    def handle_payment(self, order_number: int, total: prices.Price, **kwargs):
        # Overriden method of OrderPlacementMixin
        payment_method = self.validated_data.get('payment_method')
        source_type, created = SourceType.objects.get_or_create(name=payment_method)
        source = Source(source_type=source_type, amount_allocated=total.incl_tax)
        self.add_payment_source(source)

    def create(self, validated_data):
        order_number = self.generate_order_number(self.basket)
        shipping_charge = self._shipping_method.calculate(self.basket) if self._shipping_method else None
        total: prices.Price = OrderTotalCalculator().calculate(self.basket, shipping_charge)

        vd = validated_data

        sa = vd.get('shipping_address', None)
        shipping_address = ShippingAddress(**vd['shipping_address']) if sa else None
        self.handle_payment(order_number, total)

        # TODO add initial order status
        order = self.place_order(
            order_number=order_number,
            user=self.request.user,
            basket=self.basket,
            shipping_address=shipping_address,
            shipping_method=self._shipping_method,
            shipping_charge=shipping_charge,
            order_total=total,
            guest_email=vd.get("guest_email", ""),
        )
        self.basket.submit()
        return order