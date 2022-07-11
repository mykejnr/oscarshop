from django.urls import reverse
from rest_framework.test import APITestCase
from oscar.apps.catalogue.models import Product as OscarProduct
from oscar.apps.basket.models import Basket as OscarBasket
from oscar.core.loading import get_model

from apps.shipping.repository import Repository
from apps.shopapi.views import BasketViewSet



Product: OscarProduct = get_model('catalogue', 'Product')
Basket: OscarBasket = get_model('basket', 'Basket')


class ShippingMethodsTestCase(APITestCase):
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
    def url(self):
        return reverse('shipping_methods')

    def add_to_basket(self):
        product = Product.objects.first()

        data = {
            'product_id': product.id,
            'quantity': 1,
        }
        self.client.post(self.add_product_url, data=data)

    @property
    def basket(self):
        basket = OscarBasket.objects.first()
        return basket

    @property
    def methods(self):
        # NOTE: were passing in any abitrary basket because, instead
        # of the session basket. Because we cannot get access to the
        # session basket here. This is not a problem, because for now
        # get_shipping_methods() does not depend on the basket to
        # determin the available shipping methods
        return Repository().get_shipping_methods(self.basket)

    def test_returns_list_of_methods(self):
        self.add_to_basket()
        shape = {
            'code': '',
            'name': '',
            'description': '',
            'price': ''
        }
        response = self.client.post(self.url)
        data = response.data

        # NOTE: were passing in any abitrary basket because, instead
        # of the session basket. Because we cannot get access to the
        # session basket here.
        self.assertEqual(len(self.methods), len(data))
        self.assertTrue(data[0].keys(), shape.keys()) 
