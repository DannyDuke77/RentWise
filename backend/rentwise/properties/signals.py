import logging
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Charge, Tenancy
from .services.balance import recompute_tenancy_balance
from .services.billing import ensure_rent_charge_for_period, reconcile_rent_charges

logger = logging.getLogger(__name__)

_billing_tracked_fields = ("billing_start_date", "start_date", "monthly_rent", "first_month_rent")

@receiver(post_save, sender=Charge)
def charge_saved(sender, instance, **kwargs):
    recompute_tenancy_balance(instance.tenancy)

@receiver(post_delete, sender=Charge)
def charge_deleted(sender, instance, **kwargs):
    recompute_tenancy_balance(instance.tenancy)

@receiver(pre_save, sender=Tenancy)
def stash_old_billing_fields(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Tenancy.objects.get(pk=instance.pk)
            instance._old_billing_snapshot = {
                f: getattr(old, f) for f in _billing_tracked_fields
            }
        except Tenancy.DoesNotExist:
            instance._old_billing_snapshot = None
    else:
        instance._old_billing_snapshot = None

@receiver(post_save, sender=Tenancy)
def tenancy_saved(sender, instance, created, **kwargs):
    if created:
        if instance.is_active:
            ensure_rent_charge_for_period(instance)
        return

    old = getattr(instance, "_old_billing_snapshot", None)
    if old is None:
        return

    changed = any(getattr(instance, f) != old[f] for f in _billing_tracked_fields)
    if changed:
        reconcile_rent_charges(instance)
        logger.info("Tenancy %s: billing fields changed, rent charges reconciled.", instance.pk)