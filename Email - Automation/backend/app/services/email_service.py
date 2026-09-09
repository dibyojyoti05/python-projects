import logging
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List, Optional
from jinja2 import Environment, BaseLoader, TemplateSyntaxError
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.jinja_env = Environment(loader=BaseLoader(), autoescape=False)

    def render_content(self, template_str: str, context: Dict[str, Any]) -> str:
        """
        Renders template using Jinja2 with contact personalization variables.
        Fallback to simple regex replacement if template syntax has issues.
        """
        if not template_str:
            return ""
        try:
            template = self.jinja_env.from_string(template_str)
            return template.render(**context)
        except Exception as e:
            logger.warning(f"Jinja template error: {e}, falling back to regex token replacement")
            result = template_str
            for key, val in context.items():
                result = result.replace(f"{{{{ {key} }}}}", str(val)).replace(f"{{{{{key}}}}}", str(val))
            return result

    def inject_tracking_and_footer(
        self, 
        html_content: str, 
        campaign_id: str, 
        contact_id: str, 
        unsubscribe_url: Optional[str] = None
    ) -> str:
        """
        Appends invisible open-tracking pixel and compliance unsubscribe footer.
        """
        tracking_pixel = f'<img src="/api/v1/campaigns/{campaign_id}/track/open?c={contact_id}" width="1" height="1" alt="" style="display:none !important;" />'
        
        unsub_footer = ""
        if unsubscribe_url:
            unsub_footer = (
                f'<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">'
                f'If you prefer not to receive these emails, you can <a href="{unsubscribe_url}" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.'
                f'</div>'
            )

        if "</body>" in html_content:
            return html_content.replace("</body>", f"{tracking_pixel}{unsub_footer}</body>")
        return f"{html_content}{tracking_pixel}{unsub_footer}"

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        provider_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches email via real SMTP if provider_config is given or falls back to simulation mode.
        """
        sender = from_email or settings.DEFAULT_FROM_EMAIL
        
        # If provider configuration is provided and valid, attempt real SMTP
        if provider_config and provider_config.get("provider_type") == "smtp":
            creds = provider_config.get("credentials", {})
            host = creds.get("host")
            port = int(creds.get("port", 587))
            user = creds.get("username")
            password = creds.get("password")
            use_tls = creds.get("use_tls", True)

            if host and user and password:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = sender
                    msg["To"] = to_email

                    if text_body:
                        msg.attach(MIMEText(text_body, "plain"))
                    msg.attach(MIMEText(html_body, "html"))

                    with smtplib.SMTP(host, port, timeout=15) as server:
                        if use_tls:
                            server.starttls()
                        server.login(user, password)
                        server.sendmail(sender, [to_email], msg.as_string())

                    return {
                        "status": "sent",
                        "recipient": to_email,
                        "mode": "smtp",
                        "details": f"Delivered via {host}:{port}"
                    }
                except Exception as e:
                    logger.error(f"SMTP delivery failed to {to_email}: {e}")
                    return {
                        "status": "failed",
                        "recipient": to_email,
                        "mode": "smtp",
                        "error": str(e)
                    }

        # Simulation Mode (High-fidelity for local testing and demo)
        logger.info(f"[SIMULATED EMAIL DISPATCH] To: {to_email} | Subject: {subject} | From: {sender}")
        return {
            "status": "sent",
            "recipient": to_email,
            "mode": "simulated",
            "details": "Simulated successful dispatch (Sandbox Mode)"
        }

email_service = EmailService()
