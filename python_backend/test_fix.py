# test_fix.py
import sys
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

sys.path.append('.')

from services.supabase_service import SupabaseService

def test_update_application():
    # Check if environment variables are loaded
    print(f"SUPABASE_URL: {'Set' if os.getenv('SUPABASE_URL') else 'Not set'}")
    print(f"SUPABASE_SERVICE_KEY: {'Set' if os.getenv('SUPABASE_SERVICE_KEY') else 'Not set'}")
    
    try:
        service = SupabaseService()
        
        # Test with correct parameters
        result = service.update_application(
            application_id="test123",
            extracted_data={"test": "data"},
            role="Test Role", 
            organization="Test Org",
            user_id="test_user",
            status="testing"
        )
        print("✅ Test result:", result)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_update_application()