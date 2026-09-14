from django.db import transaction

from ..models import MpesaConfiguration
from ..utils.encryption import encrypt_value

@transaction.atomic
def save_mpesa_configuration(
    *,
    business,
    consumer_key=None,
    consumer_secret=None,
    shortcode=None,
    passkey=None,
    account_type=None,
    environment=None,
    is_active=None,
):
    configuration, created = MpesaConfiguration.objects.get_or_create(
        business=business,
        defaults={
            "consumer_key": consumer_key or "",
            "consumer_secret": encrypt_value(consumer_secret or ""),
            "shortcode": shortcode or "",
            "passkey": encrypt_value(passkey or ""),
            "account_type": account_type or "paybill",
            "environment": environment or "sandbox",
            "is_active": True if is_active is None else is_active,
        },
    )

    if not created:
        if consumer_key is not None:
            configuration.consumer_key = consumer_key

        if consumer_secret is not None:
            configuration.consumer_secret = encrypt_value(consumer_secret)

        if shortcode is not None:
            configuration.shortcode = shortcode

        if passkey is not None:
            configuration.passkey = encrypt_value(passkey)

        if account_type is not None:
            configuration.account_type = account_type

        if environment is not None:
            configuration.environment = environment

        if is_active is not None:
            configuration.is_active = is_active

        configuration.save()

    return configuration