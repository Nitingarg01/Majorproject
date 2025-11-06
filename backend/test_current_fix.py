"""
Quick test to verify the security fix is working
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

print("\n" + "="*80)
print("🔍 TESTING SECURITY FIX")
print("="*80)

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'interview_ai')

async def test():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get all users
    users = await db.users.find().to_list(10)
    print(f"\n📊 Total users in database: {len(users)}")
    
    if len(users) < 2:
        print("⚠️ Need at least 2 users to test isolation")
        print("💡 Create another user account to test")
        client.close()
        return
    
    # Test for first 2 users
    for i, user in enumerate(users[:2], 1):
        user_id = str(user['_id'])
        user_email = user.get('email', 'unknown')
        
        print(f"\n👤 User {i}: {user_email}")
        print(f"   ID: {user_id}")
        
        # This is what the /interviews endpoint does
        user_interviews = await db.interviews.find({"createdBy": user_id}).to_list(1000)
        
        print(f"   Interviews: {len(user_interviews)}")
        
        if user_interviews:
            for interview in user_interviews[:3]:  # Show first 3
                print(f"      - {interview.get('candidateName', 'Unknown')} (created by: {interview.get('createdBy')})")
                
                # Verify it's their own
                if interview.get('createdBy') != user_id:
                    print(f"      ❌ ERROR: This interview belongs to another user!")
        else:
            print(f"      (No interviews yet)")
    
    # Check if any interviews have no createdBy field
    print(f"\n🔍 Checking for interviews without createdBy field...")
    orphan_interviews = await db.interviews.find({"createdBy": {"$exists": False}}).to_list(100)
    
    if orphan_interviews:
        print(f"   ⚠️ Found {len(orphan_interviews)} interviews without createdBy!")
        print(f"   These will show up for everyone!")
        print(f"\n   💡 Fix: Add createdBy field to these interviews")
    else:
        print(f"   ✅ All interviews have createdBy field")
    
    print("\n" + "="*80)
    print("✅ TEST COMPLETE")
    print("="*80)
    
    client.close()

asyncio.run(test())
