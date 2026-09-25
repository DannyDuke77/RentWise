from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid
from decimal import Decimal

from accounts.models import Business
from .services.dates import first_day_of_month, next_month

# Create your models here.
class Property(models.Model):
    PROPERTY_TYPES = (
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='properties')
    name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES, default='apartment')
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('business', 'name')
        verbose_name_plural = 'Properties'


    def __str__(self):
        return f'{self.name} ({self.location})'
    
class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tenant_profile',
        null=True,
        blank=True,
    )

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

class TenantInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField( null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_accepted(self):
        return self.accepted_at is not None

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Invitation for {self.tenant.full_name}"
    
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

    billing_start_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="The date from which rent calculation begins. If blank, start_date is used."
    )

    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # + = arrears, - = credit

    first_month_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)


    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name_plural = 'Tenancies'
        constraints = [
            models.UniqueConstraint(
                fields=['unit'],
                condition=models.Q(is_active=True),
                name='one_active_tenancy_per_unit'
            )
        ]

    def __str__(self):
        return f"{self.unit} - Tenancy starting {self.start_date}"
    
    def get_effective_billing_start(self):
        return self.billing_start_date or self.start_date

    def calculate_balance(self):
        total_charges = sum(
            (c.amount for c in self.charges.all() if c.status != "waived"),
            Decimal("0.00"),
        )
        total_paid = sum(
            (p.amount_paid if p.type == "payment" else -p.amount_paid
            for p in self.payments.filter(category="rent")),
            Decimal("0.00"),
        )
        return total_charges - total_paid

    def get_deposit_held(self):
        deposit_payments = self.payments.filter(category="deposit")
        return sum(
            (p.amount_paid if p.type == "payment" else -p.amount_paid for p in deposit_payments),
            Decimal("0.00"),
        )

    def get_deposit_held_prefetched(self):
        if hasattr(self, "deposit_payments"):
            return sum(
                (p.amount_paid if p.type == "payment" else -p.amount_paid for p in self.deposit_payments),
                Decimal("0.00"),
            )
        return self.get_deposit_held()

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

    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('deposit', 'Security Deposit'),
    ]

    SOURCE_CHOICES = [
        ('manual', 'Manually Recorded'),
        ('stk', 'M-Pesa STK Push'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='rent')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    year = models.IntegerField()
    month = models.IntegerField()
    paid_on = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    mpesa_transaction = models.ForeignKey(
        "payments.MpesaTransaction",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="unit_payments",
    )
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
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="charge_types")
    name = models.CharField(max_length=100)
    default_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Charge(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('waived', 'Waived'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name="charges")
    charge_type = models.ForeignKey(ChargeType, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    accrual_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[("rent", "Rent Accrual")],
    )
    period = models.DateField(null=True,blank=True,)

    voided_at = models.DateTimeField(null=True, blank=True)
    voided_reason = models.CharField(max_length=255, blank=True)

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

