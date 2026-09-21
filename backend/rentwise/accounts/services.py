"""
Business-level services.

Includes:
  - Business CRUD (create_business)
  - Membership / invitation flows
  - Portal access resolution
  - Landlord dashboard aggregation (single-request snapshot)
  - Dashboard trends (month-bucketed collections)
"""

from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Q, F, DecimalField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.models import Business, BusinessMembership, BusinessInvitation
from accounts.validators import normalize_kenyan_phone
from properties.serializers import PropertyShortSerializer, UnitListSerializer

# ═════════════════════════════════════════════════════════════
# USERS
# ═════════════════════════════════════════════════════════════

def create_user(*, name, email, password, phone_number=None, address=None, avatar=None):
    """
    Create a new user. Kept as a service so the registration serializer
    doesn't need to know about the user model's creation details.
    """
    from accounts.models import User

    user = User.objects.create_user(
        name=name,
        email=email,
        password=password,
        phone_number=phone_number or None,
        address=address or None,
    )

    if avatar:
        user.avatar = avatar
        user.save(update_fields=["avatar"])

    return user


def get_user_portal_access(user):
    """
    Return which portals this user can access, based on their memberships
    and user_type. Used by login serializers and the current-user view.
    """
    has_landlord_membership = BusinessMembership.objects.filter(
        user=user,
    ).exists()

    is_landlord = user.user_type == "landlord" or has_landlord_membership
    is_tenant = user.user_type == "tenant" or hasattr(user, "tenant_profile")
    is_admin = user.user_type == "admin" or user.is_superuser

    return {
        "landlord": is_landlord,
        "tenant": is_tenant,
        "admin": is_admin,
    }


# ═════════════════════════════════════════════════════════════
# BUSINESS
# ═════════════════════════════════════════════════════════════

def create_business(*, user, **business_data):
    """
    Create a business and make the creating user its owner.
    Returns the newly created Business.
    """
    business = Business.objects.create(**business_data)

    BusinessMembership.objects.create(
        business=business,
        user=user,
        role="owner",
    )

    return business


# ═════════════════════════════════════════════════════════════
# INVITATIONS
# ═════════════════════════════════════════════════════════════

def create_business_invitation(*, business, email, role="staff"):
    """
    Create (or refresh) an invitation for the given email.
    If an unaccepted, uncancelled invitation already exists, resend it.
    """
    from datetime import timedelta

    existing = BusinessInvitation.objects.filter(
        business=business,
        email__iexact=email,
        accepted_at__isnull=True,
        cancelled_at__isnull=True,
    ).first()

    if existing:
        existing.expires_at = timezone.now() + timedelta(days=7)
        existing.save(update_fields=["expires_at"])
        return existing

    invitation = BusinessInvitation.objects.create(
        business=business,
        email=email,
        role=role,
        expires_at=timezone.now() + timedelta(days=7),
    )

    # TODO: send invitation email
    return invitation


def resend_business_invitation(invitation):
    """
    Extend an existing invitation's expiry and resend the email.
    """
    from datetime import timedelta

    invitation.expires_at = timezone.now() + timedelta(days=7)
    invitation.save(update_fields=["expires_at"])

    # TODO: send invitation email
    return invitation


def accept_business_invitation(*, token, password):
    """
    Accept an invitation by token. Creates the user if they don't exist,
    otherwise links the existing user to the business.
    Returns (user, business).
    """
    from accounts.models import User

    invitation = BusinessInvitation.objects.select_related("business").filter(
        token=token
    ).first()

    if not invitation:
        raise ValidationError({"detail": "Invalid invitation token."})

    if invitation.is_accepted:
        raise ValidationError({"detail": "This invitation has already been accepted."})

    if invitation.is_cancelled:
        raise ValidationError({"detail": "This invitation has been cancelled."})

    if invitation.is_expired:
        raise ValidationError({"detail": "This invitation has expired."})

    user = User.objects.filter(email__iexact=invitation.email).first()

    if user is None:
        # Create the user
        name = invitation.email.split("@")[0]
        user = User.objects.create_user(
            name=name,
            email=invitation.email,
            password=password,
            user_type="landlord",
        )

    # Link the user to the business
    BusinessMembership.objects.get_or_create(
        business=invitation.business,
        user=user,
        defaults={"role": invitation.role},
    )

    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["accepted_at"])

    return user, invitation.business


