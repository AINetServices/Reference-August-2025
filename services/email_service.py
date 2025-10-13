# services/email_service.py
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email_user = os.getenv("EMAIL_USER")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        self.app_base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
        
        # Debug email configuration
        print(f"🔧 Email Configuration:")
        print(f"   EMAIL_USER: {'✅ Set' if self.email_user else '❌ Not set'}")
        print(f"   EMAIL_PASSWORD: {'✅ Set' if self.email_password else '❌ Not set'}")
        print(f"   SMTP_SERVER: {self.smtp_server}")
        print(f"   SMTP_PORT: {self.smtp_port}")
        
        if not all([self.email_user, self.email_password]):
            logger.warning("Email credentials not configured. Email functionality will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            print("✅ Email service enabled")

    def send_reference_request(self, reference_email, reference_name, candidate_name, role, organization, questions, reference_request_id=None, application_id=None):
        # Use whichever ID is provided
        request_id = reference_request_id or application_id
        
        if not self.enabled:
            print("❌ Email service disabled - cannot send email")
            return False

        # Validate email parameters
        if not reference_email:
            print(f"❌ No email address provided for {reference_name}")
            return False

        try:
            print(f"📧 Preparing to send email to: {reference_email}")
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Reference Check Request for {candidate_name} - {organization}"
            msg['From'] = self.email_user
            msg['To'] = reference_email
            
            # Create Google Form link
            google_form_id = os.getenv("GOOGLE_FORM_ID", "YOUR_GOOGLE_FORM_ID_HERE")
            google_form_url = f"https://docs.google.com/forms/d/{google_form_id}/viewform?entry.123456789={request_id}"
            
            text_content = self._create_text_content(reference_name, candidate_name, role, organization, questions, request_id, google_form_url)
            html_content = self._create_html_content(reference_name, candidate_name, role, organization, questions, request_id, google_form_url)
            
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            print(f"🔧 Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    print("🔧 Starting TLS...")
                    server.starttls()
                
                print(f"🔧 Logging in as: {self.email_user}")
                server.login(self.email_user, self.email_password)
                
                print(f"🔧 Sending email to: {reference_email}")
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {reference_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {reference_email}: {str(e)}")
            return False

    def _create_text_content(self, reference_name, candidate_name, role, organization, questions, request_id, form_link):
        questions_text = ""
        for i, question in enumerate(questions, 1):
            questions_text += f"{i}. {question}\n"
        
        return f"""
Dear {reference_name},

We hope this message finds you well.

{candidate_name} has listed you as a reference for the position of {role} at {organization}. 
We would greatly appreciate your feedback to help us in our evaluation process.

Please use this link to complete the reference form:
{form_link}

The form includes questions about {candidate_name}'s qualifications.

Your responses will be kept confidential and will only be used for evaluating {candidate_name}'s suitability for this position.

Thank you for your time and assistance.

Best regards,
{organization} Hiring Team

Reference ID: {request_id}
"""

    def _create_html_content(self, reference_name, candidate_name, role, organization, questions, request_id, form_link):
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 5px; }}
        .button {{ display: inline-block; background: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Reference Check Request</h2>
        </div>
        
        <p>Dear {reference_name},</p>
        
        <p><strong>{candidate_name}</strong> has listed you as a reference for <strong>{role}</strong> at <strong>{organization}</strong>.</p>
        
        <div style="text-align: center;">
            <a href="{form_link}" class="button">Complete Reference Form</a>
        </div>
        
        <p>Or copy this link: <code>{form_link}</code></p>
        
        <p>Thank you for your assistance!</p>
        
        <p>Best regards,<br>{organization} Hiring Team</p>
    </div>
</body>
</html>
"""

    def test_connection(self):
        if not self.enabled:
            print("❌ Email service not enabled")
            return False
            
        try:
            print("🔧 Testing SMTP connection...")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.email_user, self.email_password)
            print("✅ SMTP connection test successful")
            return True
        except Exception as e:
            print(f"❌ SMTP connection test failed: {str(e)}")
            return False