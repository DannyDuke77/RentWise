from django.db import transaction
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from ..models import UnitPayment, Tenancy

@transaction.atomic
def process_payment(tenancy, validated_data):
    if not tenancy:
        raise ValidationError("No active tenancy found.")

    # Lock the tenancy row for the duration of this transaction so two
    # concurrent refund requests can't both read the same available balance
    # and both go through before either one's write lands.
    tenancy = Tenancy.objects.select_for_update().get(pk=tenancy.pk)

    print(validated_data)
    print("Amount received:", validated_data["amount_paid"])

    amount = Decimal(validated_data["amount_paid"])

    if amount <= 0:
        raise ValidationError("Payment amount must be positive.")

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

    UnitPayment.objects.create(
        tenancy=tenancy,
        amount_paid=amount,
        payment_method=validated_data["payment_method"],
        reference=validated_data.get("reference", ""),
        paid_on=validated_data["paid_on"],
        year=payment_year,
        month=payment_month,
        type=payment_type,
        category=category,
        notes=validated_data.get("notes", ""),
    )

    tenancy.balance = tenancy.calculate_balance()
    tenancy.save(update_fields=["balance"])

    return tenancy.balance