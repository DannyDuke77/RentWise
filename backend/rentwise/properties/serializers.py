from rest_framework import serializers
from .models import ChangeLog, Property, Unit, Tenant, UnitPayment, Tenancy, Charge, ChargeType
from accounts.validators import normalize_kenyan_phone

class UnitListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'status']

class PropertyShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'name']

class ChangeLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    def get_changed_by_name(self, obj):
        return obj.changed_by.name if obj.changed_by else "System"

    class Meta:
        model = ChangeLog
        fields = ['id', 'field_name', 'old_value', 'new_value', 'created_at', 'changed_by_name']

class UnitDetailSerializer(serializers.ModelSerializer):
    property = PropertyShortSerializer(read_only=True)
    tenant_names = serializers.SerializerMethodField()
    change_logs = ChangeLogSerializer(many=True, read_only=True)
   
    class Meta:
        model = Unit
        fields = [
            'id', 'property', 'name', 'monthly_rent', 'status', 
            'floor', 'is_active', 'tenant_names', 'change_logs'
        ]
        read_only_fields = ['property']

    def get_tenant_names(self, obj):
        """
        Dumb Transformer: Extracts strings from the active prefetch chain.
        """
        all_tenancies = list(obj.tenancies.all())
        active_tenancy = all_tenancies[0] if all_tenancies else None
        if active_tenancy:
            return ", ".join([
                member.tenant.full_name 
                for member in active_tenancy.tenancy_members.all() 
                if member.is_active
            ])
        return ""

class TenantSerializer(serializers.ModelSerializer):
    units = serializers.SerializerMethodField()
    tenancies = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'full_name', 'phone', 'email', 'id_number', 
            'created_at', 'left_at', 'is_active', 'units', 'tenancies'
        ]

    def get_units(self, tenant):
        # 1. Check if the prefetch cache is populated for 'tenancy_members'
        has_cache = (
            hasattr(tenant, '_prefetched_objects_cache') and 
            'tenancy_members' in tenant._prefetched_objects_cache
        )

        if has_cache:
            # print(f"MEMORY CACHE HIT: Units for tenant '{tenant.full_name}' read from prefetch cache without hitting DB!")
            tenancies = tenant.tenancy_members.all()
            active_units = [
                m.tenancy.unit
                for m in tenancies
                if m.is_active and m.tenancy.unit
            ]
        else:
            # print(f"DATABASE HIT: No prefetch cache found for tenant '{tenant.full_name}'. Querying DB directly!")
            active_units = [
                t.unit
                for t in Tenancy.objects.filter(
                    tenants=tenant,
                    is_active=True
                ).select_related("unit")
            ]

        return UnitListSerializer(active_units, many=True).data
    
    def get_tenancies(self, tenant):
        memberships = tenant.tenancy_members.all().select_related(
            'tenancy__unit', 'tenancy__unit__property'
        )
        return [
            {
                "id": m.tenancy.id,
                "unit_name": m.tenancy.unit.name,
                "property_name": m.tenancy.unit.property.name,
                "is_active": m.is_active,
                "start_date": m.tenancy.start_date,
                "end_date": m.left_at.date() if m.left_at else None
            }
            for m in memberships
        ]

    def validate_phone(self, value):
        return normalize_kenyan_phone(value)

class PropertyDetailSerializer(serializers.ModelSerializer):
    units_count = serializers.IntegerField(source='units.count', read_only=True)
    occupied_units_count = serializers.SerializerMethodField()
    vacant_units_count = serializers.SerializerMethodField()
    maintenance_units_count = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'name', 'property_type', 'location', 
            'description', 'is_active',
            'units_count', 'occupied_units_count', 'vacant_units_count', 'maintenance_units_count'
        ]

    def get_occupied_units_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'units' in obj._prefetched_objects_cache:
            # print("MEMORY CACHE HIT: Occupied units counted without a DB trip!")
            return sum(1 for unit in obj.units.all() if unit.status == "occupied")
        
        # print("DATABASE HIT: Query sent to database for status='occupied'")
        return obj.units.filter(status="occupied").count()
    
    def get_vacant_units_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'units' in obj._prefetched_objects_cache:
            # print("MEMORY CACHE HIT: Vacant units counted without a DB trip!")
            return sum(1 for unit in obj.units.all() if unit.status == "vacant")
        return obj.units.filter(status="vacant").count()

    def get_maintenance_units_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'units' in obj._prefetched_objects_cache:
            # print("MEMORY CACHE HIT: Maintenance units counted without a DB trip!")
            return sum(1 for unit in obj.units.all() if unit.status == "maintenance")
        return obj.units.filter(status="maintenance").count()

class UnitPaymentSerializer(serializers.ModelSerializer):
    tenancy_start = serializers.DateField(source="tenancy.start_date", read_only=True)
    unit_name = serializers.CharField(source="tenancy.unit.name", read_only=True)

    class Meta:
        model = UnitPayment
        fields = [
            "id", "tenancy", "tenancy_start", "unit_name", "amount_paid",
            "payment_method", "type", "paid_on", "month", "year", "paid_for", "reference"
        ]

class UnitPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPayment
        fields = ["id", "amount_paid", "payment_method", "type", "paid_on", "month", "year", "reference", "notes"]
        extra_kwargs = {
            'payment_method': {
                'error_messages': {
                    'invalid_choice': 'Please select a valid payment method.',
                    'required': 'Payment method is required.',
                }
            },
            'month': {'required': False},
            'year': {'required': False}
        }

    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
    
    def validate_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError("Month must be between 1 and 12.")
        return value
    
    def validate_year(self, value):
        if value < 2000 or value > 2100:
            raise serializers.ValidationError("Year must be between 2000 and 2100.")
        return value

class TenancySerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True)

    class Meta:
        model = Tenancy
        fields = [
            "id", "tenants", "unit", "start_date", "end_date",
            "billing_start_date", "monthly_rent", "carried_arrears", "is_active"
        ]
        read_only_fields = ["id"]

class TenancyDropdownSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    property_name = serializers.CharField(source="unit.property.name", read_only=True)
    billing_start_date = serializers.DateField(source="unit.billing_start_date", read_only=True)
    
    class Meta:
        model = Tenancy
        fields = ['id', 'unit_name', 'property_name', 'start_date', 'end_date', 'billing_start_date']

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
            'id', 'tenancy', 'unit_name', 'property_name', 'charge_type',
            'charge_type_name', 'amount', 'description', 'status', 'created_at'
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