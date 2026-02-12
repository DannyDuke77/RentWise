from django.utils import timezone
from django.db.models import Sum
from datetime import date
from decimal import Decimal

from properties.models import UnitPayment

def is_unit_paid(unit):
    now = timezone.now()

    total_paid = (
        unit.payments
        .filter(year=now.year, month=now.month)
        .aggregate(total=Sum("amount_paid"))["total"]
        or 0
    )

    return total_paid >= unit.rent

def unpaid_units(property):
    now = timezone.now()
    return property.units.exclude(
        payments__year=now.year,
        payments__month=now.month
    )
