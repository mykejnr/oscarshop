import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from oscar.core.loading import get_model
from oscar.apps.order.models import Order as OsOrder, Line as OsOrderLine, ShippingAddress as OShippingAddress

from apps.shopapi.views import OrderViewSet, generate_anonymous_order_credentials
from apps.userapi.models import User


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
def user():
    return User.objects.create(email='testuser@mail.com', password='12345')

# NOT a fixture
def create_order(order_data, shipping_address, order_number=None, user=None): 
    o_data = order_data
    if order_number is not None:
        o_data = order_data.copy()
        o_data['number'] = order_number

    o_data['user'] = user
    return Order.objects.create(**o_data, shipping_address=shipping_address)


@pytest.fixture
def order(order_data: dict, shipping_address, user) -> OsOrder:
    return Order.objects.create(**order_data, shipping_address=shipping_address, user=user)


@pytest.fixture
def order_list(order_data: dict, shipping_address, order, user):
    order2 = create_order(order_data, shipping_address, '1000090', user=user)
    order3 = create_order(order_data, shipping_address, '1000092', user=user)
    return [order, order2, order3]


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


# TESTING view.list ***************

@pytest.fixture
def test_client(user):
    client = APIClient()
    client.login(email=user.email, password='12345')
    return client


def test_rejects_request_for_unauthenticated_user():
    response = APIClient().get(reverse('order-list'))
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_retrieve_list_of_orders(test_client, order_list):
    response = test_client.get(reverse('order-list'))
    data = response.data['results']

    assert len(data) == len(order_list)
    # retreive order number from both data and comber
    numbers = set(map(lambda o: o.number, order_list))
    numbers2 = set(map(lambda d: d['number'], data))

    assert numbers == numbers2


def test_retrieve_only_orders_belonging_to_user(test_client, order_list, order_data, shipping_address):
    # create an order with no user
    order_nouser = create_order(order_data, shipping_address, '3000090')

    response = test_client.get(reverse('order-list'))
    data = response.data['results']

    numbers = list(map(lambda d: d['number'], data))

    assert (order_nouser.number not in numbers)
    assert len(data) == len(order_list)

# def test_return_a_204_for_empty_order_list(test_client):
#     user = User.objects.create(email='anotheruser@mail.com', password='12345')
#     client = APIClient()
#     client.login(email=user.email, password='12345')
#     response = client.get(reverse('order-list'))
#     assert response.status_code == status.HTTP_204_NO_CONTENT


# TESTING view.retreive (aka order details) ***************


def test_retrieve_order(order, test_client):
    response = test_client.get(reverse('order-detail', args=[order.number]))
    assert order.number == response.data['number']


def test_retreive_order_together_with_lines(order_lines, test_client):
    order = order_lines[0].order
    response = test_client.get(reverse('order-detail', args=[order.number]))
    assert len(order_lines) == len(response.data['lines'])


def test_cant_request_order_for_another_user(test_client, order_data, shipping_address):
    order_nouser = create_order(order_data, shipping_address, '3001090')
    response = test_client.get(reverse('order-detail', args=[order_nouser.number]))
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_return_a_404_for_not_found_order(test_client):
    response = test_client.get(reverse('order-detail', args=['1111111kkk']))
    assert response.status_code == status.HTTP_404_NOT_FOUND