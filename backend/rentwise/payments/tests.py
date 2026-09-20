from datetime import date
from decimal import Decimal

from django.test import TestCase

from accounts.models import Business, BusinessMembership, User
from properties.models import Property, Unit, Tenancy, TenancyMember, Tenant
from .models import MpesaTransaction
from .services.mpesa_callback_service import process_mpesa_callback


class MpesaCallbackTests(TestCase):

    def setUp(self):
        self.business = Business.objects.create(company_name="MobLand Enterprises Ltd")

        self.user = User.objects.create_user(
            name="Danny",
            email="danny@example.com",
            password="testpassword123",
        )

        BusinessMembership.objects.create(business=self.business, user=self.user, role="owner")

        self.property = Property.objects.create(
            business=self.business,
            name="Blue Skies Apartments",
            location="Naivasha",
        )

        self.unit = Unit.objects.create(
            property=self.property,
            name="A1",
            monthly_rent=Decimal("15000.00"),
        )

        self.tenant = Tenant.objects.create(
            full_name="Test Tenant",
            phone="0712345678",
            id_number="TEST12345",
        )

        self.tenancy = Tenancy.objects.create(
            unit=self.unit,
            start_date=date(2026, 1, 1),
            billing_start_date=date(2026, 1, 1),
            monthly_rent=Decimal("15000.00"),
        )

        TenancyMember.objects.create(
            tenancy=self.tenancy,
            tenant=self.tenant,
        )

        self.mpesa_transaction = MpesaTransaction.objects.create(
            tenancy=self.tenancy,
            phone_number="254712345678",
            amount=Decimal("5000.00"),
            checkout_request_id="ws_CO_TEST_123",
            category="rent",
            status="pending",
        )

    def test_duplicate_successful_callback_does_not_create_duplicate_payment(self):
        callback_data = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "29115-12345-1",
                    "CheckoutRequestID": "ws_CO_TEST_123",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {
                                "Name": "Amount",
                                "Value": 5000,
                            },
                            {
                                "Name": "MpesaReceiptNumber",
                                "Value": "TEST123ABC",
                            },
                            {
                                "Name": "TransactionDate",
                                "Value": 20260919120000,
                            },
                            {
                                "Name": "PhoneNumber",
                                "Value": 254712345678,
                            },
                        ]
                    },
                }
            }
        }

        # First callback
        process_mpesa_callback(callback_data)

        # Second callback, duplicate delivery
        process_mpesa_callback(callback_data)

        # The transaction should only have produced one payment
        self.assertEqual(self.tenancy.payments.count(), 1)

    def test_failed_callback_does_not_create_payment(self):
        callback_data = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "29115-12345-1",
                    "CheckoutRequestID": "ws_CO_TEST_123",
                    "ResultCode": 1032,
                    "ResultDesc": "Request cancelled by user.",
                }
            }
        }

        process_mpesa_callback(callback_data)
        
        self.assertEqual(self.tenancy.payments.count(), 0)