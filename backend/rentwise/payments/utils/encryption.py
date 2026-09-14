from cryptography.fernet import Fernet

from django.conf import settings


def encrypt_value(value: str) -> str:
    if not value:
        return value

    fernet = Fernet(settings.MPESA_ENCRYPTION_KEY.encode())
    return fernet.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    if not value:
        return value

    fernet = Fernet(settings.MPESA_ENCRYPTION_KEY.encode())
    return fernet.decrypt(value.encode()).decode()