from django.db import transaction
from django.utils import timezone

from ..models import MpesaConfiguration, MpesaTransaction
from .mpesa_service import MpesaService


@transaction.atomic
def initiate_mpesa_payment(*, tenancy, phone_number, amount, category, notes, account_reference, transaction_description, callback_url):
    configuration = MpesaConfiguration.objects.get(
        business=tenancy.unit.property.business,
        is_active=True,
    )

    mpesa_transaction = MpesaTransaction.objects.create(
        tenancy=tenancy,
        phone_number=phone_number,
        amount=amount,
        category=category,
        notes=notes or "M-Pesa STK Payment",
        status="pending",
    )

    try:
        service = MpesaService(configuration)

        result = service.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=account_reference,
            transaction_description=transaction_description,
            callback_url=callback_url,
        )

        mpesa_transaction.merchant_request_id = result.get(
            "MerchantRequestID"
        )
        mpesa_transaction.checkout_request_id = result.get(
            "CheckoutRequestID"
        )
        mpesa_transaction.save(
            update_fields=[
                "merchant_request_id",
                "checkout_request_id",
            ]
        )

        return mpesa_transaction

    except Exception as exc:
        mpesa_transaction.status = "failed"
        mpesa_transaction.result_description = str(exc)
        mpesa_transaction.completed_at = timezone.now()
        mpesa_transaction.save(
            update_fields=[
                "status",
                "result_description",
                "completed_at",
            ]
        )

        raise