import pandas as pd
from supabase import create_client, Client
import os

# --- SUPABASE CONNECTION ---
url = "https://cpxdambmhkiouhlmtteh.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweGRhbWJtaGtpb3VobG10dGVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ0MjU4NiwiZXhwIjoyMDcyMDE4NTg2fQ.3KVmbYTq8vpvqbvik6RfLzLL-cz1btXbd_PmcQ4V4lk"   # find this under Project Settings → API → Service Role Key
supabase: Client = create_client(url, key)

# --- TABLES TO EXPORT ---
tables = [
    "applications",
    "candidates",
    "candidate_references",
    "reference_requests",
    "reference_responses",
    "roles",
    "organizations",
    "users"
]

# --- EXPORT EACH TABLE TO CSV ---
for table in tables:
    print(f"📦 Exporting {table} ...")
    data = supabase.table(table).select("*").execute()
    df = pd.DataFrame(data.data)
    df.to_csv(f"{table}.csv", index=False)
    print(f"✅ Saved {table}.csv ({len(df)} rows)")

print("🎉 All done! CSVs ready for Power BI.")
