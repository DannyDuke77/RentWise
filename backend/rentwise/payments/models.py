import uuid
from django.db import models

# Create your models here.
class MpesaConfiguration(models.Model):
    ENVIRONMENT_CHOICES = [
        ("sandbox", "Sandbox"),
        ("production", "Production"),
    ]

    ACCOUNT_TYPE_CHOICES = [
        ("paybill", "Paybill"),
        ("till", "Till"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,)
    business = models.OneToOneField("accounts.Business", on_delete=models.CASCADE, related_name="mpesa_configuration",)

    consumer_key = models.CharField(max_length=255)
    consumer_secret = models.CharField(max_length=255)
    shortcode = models.CharField(max_length=20)
    passkey = models.CharField(max_length=255)

    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES,)

    environment = models.CharField(max_length=20, choices=ENVIRONMENT_CHOICES, default="sandbox",)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business.company_name} - M-Pesa"
    
class MpesaTransaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    CATEGORY_CHOICES = [
        ("rent", "Rent"),
        ("deposit", "Security Deposit"),
    ]

    id = models.UUIDField( primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey("properties.Tenancy", on_delete=models.PROTECT, related_name="mpesa_transactions")
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True, null=True)
    result_code = models.IntegerField(blank=True, null=True)
    result_description = models.TextField(blank=True, null=True)

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="rent")
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.phone_number} - KES {self.amount} - {self.status}"