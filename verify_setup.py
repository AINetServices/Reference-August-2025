# verify_setup.py
import os
from dotenv import load_dotenv

def verify_environment():
    # Load environment variables
    load_dotenv()
    
    print("🔍 Environment Verification")
    print("=" * 50)
    
    # Check required variables
    required_vars = {
        'SUPABASE_URL': os.getenv('SUPABASE_URL'),
        'SUPABASE_SERVICE_KEY': os.getenv('SUPABASE_SERVICE_KEY'),
        'GROQ_API_KEY': os.getenv('GROQ_API_KEY')
    }
    
    all_good = True
    
    for var_name, var_value in required_vars.items():
        status = "✅ SET" if var_value else "❌ MISSING"
        print(f"{var_name}: {status}")
        if var_value:
            # Show first few characters for verification (don't show full keys for security)
            preview = var_value[:20] + "..." if len(var_value) > 20 else var_value
            print(f"   Preview: {preview}")
        else:
            all_good = False
        print()
    
    if all_good:
        print("🎉 All environment variables are set correctly!")
        print("You can now run your application.")
    else:
        print("❌ Some environment variables are missing.")
        print("Please check your .env file and add the missing variables.")
    
    return all_good

if __name__ == "__main__":
    verify_environment()