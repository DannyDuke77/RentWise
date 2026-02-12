from django.db.models import Sum
from django.utils import timezone
from django.db import models
from decimal import Decimal

from properties.models import UnitPayment

from django.db.models import Sum
from django.utils import timezone

def get_unit_rent_status(unit):
    tenancy = unit.tenancies.filter(is_active=True).first()
    if not tenancy:
        return {
            "rent": unit.monthly_rent,
            "paid": 0,
            "balance": 0,
            "status": "vacant",
        }

    # 1. Total Ledger Truth (Balance including all payments/refunds)
    total_balance = tenancy.calculate_balance()

    # 2. Monthly Performance (Payments made strictly THIS calendar month, considering refunds)
    now = timezone.now()
    payments_this_month = tenancy.payments.filter(
        paid_on__year=now.year,
        paid_on__month=now.month
    )

    this_month_paid = Decimal("0.00")
    for p in payments_this_month:
        if p.type == "payment":
            this_month_paid += p.amount_paid
        elif p.type == "refund":
            this_month_paid -= p.amount_paid  # refunds reduce monthly collection

    # 3. Status Logic (based on total balance)
    if total_balance <= 0:
        status = "paid"
    elif total_balance < tenancy.monthly_rent:
        status = "partial"
    else:
        status = "unpaid"

    return {
        "rent": float(tenancy.monthly_rent),
        "paid": float(this_month_paid),
        "balance": float(total_balance),
        "status": status,
    }


def get_property_rent_summary(property):
    units = property.units.filter(is_active=True)
    occupied_units = units.filter(status='occupied')

    # Expected rent
    expected = Decimal(units.aggregate(total=Sum("monthly_rent"))["total"] or 0)
    occupied_expected = Decimal(occupied_units.aggregate(total=Sum("monthly_rent"))["total"] or 0)

    # Initialize totals
    total_arrears = Decimal("0.00")
    total_credits = Decimal("0.00")
    effective_collection = Decimal("0.00")

    paid_units = 0
    partial_units = 0
    unpaid_units = 0

    for unit in units:
        status_data = get_unit_rent_status(unit)
        balance = Decimal(status_data["balance"])
        monthly_rent = Decimal(status_data["rent"])
        amount_paid_this_month = Decimal(status_data["paid"])

        # --- Separate debt from credit ---
        if balance > 0:
            total_arrears += balance      # tenant owes money
        elif balance < 0:
            total_credits += abs(balance) # tenant has a credit

        # --- Compliance / Progress Bar Logic ---
        if status_data["status"] == "paid":
            effective_collection += monthly_rent
            paid_units += 1
        elif status_data["status"] == "partial":
            effective_collection += min(amount_paid_this_month, monthly_rent)
            partial_units += 1
        else:
            unpaid_units += 1

    return {
        "expected": float(expected),
        "occupied_expected": float(occupied_expected),
        "paid": float(effective_collection),
        "balance": float(total_arrears),
        "total_credits": float(total_credits),
        "occupied_units": occupied_units.count(),
        "paid_units": paid_units,
        "partial_units": partial_units,
        "unpaid_units": unpaid_units,
        "total_units": units.count(),
    }   