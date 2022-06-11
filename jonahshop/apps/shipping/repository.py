from oscar.apps.shipping.repository import Repository as OscarRepository

from oscar.core.loading import get_class

from apps.shipping.methods import HomeDelivery, PayOnDelivery, NoDeliveryRequired


Free = get_class('shipping.methods', 'Free')

class Repository(OscarRepository):
    """
    Repository class responsible for returning ShippingMethod
    objects for a given user, basket etc
    """

    # A list instantiated shipping methods.
    methods = (Free(), HomeDelivery(), PayOnDelivery(), NoDeliveryRequired())

    def get_default_shipping_method(self, basket, shipping_addr=None, **kwargs):
        # We need to implement this to return the default shipping method
        # based on variables such as items in a basket, user, etc.
        # for now we just return the first item in the self.methods, aka. Free() shipping
        return self.methods[0]

    def get_available_shipping_methods(self, basket, shipping_addr=None, **kwargs):
        # We need to implement this method to return a list
        # of methods applicable to a basket based on other variables
        # such as location of user, type of items in a basket, etc
        # for now we return a list of all shipping methods
        return self.methods

    def get_shipping_method(self, shipping_method_code,  basket, shipping_addr=None):
        """
        Return a shipping method instatnce that matches the given shipping_method_code
        or return "None" if none of the applicable shipping methods matches the given
        code
        """
        methods = self.get_shipping_methods(basket, shipping_addr)
        for method in methods:
            if shipping_method_code == method.code:
                return method
        return None