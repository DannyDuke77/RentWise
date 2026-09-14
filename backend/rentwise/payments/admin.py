from django.contrib import admin

from .models import MpesaConfiguration, MpesaTransaction

# Register your models here.
@admin.register(MpesaConfiguration)
class MpesaConfigurationAdmin(admin.ModelAdmin):
    search_fields = ("business__company_name",)
    list_per_page = 25
    list_display = ("business", "is_active", "created_at")

@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    search_fields = ("tenancy__unit__name", "tenancy__unit__property__name", "phone_number",)
    list_per_page = 25
    list_display = ("tenancy__unit__name", "phone_number", "amount", "status", "created_at",)
    list_filter = ("status",)