from rest_framework.routers import DefaultRouter

from django.urls import path, include

from . import api

router = DefaultRouter()

router.register(r'configurations', api.MpesaConfigurationViewSet, basename="mpesa-configuration")

urlpatterns = [
    path('', include(router.urls)),
    path('callback/', api.mpesa_callback, name='mpesa-callback'),
    path('initiate/', api.InitiateMpesaPaymentView.as_view(), name='initiate-mpesa-payment'),
]