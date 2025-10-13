# test_email.py
import os
from dotenv import load_dotenv

load_dotenv()

print("🔧 Testing Email Configuration:")
print(f"EMAIL_USER: {os.getenv('EMAIL_USER')}")
print(f"EMAIL_PASSWORD: {'*' * len(os.getenv('EMAIL_PASSWORD', ''))}")
print(f"SMTP_SERVER: {os.getenv('SMTP_SERVER')}")
print(f"SMTP_PORT: {os.getenv('SMTP_PORT')}")

# Test if email credentials are set
email_user = os.getenv("EMAIL_USER")
email_password = os.getenv("EMAIL_PASSWORD")

if not email_user or not email_password:
    print("❌ Email credentials are not set in .env file")
else:
    print("✅ Email credentials found in .env")