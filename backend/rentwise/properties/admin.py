from django.contrib import admin

from .models import Property, Unit, Tenant, UnitPayment, Tenancy, TenancyMember, ChangeLog, Charge, ChargeType

# Register your models here.
admin.site.register(Property)
admin.site.register(Unit)
admin.site.register(Tenant)
admin.site.register(Tenancy)
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
    