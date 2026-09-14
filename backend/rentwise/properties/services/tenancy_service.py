from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

from accounts.models import User

from ..models import Tenancy, Tenant, TenancyMember, TenantInvitation
from accounts.validators import normalize_kenyan_phone
from services.emails.service import EmailService

@transaction.atomic
def add_tenant_or_roommate_to_unit(unit, data, billing_start_date=None):
    data = data.dict() if hasattr(data, 'dict') else data.copy()

    if unit.status == "maintenance":
        raise ValidationError({"errors": {"unit": ["Unit is under maintenance."]}})

    errors = {}
    required_fields = ["full_name", "id_number", "phone"]
    
    active_tenancy = Tenancy.objects.filter(unit=unit, is_active=True).first()
    if not active_tenancy:
        required_fields.append("billing_start_date")

    for field in required_fields:
        if not data.get(field):
            errors[field] = ["This field is required."]

    if errors:
        raise ValidationError({
            "errors": errors
        })

    try:
        normalized_phone = normalize_kenyan_phone(data["phone"])

        tenant, _ = Tenant.objects.get_or_create(
            id_number=data["id_number"],
            defaults={
                "full_name": data["full_name"],
                "phone": normalized_phone,
                "email": data.get("email"),
                "is_active": True
            }
        )
    except DjangoValidationError as e:
        raise ValidationError({"errors": {"phone": e.messages}})

    if active_tenancy:
        if TenancyMember.objects.filter(tenancy=active_tenancy, tenant=tenant).exists():
            raise ValidationError({"errors": {"id_number": ["Tenant is already part of this active tenancy."]}})
        
        TenancyMember.objects.create(
            tenancy=active_tenancy,
            tenant=tenant
        )
        tenancy = active_tenancy
        is_roommate = True
    else:
        start_date = data.get("billing_start_date") or timezone.now().date()
        
        tenancy = Tenancy.objects.create(
            unit=unit,
            start_date=start_date,
            monthly_rent=unit.monthly_rent,
            billing_start_date=billing_start_date or start_date,
            is_active=True
        )
        
        TenancyMember.objects.create(
            tenancy=tenancy, 
            tenant=tenant
        )

        unit.status = "occupied"
        unit.save(update_fields=["status"])
        is_roommate = False

    create_tenant_invitation(tenant)

    return tenancy, tenant, is_roommate

def create_tenant_invitation(tenant):
    if not tenant.email:
        return None

    if tenant.user:
        return None

    invitation = TenantInvitation.objects.create(
        tenant=tenant,
        email=tenant.email,
        expires_at=timezone.now() + timedelta(days=7),
    )

    transaction.on_commit(
        lambda: send_tenant_invitation_email(invitation)
    )

    return invitation

def send_tenant_invitation_email(invitation):
    return EmailService.send_tenant_invitation(invitation)

@transaction.atomic
def accept_tenant_invitation(token, password):
    invitation = (TenantInvitation.objects.select_for_update().select_related("tenant").filter(token=token).first())

    if not invitation:
        raise ValidationError({"token": ["Invalid invitation."]})

    if invitation.is_accepted:
        raise ValidationError({"token": ["This invitation has already been accepted."]})

    if invitation.is_expired:
        raise ValidationError({"token": ["This invitation has expired."]})

    tenant = invitation.tenant

    if tenant.user:
        raise ValidationError({"token": ["This tenant already has an account."]})

    validate_password(password)

    user = User.objects.create_user(
        name=tenant.full_name,
        email=invitation.email,
        password=password,
        is_verified=True,
    )

    tenant.user = user
    tenant.save(update_fields=["user"])

    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["accepted_at"])

    return user, tenant

@transaction.atomic
def vacate_unit(unit):
    tenancy = Tenancy.objects.select_for_update().filter(unit=unit, is_active=True).first()
    if not tenancy:
        raise ValidationError({"errors": {"unit": ["No active tenancy found for this unit."]}})

    # Deactivate active tenancy
    tenancy.is_active = False
    tenancy.end_date = timezone.now().date()
    tenancy.save(update_fields=["is_active", "end_date"])

    # Deactivate all tenancy memberships
    TenancyMember.objects.filter(tenancy=tenancy, is_active=True).update(
        is_active=False,
        left_at=timezone.now()
    )

    # Update unit status
    unit.status = "vacant"
    unit.save(update_fields=["status"])
    return tenancy


@transaction.atomic
def remove_roommate_from_unit(unit, tenant_id):
    tenancy = get_object_or_404(Tenancy, unit=unit, is_active=True)
    
    membership = get_object_or_404(
        TenancyMember, 
        tenancy=tenancy, 
        tenant_id=tenant_id, 
        is_active=True
    )

    active_members_count = TenancyMember.objects.filter(tenancy=tenancy, is_active=True).count()
    if active_members_count <= 1:
        raise ValidationError({
            "errors": {"tenant": ["At least one tenant must remain. To remove everyone, use Vacate Unit."]}
        })

    membership.is_active = False
    membership.left_at = timezone.now()
    membership.save(update_fields=['is_active', 'left_at'])

    return membership