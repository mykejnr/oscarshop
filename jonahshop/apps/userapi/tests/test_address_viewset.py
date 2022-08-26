import pytest

from django.contrib.auth import get_user_model
from django.urls import reverse

from oscar.core.loading import get_model
from oscar.apps.address.abstract_models import AbstractUserAddress

from rest_framework.test import APIClient
from rest_framework import status

from apps.userapi.serializers import UserAddressSerializer


pytestmark = pytest.mark.django_db(transaction=True)
User = get_user_model()
UserAddress: AbstractUserAddress = get_model("address", "UserAddress")
Country = get_model("address", "Country")


@pytest.fixture
def user():
    return User.objects.create(email='addresstestuser@email.com', password='12345')


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
def address_data(user, country: Country) -> dict:
    return {
        'title': 'Mr',
        'user': user.id,
        'first_name': 'Michael',
        'last_name': 'Mensah',
        'line1': 'NT #9 Blk D, New Brosankro',
        'line4': 'Bechem',
        'state': 'Ahafo',
        'country': country.iso_3166_1_a2,
        'postcode': '+233',
        'phone_number': '+233248352555',
        'notes': 'Brosankro new town. Adjescent methodist church',
        'is_default_for_shipping': False,
        'num_orders_as_shipping_address': 0,
    }


@pytest.fixture
def linked_address_data(address_data: dict, country, user) -> dict:
    addr = address_data.copy()
    addr['country'] = country
    addr['user'] = user
    return addr



@pytest.fixture
def address(linked_address_data: dict) -> AbstractUserAddress:
    return UserAddress.objects.create(**linked_address_data)


@pytest.fixture
def addresses(linked_address_data: dict):
    data1 = linked_address_data.copy()
    data2 = linked_address_data.copy()
    # address.hash is generated whe address.save is
    # called, so since bulk_create don't call 'save' method
    # we pass in a fake hash, to avoid a unique contraint failure
    data1.update({
    'hash': '23ddfer3fsd',
    'line1': 'First line of address for 1',
    })
    data2.update({
    'hash': 'we9uoiuw09823k3j',
    'line1': 'Second line of address for 2',
    })
    return UserAddress.objects.bulk_create([
        UserAddress(**data1),
        UserAddress(**data2)
    ])


@pytest.fixture
def client(user):
    client = APIClient()
    client.login(email=user.email, password='12345')
    return client


#--- Test for address-list

def test_disallow_anaunthenticated_users():
    client = APIClient()
    response = client.get(reverse('address-list'))
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_returns_list_of_address(client, addresses):
    response = client.get(reverse('address-list'))
    response_data = response.data
    assert len(response_data['results']) == len(addresses)


def test_returns_only_address_of_auth_user(linked_address_data, addresses, client):
    data = linked_address_data.copy()

    data['user'] = User.objects.create(email='user2@email.com', password='12345')
    UserAddress.objects.create(**data)

    response = client.get(reverse('address-list'))
    results = response.data['results']

    assert data['user'].id not in [result['user'] for result in results]


# ~~~~~~~~~~~ Tesint address creation

def test_creates_address_object(address_data, client: APIClient):
    line1 = 'Teas create address line 1'
    data = address_data.copy()
    data['line1'] = line1
    response = client.post(reverse('address-list'), data=data)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['line1'] == line1 


def test_create_failed_validation(address_data, client: APIClient):
    data = address_data.copy()
    data.pop('line1')
    response = client.post(reverse('address-list'), data=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ~~~~~~~~~~~ Tesing address retrieval

def test_retreive_address_object(client: APIClient, address: AbstractUserAddress):
    response = client.get(reverse('address-detail', args=[address.id]))
    assert response.data == UserAddressSerializer(address).data


def test_apply_object_permission_auth(linked_address_data, address: AbstractUserAddress):
    data = linked_address_data.copy()
    data['user'] = User.objects.create(email='notallowduser@email.com', password='12345')

    client = APIClient()
    client.login(email=data['user'].email, password='12345')

    response = client.get(reverse('address-detail', args=[address.id]))
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_patch_object(address: AbstractUserAddress, client: APIClient):
    data = {
        'first_name': 'Emmanuel',
        'last_name': 'Jonathan'
    }
    response = client.patch(reverse('address-detail', args=[address.id]), data=data)
    assert response.data['first_name'] == data['first_name']
    assert response.data['last_name'] == data['last_name']

def test_delete_object(address: AbstractUserAddress, client: APIClient):
    response = client.delete(reverse('address-detail', args=[address.id]))
    assert response.status_code == status.HTTP_204_NO_CONTENT
    with pytest.raises(UserAddress.DoesNotExist):
        UserAddress.objects.get(pk=address.id)
