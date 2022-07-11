from django.urls import reverse
from rest_framework.test import APITestCase
from apps.payapi.paymethods import PaymentMethods


class PaymentMethodsTestCase(APITestCase):

    @property
    def url(self):
        return reverse('payment_methods')

    def test_returns_list_of_methods(self):
        shape = {
            'label': '',
            'name': '',
            'description': '',
            'icon': '',
        }
        response = self.client.post(self.url)
        data = response.data

        methods = PaymentMethods().methods()

        self.assertEqual(len(methods), len(data))
        self.assertEqual(shape.keys(), data[0].keys())

