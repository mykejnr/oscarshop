"""jonahshop URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.apps import apps

from django.conf import settings

from rest_framework import routers
from shopapi import views

router = routers.DefaultRouter()
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('i18n/', include('django.conf.urls.i18n')),

    # The Django admin is not officially supported; expect breakage.
    # Nonetheless, it's often useful for debugging.
    # path('admin/', admin.site.urls),

    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    path('', include(apps.get_app_config('oscar').urls[0])),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
