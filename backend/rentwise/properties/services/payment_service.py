from django.db import transaction
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth

from ..models import UnitPayment, Tenancy
from ..services.balance import recompute_tenancy_balance

@transaction.atomic
def process_payment(tenancy, validated_data, source="manual", mpesa_transaction=None):
    if not tenancy:
        raise ValidationError("No active tenancy found.")
    tenancy = Tenancy.objects.select_for_update().get(pk=tenancy.pk)

    amount = validated_data["amount_paid"]
    payment_type = validated_data["type"]
    category = validated_data.get("category", "rent")

    if payment_type == "refund":
        if category == "deposit":
            available = tenancy.get_deposit_held()
        else:
            current_balance = tenancy.calculate_balance()
            available = -current_balance if current_balance < 0 else Decimal("0.00")

        if amount > available:
            raise ValidationError(
                f"Refund amount (KES {amount}) exceeds available {category} balance (KES {available})."
            )

    payment_month = validated_data.get("month", validated_data["paid_on"].month)
    payment_year = validated_data.get("year", validated_data["paid_on"].year)

    payment = UnitPayment.objects.create(
        tenancy=tenancy,
        amount_paid=amount,
        payment_method=validated_data["payment_method"],
        reference=validated_data.get("reference", ""),
        paid_on=validated_data["paid_on"],
        year=payment_year,
        month=payment_month,
        type=payment_type,
        category=category,
        source=source,
        mpesa_transaction=mpesa_transaction,
        notes=validated_data.get("notes", ""),
    )

    new_balance = recompute_tenancy_balance(tenancy)

    return payment, new_balance

def get_payment_analytics(user, property_id=None):
    payments = UnitPayment.objects.filter(tenancy__unit__property__business__memberships__user=user)

    if property_id:
        payments = payments.filter(tenancy__unit__property_id=property_id)

    total_amount_paid = payments.filter(
        type="payment"
    ).aggregate(
        total=Sum("amount_paid")
    )["total"] or 0

    total_rent_paid = payments.filter(
        type="payment", category="rent"
    ).aggregate(
        total=Sum("amount_paid")
    )["total"] or 0

    total_deposit_paid = payments.filter(
        type="payment", category="deposit"
    ).aggregate(
        total=Sum("amount_paid")
    )["total"] or 0

    total_amount_refunded = payments.filter(
        type="refund"
    ).aggregate(
        total=Sum("amount_paid")
    )["total"] or 0

    # Payment method counts
    method_counts = payments.filter(
        type="payment"
    ).values("payment_method").annotate(
        count=Count("id")
    )

    method_map = {
        item["payment_method"].lower(): item["count"]
        for item in method_counts
    }

    # Payment/refund counts
    type_counts = payments.values("type").annotate(
        count=Count("id")
    )

    type_map = {
        item["type"].lower(): item["count"]
        for item in type_counts
    }

    # Payment category counts
    category_counts = payments.filter(
        type="payment"
    ).values("category").annotate(
        count=Count("id")
    )

    category_map = {
        item["category"].lower(): item["count"]
        for item in category_counts
    }

    # Monthly payment/refund amounts
    monthly_data = (
        payments
        .annotate(month_date=TruncMonth("paid_on"))
        .values("month_date")
        .annotate(
            payments=Sum(
                "amount_paid",
                filter=Q(type="payment" , category="rent")
            ),
            deposits=Sum(
                "amount_paid",
                filter=Q(type="payment", category="deposit")
            ),
            refunds=Sum(
                "amount_paid",
                filter=Q(type="refund")
            ),
        )
        .order_by("month_date")
    )

    return {
        "stats": {
            "total_amount_paid": float(total_amount_paid),

            "total_amount_rent_paid": float(total_rent_paid),
            "total_amount_deposit_paid": float(total_deposit_paid),
            
            "total_amount_refunded": float(total_amount_refunded),
            "net_total_amount": float(
                total_amount_paid - total_amount_refunded
            ),
            "payment_count": type_map.get("payment", 0),
            "deposit_count": category_map.get("deposit", 0),
            "refund_count": type_map.get("refund", 0),
            "mpesa": method_map.get("mpesa", 0),
            "cash": method_map.get("cash", 0),
            "bank_transfer": method_map.get("bank", 0),
        },

        "payment_methods": [
            {"name": "M-Pesa", "value": method_map.get("mpesa", 0)},
            {"name": "Cash", "value": method_map.get("cash", 0)},
            {"name": "Bank Transfer", "value": method_map.get("bank", 0)},
        ],

        "types": [
            {"name": "Payments", "value": type_map.get("payment", 0)},
            {"name": "Refunds", "value": type_map.get("refund", 0)},
        ],

        "categories": [
            {"name": "Rent", "value": category_map.get("rent", 0)},
            {"name": "Deposit", "value": category_map.get("deposit", 0)},
        ],

        "monthly": [
            {
                "month": item["month_date"].strftime("%b %Y"),
                "payments": float(item["payments"] or 0),
                "refunds": float(item["refunds"] or 0),
            }
            for item in monthly_data
        ],
    }