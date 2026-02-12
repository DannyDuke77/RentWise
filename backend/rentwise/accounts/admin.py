from django.contrib import admin

from .models import User, BusinessProfile

# Register your models here.
admin.site.register(User)
admin.site.register(BusinessProfile)