import logging
from typing import Optional
from .config import resend, DEFAULT_FROM_EMAIL
from .templates import EmailTemplate, EmailTemplates

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using Resend"""
    
    @staticmethod
    def send(
        to: str,
        template: EmailTemplate,
        from_email: Optional[str] = None
    ) -> bool:
        try:
            from_email = from_email or template.from_email or DEFAULT_FROM_EMAIL
            
            response = resend.Emails.send({
                "from": from_email,
                "to": to,
                "subject": template.subject,
                "html": template.html,
            })
            
            logger.info("Email sent successfully to %s - response: %s", to, response)
            return True
            
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to, str(e))
            return False
    
    @staticmethod
    def send_tenant_invitation(invitation) -> bool:
        """Send tenant invitation email"""
        from django.conf import settings
        
        invitation_url = (
            f"{settings.TENANT_PORTAL_URL}"
            f"/accept-invitation/{invitation.token}"
        )
        
        template = EmailTemplates.tenant_invitation(
            full_name=invitation.tenant.full_name,
            invitation_url=invitation_url,
            expires_in_days=7
        )
        
        return EmailService.send(invitation.email, template)