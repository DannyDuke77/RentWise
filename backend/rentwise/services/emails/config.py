import resend
from django.conf import settings

resend.api_key = settings.RESEND_API_KEY

DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL')