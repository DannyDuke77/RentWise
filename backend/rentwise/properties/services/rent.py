from decimal import Decimal
from django.db.models import Prefetch
from django.utils import timezone

from properties.models import Property, Unit, Tenancy, TenancyMember
from .unit_service import get_active_tenancy, get_tenant_names, get_unit_rent_info

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

        tenancy = get_active_tenancy(unit)
        rent_status = get_unit_rent_info(unit, tenancy=tenancy, as_of=as_of)

        if tenancy:
            occupied_count += 1
            rent = unit.monthly_rent
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
            elif rent_status["status"] == "unpaid":
                unpaid_units += 1

            tenant_names = get_tenant_names(tenancy)
        else:
            tenant_names = ""

        rent_status_payload = {
            "paid": float(rent_status["paid"]),
            "balance": float(rent_status["balance"]),
            "deposit": float(rent_status["deposit"]) if rent_status["deposit"] is not None else None,
            "status": rent_status["status"],
        }
        if "billing_start" in rent_status:
            rent_status_payload["billing_start"] = rent_status["billing_start"]

        units_payload.append({
            "id": str(unit.id),
            "property": {
                "id": str(unit.property.id),
                "name": unit.property.name,
            },
            "name": unit.name,
            "monthly_rent": float(unit.monthly_rent),
            "status": unit.status,
            "floor": unit.floor,
            "is_active": unit.is_active,
            "tenant_names": tenant_names,
            "tenancy_id": str(tenancy.id) if tenancy else None,
            "rent_status": rent_status_payload,
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
    units_payload, summary = _build_units_data(units, now.year, now.month)

    return {
        "property": {
            "id": str(property_obj.id),
            "name": property_obj.name,
            "location": property_obj.location,
        },
        "units": units_payload,
        "summary": summary,
    }


def get_property_units(property_id, search=None, status=None, rent_status=None):
    now = timezone.now()

    property_obj = Property.objects.get(id=property_id)

    units = _prefetch_units(property_obj)

    if search:
        units = [
            unit for unit in units
            if search.lower() in unit.name.lower()
               or search.lower() in get_tenant_names(get_active_tenancy(unit)).lower()
        ]

    if status:
        units = [unit for unit in units if unit.status == status]

    units_payload, _ = _build_units_data(units, now.year, now.month)

    if rent_status:
        units_payload = [u for u in units_payload if u["rent_status"]["status"] == rent_status]

    return units_payload