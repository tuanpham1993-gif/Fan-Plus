"""Development .eml mailbox or SMTP transport. Never expose tokens in an API response."""
from pathlib import Path
from uuid import uuid4
from email.message import EmailMessage
import smtplib,ssl
from flask import current_app

def deliver_link(email,raw,purpose):
    config=current_app.config
    path="reset-password" if purpose=="reset_password" else "verify-email"
    link=config["PUBLIC_BASE_URL"]+"/"+path+"#token="+raw
    message=EmailMessage();message["From"]=config["MAIL_FROM"];message["To"]=email
    message["Subject"]="Fan Hub Plus: "+("reset password" if purpose=="reset_password" else "verify email")
    message.set_content("Open this link to continue:\n"+link+"\n\nIgnore this message if you did not request it.\n")
    if config["DEV_MAILBOX"]:
        folder=Path(config["MAILBOX_PATH"]);folder.mkdir(parents=True,exist_ok=True)
        target=folder/(str(uuid4())+".eml");target.write_bytes(message.as_bytes());target.chmod(0o600)
        current_app.logger.info("Development email written to private mailbox (not served over HTTP).")
        return
    if not config["SMTP_HOST"]:
        # Generic response remains identical for existing/non-existing accounts.
        # A durable encrypted outbox and operator alerts are a production gate.
        current_app.logger.error("Email delivery unavailable: SMTP is not configured.")
        return
    try:
        with smtplib.SMTP(config["SMTP_HOST"],config["SMTP_PORT"],timeout=10) as server:
            server.starttls(context=ssl.create_default_context())
            if config["SMTP_USER"]:server.login(config["SMTP_USER"],config["SMTP_PASSWORD"])
            server.send_message(message)
    except (OSError,smtplib.SMTPException):
        current_app.logger.error("Email delivery failed; token not logged. Configure delivery alerting and retries.")
