import pytest
import tempfile
from django.conf import settings
from rest_framework.test import APIClient

from oscar.core.loading import get_model
from oscar.apps.order.models import Order as OsOrder, Line as OsOrderLine, ShippingAddress as OShippingAddress

from apps.shopapi.views import OrderViewSet, generate_anonymous_order_credentials


pytestmark = pytest.mark.django_db(transaction=True)
Order: OsOrder = get_model('order', 'Order')
OrderLine: OsOrderLine = get_model('order', 'Line')
ProductImage = get_model('catalogue', 'ProductImage')
Product = get_model('catalogue', 'Product')
ProductClass = get_model('catalogue', 'ProductClass')
ShippingAddress: OShippingAddress = get_model("order", "ShippingAddress")
Country = get_model("address", "Country")


@pytest.fixture
def shipping_data():
    return {
        'first_name': 'Michael',
        'last_name': 'Mensah',
        'line1': 'NT #9 Blk D, New Brosankro',
        'line4': 'Bechem',
        'state': 'Ahafo',
        'country': 'GH',
        'postcode': '+233',
        'phone_number': '+233248352555',
        'notes': 'Brosankro new town. Adjescent methodist church'
    }


@pytest.fixture
def shipping_address(shipping_data: dict) -> OShippingAddress:
    c = Country.objects.create(**{
        "iso_3166_1_a2": "GH",
        "iso_3166_1_a3": "GHA",
        "iso_3166_1_numeric": "288",
        "printable_name": "Ghana",
        "name": "Republic of Ghana",
    })
    sd = shipping_data.copy()
    sd['country'] = c
    sa: OShippingAddress = ShippingAddress.objects.create(**sd)
    return sa


@pytest.fixture
def order_data() -> dict:
    return {
        'number': '100087',
        'currency': 'GHC',
        'total_incl_tax': '25.23',
        'total_excl_tax': '25.23',
        'shipping_incl_tax': '3.55', 
        'shipping_excl_tax': '3.55', 
        'shipping_method': 'no-payment-required',
        'shipping_code': 'GSD3324',
        'status': 'OPEN',
        'guest_email': 'mykejnr4@Gmail.com',
    }


@pytest.fixture
def order(order_data: dict, shipping_address) -> OsOrder:
    return Order.objects.create(**order_data, shipping_address=shipping_address)


@pytest.fixture
def order_credentials(order):
    # add product to basket before checkout
    return generate_anonymous_order_credentials(order)


@pytest.fixture
def line_data() -> dict:
    return {
        'title': 'School Bag',
        'quantity': 3,
        'unit_price_incl_tax': '21.00',
        'unit_price_excl_tax': '20.00',
        'line_price_incl_tax': '63.00',
        'line_price_excl_tax': '60.00',
        'line_price_before_discounts_incl_tax': '63.00',
        'line_price_before_discounts_excl_tax': '60.00',
    }


@pytest.fixture
def order_lines(line_data: dict, order):
    ld = line_data.copy()
    ld2 = line_data.copy()
    ld.update({
        'order': order,
        'title': "Men Fashion Suit"
    })
    ld2.update({
        'order': order
    })
    return OrderLine.objects.bulk_create([
        OrderLine(**ld), OrderLine(**ld2)
    ])
    # return OrderLine.objects.create(**ld)


@pytest.fixture
def order_url():
    view = OrderViewSet()
    view.basename = 'order'
    view.request = None
    return view.reverse_action(view.anonymous.url_name)


def test_anonymous_order_request(order_url, order_data, order_credentials):
    client = APIClient()
    response = client.post(order_url, data=order_credentials._asdict())
    rdata: dict = response.data
    data = order_data.copy()
    data.update({
        'id': rdata.get('id'),
        'user': rdata.get('user'),
        'date_placed': rdata.get('date_placed'),
    })
    rdata.pop('shipping_address', None)
    rdata.pop('lines', None)

    assert rdata == data


def test_anonymous_request_contains_shipping_data(order_url, order_credentials, shipping_data):
    client = APIClient()
    response = client.post(order_url, data=order_credentials._asdict())
    assert shipping_data == response.data['shipping_address']


def test_anonymous_request_contains_order_lines(order_url, order_credentials, line_data, order_lines):
    client = APIClient()
    response = client.post(order_url, data=order_credentials._asdict())
    assert len(response.data['lines']) == 2
    line1 = response.data['lines'][1]
    line1.pop('id')
    line1.pop('image')
    assert line_data == line1