from oscar.apps.shipping.methods import Base
from decimal import Decimal as D
from oscar.core import prices

from django.utils.translation import gettext_lazy as _


class HomeDelivery(Base):
    code = 'home-delivery'
    name = _('Home Delivery')
    description = ('Item delivered to your premises, (home or office)')

    def calculate(self, basket):
        return prices.Price(
            currency=basket.currency,
            excl_tax=D('20.00'), tax=D('0.00'))


class PayOnDelivery(Base):
    code = 'pay-on-delivery'
    name = _('Pay on Delivery')
    description = _('Pay delivery fees on delivery')

    def calculate(self, basket):
        return prices.Price(
            currency=basket.currency,
            excl_tax=D('00.00'), tax=D('0.00'))


class NoDeliveryRequired(Base):
    code = 'no-delivery-required'
    name = _('No Delivery Required')
    description = _('Items in this basket requires no delivery')

    def calculate(self, basket):
        return prices.Price(
            currency=basket.currency,
            excl_tax=D('00.00'), tax=D('0.00'))