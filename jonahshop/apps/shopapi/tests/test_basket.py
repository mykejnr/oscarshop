from unittest.mock import ANY, patch, MagicMock
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from oscar.core.loading import get_model
from oscar.apps.basket.models import Basket as OscarBasket, Line as OscarLine
from oscar.apps.catalogue.models import Product as OscarProduct
from oscar.apps.order.utils import OrderNumberGenerator
from oscar.apps.order.models import Order

from rest_framework.test import APITestCase
from rest_framework import status

from apps.shopapi.views import BasketViewSet
from apps.shipping.methods import NoDeliveryRequired
from apps.payapi.paymethods import PaymentMethods
from apps.core.token import simple_token

Basket: OscarBasket = get_model('basket', 'Basket')
Line: OscarLine = get_model('basket', 'Line')
Product: OscarProduct = get_model('catalogue', 'Product')


class BasketTestMixin:
    fixtures = ['fixture_all.json' ]

    @property
    def basket_viewset(self):
        view = BasketViewSet()
        view.basename = 'basket'
        view.request = None
        return view

    @property
    def add_product_url(self):
        view = self.basket_viewset
        return view.reverse_action(view.add_product.url_name)

    @property
    def get_basket_url(self):
        return self.basket_viewset.reverse_action('list')

    @property
    def checkout_url(self):
        view = self.basket_viewset
        return view.reverse_action(view.checkout.url_name)

    def retrieve_bakset_url(self, pk):
        return self.basket_viewset.reverse_action(
            'detail', args=[pk], request=None)

    def get_add_product_data(self, product=None):
        product = product or  Product.objects.first()

        return {
            'product_id': product.id,
            'quantity': 1,
        }

    def get_checkout_data(self, guest_email='mykejnr4@gmail.com'):
        data = {
            'payment_method': PaymentMethods().methods()[0].label,
            'shipping_method': NoDeliveryRequired().code,
            'guest_email': guest_email,
            'shipping_address': {
                'first_name': 'Michael',
                'last_name': 'Mensah',
                'line1': 'NT #9 Blk D, New Brosankro',
                'state': 'Ahafo',
                'country': 'GH',
                'title': 'Mr',
                'phone_number': '+233248352555',
                'notes': 'Brosankro new town. Adjescent methodist church'
            }
        }
        return data


class AddProductToBasketTestCase(BasketTestMixin, APITestCase):
    def test_add_product_to_basket(self):
        product = Product.objects.first()

        data = {
            'product_id': product.id,
            'quantity': 1,
        }
        response = self.client.post(self.add_product_url, data=data)

        line: OscarLine = Line.objects.get(pk=response.data['line']['id'])

        self.assertEqual(product.id, line.product.id)

    def test_add_product_basket_response_shape(self):
        """
        Test the shape of response returned by adding product
        to basket
        """
        prod_data = self.get_add_product_data()
        shape = get_add_product_response_shape()

        response = self.client.post(self.add_product_url, prod_data)
        data = response.json()

        #test line product data
        line_prod = data['line']['product']
        self.assertTupleEqual(
            tuple(shape['line']['product'].keys()),
            tuple(line_prod.keys())
        )
        self.assertTupleEqual(
            tuple(shape['line']['product'].values()),
            tuple(map(type, line_prod.values()))
        )

        shape['line']['product'] = dict
        # test line data
        line_data = data['line']
        self.assertTupleEqual(
            tuple(shape['line'].keys()),
            tuple(line_data.keys())
        )
        self.assertTupleEqual(
            tuple(shape['line'].values()),
            tuple(map(type, line_data.values()))
        )
        
        self.assertTrue(data['is_line_created'])
        
        shape['line'] = dict
        # test data shape
        self.assertTupleEqual(
            tuple(shape.keys()),
            tuple(data.keys())
        )
        self.assertTupleEqual(
            tuple(shape.values()),
            tuple(map(type, data.values()))
        )


    def test_update_basket_product_quantity(self):
        prod_data = self.get_add_product_data()

        # add product 
        self.client.post(self.add_product_url, prod_data)
        # update data
        response = self.client.post(
            self.add_product_url, prod_data, format='json'
        )
        data = response.data

        self.assertFalse(data['is_line_created'])
        self.assertEqual(data['line']['quantity'], 2)


