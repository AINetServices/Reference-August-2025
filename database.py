from supabase import create_client
from faker import Faker
import random, uuid, datetime

url = "https://cpxdambmhkiouhlmtteh.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweGRhbWJtaGtpb3VobG10dGVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ0MjU4NiwiZXhwIjoyMDcyMDE4NTg2fQ.3KVmbYTq8vpvqbvik6RfLzLL-cz1btXbd_PmcQ4V4lk"
supabase = create_client(url, key)
fake = Faker()

success_count = 0
error_count = 0

for i in range(100):
    try:
        candidate = {
            "id": str(uuid.uuid4()),
            "name": fake.name(),
            "email": fake.email(),
            "status": random.choice(["Applied","Shortlisted","Interview","Hired"]),
            "created_at": datetime.datetime.now(datetime.UTC).isoformat()  # Fixed line
        }
        
        response = supabase.table("candidates").insert(candidate).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error inserting candidate {i+1}: {response.error}")
            error_count += 1
        else:
            success_count += 1
            print(f"Inserted candidate {i+1}: {candidate['name']}")
            
    except Exception as e:
        print(f"Exception inserting candidate {i+1}: {e}")
        error_count += 1

print(f"\nInsertion completed: {success_count} successful, {error_count} failed")