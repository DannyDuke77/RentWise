from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from ..models import Tenancy, Tenant

@transaction.atomic
def add_tenant_to_unit(unit, data):
    if Tenancy.objects.filter(unit=unit, is_active=True).exists():
        raise ValidationError("Unit is currently occupied")
    
    if unit.status == "maintenance":
        raise ValidationError("Unit is under maintenance")

    for field in ["full_name", "id_number", "phone"]:
        if not data.get(field):
            raise ValidationError({"errors": {field: ["Required"]}})

    tenant, created = Tenant.objects.get_or_create(
        id_number=data["id_number"],
        defaults={
            "full_name": data["full_name"],
            "phone": data["phone"],
            "email": data.get("email"),
            "is_active": True
        }
    )

    tenancy = Tenancy.objects.create(
        unit=unit,
        start_date=timezone.now().date(),
        monthly_rent=unit.monthly_rent,
    )
    tenancy.tenants.add(tenant)

    unit.status = "occupied"
    unit.save(update_fields=["status"])

    return tenancy, tenant

@transaction.atomic
def vacate_unit(unit):
    tenancy = Tenancy.objects.filter(
        unit=unit,
        is_active=True
    ).first()

    if not tenancy:
        raise ValidationError("No active tenancy found for this unit.")

    tenants = list(tenancy.tenants.all())

    # deactivate tenancy
    tenancy.is_active = False
    tenancy.end_date = timezone.now().date()
    tenancy.save(update_fields=["is_active", "end_date"])

    # deactivate tenants
    for tenant in tenants:
        tenant.left_at = timezone.now()
        tenant.is_active = False
        tenant.save(update_fields=["left_at", "is_active"])

    tenancy.tenants.clear()

    # reset unit
    unit.status = "vacant"
    unit.save(update_fields=["status"])

    return tenancy

def add_roommate_to_unit(unit, data):
    tenancy = get_object_or_404(Tenancy, unit=unit, is_active=True)

    required_fields = ["full_name", "id_number", "phone"]
    errors = {f: ["This field is required."] for f in required_fields if not data.get(f)}
    if errors:
        raise ValidationError(errors)

    tenant, _ = Tenant.objects.get_or_create(
        id_number=data["id_number"],
        defaults={
            "full_name": data["full_name"],
            "phone": data["phone"],
            "email": data.get("email"),
            "is_active": True,
        }
    )

    if tenancy.tenants.filter(id=tenant.id).exists():
        raise ValidationError("Tenant already part of this tenancy")

    tenancy.tenants.add(tenant)

    return tenant

@transaction.atomic
def remove_roommate_from_unit(unit, tenant_id):
    tenancy = get_object_or_404(Tenancy, unit=unit, is_active=True)
    tenant = get_object_or_404(Tenant, id=tenant_id)

    # Validation: Ensure at least one person stays in the unit
    if tenancy.tenants.count() <= 1:
        raise ValidationError("At least one tenant must stay in the unit")

    tenancy.tenants.remove(tenant)

    # Update tenant status
    tenant.left_at = timezone.now()
    tenant.is_active = False
    tenant.save(update_fields=["left_at", "is_active"])