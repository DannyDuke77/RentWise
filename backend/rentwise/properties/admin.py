from django.contrib import admin

from .models import Property, Unit, Tenant, TenantInvitation, UnitPayment, Tenancy, TenancyMember, ChangeLog, Charge, ChargeType

# Register your models here.
@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    search_fields = ("name", "business__company_name")
    list_display = (
        "name",
        "business__company_name",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active",)
    list_per_page = 25

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    search_fields = ("property__name", "name")
    list_display = (
        "property__name",
        "name",
        "status",
    )
    list_filter = ("status", "is_active")
    list_per_page = 25
    
@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    search_fields = ("full_name", "id_number", "email", "phone")
    list_display = (
        "full_name",
        "id_number",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active",)
    list_per_page = 25

@admin.register(TenantInvitation)
class TenantInvitationAdmin(admin.ModelAdmin):
    search_fields = ("tenant__full_name", "email", "token")
    list_display = (
        "tenant",
        "email",
        "token",
        "is_accepted",
        "created_at",
    )

@admin.register(Tenancy)
class TenancyAdmin(admin.ModelAdmin):
    search_fields = ("unit__name", "tenants__full_name")
    list_display = (
        "unit",
        "get_tenants",
        "start_date",
        "end_date",
        "is_active",
    )
    list_filter = ("is_active",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("unit").prefetch_related(
            "tenancy_members__tenant"
        )

    def get_tenants(self, obj):
        return ", ".join(
            member.tenant.full_name
            for member in obj.tenancy_members.select_related("tenant").filter(is_active=True)
        )

    get_tenants.short_description = "Tenants"

@admin.register(TenancyMember)
class TenancyMemberAdmin(admin.ModelAdmin):
    search_fields = ("tenancy__unit__name", "tenant__full_name")
    list_display = (
        "tenancy",
        "tenant",
        "is_active",
    )
    list_filter = ("is_active",)
    list_per_page = 25

@admin.register(ChangeLog)
class ChangeLogAdmin(admin.ModelAdmin):
    search_fields = ("unit__name", "unit__property__name", "changed_by__name")
    list_display = (
        "unit",
        "field_name",
        "old_value",
        "new_value",
        "changed_by__name",
        "created_at",
    )
    list_per_page = 25

@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    search_fields = (
        "tenancy__unit__name",
        "tenancy__unit__property__name",
        "tenancy__unit__property__business__company_name",
        "charge_type__name",
    )
    list_display = (
        "tenancy",
        "charge_type",
        "amount",
        "status",
        "created_at",
    )
    list_filter = ("status",)
    list_per_page = 25

admin.site.register(ChargeType)
@admin.register(UnitPayment)
class UnitPaymentAdmin(admin.ModelAdmin):
    search_fields = ("tenancy__unit__name", "tenancy__unit__property__name", "tenancy__unit__property__business__company_name")
    list_display = (
        "tenancy__unit__property__name",
        "tenancy__unit__name",
        "month",
        "year",
        "amount_paid",
        "category",
        "source",
        "type",
        "payment_method",
        "paid_on",
    )
    list_filter = ("year", "month", "category", "source", "type", "payment_method")
    list_per_page = 25