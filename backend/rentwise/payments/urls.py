from rest_framework.routers import DefaultRouter

from django.urls import path, include

from . import api

router = DefaultRouter()

router.register(r'configurations', api.MpesaConfigurationViewSet, basename="mpesa-configuration")

urlpatterns = [
    path('api/v1/payments/', include(router.urls)),
    path('api/v1/payments/callback/', api.mpesa_callback, name='mpesa-callback'),
    path('api/v1/payments/initiate/', api.InitiateMpesaPaymentView.as_view(), name='initiate-mpesa-payment'),
]