# ═════════════════════════════════════════════════════════════
# MEMBERS
# ═════════════════════════════════════════════════════════════

def change_business_member_role(*, membership, role):
    """
    Change a member's role. Owner cannot be demoted via this call.
    """
    if role not in dict(BusinessMembership.ROLE_CHOICES):
        raise ValidationError({"role": ["Invalid role."]})

    if membership.role == "owner":
        raise ValidationError(
            {"detail": "The owner's role cannot be changed."}
        )

    membership.role = role
    membership.save(update_fields=["role"])
    return membership


def remove_business_member(*, membership):
    """
    Remove a member from a business. The owner cannot be removed.
    """
    if membership.role == "owner":
        raise ValidationError(
            {"detail": "The owner cannot be removed from the business."}
        )

    membership.delete()


# ═════════════════════════════════════════════════════════════
# DASHBOARD — SHARED HELPERS
# ═════════════════════════════════════════════════════════════

PERIODS = {
    "30d": 30,
    "90d": 90,
    "1y": 365,
}


def _resolve_period(period):
    """
    Return (start_date, normalized_period_key) for the given period.
    Defaults to 30d.
    """
    if period not in PERIODS:
        period = "30d"
    days = PERIODS[period]
    start = timezone.now().date() - timedelta(days=days)
    return start, period


def _month_buckets(start, end):
    """
    Return [(year, month), ...] covering [start, end] inclusive,
    in chronological order.
    """
    buckets = []
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        buckets.append((y, m))
        if m == 12:
            y, m = y + 1, 1
        else:
            m += 1
    return buckets


# ═════════════════════════════════════════════════════════════
# DASHBOARD — TRENDS
# ═════════════════════════════════════════════════════════════

def get_dashboard_trends(business, period="30d"):
    """
    Month-bucketed rent collections over the given window.
    Returns { period, total, points: [{label, year, month, collected, count}] }.
    """
    from properties.models import UnitPayment

    start_date, normalized = _resolve_period(period)
    today = timezone.now().date()

    rows = (
        UnitPayment.objects
        .filter(
            tenancy__unit__property__business=business,
            category="rent",
            paid_on__date__gte=start_date,
            paid_on__date__lte=today,
        )
        .values("year", "month", "type")
        .annotate(total=Sum("amount_paid"))
    )

    collected_map = {}
    count_map = {}

    for row in rows:
        key = (row["year"], row["month"])
        amount = row["total"] or Decimal("0.00")
        if row["type"] == "refund":
            amount = -amount

        collected_map[key] = collected_map.get(key, Decimal("0.00")) + amount
        count_map[key] = count_map.get(key, 0) + 1

    points = []
    for (y, m) in _month_buckets(start_date, today):
        label = date(y, m, 1).strftime("%b %Y")
        points.append({
            "label": label,
            "year": y,
            "month": m,
            "collected": float(collected_map.get((y, m), Decimal("0.00"))),
            "count": count_map.get((y, m), 0),
        })

    total = sum(p["collected"] for p in points)

    return {
        "period": normalized,
        "points": points,
        "total": total,
    }


# ═════════════════════════════════════════════════════════════
# DASHBOARD — RECENT CHARGES
# ═════════════════════════════════════════════════════════════

def _get_recent_charges(business, limit=5):
    from properties.models import Charge

    charges = (
        Charge.objects
        .filter(tenancy__unit__property__business=business)
        .select_related("charge_type", "tenancy", "tenancy__unit", "tenancy__unit__property")
        .order_by("-created_at")[:limit]
    )

    return [
        {
            "id": str(c.id),
            "type_name": c.charge_type.name if c.charge_type else "Charge",
            "amount": float(c.amount),
            "status": c.status,
            "unit": UnitListSerializer(c.tenancy.unit).data,
            "property": PropertyShortSerializer(c.tenancy.unit.property).data,
            "description": c.description,
            "created_at": c.created_at.isoformat(),
        }
        for c in charges
    ]


