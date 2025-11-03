"""
Test MongoDB Atlas Connection
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import dns.resolver

load_dotenv()

print("=" * 60)
print("🧪 Testing MongoDB Atlas Connection")
print("=" * 60)

# Test 1: DNS Resolution
print("\n1️⃣ Testing DNS Resolution...")
try:
    answers = dns.resolver.resolve('cluster0.67w57ax.mongodb.net', 'A')
    print(f"✅ DNS Resolution successful!")
    for rdata in answers:
        print(f"   → {rdata.address}")
except Exception as e:
    print(f"❌ DNS Resolution failed: {e}")
    print("💡 Solution: Change DNS to 8.8.8.8 or use VPN")

# Test 2: MongoDB Connection
print("\n2️⃣ Testing MongoDB Connection...")
mongo_url = os.environ.get('MONGO_URL')

try:
    client = MongoClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000
    )
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
    # List databases
    dbs = client.list_database_names()
    print(f"📊 Available databases: {dbs}")
    
    # Test write operation
    db = client['Cluster0']
    test_collection = db['test']
    result = test_collection.insert_one({'test': 'connection', 'timestamp': 'now'})
    print(f"✅ Write test successful! ID: {result.inserted_id}")
    
    # Clean up test
    test_collection.delete_one({'_id': result.inserted_id})
    print("✅ Delete test successful!")
    
    client.close()
    
    print("\n" + "=" * 60)
    print("🎉 All tests passed! MongoDB Atlas is working!")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("\n💡 Solutions:")
    print("1. Whitelist your IP (112.196.30.231) in MongoDB Atlas")
    print("2. Go to: https://cloud.mongodb.com → Network Access")
    print("3. Click 'Add IP Address' → 'Allow Access from Anywhere'")
    print("4. Wait 2-3 minutes for changes to apply")
    print("5. Change DNS to 8.8.8.8 (Google DNS)")
    print("\n" + "=" * 60)
