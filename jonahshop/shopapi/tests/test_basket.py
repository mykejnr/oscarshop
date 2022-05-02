import decimal

from oscar.core.loading import get_model
from oscar.apps.basket.models import Basket as OscarBasket, Line as OscarLine
from oscar.apps.catalogue.models import Product as OscarProduct

from rest_framework.test import APITestCase

from shopapi.views import BasketViewSet

Basket: OscarBasket = get_model('basket', 'Basket')
Line: OscarLine = get_model('basket', 'Line')
Product: OscarProduct = get_model('catalogue', 'Product')

class ProductsTestCase(APITestCase):
    fixtures = ['fixture_all.json' ]

    @property
    def add_product_url(self):
        view = BasketViewSet()
        view.basename = 'basket'
        view.request = None
        return view.reverse_action(view.add_product.url_name)

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
        data = response.data

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
        
        self.assertTrue(data['line']['created'])
        
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
        response = self.client.post(self.add_product_url, prod_data)
        data = response.data

        self.assertFalse(data['line']['created'])
        self.assertEqual(data['line']['quantity'], 2)

    def get_add_product_data(self, product=None):
        product = product or  Product.objects.first()

        return {
            'product_id': product.id,
            'quantity': 1,
        }


def get_add_product_response_shape():
    return {
        'basket': str,
        'total_price': decimal.Decimal,
        'total_quantity': int,
        'line': {
            'id': int,
            'line_ref': str,
            'created': bool,
            'quantity': int,
            'product_id': int,
        }
    }

def get_basket_response_shape():
    return {
        'id': 1, # basket id
        'quantity': 4, # total quantity of items in basket
        'owner': 1, # id of owner (auth user or None if not loggend in)
        'status':  'Open|Merged|Saved|Frozen|Submitted',
        'lines': [
            {
                'quantity': 3,
                'product': {
                    'url': 'http://www.sdrer/sdf/',
                    'title': 'Mens Nice Footware',
                    'price': 344.34,
                    'image': 'http://image/url/'
                }
            },
            {
                'quantity': 3,
                'product': {
                    'url': 'http://www.sdrer/sdf/',
                    'title': 'Mens Nice Footware',
                    'price': 344.34,
                    'image': 'http://image/url/'
                }
            }
        ]
    }