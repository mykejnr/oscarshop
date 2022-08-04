from oscar.apps.catalogue.abstract_models import AbstractProduct
from oscar.core.thumbnails import get_thumbnailer

class ProductImageMixin:
    """
    Mixin to get the primary image of a Product object
    """
    def get_primary_image(self, product: AbstractProduct):
        if not product: # if asscociated product object is deleted
            return ''
        image = product.primary_image()
        # product.primary_image can return a dict (if product has no image), else a
        # ProductImage object, both with similar interface
        if isinstance(image, dict):
            source = image.get('original')
        else:
            source = image.original
        thumbnail = get_thumbnailer().generate_thumbnail(source, size="200x200")
        return self.request.build_absolute_uri(thumbnail.url)