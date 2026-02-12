from rest_framework import serializers

from .models import ChangeLog, Property, Unit, Tenant, UnitPayment, Tenancy, Charge, ChargeType

from properties.services.rent import get_unit_rent_status, get_property_rent_summary
from accounts.validators import normalize_kenyan_phone

class UnitListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = [
            'id',
            'name',
            'status',
        ]

class PropertyShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'id',
            'name',
        ]

class ChangeLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    def get_changed_by_name(self, obj):
        return obj.changed_by.name if obj.changed_by else "System"

    class Meta:
        model = ChangeLog
        fields = [
            'id', 
            'field_name', 
            'old_value', 
            'new_value', 
            'created_at', 
            'changed_by_name'
        ]
class UnitDetailSerializer(serializers.ModelSerializer):
    property = PropertyShortSerializer(read_only=True) 
    tenant_names = serializers.SerializerMethodField()
    rent_status = serializers.SerializerMethodField()
    change_logs = ChangeLogSerializer(many=True, read_only=True)
   
    class Meta:
        model = Unit
        fields = ['id', 'property', 'name', 'monthly_rent', 'status', 'floor', 'is_active', 'tenant_names', 'rent_status', 'change_logs',]
        read_only_fields = ['property']

    def get_tenant_names(self, obj):
        active_tenancy = obj.tenancies.filter(is_active=True).first()
        if active_tenancy:
            return ", ".join([tenant.full_name for tenant in active_tenancy.tenants.all()])
        return None
    
    def get_rent_status(self, unit):
        from properties.services.rent import get_unit_rent_status
        return get_unit_rent_status(unit)
    
class TenantSerializer(serializers.ModelSerializer):
    units = serializers.SerializerMethodField()
    class Meta:
        model = Tenant
        fields = [
            'id', 
            'full_name', 
            'phone', 
            'email', 
            'id_number', 
            'created_at',
            'left_at',
            'units',
            'is_active',
            'units',
        ]

    def get_units(self, tenant):
        tenancies = Tenancy.objects.filter(
            tenants=tenant,
            is_active=True
        ).select_related("unit")

        return UnitListSerializer(
            [t.unit for t in tenancies],
            many=True
        ).data
    
    def validate_phone(self, value):
        """
        Replaces TenantForm.clean_phone logic.
        """
        return normalize_kenyan_phone(value)

class PropertyDetailSerializer(serializers.ModelSerializer):
    units = UnitDetailSerializer(read_only=True, many=True)

    class Meta:
        model = Property
        fields = [
            'id', 
            'name', 
            'property_type', 
            'location', 
            'description', 
            'is_active', 
            'created_at', 
            'updated_at',
            'units'
        ]

class UnitRentStatusSerializer(serializers.ModelSerializer):
    rent_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Unit
        fields = [
            'id',
            'name',
            'monthly_rent',
            'rent_status'
        ]

    def get_rent_status(self, unit):
        return get_unit_rent_status(unit)
    
class UnitPaymentSerializer(serializers.ModelSerializer):
    tenancy_start = serializers.DateField(source="tenancy.start_date", read_only=True)
    unit_name = serializers.CharField(source="tenancy.unit.name", read_only=True)

    class Meta:
        model = UnitPayment
        fields = [
            "id",
            "tenancy",
            "tenancy_start",
            "unit_name",
            "amount_paid",
            "payment_method",
            "type",
            "paid_on",
            "paid_for",
            "reference",
        ]

class PropertyRentSummarySerializer(serializers.ModelSerializer):
    summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id',
            'name',
            'summary'
        ]

    def get_summary(self, property):
        return get_property_rent_summary(property)
    
class UnitPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPayment
        fields = ["id", "amount_paid", "payment_method", "type", "paid_on", "paid_for", "reference", "notes",]
        extra_kwargs = {
            'payment_method': {
                'error_messages': {
                    'invalid_choice': 'Please select a valid payment method.',
                    'required': 'Payment method is required.',
                }
            },
        }

    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
    
class TenancySerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True)

    class Meta:
        model = Tenancy
        fields = [
            "id",
            "tenants",
            "unit",
            "start_date",
            "end_date",
            "monthly_rent",
            "carried_arrears",
            "is_active"
        ]
        read_only_fields = ["id"]

class TenancyDropdownSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    property_name = serializers.CharField(source="unit.property.name", read_only=True)

    class Meta:
        model = Tenancy
        fields = ['id', 'unit_name', 'property_name', 'start_date', 'end_date']

class ChargeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeType
        fields = ['id', 'name', 'default_amount', 'is_active', 'created_at']

class ChargeTypeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeType
        fields = ['id', 'name', 'default_amount', 'is_active']

    def validate_default_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Default amount must be greater than zero.")
        return value

class ChargeSerializer(serializers.ModelSerializer):
    charge_type_name = serializers.CharField(source="charge_type.name", read_only=True)
    unit_name = serializers.CharField(source="tenancy.unit.name", read_only=True)
    property_name = serializers.CharField(source="tenancy.unit.property.name", read_only=True)

    class Meta:
        model = Charge
        fields = [
            'id',
            'tenancy',
            'unit_name',
            'property_name',
            'charge_type',
            'charge_type_name',
            'amount',
            'description',
            'status',
            'created_at',
        ]

class ChargeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charge
        fields = ['tenancy', 'charge_type', 'amount', 'description']

class ChargeStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charge
        fields = ['status']

    def validate_status(self, value):
        if value not in ['paid', 'waived']:
            raise serializers.ValidationError("Status must be either 'paid' or 'waived'.")
        return value