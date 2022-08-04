from unittest.mock import patch

from oscar.core.loading import get_model, get_class
from oscar.apps.catalogue.models import Product as OscarProduct
from oscar.apps.basket.models import Basket as OscarBasket
from oscar.apps.order.abstract_models import AbstractOrder

from rest_framework.test import APITestCase, APIRequestFactory

from apps.shopapi.serializers.checkout import CheckoutSerializer
from apps.shipping.methods import NoDeliveryRequired
from apps.userapi.models import User
from apps.payapi.paymethods import PaymentMethods


Product: OscarProduct = get_model('catalogue', 'Product')
Selector = get_class('partner.strategy', 'Selector')

class CheckoutSerializerTestCase(APITestCase):
    fixtures = ['fixture_all.json' ]
    basket = None
    request = None

    @classmethod
    def setUpClass(cls) -> None:
        patch.object(User, 'is_authenticated', True).start()
        # cls.userAuthMock = cls.p.start()
        return super().setUpClass()

    @classmethod
    def tearDownClass(cls) -> None:
        patch.stopall()
        return super().tearDownClass()

    def setUp(self) -> None:
        self.basket = OscarBasket.objects.first()
        self.basket.strategy = Selector().strategy()
        self.request = APIRequestFactory()
        self.request.basket = self.basket


        user = User.objects.first()
        self.request.user = user
        return super().setUp()

    def get_data(self, guest_email='mykejnr4@gmail.com'):
        data = {
            'payment_method': PaymentMethods().methods()[0].label,
            'shipping_method': NoDeliveryRequired().code,
            'guest_email': guest_email,
            'shipping_address': {
                'first_name': 'Michael',
                'last_name': 'Mensah',
                'line1': 'NT #9 Blk D, New Brosankro',
                'line4': 'Bechem',
                'state': 'Ahafo',
                'country': 'GH',
                'title': 'Mr',
                'phone_number': '+233248352555',
                'notes': 'Brosankro new town. Adjescent methodist church'
            }
        }
        return data

    def test_creates_order(self):
        data = self.get_data()

        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        order = cser.save()
        self.assertIsInstance(order, AbstractOrder)

    def test_create_order_with_shipping_address(self):
        data = self.get_data()

        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        order = cser.save()
        self.assertEqual(
            order.shipping_address.line1,
            data['shipping_address']['line1']
        )

    def test_wrong_shipping_method(self):
        data = {
            'shipping_method': 'wrong-shipping-method-code',
        }

        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        self.assertEqual(
            cser.errors['shipping_method'][0],
            'Shipping method is not applicable.'
        )

    def test_delete_guest_email_if_user_is_authenticated(self):
        data = self.get_data()

        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        self.assertEqual(cser.validated_data['guest_email'], '')

    def test_require_guest_email_for_anonymous_user(self):
        data = self.get_data()
        data.pop('guest_email')

        # self.userAuthMock.return_value = False
        with patch.object(User, 'is_authenticated', False):
            cser = CheckoutSerializer(data=data, context={'request': self.request})
            cser.is_valid()

        self.assertEqual(
            cser.errors['guest_email'][0],
            'Guest email is required for anonymous checkouts.'
        )

    def test_create_order_with_auth_user(self):
        data = self.get_data()

        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        order = cser.save()
        self.assertEqual(order.user, self.request.user)

    def test_submits_basket_after_order_placement(self):
        data = self.get_data()
        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()
        cser.save()

        self.assertEqual(self.basket.status, OscarBasket.SUBMITTED)

    def test_invalid_payment_method(self):
        data = self.get_data()
        data['payment_method'] = 'InvalidMethod'
        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()

        self.assertEqual(
            str(cser.errors['payment_method'][0]), 'Invalid payment method.'
        )

    def test_create_payment_source(self):
        data = self.get_data()
        cser = CheckoutSerializer(data=data, context={'request': self.request})
        cser.is_valid()
        order = cser.save()

        self.assertEqual(
            data['payment_method'],
            order.sources.first().source_type.name
        )
        # test allocated amount
        self.assertEqual(
            order.total_incl_tax,
            order.sources.first().amount_allocated
        )