"""
Test what URL is being used in password reset emails
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

print("\n" + "="*80)
print("🔗 EMAIL URL TEST")
print("="*80)

print(f"\n📋 Environment Variable:")
print(f"   FRONTEND_URL = {os.getenv('FRONTEND_URL')}")

# Import email service
from email_service import EmailService, FRONTEND_URL

print(f"\n📧 Email Service Configuration:")
print(f"   FRONTEND_URL = {FRONTEND_URL}")

# Test email generation
async def test_url():
    test_email = "gargnitin132@gmail.com"
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
    
    print(f"\n🧪 Testing password reset email...")
    print(f"   To: {test_email}")
    print(f"   Token: {test_token[:30]}...")
    
    # The URL that will be generated
    reset_url = f"{FRONTEND_URL}/reset-password?token={test_token}"
    
    print(f"\n🔗 Generated Reset URL:")
    print(f"   {reset_url}")
    
    # Check if it's correct
    if "localhost" in reset_url:
        print(f"\n   ⚠️ WARNING: Using localhost URL!")
        print(f"   This will only work on your computer")
        print(f"   Users won't be able to access it")
    elif "vercel.app" in reset_url or "majorproject" in reset_url:
        print(f"\n   ✅ CORRECT: Using production URL!")
        print(f"   This will work for all users")
    else:
        print(f"\n   ⚠️ UNKNOWN: Check if this URL is accessible")
    
    # Send actual test email
    print(f"\n📤 Sending test email...")
    result = await EmailService.send_password_reset(test_email, test_token)
    
    if result:
        print(f"   ✅ Email sent successfully!")
    else:
        print(f"   ❌ Email failed to send")

print("\n" + "="*80)
asyncio.run(test_url())
print("="*80 + "\n")
