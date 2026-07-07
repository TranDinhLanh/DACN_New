import smtplib
import sys
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            sys.stdout.buffer.write((text + "\n").encode('utf-8', errors='replace'))
            sys.stdout.flush()
        except Exception:
            # Absolute fallback if buffer write fails
            print(text.encode('ascii', errors='replace').decode('ascii'))

def send_email(
    to_email: str,
    subject: str,
    body: str,
) -> bool:
    # If SMTP settings are not configured or still have default placeholders, fallback to console printing
    is_placeholder = settings.SMTP_USER == "email_cua_ban@gmail.com" or settings.SMTP_PASSWORD == "xxxx_xxxx_xxxx_xxxx"
    has_settings = all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD])
    
    if is_placeholder or not has_settings:
        safe_print("\n==========================================")
        safe_print("[WARNING] Gmail SMTP not configured or has placeholder values.")
        safe_print("Fallback: Print email content to terminal:")
        safe_print(f"To: {to_email}")
        safe_print(f"Subject: {subject}")
        safe_print("Body: (Plain text view)")
        
        # Simple HTML tag strip for terminal readability
        plain_body = re.sub('<[^<]+?>', '', body).strip()
        safe_print(plain_body)
        safe_print("==========================================\n")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "html" if body.strip().startswith("<") else "plain", "utf-8"))

        if settings.SMTP_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            if settings.SMTP_TLS:
                server.starttls()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.quit()
        safe_print(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        safe_print(f"Failed to send email to {to_email}: {e}")
        return False
