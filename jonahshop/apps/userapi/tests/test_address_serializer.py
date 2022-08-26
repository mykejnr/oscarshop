import pytest
from oscar.apps.address.abstract_models import AbstractUserAddress
from oscar.core.loading import get_model

from apps.userapi.models import User
from apps.userapi.serializers import UserAddressSerializer


UserAddress: AbstractUserAddress = get_model("address", "UserAddress")
Country = get_model("address", "Country")


pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def user():
    return User.objects.create(email='testuser@mail.com', password='12345')


@pytest.fixture
def country():
    return Country.objects.create(**{
        "iso_3166_1_a2": "GH",
        "iso_3166_1_a3": "GHA",
        "iso_3166_1_numeric": "288",
        "printable_name": "Ghana",
        "name": "Republic of Ghana",
    })

@pytest.fixture
def address_data(user, country) -> dict:
    return {
        'title': 'Mr',
        'user': user.id,
        'first_name': 'Michael',
        'last_name': 'Mensah',
        'line1': 'NT #9 Blk D, New Brosankro',
        'line4': 'Bechem',
        'state': 'Ahafo',
        'country': 'GH',
        'postcode': '+233',
        'phone_number': '+233248352555',
        'notes': 'Brosankro new town. Adjescent methodist church',
        'is_default_for_shipping': False,
        'num_orders_as_shipping_address': 0,
    }


@pytest.fixture
def address(address_data: dict, country, user) -> AbstractUserAddress:
    addr = address_data.copy()
    addr['country'] = country
    addr['user'] = user
    return UserAddress.objects.create(**addr)


def test_serializes_address(address, address_data: dict):
    u_ser = UserAddressSerializer(address)
    data = address_data.copy()
    assert u_ser.data == data


def test_create_address_use_current_auth_user(address_data):
    new_user = User.objects.create(email='anotheruser@mail.com', password='12345')
    class Request:
        user = new_user
    u_ser = UserAddressSerializer(data=address_data, context={'request': Request()})
    u_ser.is_valid()
    addr_obj = u_ser.save()
    assert new_user == addr_obj.user


def test_read_only_fields(address_data):
    new_user = User.objects.create(email='thirdorderuser@mail.com', password='12345')
    class Request:
        user = new_user
    num_orders = 10
    data = address_data.copy()
    data['num_orders_as_shipping_address'] = num_orders

    u_ser = UserAddressSerializer(data=data, context={'request': Request()})
    u_ser.is_valid()
    addr_obj = u_ser.save()

    assert addr_obj.user.id != data['user']
    assert addr_obj.num_orders_as_shipping_address != num_orders