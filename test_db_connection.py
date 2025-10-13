# test_db_connection.py
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Checking environment variables:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_SERVICE_KEY length: {len(os.getenv('SUPABASE_SERVICE_KEY', ''))}")

sys.path.append('.')
from services.supabase_service import SupabaseService

def test_connection():
    service = SupabaseService()
    
    if service.demo_mode:
        print("❌ Still in demo mode - check your SUPABASE_SERVICE_KEY")
        return False
    
    print("✅ Connected to real Supabase database!")
    
    # Test a simple query
    try:
        # Try to count applications
        response = service.supabase.table('applications').select('*', count='exact').limit(1).execute()
        print(f"✅ Database test successful - Count: {response.count}")
        return True
    except Exception as e:
        print(f"❌ Database query failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()