from django.contrib import admin

from .models import User, Business, BusinessMembership, BusinessInvitation

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    search_fields = ("name", "email")
    list_display = ("name", "email", "user_type", "is_verified", "is_active", "is_superuser", "is_staff", "date_joined")
    list_filter = ("user_type", "is_verified", "is_active", "is_superuser", "is_staff")
    list_per_page = 25
@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin): 
    search_fields = ("company_name",)   
    list_per_page = 25

@admin.register(BusinessMembership)
class BusinessMembershipAdmin(admin.ModelAdmin):
    search_fields = ("user__name", "business__company_name")
    list_display = ("user", "business", "role", "joined_at")
    list_filter = ("role",)
    list_per_page = 25

@admin.register(BusinessInvitation)
class BusinessInvitationAdmin(admin.ModelAdmin):
    list_display = ("business", "email", "token", "is_accepted", "is_cancelled", "is_expired", "created_at")
    list_per_page = 25