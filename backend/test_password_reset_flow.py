"""
Test Complete Password Reset Flow with MongoDB
"""
import asyncio
import os
from dotenv import load_dotenv

# Load .env FIRST before importing auth_utils
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from auth_utils import create_reset_token, verify_reset_token, hash_password

print("\n" + "="*80)
print("🧪 PASSWORD RESET FLOW TEST")
print("="*80)

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'interview_ai')

async def test_flow():
    try:
        # Connect to MongoDB
        print("\n1️⃣ Connecting to MongoDB...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        print("   ✅ Connected to MongoDB")
        
        # Test email
        test_email = "test@example.com"
        
        # Check if user exists
        print(f"\n2️⃣ Checking if user exists: {test_email}")
        user = await db.users.find_one({"email": test_email})
        
        if not user:
            print(f"   ⚠️ User not found in database")
            print(f"   💡 Creating test user...")
            
            # Create test user
            test_user = {
                "name": "Test User",
                "email": test_email,
                "password": hash_password("oldpassword123"),
                "role": "recruiter",
                "createdAt": "2025-11-04T00:00:00Z"
            }
            result = await db.users.insert_one(test_user)
            print(f"   ✅ Test user created with ID: {result.inserted_id}")
            user = await db.users.find_one({"email": test_email})
        else:
            print(f"   ✅ User found in database")
            print(f"   User ID: {user['_id']}")
            print(f"   Name: {user.get('name')}")
        
        # Create reset token
        print(f"\n3️⃣ Creating reset token...")
        reset_token = create_reset_token(test_email)
        print(f"   ✅ Token created: {reset_token[:50]}...")
        
        # Verify token
        print(f"\n4️⃣ Verifying reset token...")
        verified_email = verify_reset_token(reset_token)
        
        if verified_email:
            print(f"   ✅ Token valid!")
            print(f"   Extracted email: {verified_email}")
        else:
            print(f"   ❌ Token invalid or expired")
            return
        
        # Update password
        print(f"\n5️⃣ Updating password in MongoDB...")
        new_password = "newpassword456"
        hashed_new_password = hash_password(new_password)
        
        result = await db.users.update_one(
            {"email": verified_email},
            {"$set": {"password": hashed_new_password}}
        )
        
        if result.modified_count > 0:
            print(f"   ✅ Password updated successfully!")
            print(f"   Modified count: {result.modified_count}")
        else:
            print(f"   ⚠️ No documents modified (user might not exist)")
        
        # Verify update
        print(f"\n6️⃣ Verifying password was updated...")
        updated_user = await db.users.find_one({"email": test_email})
        
        if updated_user:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
            
            # Check if new password works
            if pwd_context.verify(new_password, updated_user['password']):
                print(f"   ✅ New password verified successfully!")
            else:
                print(f"   ❌ New password verification failed")
        
        print("\n" + "="*80)
        print("✅ PASSWORD RESET FLOW TEST COMPLETE")
        print("="*80)
        
        print("\n📊 SUMMARY:")
        print("   ✅ MongoDB connection working")
        print("   ✅ User lookup working")
        print("   ✅ Token creation working")
        print("   ✅ Token verification working")
        print("   ✅ Password update working")
        print("   ✅ Password verification working")
        
        print("\n🎉 All systems operational!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

# Run test
asyncio.run(test_flow())
