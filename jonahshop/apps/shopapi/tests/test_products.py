from django.urls import reverse
from oscar.core.loading import get_model
from rest_framework.test import APITestCase


class ProductsTestCase(APITestCase):
    fixtures = ['fixture_all.json' ]

    @property
    def product_class(self):
        return get_model('catalogue', 'Product')

    def test_get_product_listing(self):
        products = self.product_class.objects.browsable()

        response = self.client.get(reverse('product-list'))
        self.assertEqual(len(response.data['results']), len(products))

    def test_product_listing_fields(self):
        fields = ('url', 'id', 'title', 'rating', 'price', 'availability', 'is_parent', 'image')
        response = self.client.get(reverse('product-list'))
        self.assertTupleEqual(
            fields,
            tuple(response.data['results'][0].keys())
        )
