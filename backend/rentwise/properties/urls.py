from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import api

from .api import UnitViewSet, PropertyViewSet, TenantViewSet, PaymentViewSet, ChargeTypeViewSet, ChargeViewSet

router = DefaultRouter()

router.register(r'properties', PropertyViewSet, basename="property")
router.register(r'units', UnitViewSet, basename="unit")
router.register(r'tenants', TenantViewSet, basename="tenant")
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'charge-types', ChargeTypeViewSet, basename='charge-type')
router.register(r'charges', ChargeViewSet, basename='charge')

urlpatterns = [
    path('api/', include(router.urls)),
]   