from unittest.mock import patch
import pytest
import tempfile
from django.conf import settings
from django.test import RequestFactory

from oscar.core.loading import get_model
from oscar.apps.order.models import Order as OsOrder, Line as OsOrderLine

from apps.shopapi.serializers import OrderSerializer
from apps.shopapi.serializers.order import OrderLineSerializer
from apps.shipping.serializers.address import ShippingAddressSerializer


pytestmark = pytest.mark.django_db(transaction=True)
Order: OsOrder = get_model('order', 'Order')
OrderLine: OsOrderLine = get_model('order', 'Line')
ProductImage = get_model('catalogue', 'ProductImage')
Product = get_model('catalogue', 'Product')
ProductClass = get_model('catalogue', 'ProductClass')
ShippingAddress = get_model("order", "ShippingAddress")
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
def shipping_address(shipping_data: dict):
    c = Country.objects.create(**{
        "iso_3166_1_a2": "GH",
        "iso_3166_1_a3": "GHA",
        "iso_3166_1_numeric": "288",
        "printable_name": "Ghana",
        "name": "Republic of Ghana",
    })
    sd = shipping_data.copy()
    sd['country'] = c
    sa = ShippingAddress.objects.create(**sd)
    return sa


@pytest.fixture
def order_data(shipping_address) -> dict:
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
        'shipping_address': shipping_address
    }


@pytest.fixture
def order(order_data: dict) -> OsOrder:
    return Order.objects.create(**order_data)


@pytest.fixture
def product_class():
    return ProductClass.objects.create(name="Bag")

@pytest.fixture
def product(product_class):
    return Product.objects.create(
        title='School Bag',
        product_class=product_class
    )


@pytest.fixture
def product_image(product):
    return ProductImage.objects.create(
        product=product,
        original=tempfile.NamedTemporaryFile(
            suffix='.jpg',
            dir=settings.MEDIA_ROOT
        ).name
    )


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
def order_line(line_data: dict, product_image, order):
    ld = line_data.copy()
    ld.update({
        'product': product_image.product,
        'order': order
    })
    return OrderLine.objects.create(**ld)


def test_serializes_order_data(order: OsOrder, order_data: dict):
    oser = OrderSerializer(order)
    data = oser.data
    data.pop('id')
    data.pop('user')
    data.pop('date_placed')
    # test serialized shipping address seperatly
    data.pop('shipping_address')
    order_data = order_data.copy()
    order_data.pop('shipping_address')

    assert data == order_data


def test_serializes_order_data_with_shipping_address(order: OsOrder, order_data: dict, shipping_data):
    oser = OrderSerializer(order)
    oser_shipping = oser.data['shipping_address']
    assert oser_shipping == shipping_data


# Order Line Serializer tests ########################

def test_serializes_line_data(order_line, line_data):
    ctx = {'request': RequestFactory().get('/media/')}
    lser = OrderLineSerializer(order_line, context=ctx)
    data = lser.data
    data.pop('id')
    data.pop('image')
    assert data == line_data


def test_line_serilizer_add_image_path_to_data(order_line, product_image):
    request = RequestFactory().get('/media/')
    ctx = {'request': request}
    image_path = 'path/to/thumb/nail/'

    class Thumbnailer:
        url = image_path
        def generate_thumbnail(self, source, size):
            return self

    with patch('apps.core.mixins.get_thumbnailer') as thm_mock:
        thm_mock.return_value = Thumbnailer()
        lser = OrderLineSerializer(order_line, context=ctx)
        data = lser.data
    
    assert data['image'] == request.build_absolute_uri(image_path)