# ═════════════════════════════════════════════════════════════
# DASHBOARD — CHANGELOG ACTIVITY
# ═════════════════════════════════════════════════════════════

CHANGELOG_FIELD_MAP = {
    "status": "status",
    "monthly_rent": "rent",
    "name": "name",
    "is_active": "active",
}


def _changelog_to_activity(log):
    label = log.unit.name
    prop = log.unit.property.name

    if log.field_name == "status":
        return f"Unit {label} ({prop}) status changed from {log.old_value} to {log.new_value}"
    if log.field_name == "monthly_rent":
        return f"Unit {label} ({prop}) rent changed from {log.old_value} to {log.new_value}"
    if log.field_name == "name":
        return f"Unit renamed from {log.old_value} to {log.new_value}"
    if log.field_name == "is_active":
        state = "reactivated" if log.new_value == "True" else "deactivated"
        return f"Unit {label} ({prop}) was {state}"
    return None


def _get_recent_changelog_activity(business, since, limit=5):
    from properties.models import ChangeLog

    logs = (
        ChangeLog.objects
        .filter(
            unit__property__business=business,
            field_name__in=list(CHANGELOG_FIELD_MAP.keys()),
            created_at__gte=since,
        )
        .select_related("unit", "unit__property")
        .order_by("-created_at")[:limit]
    )

    items = []
    for log in logs:
        text = _changelog_to_activity(log)
        if text:
            items.append({
                "id": str(log.id),
                "type": "unit_change",
                "text": text,
                "created_at": log.created_at.isoformat(),
            })
    return items


# ═════════════════════════════════════════════════════════════
# DASHBOARD — MAIN SNAPSHOT
# ═════════════════════════════════════════════════════════════

