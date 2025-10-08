# test_supabase.py - CORRECTED VERSION
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def test_supabase():
    # Use the environment variable NAMES, not the actual values
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url or not key:
        print("❌ Supabase credentials missing")
        print(f"SUPABASE_URL exists: {url is not None}")
        print(f"SUPABASE_SERVICE_KEY exists: {key is not None}")
        return False
    
    print(f"🔑 URL found: {url}")
    print(f"🔑 Key found: {key[:20]}...")  # Show first 20 chars for verification
    
    try:
        supabase = create_client(url, key)
        # Test connection by listing tables or a simple query
        response = supabase.table('applications').select('*').limit(1).execute()
        print("✅ Supabase connection successful!")
        print(f"📊 Test response: {len(response.data)} applications found")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

if __name__ == "__main__":
    test_supabase()