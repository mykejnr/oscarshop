from unittest.mock import patch
import pytest
from pytest_mock import MockFixture
from oscar.core.loading import get_model
from oscar.apps.catalogue.models import Product as OsProduct, ProductClass as OsProductClass
from rest_framework.test import APIClient
from channels.testing import WebsocketCommunicator 
from asgiref.sync import sync_to_async
from apps.payapi.consumers import PaymentConsumer, Momo


pytestmark = pytest.mark.django_db(transaction=True)
Order = get_model('order', 'Order')
ProductClass: OsProductClass = get_model('catalogue', 'ProductClass')
Product: OsProduct = get_model('catalogue', 'Product')


# never used
# @pytest.fixture
# async def product() -> OsProduct:
#     pclass = await sync_to_async(lambda: ProductClass.objects.create(name='Shirt'))()
#     prod = await sync_to_async(lambda: Product.objects.create(title='T-Shirt', product_class=pclass))()
#     return prod


@pytest.fixture(scope='session', autouse=True)
def time_mock():
    with patch('time.sleep', autospec=True) as time_mock:
        yield time_mock


class MockSourceType:
    name = 'momo'

class MockSource:
    amount_allocated = 123.34
    source_type = MockSourceType()
    def debit(self, amount):
        pass

class MockOrder:
    allocated_amount = 2334.23
    number = 10001

    def first(self):
        return MockSource()

    @property
    def sources(self):
        return self


async def create_comm(connect=True) -> WebsocketCommunicator:
    communicator = WebsocketCommunicator(PaymentConsumer.as_asgi(), '/wbs/pay/')
    if connect:
        await communicator.connect()
    return communicator


@pytest.mark.asyncio
async def test_accept_connections():
    communicator = WebsocketCommunicator(PaymentConsumer.as_asgi(), '/wbs/pay/')
    connected, subprotocol = await communicator.connect()
    assert connected


@pytest.mark.asyncio
async def test_wrong_order_number():
    comm = await create_comm()
    o_num = 233332222
    await comm.send_json_to({
        'order_number': o_num,
        'momo_number': '233432334'
    })
    data = await comm.receive_json_from()

    assert data == {
        'status': 'NOTFOUND',
        'message': f'Order number ({o_num}) does not exist. Please contact customer support for assistance.'
    }


@pytest.mark.asyncio
async def test_order_number_not_provided():
    comm = await create_comm()
    await comm.send_json_to({
        'momo_number': '233432334'
    })
    data = await comm.receive_json_from()

    assert data == {
        'status': 'BADDATA',
        'message': 'Order number not provided. You must provide an order number.'
    }


@pytest.mark.asyncio
async def test_momo_number_not_provided(mocker):
    # no order create, mock targets Order.objects.get
    mocker.patch('apps.payapi.consumers.Order', autospec=True)

    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 223,
    })
    data = await comm.receive_json_from()

    assert data == {
        'status': 'BADDATA',
        'message': 'Momo number not provided. You must provide a momo number.'
    }


@pytest.mark.asyncio
async def test_REQUESTING_status(mocker: MockFixture):
    # no order create, mock targets Order.objects.get
    mocker.patch('apps.payapi.consumers.Order', autospec=True)
    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 22333,
        'momo_number': '233432334'
    })
    data = await comm.receive_json_from()

    assert data == {
        'status': 'REQUESTING',
        'message': 'Requesting for payment. Please wait...'
    }


@pytest.mark.asyncio
async def test_request_payment_with_allocated_amount(mocker: MockFixture):
    order_mock = mocker.patch('apps.payapi.consumers.Order.objects.get')
    order_mock.return_value = MockOrder()
    momo_mock = mocker.patch.object(Momo, 'request_payment')

    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 22333,
        'momo_number': '233432334'
    })
    await comm.receive_json_from() # status 'REQUESTING'
    data = await comm.receive_json_from() # status 'WAITING'

    momo_mock.assert_called_once_with(MockSource.amount_allocated )
    assert data == {
        'status': 'WAITING',
        'message': 'Please check your phone for an authorization prompt for confirmation.'
    }


@pytest.mark.asyncio
async def test_confirm_payment_success(mocker: MockFixture):
    source_mock = mocker.patch.object(MockSource, 'debit')
    order_mock = mocker.patch('apps.payapi.consumers.Order.objects.get')
    order_mock.return_value = MockOrder()
    momo_mock = mocker.patch.object(Momo, 'confirm_payment')
    momo_mock.return_value = True

    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 22333,
        'momo_number': '233432334'
    })

    await comm.receive_json_from() # status 'REQUESTING'
    await comm.receive_json_from() # status 'WAITING'
    data = await comm.receive_json_from() # status 'AUTHORIZED'

    source_mock.assert_called_once_with(MockSource.amount_allocated)
    assert data == {
        'status': 'AUTHORIZED',
        'message': 'Payment Received. Thank you for buying from us.'
    }


@pytest.mark.asyncio
async def test_confirm_payment_failure(mocker: MockFixture):
    order_mock = mocker.patch('apps.payapi.consumers.Order.objects.get')
    order_mock.return_value = MockOrder()
    momo_mock = mocker.patch.object(Momo, 'confirm_payment')
    momo_mock.return_value = False

    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 22333,
        'momo_number': '233432334'
    })

    await comm.receive_json_from() # status 'REQUESTING'
    await comm.receive_json_from() # status 'WAITING'
    data = await comm.receive_json_from() # status 'AUTHORIZED'

    assert data == {
        'status': 'TIMEOUT',
        'message': 'Timeout waiting for authorization.'
    }