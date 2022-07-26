from unittest.mock import AsyncMock, patch
import pytest
from pytest_mock import MockFixture
from oscar.core.loading import get_model
from oscar.apps.catalogue.models import Product as OsProduct, ProductClass as OsProductClass
from rest_framework import status
from channels.testing import WebsocketCommunicator
from apps.payapi.consumers import PaymentConsumer, Momo


pytestmark = pytest.mark.django_db(transaction=True)
Order = get_model('order', 'Order')
ProductClass: OsProductClass = get_model('catalogue', 'ProductClass')
Product: OsProduct = get_model('catalogue', 'Product')


@pytest.fixture(scope='session', autouse=True)
def time_mock():
    with patch('asyncio.sleep', autospec=True) as time_mock:
        time_mock.return_value = AsyncMock()
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
    await communicator.disconnect()


@pytest.mark.asyncio
async def test_wrong_order_number():
    comm = await create_comm()
    o_num = 233332222
    await comm.send_json_to({
        'order_number': o_num,
        'momo_number': '233432334'
    })
    event = await comm.receive_output()
    assert event == {
        'type': 'websocket.close',
        'code': 4004
    }
    await comm.disconnect()


@pytest.mark.asyncio
async def test_order_number_not_provided():
    comm = await create_comm()
    await comm.send_json_to({
        'momo_number': '233432334'
    })
    event = await comm.receive_output()
    assert event == {
        'type': 'websocket.close',
        'code': 4007
    }
    await comm.disconnect()


@pytest.mark.asyncio
async def test_momo_number_not_provided(mocker):
    # no order create, mock targets Order.objects.get
    mocker.patch('apps.payapi.consumers.Order', autospec=True)

    comm = await create_comm()
    await comm.send_json_to({
        'order_number': 223,
    })
    event = await comm.receive_output()
    assert event == {
        'type': 'websocket.close',
        'code': 4007
    }
    await comm.disconnect()


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
        'status': 102,
        'message': 'Requesting for payment. Please wait...',
        'status_text': 'REQUESTING',
    }
    await comm.disconnect()


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
        'status': 102,
        'message': 'Please check your phone for an authorization prompt for confirmation.',
        'status_text': 'WAITING',
    }
    await comm.disconnect()


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
        'status': status.HTTP_200_OK,
        'message': 'Payment Received. Thank you for buying from us.',
        'status_text': 'AUTHORIZED',
    }
    await comm.disconnect()


@pytest.mark.asyncio
async def test_confirm_payment_failure(mocker: MockFixture):
    order_mock = mocker.patch('apps.payapi.consumers.Order.objects.get')
    order_mock.return_value = MockOrder()

    with patch('apps.payapi.consumers.Momo.confirm_payment', return_value=False) as mm:

        comm = await create_comm()
        await comm.send_json_to({
            'order_number': 22333,
            'momo_number': '233432334'
        })

        await comm.receive_json_from() # status 'REQUESTING'
        await comm.receive_json_from() # status 'WAITING'
        event = await comm.receive_output() # status 'AUTHORIZED'

    assert event == {
        'type': 'websocket.close',
        'code': 4008
    }
    await comm.disconnect()