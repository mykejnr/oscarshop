import os

if os.environ.get('DJANGO_DEV_ENV', False):
    from .prod import *
else:
    from .dev import *