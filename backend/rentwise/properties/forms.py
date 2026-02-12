from django.forms import ModelForm
from django import forms

from .models import Property, Unit, Tenant

from accounts.validators import normalize_kenyan_phone

class PropertyForm(ModelForm):
    class Meta:
        model = Property
        fields = '__all__'
        exclude = [
            'owner', 
            'is_active', 
            'created_at', 
            'updated_at'
        ]

class UnitForm(ModelForm):
    class Meta:
        model = Unit
        fields = '__all__'
        exclude = [
            'property', 
            'is_active', 
            'created_at', 
            'updated_at'
        ]

class TenantForm(forms.ModelForm):
    class Meta:
        model = Tenant
        fields = ["full_name", "phone", "email", "id_number"]

    def clean_id_number(self):
        # just return it, don't validate uniqueness
        return self.cleaned_data["id_number"]

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        return normalize_kenyan_phone(phone)