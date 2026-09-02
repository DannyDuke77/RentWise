from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from django.conf import settings


@dataclass
class EmailTemplate:
    """Container for email template data"""
    subject: str
    html: str
    from_email: Optional[str] = None  # Allow per-email sender override


class EmailTemplates:
    """Central repository for all email templates"""
    
    # Shared styling - consistent brand across all emails
    BASE_STYLES = """
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 0;
                background: #f6f9fc;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header { 
                background: #4F46E5; 
                color: white; 
                padding: 30px; 
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px;
                display: inline-block;
            }
            .content { 
                padding: 30px; 
                background: #ffffff;
                border-radius: 0 0 8px 8px;
            }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #4F46E5; 
                color: white !important; 
                text-decoration: none; 
                border-radius: 6px;
                font-weight: 600;
            }
            .button:hover {
                background: #4338CA;
            }
            .footer { 
                padding: 20px; 
                text-align: center; 
                color: #6B7280; 
                font-size: 14px;
                border-top: 1px solid #E5E7EB;
                margin-top: 20px;
            }
            .info-box {
                background: #F9FAFB;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #4F46E5;
            }
            .success-box {
                background: #F0FDF4;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #059669;
            }
            .warning-box {
                background: #FFFBEB;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #D97706;
            }
        </style>
    """
    
    BASE_HTML = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {styles}
        </head>
        <body style="margin:0;padding:20px;background:#f6f9fc;">
            <div class="container">
                <div class="header" style="text-align:center;">
                    <img src="{logo}" height="60" width="60" alt="RentWise Logo" style="display:inline-block;vertical-align:middle;margin-right:10px;">
                    <h1 style="display:inline-block;vertical-align:middle;">RentWise</h1>
                </div>
                <div class="content">
                    {content}
                </div>
                <div class="footer">
                    <p style="margin:0;">RentWise - Your Property Management Solution</p>
                    <p style="margin:5px 0 0 0;font-size:12px;color:#9CA3AF;">
                        © {year} RentWise. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
    """
    
    @classmethod
    def _render_base(cls, content: str) -> str:
        """Wrap content in base template for consistent branding"""
        return cls.BASE_HTML.format(
            styles=cls.BASE_STYLES,
            logo=settings.LOGO_URL,
            content=content,
            year=datetime.now().year
        )
    
    @staticmethod
    def tenant_invitation(full_name: str, invitation_url: str, expires_in_days: int = 7) -> EmailTemplate:
        """Template for tenant invitation emails"""
        content = f"""
            <h2 style="margin-top:0;">Welcome to RentWise, {full_name}! 👋</h2>
            
            <p>Your landlord has added you to RentWise. Create your account to:</p>
            
            <ul style="padding-left:20px;line-height:1.8;">
                <li>🏠 View your tenancy and rental details</li>
                <li>💳 Keep track of your rent payments and balance</li>
                <li>🔧 Submit and follow up on maintenance requests</li>
                <li>🔔 Receive important updates from your property manager</li>
            </ul>
            
            <div style="text-align:center; margin: 35px 0;">
                <a href="{invitation_url}" class="button">
                    Create Your Account Now →
                </a>
            </div>
            
            <div class="warning-box">
                <p style="margin:0;">
                    This invitation expires in <strong>{expires_in_days} days</strong>.
                </p>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        """
        
        return EmailTemplate(
            subject=f"You're invited to RentWise",
            html=EmailTemplates._render_base(content)
        )