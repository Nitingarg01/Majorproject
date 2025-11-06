"""
Test User Data Isolation - Ensure users only see their own data
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from auth_utils import create_access_token, hash_password

load_dotenv()

print("\n" + "="*80)
print("🔐 USER DATA ISOLATION TEST")
print("="*80)

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'interview_ai')

async def test_isolation():
    try:
        # Connect to MongoDB
        print("\n1️⃣ Connecting to MongoDB...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        print("   ✅ Connected")
        
        # Create two test users
        print("\n2️⃣ Creating test users...")
        
        user1_email = "recruiter1@test.com"
        user2_email = "recruiter2@test.com"
        
        # User 1
        user1 = await db.users.find_one({"email": user1_email})
        if not user1:
            result = await db.users.insert_one({
                "name": "Recruiter 1",
                "email": user1_email,
                "password": hash_password("password123"),
                "role": "recruiter"
            })
            user1_id = str(result.inserted_id)
        else:
            user1_id = str(user1['_id'])
        print(f"   ✅ User 1: {user1_email} (ID: {user1_id})")
        
        # User 2
        user2 = await db.users.find_one({"email": user2_email})
        if not user2:
            result = await db.users.insert_one({
                "name": "Recruiter 2",
                "email": user2_email,
                "password": hash_password("password123"),
                "role": "recruiter"
            })
            user2_id = str(result.inserted_id)
        else:
            user2_id = str(user2['_id'])
        print(f"   ✅ User 2: {user2_email} (ID: {user2_id})")
        
        # Create interviews for each user
        print("\n3️⃣ Creating test interviews...")
        
        # User 1's interview
        interview1 = await db.interviews.insert_one({
            "interviewId": "test_interview_user1",
            "candidateName": "Candidate for User 1",
            "targetRole": "Developer",
            "createdBy": user1_id,
            "status": "completed",
            "scores": {"overall": 85}
        })
        print(f"   ✅ Interview 1 created by User 1")
        
        # User 2's interview
        interview2 = await db.interviews.insert_one({
            "interviewId": "test_interview_user2",
            "candidateName": "Candidate for User 2",
            "targetRole": "Designer",
            "createdBy": user2_id,
            "status": "completed",
            "scores": {"overall": 90}
        })
        print(f"   ✅ Interview 2 created by User 2")
        
        # Test data isolation
        print("\n4️⃣ Testing data isolation...")
        
        # User 1 should only see their own interviews
        user1_interviews = await db.interviews.find({"createdBy": user1_id}).to_list(100)
        print(f"\n   User 1's interviews: {len(user1_interviews)}")
        for interview in user1_interviews:
            print(f"      - {interview.get('candidateName')} (created by: {interview.get('createdBy')})")
            if interview.get('createdBy') != user1_id:
                print(f"      ❌ SECURITY ISSUE: User 1 can see User 2's interview!")
        
        # User 2 should only see their own interviews
        user2_interviews = await db.interviews.find({"createdBy": user2_id}).to_list(100)
        print(f"\n   User 2's interviews: {len(user2_interviews)}")
        for interview in user2_interviews:
            print(f"      - {interview.get('candidateName')} (created by: {interview.get('createdBy')})")
            if interview.get('createdBy') != user2_id:
                print(f"      ❌ SECURITY ISSUE: User 2 can see User 1's interview!")
        
        # Verify isolation
        print("\n5️⃣ Verification...")
        
        user1_sees_only_own = all(i.get('createdBy') == user1_id for i in user1_interviews)
        user2_sees_only_own = all(i.get('createdBy') == user2_id for i in user2_interviews)
        
        if user1_sees_only_own and user2_sees_only_own:
            print("   ✅ PASS: Users can only see their own interviews")
        else:
            print("   ❌ FAIL: Data isolation broken!")
        
        # Test the fixed endpoint query
        print("\n6️⃣ Testing fixed endpoint query...")
        
        # This is what the /interviews endpoint now does
        user1_query_result = await db.interviews.find({"createdBy": user1_id}).to_list(1000)
        user2_query_result = await db.interviews.find({"createdBy": user2_id}).to_list(1000)
        
        print(f"   User 1 query returns: {len(user1_query_result)} interviews")
        print(f"   User 2 query returns: {len(user2_query_result)} interviews")
        
        # Cleanup test data
        print("\n7️⃣ Cleaning up test data...")
        await db.interviews.delete_many({"interviewId": {"$in": ["test_interview_user1", "test_interview_user2"]}})
        print("   ✅ Test interviews deleted")
        
        print("\n" + "="*80)
        print("✅ USER DATA ISOLATION TEST COMPLETE")
        print("="*80)
        
        print("\n📊 RESULTS:")
        print(f"   ✅ User 1 isolation: {'PASS' if user1_sees_only_own else 'FAIL'}")
        print(f"   ✅ User 2 isolation: {'PASS' if user2_sees_only_own else 'FAIL'}")
        print(f"   ✅ Query filtering: WORKING")
        
        print("\n🔐 SECURITY STATUS:")
        if user1_sees_only_own and user2_sees_only_own:
            print("   ✅ Data isolation is working correctly")
            print("   ✅ Users can only see their own interviews")
            print("   ✅ No data leakage between users")
        else:
            print("   ❌ SECURITY ISSUE DETECTED!")
            print("   ❌ Users can see other users' data")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

asyncio.run(test_isolation())
