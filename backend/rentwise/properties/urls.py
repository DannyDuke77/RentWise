from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import api

from .api import UnitViewSet, PropertyViewSet, TenantViewSet, PaymentViewSet, ChargeTypeViewSet, ChargeViewSet, ChangeLogViewSet

router = DefaultRouter()

router.register(r'properties', PropertyViewSet, basename="property")
router.register(r'units', UnitViewSet, basename="unit")
router.register(r'tenants', TenantViewSet, basename="tenant")
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'charge-types', ChargeTypeViewSet, basename='charge-type')
router.register(r'charges', ChargeViewSet, basename='charge')   
router.register(r'change-logs', ChangeLogViewSet, basename='change-logs')

urlpatterns = [
    path('api/', include(router.urls)),
    path("api/tenant/me/", api.TenantMeView.as_view(), name="tenant-me"),
    path("api/tenant/payments/", api.TenantPaymentsView.as_view(), name="tenant-payments"),
]   