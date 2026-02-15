from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.exceptions import ValidationError
from ..models import Tenancy, Tenant, TenancyMember
from accounts.validators import normalize_kenyan_phone

@transaction.atomic
def add_tenant_to_unit(unit, data):
    if hasattr(data, 'dict'):
        data = data.dict()
    else:
        data = data.copy()

    if Tenancy.objects.filter(unit=unit, is_active=True).exists():
        raise ValidationError("Unit is currently occupied")
    
    if unit.status == "maintenance":
        raise ValidationError("Unit is under maintenance")

    for field in ["full_name", "id_number", "phone"]:
        if not data.get(field):
            raise ValidationError({"errors": {field: ["Required"]}})
        
    try:
        # 1. Attempt normalization
        data["phone"] = normalize_kenyan_phone(data["phone"])

        # 2. Attempt tenant retrieval/creation
        # We wrap this too in case the model's clean() or save() methods 
        # also call validators that raise DjangoValidationError
        tenant, created = Tenant.objects.get_or_create(
            id_number=data["id_number"],
            defaults={
                "full_name": data["full_name"],
                "phone": data["phone"],
                "email": data.get("email"),
                "is_active": True
            }
        )
    except DjangoValidationError as e:
        # This catches the 'Invalid Kenyan phone number' message
        # and sends it back as {"phone": ["Invalid Kenyan phone number."]}
        raise ValidationError({"phone": e.messages})

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
    
    TenancyMember.objects.create(tenancy=tenancy, tenant=tenant, is_active=True)

    unit.status = "occupied"
    unit.save(update_fields=["status"])

    return tenancy, tenant

@transaction.atomic
def vacate_unit(unit):
    tenancy = Tenancy.objects.select_for_update().filter(unit=unit, is_active=True).first()
    if not tenancy:
        raise ValidationError("No active tenancy found.")

    # 1. End the lease contract
    tenancy.is_active = False
    tenancy.end_date = timezone.now().date()
    tenancy.save()

    # 2. Mark ALL members of this tenancy as having left
    TenancyMember.objects.filter(tenancy=tenancy, is_active=True).update(
        is_active=False,
        left_at=timezone.now()
    )

    unit.status = "vacant"
    unit.save()
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
    
    # Find the specific relationship record
    membership = get_object_or_404(
        TenancyMember, 
        tenancy=tenancy, 
        tenant_id=tenant_id, 
        is_active=True
    )

    if tenancy.tenants.filter(tenancymember__is_active=True).count() <= 1:
        raise ValidationError("At least one tenant must stay. To remove everyone, use 'Vacate'.")

    # Mark the relationship as inactive and set the leave date
    membership.is_active = False
    membership.left_at = timezone.now()
    membership.save(update_fields=['is_active', 'left_at'])