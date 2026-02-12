from django.db import transaction
from rest_framework.exceptions import ValidationError
from properties.models import Unit, Tenancy, ChangeLog

@transaction.atomic
def update_unit(unit, serializer, user):
    tenancy = unit.tenancies.filter(is_active=True).first()
    new_status = serializer.validated_data.get("status")

    if new_status and new_status != unit.status:
        if unit.status == "occupied":
            raise ValidationError({"detail": "Cannot change status of an occupied unit."})
        
        if new_status not in ["vacant", "maintenance"]:
            raise ValidationError({"detail": "Only 'vacant' and 'maintenance' allowed."})

    logs_to_create = []
    for field in ["name", "monthly_rent", "floor", "status"]:
        if field in serializer.validated_data:
            old_val = getattr(unit, field)
            new_val = serializer.validated_data[field]
            if str(old_val) != str(new_val):
                logs_to_create.append(ChangeLog(
                    unit=unit,
                    changed_by=user,
                    field_name=field,
                    old_value=str(old_val),
                    new_value=str(new_val)
                ))

    instance = serializer.save()
    if tenancy and "monthly_rent" in serializer.validated_data:
        tenancy.monthly_rent = instance.monthly_rent
        tenancy.save(update_fields=["monthly_rent"])
    if logs_to_create:
        ChangeLog.objects.bulk_create(logs_to_create)
