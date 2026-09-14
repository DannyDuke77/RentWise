from decimal import Decimal
from django.db.models import Prefetch
from django.utils import timezone
from properties.models import Property, Unit, Tenancy, TenancyMember

def _prefetch_units(property_obj):
    tenancy_queryset = (
        Tenancy.objects
        .filter(is_active=True)
        .prefetch_related(
            Prefetch(
                "tenancy_members",
                queryset=TenancyMember.objects.filter(is_active=True).select_related("tenant"),
            ),
            "payments",
            "charges",
        )
    )

    return list(
        Unit.objects
        .filter(property=property_obj, is_active=True)
        .prefetch_related(Prefetch("tenancies", queryset=tenancy_queryset))
    )

def _calculate_tenancy_balance(tenancy, as_of):
    billing_start = tenancy.billing_start_date or tenancy.start_date

    if as_of < billing_start:
        total_rent_due = Decimal("0.00")
    else:
        months_elapsed = ((as_of.year - billing_start.year) * 12
            + (as_of.month - billing_start.month) + 1)
        total_rent_due = Decimal(months_elapsed) * tenancy.monthly_rent

    total_charges = sum(
        (c.amount for c in tenancy.charges.all() if c.status != "waived"),
        Decimal("0.00"),
    )

    # Only "rent" category payments count against the rent ledger — deposits
    # are tracked separately and must never look like a rent payment.
    total_paid = sum(
        (p.amount_paid if p.type == "payment" else -p.amount_paid
         for p in tenancy.payments.all() if p.category == "rent"),
        Decimal("0.00"),
    )

    return total_rent_due + total_charges - total_paid

def _compute_unit_rent_status(unit, tenancy, payments_this_month, as_of):
    if not tenancy:
        return {
            "rent": unit.monthly_rent,
            "paid": Decimal("0.00"),
            "balance": Decimal("0.00"),
            "status": "vacant",
        }

    this_month_paid = Decimal("0.00")
    for p in payments_this_month:
        if p.type == "payment":
            this_month_paid += p.amount_paid
        elif p.type == "refund":
            this_month_paid -= p.amount_paid

    total_balance = _calculate_tenancy_balance(tenancy, as_of)

    if total_balance <= 0:
        status = "paid"
    elif total_balance < tenancy.monthly_rent:
        status = "partial"
    else:
        status = "unpaid"

    return {
        "rent": tenancy.monthly_rent,
        "paid": this_month_paid,
        "balance": total_balance,
        "status": status,
    }


def _build_units_data(units, year, month):
    as_of = timezone.now().date()
    expected = Decimal("0.00")
    occupied_expected = Decimal("0.00")
    total_arrears = Decimal("0.00")
    total_credits = Decimal("0.00")
    effective_collection = Decimal("0.00")

    paid_units = 0
    partial_units = 0
    unpaid_units = 0
    occupied_count = 0
    total_count = 0

    units_payload = []

    for unit in units:
        total_count += 1
        expected += unit.monthly_rent

        all_tenancies = unit.tenancies.all()
        tenancy = all_tenancies[0] if all_tenancies else None

        payments_this_month = []
        if tenancy:
            for p in tenancy.payments.all():
                if p.category == "rent" and p.paid_on.year == year and p.paid_on.month == month:
                    payments_this_month.append(p)

        rent_status = _compute_unit_rent_status(unit, tenancy, payments_this_month, as_of)

        if tenancy:
            occupied_count += 1
            rent = rent_status["rent"]
            balance = rent_status["balance"]
            month_paid = rent_status["paid"]
            
            occupied_expected += rent

            if balance > 0:
                total_arrears += balance
            elif balance < 0:
                total_credits += abs(balance)

            if rent_status["status"] == "paid":
                effective_collection += rent
                paid_units += 1
            elif rent_status["status"] == "partial":
                effective_collection += min(month_paid, rent)
                partial_units += 1
            else:
                unpaid_units += 1

            tenant_names = ", ".join(
                tm.tenant.full_name for tm in tenancy.tenancy_members.all()
            )
        else:
            tenant_names = ""

        units_payload.append({
            "id": str(unit.id),
            "name": unit.name,
            "property": str(unit.property.name),
            "status": unit.status,
            "floor": unit.floor,
            "monthly_rent": float(unit.monthly_rent),
            "tenant_names": tenant_names,
            "rent_status": {
                "rent": float(rent_status["rent"]),
                "paid": float(rent_status["paid"]),
                "balance": float(rent_status["balance"]),
                "status": rent_status["status"],
            },
        })

    summary = {
        "expected": float(expected),
        "occupied_expected": float(occupied_expected),
        "paid": float(effective_collection),
        "balance": float(total_arrears),
        "total_credits": float(total_credits),
        "occupied_units": occupied_count,
        "paid_units": paid_units,
        "partial_units": partial_units,
        "unpaid_units": unpaid_units,
        "total_units": total_count,
    }

    return units_payload, summary

def get_property_dashboard(property_id):
    now = timezone.now()
    
    property_obj = Property.objects.get(id=property_id)
    
    units = _prefetch_units(property_obj)
    _, summary = _build_units_data(units, now.year, now.month)

    return {
        "property": {
            "id": str(property_obj.id),
            "name": property_obj.name,
            "location": property_obj.location,
        },
        "summary": summary,
    }

def get_property_units(property_id, search=None, status=None, rent_status=None):
    now = timezone.now()
    
    property_obj = Property.objects.get(id=property_id)
    
    units = _prefetch_units(property_obj)
    
    if search:
        units = [
            unit for unit in units 
            if search.lower() in unit.name.lower() or
               search.lower() in _get_tenant_names(unit).lower()
        ]

    if status:
        units = [unit for unit in units if unit.status == status]
    
    units_payload, _ = _build_units_data(units, now.year, now.month)

    if rent_status:
        units_payload = [unit for unit in units_payload if unit["rent_status"]["status"] == rent_status]
    
    return units_payload

def _get_tenant_names(unit):
    all_tenancies = list(unit.tenancies.all())
    active_tenancy = all_tenancies[0] if all_tenancies else None
    if active_tenancy:
        return ", ".join([
            member.tenant.full_name 
            for member in active_tenancy.tenancy_members.all() 
            if member.is_active
        ])
    return ""