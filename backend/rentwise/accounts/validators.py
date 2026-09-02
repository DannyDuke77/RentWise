import re
from rest_framework.exceptions import ValidationError

def normalize_kenyan_phone(value: str) -> str:
    if not value:
        return value 
    
    value = re.sub(r'[\s-]', '', str(value))

    if not re.match(r'^\+?[0-9]+$', value):
        raise ValidationError({"errors": {"phone": ["Invalid Kenyan phone number format."]}})

    # Format to international +254 structure
    if value.startswith("+254"):
        normalized = value
    elif value.startswith("254"):
        normalized = f"+{value}"
    elif value.startswith("0"):
        normalized = f"+254{value[1:]}"
    elif re.match(r'^[71]\d{8}$', value):
        normalized = f"+254{value}"
    else:
        raise ValidationError({"errors": {"phone": ["Invalid Kenyan phone number prefix."]}})

    if not re.match(r'^\+254[71]\d{8}$', normalized):
        raise ValidationError({"errors": {"phone": ["Enter a valid 10-digit Kenyan phone number."]}})

    return normalized