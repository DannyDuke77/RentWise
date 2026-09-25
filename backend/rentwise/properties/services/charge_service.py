from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

@transaction.atomic
def update_charge_status(charge, new_status):
    if charge.status == new_status:
        return charge

    if charge.status == "paid" and new_status == "waived":
        raise ValidationError(
            "This charge has already been paid and cannot be waived."
        )

    charge.status = new_status
    charge.description = f"{charge.description} (Paid on {timezone.now()})"
    charge.save(update_fields=["status"])
    return charge