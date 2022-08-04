import pytest
from oscar.core.loading import get_model
from oscar.apps.order.models import ShippingAddress as OShippingAddress

from apps.shipping.serializers.address import ShippingAddressSerializer


pytestmark = pytest.mark.django_db(transaction=True)
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
    sa: OShippingAddress = ShippingAddress(**sd)
    return sa


def test_serializes_shipping_address_object(shipping_address: OShippingAddress, shipping_data):
    s_ser = ShippingAddressSerializer(shipping_address)
    assert shipping_data == s_ser.data