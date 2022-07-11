from oscar.apps.shipping.methods import Base as OscarBase
from decimal import Decimal as D
from oscar.core import prices

from django.utils.translation import gettext_lazy as _


class Base(OscarBase):
    def get_description(self, basket):
        return self.description


class DeliveryOnly(Base):
    code = 'delivery-only-fees'
    name = _('Delivery Fees Only (Free Shipping)')
    description = _('Pay only delivery fees for this order. No shipping fees required.')

    def calculate(self, basket):
        return prices.Price(
            currency=basket.currency,
            excl_tax=D('00.00'), tax=D('0.00'))


class PayOnDeliveryOnly(Base):
    code = 'pay-on-delivery-only-fees'
    name = _('Pay on Delivery (Free Shipping Required)')
    description = _('Pay delivery fees when items are delivered to you. No shipping fees required.')

    def calculate(self, basket) -> prices.Price:
        return prices.Price(
            currency=basket.currency,
            excl_tax=D('00.00'), tax=D('0.00'))


class PayOnDelivery(Base):
    code = 'pay-on-delivery'
    name = _('Pay on Delivery')
    description = _('Pay delivery fees on when items are delivered.')

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