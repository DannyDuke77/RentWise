from .service import EmailService
from .templates import EmailTemplates, EmailTemplate
from .config import resend, DEFAULT_FROM_EMAIL

__all__ = ['EmailService', 'EmailTemplates', 'EmailTemplate']