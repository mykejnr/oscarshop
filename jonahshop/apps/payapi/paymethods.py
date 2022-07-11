import enum
from collections import namedtuple


class PaymentMethod:
    MOMO = "mtn_momo"
    VFCASH = "vf_cash"


class PaymentMethods:
    # NOTE: 'icon' in _PaymentType is name of icon as can be found in
    # storefront (react) / public / images
    _PaymentMethod = namedtuple('PaymentMethod', ["label", "name", "description", "icon"])
    _methods = [
        _PaymentMethod(PaymentMethod.MOMO, "MTN Mobile Money", "Pay with MTN Mobile Money", "momo.jpg"),
        _PaymentMethod(PaymentMethod.VFCASH, "Vodafone Cash", "Pay with Vodafone Cash", "vfcash.jpg"),
    ]

    def methods(self):
        return self._methods

    def get(self, label):
        for ptype in self._methods:
            if ptype.label == label:
                return ptype
        return None
