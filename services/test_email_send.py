# test_email_send.py
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to Python path so we can import the email service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from email_service import EmailService

def test_email_service():
    print("🔧 Testing Email Service...")
    
    # Initialize email service
    email_service = EmailService()
    
    print(f"✅ Email service enabled: {email_service.enabled}")
    print(f"✅ Email user: {email_service.email_user}")
    print(f"✅ SMTP server: {email_service.smtp_server}:{email_service.smtp_port}")
    
    # Test connection
    print("\n🔧 Testing SMTP connection...")
    connection_ok = email_service.test_connection()
    print(f"✅ Connection test: {connection_ok}")
    
    if connection_ok:
        # Test sending an actual email
        print("\n🔧 Testing email sending...")
        success = email_service.send_reference_request(
            reference_email="purakdec@gmail.com",  # Send to yourself for testing
            reference_name="Test Reference",
            candidate_name="Test Candidate",
            role="Test Role",
            organization="Test Organization",
            questions=[
                "How long have you known the candidate?",
                "What are their strengths?",
                "Would you recommend them?"
            ],
            application_id="test-123"
        )
        print(f"✅ Email send test: {success}")
    else:
        print("❌ Cannot test email sending - connection failed")

if __name__ == "__main__":
    test_email_service()