def get_business_dashboard(business):
    """
    Dashboard snapshot for a business. Single source of truth for
    everything the landlord dashboard needs.
    """
    from properties.models import Property, Unit, Tenancy, UnitPayment

    now = timezone.now()
    today = now.date()

    month_start = today.replace(day=1)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # ── Portfolio ─────────────────────────────────────────
    properties_qs = Property.objects.filter(business=business, is_active=True)
    units_qs = Unit.objects.filter(property__business=business, is_active=True)

    total_properties = properties_qs.count()
    total_units = units_qs.count()
    occupied = units_qs.filter(status="occupied").count()
    vacant = units_qs.filter(status="vacant").count()
    maintenance = units_qs.filter(status="maintenance").count()

    occupancy_rate = (
        round((occupied / total_units) * 100, 2) if total_units else 0.0
    )

    # ── Payments collected (this month vs last) ───────────
    base_payments = UnitPayment.objects.filter(
        tenancy__unit__property__business=business,
        category="rent",
    )

    collected_this_month = (
        base_payments
        .filter(paid_on__date__gte=month_start, paid_on__date__lte=today)
        .aggregate(
            total=Coalesce(
                Sum("amount_paid", filter=Q(type="payment")),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            refunds=Coalesce(
                Sum("amount_paid", filter=Q(type="refund")),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        )
    )

    collected_this_month = float(
        (collected_this_month["total"] or 0) - (collected_this_month["refunds"] or 0)
    )

    collected_prev = (
        base_payments
        .filter(paid_on__date__gte=prev_month_start, paid_on__date__lt=month_start)
        .aggregate(
            total=Coalesce(
                Sum("amount_paid", filter=Q(type="payment")),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            refunds=Coalesce(
                Sum("amount_paid", filter=Q(type="refund")),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        )
    )
    collected_prev_month = float(
        (collected_prev["total"] or 0) - (collected_prev["refunds"] or 0)
    )

    if collected_prev_month > 0:
        change_pct = round(
            (collected_this_month - collected_prev_month) / collected_prev_month * 100,
            1,
        )
    else:
        change_pct = None

    # ── Overdue — active tenancies with a positive balance ─
    active_tenancies = (
        Tenancy.objects
        .filter(unit__property__business=business, is_active=True)
        .select_related("unit", "unit__property")
        .prefetch_related("tenants")
    )

    overdue = []
    for t in active_tenancies:
        try:
            bal = t.calculate_balance()
        except Exception:
            bal = Decimal("0.00")

        if bal > 0:
            primary_tenant = t.tenants.first()
            overdue.append({
                "unit": UnitListSerializer(t.unit).data,
                "property": PropertyShortSerializer(t.unit.property).data,
                "tenant_name": primary_tenant.full_name if primary_tenant else None,
                "amount_due": float(bal),
                "days_overdue": (today - t.start_date).days if t.start_date else 0,
            })

    overdue.sort(key=lambda r: r["amount_due"], reverse=True)
    rent_outstanding = sum(r["amount_due"] for r in overdue)
    unpaid_units_count = len(overdue)
    overdue_top5 = overdue[:5]

    # ── Recent activity ───────────────────────────────────
    recent = []

    recent_payments = (
        UnitPayment.objects
        .filter(tenancy__unit__property__business=business)
        .select_related("tenancy", "tenancy__unit")
        .prefetch_related("tenancy__tenants")
        .order_by("-created_at")[:5]
    )
    for p in recent_payments:
        tenant = p.tenancy.tenants.first() if p.tenancy else None
        label = tenant.full_name if tenant else "A tenant"
        verb = "paid" if p.type == "payment" else "was refunded"
        recent.append({
            "id": str(p.id),
            "type": "payment",
            "text": f"{label} {verb} {business.currency} {p.amount_paid:,.0f} for Unit {p.tenancy.unit.name}",
            "created_at": p.created_at.isoformat(),
        })

    recent_tenancies = (
        Tenancy.objects
        .filter(
            unit__property__business=business,
            created_at__gte=now - timedelta(days=14),
        )
        .select_related("unit")
        .order_by("-created_at")[:3]
    )
    for t in recent_tenancies:
        recent.append({
            "id": str(t.id),
            "type": "tenancy",
            "text": f"New tenancy started for Unit {t.unit.name}",
            "created_at": t.created_at.isoformat(),
        })

    recent_maintenance = (
        units_qs
        .filter(status="maintenance", updated_at__gte=now - timedelta(days=14))
        .select_related("property")
        .order_by("-updated_at")[:3]
    )
    for u in recent_maintenance:
        recent.append({
            "id": str(u.id),
            "type": "maintenance",
            "text": f"Maintenance logged for Unit {u.name}",
            "created_at": u.updated_at.isoformat(),
        })

    recent.extend(
        _get_recent_changelog_activity(
            business,
            since=now - timedelta(days=14),
            limit=5,
        )
    )

    recent.sort(key=lambda r: r["created_at"], reverse=True)
    recent = recent[:10]

    # ── Properties preview ────────────────────────────────
    properties_preview = (
        properties_qs
        .annotate(
            units_count=Count("units", filter=Q(units__is_active=True), distinct=True),
            occupied_units_count=Count(
                "units",
                filter=Q(units__is_active=True, units__status="occupied"),
                distinct=True,
            ),
        )
        .order_by("-updated_at")[:5]
    )

    preview_list = [
        {
            "id": str(p.id),
            "name": p.name,
            "units_count": p.units_count,
            "occupied_units_count": p.occupied_units_count,
        }
        for p in properties_preview
    ]

    return {
        "kpis": {
            "occupancy_rate": occupancy_rate,
            "total_properties": total_properties,
            "total_units": total_units,
            "occupied": occupied,
            "vacant": vacant,
            "maintenance": maintenance,
            "rent_collected_this_month": collected_this_month,
            "rent_collected_prev_month": collected_prev_month,
            "rent_collected_change_pct": change_pct,
            "rent_outstanding": round(rent_outstanding, 2),
            "unpaid_units_count": unpaid_units_count,
        },
        "overdue_units": overdue_top5,
        "recent_activity": recent,
        "recent_charges": _get_recent_charges(business, limit=5),
        "properties_preview": preview_list,
    }