from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from properties.models import ChangeLog

@transaction.atomic
def update_unit(unit, serializer, user):
    tenancy = unit.tenancies.filter(is_active=True).first()
    new_status = serializer.validated_data.get("status")

    if tenancy and serializer.validated_data.get("is_active") is False:
        raise ValidationError({"detail": "Cannot deactivate a unit with an active tenancy."})

    if new_status and new_status != unit.status:
        if unit.status == "occupied":
            raise ValidationError({"detail": "Cannot change status of an occupied unit."})
        
        if new_status not in ["vacant", "maintenance"]:
            raise ValidationError({"detail": "Only 'vacant' and 'maintenance' allowed."})

    logs_to_create = []
    for field in ["name", "monthly_rent", "floor", "status"]:
        if field in serializer.validated_data:
            old_val = getattr(unit, field)
            new_val = serializer.validated_data[field]
            if str(old_val) != str(new_val):
                logs_to_create.append(ChangeLog(
                    unit=unit,
                    changed_by=user,
                    field_name=field,
                    old_value=str(old_val),
                    new_value=str(new_val)
                ))

    instance = serializer.save()
    if tenancy and "monthly_rent" in serializer.validated_data:
        tenancy.monthly_rent = instance.monthly_rent
        tenancy.save(update_fields=["monthly_rent"])
    if logs_to_create:
        ChangeLog.objects.bulk_create(logs_to_create)

def get_active_tenancy(unit):
    tenancies = list(unit.tenancies.all())
    return tenancies[0] if tenancies else None

def get_tenant_names(tenancy):
    if not tenancy:
        return ""
    return ", ".join(
        tm.tenant.full_name
        for tm in tenancy.tenancy_members.all()
        if tm.is_active
    )


def get_unit_rent_info(unit, tenancy=None, as_of=None):
    if as_of is None:
        as_of = timezone.now().date()
    if tenancy is None:
        tenancy = get_active_tenancy(unit)

    if not tenancy:
        return {
            "paid": Decimal("0.00"),
            "balance": Decimal("0.00"),
            "deposit": None,
            "tenancy_id": None,
            "status": "vacant",
        }

    billing_start = tenancy.get_effective_billing_start()
    if hasattr(billing_start, "date"):
        billing_start = billing_start.date()

    if as_of < billing_start:
        return {
            "paid": Decimal("0.00"),
            "balance": tenancy.balance,
            "deposit": tenancy.get_deposit_held_prefetched(),
            "tenancy_id": tenancy.id,
            "status": "not_billed",
            "billing_start": str(billing_start),
        }

    this_month_paid = Decimal("0.00")
    for payment in tenancy.payments.all():
        if payment.category == "rent" and payment.paid_on.year == as_of.year and payment.paid_on.month == as_of.month:
            this_month_paid += payment.amount_paid if payment.type == "payment" else -payment.amount_paid

    balance = tenancy.balance

    if balance <= 0:
        status = "paid"
    elif balance < tenancy.monthly_rent:
        status = "partial"
    else:
        status = "unpaid"

    return {
        "paid": this_month_paid,
        "balance": balance,
        "deposit": tenancy.get_deposit_held_prefetched(),
        "tenancy_id": tenancy.id,
        "status": status,
    }