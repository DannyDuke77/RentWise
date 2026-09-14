import uuid
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from services.emails.service import EmailService

from .models import User, Business, BusinessMembership, BusinessInvitation

@transaction.atomic
def register_business_owner(*, name, email, password, company_name, phone_number=None, address=None, avatar=None):
    user = User.objects.create_user(
        name=name,
        email=email,
        password=password,
        phone_number=phone_number,
        address=address,
        avatar=avatar,
        is_verified=True,
    )

    business = Business.objects.create(
        company_name=company_name,
        email=email,
        phone=phone_number,
        address=address,
    )

    BusinessMembership.objects.create(
        business=business,
        user=user,
        role="owner",
    )

    return user, business

def create_business_invitation(*, business, email, role="staff"):
    invitation = BusinessInvitation.objects.create(
        business=business,
        email=email,
        role=role,
        expires_at=timezone.now() + timedelta(days=7),
    )

    transaction.on_commit(
        lambda: send_business_invitation_email(invitation)
    )

    return invitation

def send_business_invitation_email(invitation):
    return EmailService.send_business_invitation(invitation)

@transaction.atomic
def accept_business_invitation(*, token, password):
    invitation = (
        BusinessInvitation.objects
        .select_for_update()
        .select_related("business")
        .filter(token=token)
        .first()
    )

    if not invitation:
        raise ValidationError({
            "token": ["Invalid invitation."]
        })

    if invitation.is_accepted:
        raise ValidationError({
            "token": ["This invitation has already been accepted."]
        })

    if invitation.is_expired:
        raise ValidationError({
            "token": ["This invitation has expired."]
        })

    if invitation.is_cancelled:
        raise ValidationError({
            "token": ["This invitation has already been cancelled."]
        })

    user = User.objects.filter(email__iexact=invitation.email).first()

    if user:
        if BusinessMembership.objects.filter(
            business=invitation.business,
            user=user,
        ).exists():
            raise ValidationError({
                "token": ["This user is already a member of this business."]
            })
    else:
        from django.contrib.auth.password_validation import validate_password

        validate_password(password)

        user = User.objects.create_user(
            name=invitation.email.split("@")[0],
            email=invitation.email,
            password=password,
            is_verified=True,
        )

    BusinessMembership.objects.create(
        business=invitation.business,
        user=user,
        role=invitation.role,
    )

    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["accepted_at"])

    return user, invitation.business

def resend_business_invitation(invitation):
    invitation.token = uuid.uuid4()
    invitation.expires_at = timezone.now() + timedelta(days=7)
    invitation.save(update_fields=["token", "expires_at"])

    transaction.on_commit(
        lambda: send_business_invitation_email(invitation)
    )

    return invitation

def change_business_member_role(*, membership, role):
    if membership.role == "owner":
        raise ValidationError({
            "role": ["The business owner role cannot be changed."]
        })

    if role not in {"manager", "staff"}:
        raise ValidationError({
            "role": ["Invalid business member role."]
        })

    membership.role = role
    membership.save(update_fields=["role"])

    return membership

def remove_business_member(*, membership):
    if membership.role == "owner":
        raise ValidationError({
            "member": ["The business owner cannot be removed."]
        })

    membership.delete()