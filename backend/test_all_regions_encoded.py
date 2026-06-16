import urllib.parse
from sqlalchemy import create_engine

regions = [
    "ap-southeast-1", # Singapore
    "ap-southeast-2", # Sydney
    "ap-northeast-1", # Tokyo
    "ap-northeast-2", # Seoul
    "ap-south-1",     # Mumbai
    "us-east-1",      # N. Virginia
    "us-east-2",      # Ohio
    "us-west-1",      # N. California
    "us-west-2",      # Oregon
    "eu-west-1",      # Ireland
    "eu-west-2",      # London
    "eu-west-3",      # Paris
    "eu-central-1",   # Frankfurt
    "sa-east-1",      # São Paulo
    "ca-central-1"    # Canada
]

project_ref = "mpdjazdqkpayinynlanf"
encoded_password = urllib.parse.quote_plus("#kDzx#7F4GX?#XZ")

print("=== TESTING ALL POOLER REGIONS WITH ENCODED PASSWORD ===")

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    url = f"postgresql+pg8000://postgres.{project_ref}:{encoded_password}@{host}:6543/postgres"
    print(f"\nTesting region: {region} ({host})...")
    try:
        engine = create_engine(url)
        conn = engine.connect()
        print(f"SUCCESS!!! Connected successfully in region: {region}")
        
        # Check tables
        from sqlalchemy import text
        res = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        print("Tables in public schema:", [r[0] for r in res])
        conn.close()
        break
    except Exception as e:
        err_msg = str(e)
        # print first two lines of error
        lines = err_msg.split('\n')
        print(f"  Result: {lines[0]}")
        if len(lines) > 1:
            print(f"  Detail: {lines[1]}")
