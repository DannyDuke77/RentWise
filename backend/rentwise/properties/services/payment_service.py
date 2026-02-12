from django.db import transaction
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from ..models import UnitPayment

@transaction.atomic
def process_payment(tenancy, validated_data):
    if not tenancy:
        raise ValidationError("No active tenancy found.")

    amount = Decimal(validated_data["amount_paid"])

    if amount <= 0:
        raise ValidationError("Payment amount must be positive.")

    UnitPayment.objects.create(
        tenancy=tenancy,
        amount_paid=amount,
        payment_method=validated_data["payment_method"],
        reference=validated_data.get("reference", ""),
        paid_on=validated_data["paid_on"],
        year=validated_data["paid_on"].year,
        month=validated_data["paid_on"].month,
        type=validated_data["type"],
        notes=validated_data.get("notes", ""),
    )

    tenancy.balance = tenancy.calculate_balance()
    tenancy.save(update_fields=["balance"])

    return tenancy.balance
