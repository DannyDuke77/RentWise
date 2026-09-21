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
    changed_by_user_type = serializers.SerializerMethodField()

    class Meta:
        model = ChangeLog
        fields = ['id', 'unit', 'field_name', 'old_value', 'new_value', 'created_at', 'changed_by_name', 'changed_by_user_type']


    def get_changed_by_name(self, obj):
        return obj.changed_by.name if obj.changed_by else "System"

    def get_changed_by_user_type(self, obj):
        if not obj.changed_by:
            return "System"
        return obj.changed_by.user_type

class UnitDetailSerializer(serializers.ModelSerializer):
    property = PropertyShortSerializer(read_only=True)
    tenant_names = serializers.SerializerMethodField()
    tenancy_id = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    deposit = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'property', 'name', 'monthly_rent', 'status', 
            'floor', 'is_active', 'tenant_names', 'tenancy_id', 'balance', 'deposit'
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

    def get_tenancy_id(self, obj):
        tenancy = obj.tenancies.filter(is_active=True).first()
        return str(tenancy.id) if tenancy else None

    def get_balance(self, obj):
        tenancy = obj.tenancies.filter(is_active=True).first()
        if not tenancy:
            return None
        try:
            return float(tenancy.calculate_balance())
        except Exception:
            return None

    def get_deposit(self, obj):
        tenancy = obj.tenancies.filter(is_active=True).first()
        if not tenancy:
            return None
        try:
            return float(tenancy.get_deposit_held())
        except Exception:
            return None

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
                "unit": UnitListSerializer(m.tenancy.unit).data,
                "property": PropertyShortSerializer(m.tenancy.unit.property).data,
                "is_active": m.is_active,
                "start_date": m.tenancy.start_date,
                "end_date": m.left_at.date() if m.left_at else None
            }
            for m in memberships
        ]

    def validate_phone(self, value):
        return normalize_kenyan_phone(value)

class PropertySerializer(serializers.ModelSerializer):
    units_count = serializers.SerializerMethodField()
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
        extra_kwargs = {
            'id': {'read_only': True},
            'property_type': {
                'required': True,
                'error_messages': {
                    'invalid_choice': 'Please select a valid property type.',
                }

            }
        }

    def get_units_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'units' in obj._prefetched_objects_cache:
            # print("MEMORY CACHE HIT: Units counted without a DB trip!")
            return len(obj.units.all())
        return obj.units.count()

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
    tenancy_start = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()

    class Meta:
        model = UnitPayment
        fields = [
            "id", "tenancy", "tenancy_start", "unit", "property", "amount_paid",
            "payment_method", "type", "category", "source", "paid_on", "month", "year", "reference", "notes", "created_at",
        ]
        read_only_fields = ["id", "source", "created_at"]

    def get_tenancy_start(self, obj):
        return obj.tenancy.start_date
    
    def get_unit(self, obj):
        return UnitListSerializer(obj.tenancy.unit).data

    def get_property(self, obj):
        return PropertyShortSerializer(obj.tenancy.unit.property).data

class UnitPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPayment
        fields = ["id", "amount_paid", "payment_method", "type", "category", "source", "paid_on", "month", "year", "reference", "notes"]
        read_only_fields = ["id", "source"]
        extra_kwargs = {
            'amount_paid': {
                'min_value': 1.00,
                'error_messages': {
                    'min_value': 'Payment amount must be at least 1.',
                    'required': 'Payment amount is required.',
                }
            },
            'payment_method': {
                'error_messages': {
                    'invalid_choice': 'Please select a valid payment method.',
                    'required': 'Payment method is required.',
                }
            },
            'category': {'required': False},
            'month': {'required': False},
            'year': {'required': False},
            'reference': {'required': True},
            'notes': {'required': False},
        }

    def validate(self, data):
        payment_method = data.get('payment_method')
        reference = data.get('reference')

        if payment_method == 'mpesa':
            if not reference:
                raise serializers.ValidationError({
                    'reference': 'M-Pesa reference is required.'
                })
            if len(reference) != 10:
                raise serializers.ValidationError({
                    'reference': 'M-Pesa reference must be exactly 10 characters.'
                })
        # Optional: Validate bank references if needed
        elif payment_method == 'bank' and not reference:
            raise serializers.ValidationError({
                'reference': 'Bank reference is required.'
            })
        
        return data
            
    
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
    charge_type_name = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()

    class Meta:
        model = Charge
        fields = [
            'id', 'unit', 'property', 'charge_type',
            'charge_type_name', 'amount', 'description', 'status', 'created_at'
        ]
        read_only_fields = ['status']

    def get_charge_type_name(self, obj):
        return obj.charge_type.name

    def get_unit(self, obj):
        return UnitListSerializer(obj.tenancy.unit).data

    def get_property(self, obj):
        return PropertyShortSerializer(obj.tenancy.unit.property).data

class ChargeListSerializer(ChargeSerializer):
    charge_type_name = serializers.CharField(source="charge_type.name", read_only=True)

    class Meta:
        model = Charge
        fields = ['id', 'charge_type_name', 'amount', 'description', 'status', 'created_at']

class ChargeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charge
        fields = ['tenancy', 'charge_type', 'amount', 'description']

    def validate(self, data):
        tenancy = data.get('tenancy')
        
        if not tenancy or not tenancy.is_active:
            raise serializers.ValidationError("Cannot create charges for inactive tenancy.")
        
        if not tenancy.unit.is_active:
            raise serializers.ValidationError("Cannot create charges for inactive unit.")
        
        amount = data.get('amount')
        if amount and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
        
        return data

class ChargeStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charge
        fields = ['status']