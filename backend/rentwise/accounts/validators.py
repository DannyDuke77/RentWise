import re
from django.core.exceptions import ValidationError

def normalize_kenyan_phone(value: str) -> str:
    if not value:
        return value 
    
    value = value.replace(" ", "")

    if not re.match(r'^[0-9+]+$', value):
        raise ValidationError("Phone number must not contain letters.")

    if value.startswith("+254"):
        normalized = value
    elif value.startswith("254"):
        normalized = f"+{value}"
    elif value.startswith("0"):
        normalized = f"+254{value[1:]}"
    else:
        raise ValidationError("Invalid Kenyan phone number.")

    if not re.match(r'^\+2547\d{8}$', normalized) and not re.match(r'^\+2541\d{8}$', normalized):
        raise ValidationError("Invalid Kenyan mobile number.")

    return normalized
