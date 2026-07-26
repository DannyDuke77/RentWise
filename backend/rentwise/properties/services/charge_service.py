from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from ..models import UnitPayment


@transaction.atomic
def update_charge_status(charge, new_status):
    if charge.status == new_status:
        return charge

    if charge.status == "paid" and new_status == "waived":
        raise ValidationError(
            "This charge has already been paid and cannot be waived."
        )

    if new_status == "paid":
        now = timezone.now()
        UnitPayment.objects.create(
            tenancy=charge.tenancy,
            amount_paid=charge.amount,
            paid_on=now,
            year=now.year,
            month=now.month,
            payment_method="manual",
            type="payment",
            reference=f"CHRG-{now.strftime('%Y%m%d%H%M%S')}",
            category="rent",
            notes=f"Payment for charge: {charge.description or (charge.charge_type.name if charge.charge_type else 'Charge')}",
        )

    charge.status = new_status
    charge.save(update_fields=["status"])
    return charge