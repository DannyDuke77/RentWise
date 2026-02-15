from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid
from datetime import date
from decimal import Decimal
from django.db.models import Sum

from .services.dates import first_day_of_month, next_month

# Create your models here.
class Property(models.Model):
    PROPERTY_TYPES = (
        ('apartment', 'Apartment'),
        ('bedsitter', 'Bedsitter'),
        ('house', 'House'),
        ('commercial', 'Commercial'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')

    name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    location = models.CharField(max_length=255, help_text='e.g. Kilimani, Nairobi')
    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('owner', 'name')
        verbose_name_plural = 'Properties'


    def __str__(self):
        return f'{self.name} ({self.location})'
    
class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    id_number = models.CharField(max_length=50, unique=True)

    left_at = models.DateTimeField(blank=True, null=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
    
class Unit(models.Model):
    UNIT_STATUS = (
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')

    name = models.CharField(max_length=50,help_text='e.g. A1, B2, Shop 3')
    monthly_rent = models.DecimalField(max_digits=10, validators=[MinValueValidator(0)], decimal_places=2)
    status = models.CharField(max_length=20, choices=UNIT_STATUS, default='vacant')
    floor = models.CharField(max_length=20,blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('property', 'name')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.property.name} - {self.name}'
    
    def save(self, *args, **kwargs):
        has_active_tenancy = self.tenancies.filter(is_active=True).exists()

        if has_active_tenancy:
            self.status = 'occupied'
        elif self.status == 'occupied':
            self.status = 'vacant'

        super().save(*args, **kwargs)

class Tenancy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenants = models.ManyToManyField(Tenant, related_name="tenancies", through='TenancyMember')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='tenancies')

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # + = arrears, - = credit

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['unit'],
                condition=models.Q(is_active=True),
                name='one_active_tenancy_per_unit'
            )
        ]

    def __str__(self):
        return f"{self.unit} - Tenancy starting {self.start_date}"

    def calculate_balance(self, up_to_date=None, start_from=None):
        """
        Calculates the tenancy balance up to a specific date.

        Balance =
            Rent Due
        + Charges
        - Payments
        + Refund adjustments
        """

        if up_to_date is None:
            up_to_date = self.end_date or timezone.now().date()

        actual_start = start_from if start_from and start_from > self.start_date else self.start_date

        if up_to_date < actual_start:
            return Decimal("0.00")

        # 1. Calculate Rent Due
        months_elapsed = (
            (up_to_date.year - actual_start.year) * 12
            + (up_to_date.month - actual_start.month)
            + 1
        )

        total_rent_due = Decimal(months_elapsed) * self.monthly_rent

        # 2. Calculate Charges
        charges_query = self.charges.filter(
            created_at__date__lte=up_to_date
        )

        total_charges = sum(
            (c.amount for c in charges_query if c.status != "waived"),
            Decimal("0.00")
        )


        # 3. Calculate Payments & Refunds
        payments_query = self.payments.filter(paid_on__date__lte=up_to_date)

        total_paid = Decimal("0.00")

        for p in payments_query:
            if p.type == "payment":
                total_paid += p.amount_paid
            elif p.type == "refund":
                total_paid -= p.amount_paid

        # 4. Final Balance
        return total_rent_due + total_charges - total_paid

class TenancyMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='tenancy_members')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tenancy_members')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenancy', 'tenant')

class UnitPayment(models.Model):
    TYPE_CHOICES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
    ]

    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('mpesa', 'M-Pesa'),
        ('bank', 'Bank Transfer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)

    year = models.IntegerField()
    month = models.IntegerField()

    paid_on = models.DateTimeField(default=timezone.now)
    paid_for = models.DateTimeField(default=timezone.now)

    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES)

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='payment')

    reference = models.CharField(max_length=100, blank=True, null=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenancy} - {self.month}/{self.year}"
    
    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Enforce positive amounts always
        self.amount_paid = abs(self.amount_paid)
        super().save(*args, **kwargs)


class ChargeType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="charge_types")
    name = models.CharField(max_length=100)  # e.g., Late Fee
    default_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.landlord.name}"


class Charge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey("Tenancy", on_delete=models.CASCADE, related_name="charges")
    charge_type = models.ForeignKey(ChargeType, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("paid", "Paid"),
            ("waived", "Waived"),
        ],
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.charge_type.name if self.charge_type else 'Charge'} - {self.tenancy}"



class ChangeLog(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey('Unit', on_delete=models.CASCADE, related_name='change_logs')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.unit} - {self.field_name} changed by {self.changed_by} on {self.created_at}"