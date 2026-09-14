import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from properties.services.payment_service import process_payment

from ..models import MpesaTransaction

logger = logging.getLogger(__name__)

@transaction.atomic
def process_mpesa_callback(data):
    callback = data["Body"]["stkCallback"]

    checkout_request_id = callback["CheckoutRequestID"]
    merchant_request_id = callback.get("MerchantRequestID")
    result_code = callback["ResultCode"]
    result_description = callback["ResultDesc"]

    mpesa_transaction = (
        MpesaTransaction.objects
        .select_for_update()
        .get(checkout_request_id=checkout_request_id)
    )

    # Ignore duplicate callbacks that have already been processed.
    if mpesa_transaction.status != "pending":
        return mpesa_transaction

    mpesa_transaction.merchant_request_id = merchant_request_id
    mpesa_transaction.result_code = result_code
    mpesa_transaction.result_description = result_description

    if result_code != 0:
        mpesa_transaction.status = (
            "cancelled" if result_code == 1032 else "failed"
        )
        mpesa_transaction.completed_at = timezone.now()

        mpesa_transaction.save(
            update_fields=[
                "merchant_request_id",
                "result_code",
                "result_description",
                "status",
                "completed_at",
            ]
        )

        return mpesa_transaction

    metadata = {
        item["Name"]: item.get("Value")
        for item in callback.get("CallbackMetadata", {}).get("Item", [])
    }

    receipt_number = metadata.get("MpesaReceiptNumber")
    amount = metadata.get("Amount")
    phone_number = metadata.get("PhoneNumber")
    transaction_date = metadata.get("TransactionDate")

    if not receipt_number:
        raise ValueError(
            "Successful M-Pesa callback did not contain a receipt number."
        )

    mpesa_transaction.mpesa_receipt_number = receipt_number
    mpesa_transaction.status = "success"
    mpesa_transaction.completed_at = timezone.now()

    mpesa_transaction.save(
        update_fields=[
            "merchant_request_id",
            "result_code",
            "result_description",
            "mpesa_receipt_number",
            "status",
            "completed_at",
        ]
    )

    process_payment(
        mpesa_transaction.tenancy,
        {
            "amount_paid": Decimal(str(amount)),
            "payment_method": "mpesa",
            "type": "payment",
            "category": mpesa_transaction.category,
            "paid_on": timezone.now(),
            "month": timezone.now().month,
            "year": timezone.now().year,
            "reference": receipt_number,
            "notes": mpesa_transaction.notes,
        },
        source="stk"
    )

    return mpesa_transaction