from django.utils import timezone
from properties.models import Charge
from decimal import Decimal
from rest_framework.exceptions import ValidationError

SEVERE_VOID_THRESHOLD = 3

def ensure_rent_charge_for_period(tenancy, period=None):
    """
    Create this tenancy's rent charge for the given period (defaults to
    the current month) if it doesn't already exist and billing has
    started. Idempotent - safe to call from a signal, a cron job, or
    anywhere else, any number of times.
    """
    if period is None:
        period = timezone.now().date().replace(day=1)

    billing_start = tenancy.get_effective_billing_start()
    billing_start_period = billing_start.replace(day=1)

    if period < billing_start_period:
        return None, False

    is_first_period = period == billing_start_period
    amount = (
        tenancy.first_month_rent
        if is_first_period and tenancy.first_month_rent is not None
        else tenancy.monthly_rent
    )

    charge, created = Charge.objects.get_or_create(
        tenancy=tenancy,
        accrual_type="rent",
        period=period,
        defaults={
            "charge_type": None,
            "amount": amount,
            "description": f"Rent - {period.strftime('%B %Y')}",
            "status": "pending",
        },
    )
    return charge, created


def reconcile_rent_charges(tenancy, previous_billing_start=None):
    """
    Reconciles automatically generated rent charges after a tenancy's
    billing details change. Invalid charges are voided rather than deleted,
    preserving the ledger history, and the correct current-period charge
    is then created if necessary.
    """
    billing_start_period = tenancy.get_effective_billing_start().replace(day=1)

    stale_charges = tenancy.charges.filter(
        accrual_type="rent",
        period__lt=billing_start_period,
        voided_at__isnull=True,
    )

    for charge in stale_charges:
        charge.voided_at = timezone.now()
        charge.voided_reason = (
            f"Billing start date changed from "
            f"{previous_billing_start} to {tenancy.billing_start_date}."
        )
        charge.status = "waived"
        charge.save(
            update_fields=["voided_at", "voided_reason", "status"]
        )

    ensure_rent_charge_for_period(tenancy, period=billing_start_period)

def check_billing_start_change_impact(tenancy, new_billing_start):
    """
    Returns None if the change is safe/trivial, a dict describing the
    impact if it requires confirmation, or raises ValidationError
    outright if it's too severe for self-service editing.
    """
    new_period = new_billing_start.replace(day=1)
    charges_to_void = tenancy.charges.filter(
        accrual_type="rent",
        period__lt=new_period,
        voided_at__isnull=True,
    )

    affected = []
    total_amount = Decimal("0.00")
    for charge in charges_to_void:
        has_payment = tenancy.payments.filter(
            category="rent",
            paid_on__year=charge.period.year,
            paid_on__month=charge.period.month,
        ).exists()
        if has_payment:
            affected.append(charge.period.strftime("%B %Y"))
            total_amount += charge.amount

    if not affected:
        return None

    if len(affected) >= SEVERE_VOID_THRESHOLD:
        raise ValidationError({
            "detail": (
                f"This change would void {len(affected)} rent charges "
                #f"({', '.join(affected)}) totaling KES {total_amount:,.0f} "
                f"totaling KES {total_amount:,.0f} "
                f"with existing payments. This is too significant to change "
                f"here. Please contact support to correct this tenancy's "
                f"billing history."
            )
        })

    return {
        "affected_periods": affected,
        "total_amount": float(total_amount),
        "message": (
            f"This will void the rent charge for {', '.join(affected)}, "
            f"which already has a recorded payment. That payment will "
            f"remain but will show as unapplied credit."
        ),
    }