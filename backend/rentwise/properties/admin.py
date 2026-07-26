from django.contrib import admin

from .models import Property, Unit, Tenant, UnitPayment, Tenancy, TenancyMember, ChangeLog, Charge, ChargeType

# Register your models here.
admin.site.register(Property)
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
        return queryset.select_related("unit").prefetch_related("tenants")

    def get_tenants(self, obj):
        return ", ".join(tenant.full_name for tenant in obj.tenants.all())

    get_tenants.short_description = "Tenants"

admin.site.register(TenancyMember)
admin.site.register(ChangeLog)
admin.site.register(Charge)
admin.site.register(ChargeType)
@admin.register(UnitPayment)
class UnitPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "tenancy",
        "month",
        "year",
        "amount_paid",
        "type",
        "paid_on",
    )
    list_filter = ("year", "month", "type")
    list_per_page = 25