class GetBasketTestCase(BasketTestMixin, APITestCase):
    def test_get_basket(self):
        """
        Test requsting for a basket and all of it lines
        """
        # add two seperate products to the basket
        prod_data = self.get_add_product_data()
        prod_data2 = self.get_add_product_data(Product.objects.last())

        self.client.post(self.add_product_url, prod_data)
        self.client.post(self.add_product_url, prod_data2)

        # get basket for the current session
        response = self.client.get(self.get_basket_url)
        data = response.json()
        shape = get_basket_response_shape()

        #test line product data
        line_prod = data['lines'][1]['product']
        shape_prod = shape['lines'][0]['product']
        self.assertTupleEqual(
            tuple(shape_prod.keys()),
            tuple(line_prod.keys())
        )
        self.assertTupleEqual(
            tuple(map(type, shape_prod.values())),
            tuple(map(type, line_prod.values()))
        )

        # test line data
        line_data = data['lines'][1]
        shape_line = data['lines'][0]
        self.assertTupleEqual(
            tuple(shape_line.keys()),
            tuple(line_data.keys())
        )
        self.assertTupleEqual(
            tuple(map(type, shape_line.values())),
            tuple(map(type, line_data.values()))
        )

        # test data (basket) shape
        self.assertTupleEqual(
            tuple(shape.keys()),
            tuple(data.keys())
        )
        self.assertTupleEqual(
            tuple(map(type, shape.values())),
            tuple(map(type, data.values()))
        )

    def test_basket_not_yet_created(self):
        """
        Test a request for (session) basket if none has been
        created yet
        """
        response = self.client.get(self.get_basket_url)
        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

    def test_unauth_user_request_specific_basket(self):
        """
        Test unauthenticated user attempt to request a specific
        bakset with a basket id
        """
        # Don't mind the primary key used here, as we expect the
        # request to be reject even before trying to hit the databse
        pk = 12334
        response = self.client.get(self.retrieve_bakset_url(pk))
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class CheckoutTestCase(BasketTestMixin, APITestCase):

    def setUp(self) -> None:
        self.p = patch('apps.shopapi.views.send_order_details')
        self.send_mail_mock = self.p.start()
        return super().setUp()

    def tearDown(self) -> None:
        self.p.stop()
        return super().tearDown()

    def test_create_order_on_checkout(self):
        # add 2 product to basket
        data1 = {'product_id': Product.objects.first().id, 'quantity': 1,}
        data2 = {'product_id': Product.objects.last().id, 'quantity': 1,}
        self.client.post(self.add_product_url, data=data1)
        response = self.client.post(self.add_product_url, data=data2)
        basket_id = response.json()['id']
        basket = OscarBasket.objects.get(pk=basket_id)

        data = self.get_checkout_data()
        response = self.client.post(self.checkout_url, data=data, format='json')

        self.assertTrue(response.status_code, status.HTTP_200_OK)

        res_data = response.json()
        res_order_num = res_data['number']
        gen_order_num = OrderNumberGenerator().order_number(basket)

        self.assertEqual(res_order_num, str(gen_order_num))

        order: Order = Order.objects.get(number=gen_order_num)
        self.assertEqual(order.num_items, 2)

    def test_return_errors_invalid_data(self):
        # add 1 product to basket
        data1 = {'product_id': Product.objects.first().id, 'quantity': 1,}
        self.client.post(self.add_product_url, data=data1)
        response = self.client.post(self.add_product_url, data=data1)

        data = self.get_checkout_data()
        data.pop('guest_email')
        response = self.client.post(self.checkout_url, data=data, format='json')
        res_data = response.json()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(
            res_data['guest_email'],
            ['Guest email is required for anonymous checkouts.']
        )

    @patch('apps.shopapi.views.send_order_details.delay')
    def test_sends_order_details_email(self, email_mock: MagicMock):
        data1 = {'product_id': Product.objects.first().id, 'quantity': 1,}
        self.client.post(self.add_product_url, data=data1)

        data = self.get_checkout_data()
        response = self.client.post(self.checkout_url, data=data, format='json')
        order = response.data
        order = Order.objects.get(pk=order['id'])
        uuid = urlsafe_base64_encode(force_bytes(order.email))
        token = simple_token.make_token(order.email)

        email_mock.assert_called_with(order.email, uuid, token, ANY)

    def test_include_for_details_anonymous_lookup(self):
        """
        Test view include 'uuid' and 'token' tobe used be used by
        anonymous user to lookup their order
        """
        data1 = {'product_id': Product.objects.first().id, 'quantity': 1,}
        self.client.post(self.add_product_url, data=data1)

        data = self.get_checkout_data()
        response = self.client.post(self.checkout_url, data=data, format='json')

        order_data = response.data
        order = Order.objects.get(pk=order_data['id'])
        uuid = urlsafe_base64_encode(force_bytes(order.email))
        token = simple_token.make_token(order.email)

        anon = order_data['anonymous']

        self.assertEqual(anon, {
            'uuid': uuid,
            'token': token
        })



def get_add_product_response_shape():
    return {
        'url': str,
        'id': int,
        'status': str,
        'total_price': float,
        'total_quantity': int,
        'is_line_created': bool,
        'line': {
            'id': int,
            'line_reference': str,
            'quantity': int,
            'product': {
                'url': str,
                'id': int,
                'title': str,
                'price': float,
                'image': str
            }
        }
    }

def get_basket_response_shape():
    return {
        'url': 'http://path/to/basket/api/',
        'id': 1,
        'status': "Open",
        'total_price': 233.32,
        'total_quantity': 4,
        'lines': [
            {
                'id': 3,
                'line_reference': 'referece-poduct-variance',
                'quantity': 2,
                'product': {
                    'url': 'http://path/to/product/details/',
                    'id': 2,
                    'title': 'Ladies wedding gown',
                    'price': 200.32,
                    'image': 'http:/path/to/image/',
                }
            },
            {
                'id': 3,
                'line_reference': 'referece-poduct-variance',
                'quantity': 2,
                'product': {
                    'url': 'http://path/to/product/details/',
                    'id': 3,
                    'title': 'Ladies wedding gown',
                    'price': 32.32,
                    'image': 'http:/path/to/image/',
                }
            }
        ]
    }