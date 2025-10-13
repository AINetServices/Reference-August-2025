# test_env.py
import os
from dotenv import load_dotenv

def test_env_loading():
    # Try loading from different locations
    env_paths = [
        '.env',
        './.env',
        '../.env',
        '../../.env'
    ]
    
    for path in env_paths:
        print(f"Trying to load from: {path}")
        if load_dotenv(path):
            print(f"✅ Successfully loaded from: {path}")
            break
        else:
            print(f"❌ Failed to load from: {path}")
    
    # Check what was loaded
    print("\n🔍 Loaded Environment Variables:")
    print(f"   SUPABASE_URL: {os.getenv('SUPABASE_URL', 'Not set')}")
    print(f"   SUPABASE_SERVICE_KEY: {'Set' if os.getenv('SUPABASE_SERVICE_KEY') else 'Not set'}")
    print(f"   GROQ_API_KEY: {'Set' if os.getenv('GROQ_API_KEY') else 'Not set'}")

if __name__ == "__main__":
    test_env_loading()