from decimal import Decimal
from django.db.models import Prefetch, Subquery, Sum, OuterRef, Value, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from properties.models import Property, Unit, Tenancy, TenancyMember, UnitPayment, Charge

def _prefetch_units(property_obj):
    charge_sum = (
        Charge.objects
        .filter(tenancy=OuterRef("pk"))
        .values("tenancy")
        .annotate(total=Sum("amount"))
        .values("total")
    )
    
    payment_sum = (
        UnitPayment.objects
        .filter(tenancy=OuterRef("pk"))
        .values("tenancy")
        .annotate(total=Sum("amount_paid"))
        .values("total")
    )

    tenancy_queryset = (
        Tenancy.objects
        .filter(is_active=True)
        .annotate(
            ledger_balance=Coalesce(Subquery(charge_sum), Value(0, output_field=DecimalField()))
            - Coalesce(Subquery(payment_sum), Value(0, output_field=DecimalField()))
        )
        .prefetch_related(
            Prefetch(
                "tenancy_members",
                queryset=TenancyMember.objects.filter(is_active=True).select_related("tenant"),
            ),
            "payments",
        )
    )

    return list(
        Unit.objects
        .filter(property=property_obj, is_active=True)
        .prefetch_related(Prefetch("tenancies", queryset=tenancy_queryset))
    )

def _compute_unit_rent_status(unit, tenancy, payments_this_month):
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

    total_balance = tenancy.ledger_balance

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
                if p.paid_on.year == year and p.paid_on.month == month:
                    payments_this_month.append(p)

        rent_status = _compute_unit_rent_status(unit, tenancy, payments_this_month)

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

def get_property_units(property_id):
    now = timezone.now()
    
    property_obj = Property.objects.get(id=property_id)
    
    units = _prefetch_units(property_obj)
    units_payload, _ = _build_units_data(units, now.year, now.month)

    return units_payload