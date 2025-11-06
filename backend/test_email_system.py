"""
Complete Email System Test
Tests Brevo, Resend, and DEV_MODE
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("\n" + "="*80)
print("🧪 EMAIL SYSTEM COMPREHENSIVE TEST")
print("="*80)

# Check environment variables
print("\n📋 Environment Variables:")
print(f"   BREVO_API_KEY: {'✅ Set' if os.getenv('BREVO_API_KEY') else '❌ Not set'}")
print(f"   BREVO_SENDER_EMAIL: {os.getenv('BREVO_SENDER_EMAIL', '❌ Not set')}")
print(f"   BREVO_SENDER_NAME: {os.getenv('BREVO_SENDER_NAME', '❌ Not set')}")
print(f"   RESEND_API_KEY: {'✅ Set' if os.getenv('RESEND_API_KEY') else '❌ Not set'}")
print(f"   EMAIL_DEV_MODE: {os.getenv('EMAIL_DEV_MODE', 'not set')}")
print(f"   FRONTEND_URL: {os.getenv('FRONTEND_URL', 'not set')}")

# Check SDK availability
print("\n📦 SDK Availability:")
try:
    import sib_api_v3_sdk
    print("   ✅ Brevo SDK (sib-api-v3-sdk) installed")
    BREVO_SDK = True
except ImportError:
    print("   ❌ Brevo SDK not installed (run: pip install sib-api-v3-sdk)")
    BREVO_SDK = False

try:
    import resend
    print("   ✅ Resend SDK installed")
    RESEND_SDK = True
except ImportError:
    print("   ❌ Resend SDK not installed")
    RESEND_SDK = False

# Import email service
print("\n📧 Loading Email Service...")
try:
    from email_service import EmailService
    print("   ✅ EmailService imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import EmailService: {e}")
    exit(1)

# Test email sending
async def test_email():
    print("\n🚀 Testing Email Sending...")
    print("-" * 80)
    
    test_email = "test@example.com"
    test_token = "test_token_abc123xyz"
    
    print(f"\n📤 Sending test password reset email to: {test_email}")
    print(f"   Token: {test_token[:20]}...")
    
    try:
        result = await EmailService.send_password_reset(test_email, test_token)
        
        if result:
            print("\n✅ SUCCESS! Email operation completed")
            
            # Check which service was used
            dev_mode = os.getenv('EMAIL_DEV_MODE', 'false').lower() == 'true'
            brevo_key = os.getenv('BREVO_API_KEY')
            resend_key = os.getenv('RESEND_API_KEY')
            
            if dev_mode:
                print("   📝 Mode: DEV_MODE (printed to console)")
                print("   💡 Set EMAIL_DEV_MODE=false to send real emails")
            elif brevo_key and BREVO_SDK:
                print("   📧 Service: Brevo")
                print("   📬 Check email inbox for reset link")
                print("   📊 Monitor: https://app.brevo.com/statistics/email")
            elif resend_key and RESEND_SDK:
                print("   📧 Service: Resend")
                print("   📬 Check email inbox for reset link")
            else:
                print("   ⚠️ No email service configured")
        else:
            print("\n❌ FAILED! Email was not sent")
            print("   Check error messages above")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

# Run test
print("\n" + "="*80)
asyncio.run(test_email())
print("="*80)

# Summary
print("\n📊 SUMMARY:")
print("-" * 80)

dev_mode = os.getenv('EMAIL_DEV_MODE', 'false').lower() == 'true'
brevo_key = os.getenv('BREVO_API_KEY')
resend_key = os.getenv('RESEND_API_KEY')

if dev_mode:
    print("✅ System Status: DEV_MODE Active")
    print("   - Reset links print to console")
    print("   - Works for ANY email address")
    print("   - Perfect for testing")
    print("\n💡 To send real emails:")
    print("   1. Set EMAIL_DEV_MODE=false in .env")
    print("   2. Ensure BREVO_API_KEY is set")
    print("   3. Restart server")
elif brevo_key and BREVO_SDK:
    print("✅ System Status: Brevo Active")
    print("   - Sends real emails to ANY address")
    print("   - 300 free emails per day")
    print("   - No domain verification needed")
    print("\n📊 Monitor emails:")
    print("   https://app.brevo.com/statistics/email")
elif resend_key and RESEND_SDK:
    print("⚠️ System Status: Resend Active")
    print("   - Requires domain verification")
    print("   - Only sends to verified emails")
    print("\n💡 Recommendation: Switch to Brevo")
    print("   1. Get free API key: https://app.brevo.com/settings/keys/api")
    print("   2. Add BREVO_API_KEY to .env")
    print("   3. Restart server")
else:
    print("❌ System Status: No Email Service")
    print("\n💡 Setup Required:")
    print("   1. Get Brevo API key: https://app.brevo.com/settings/keys/api")
    print("   2. Add to .env:")
    print("      BREVO_API_KEY=your-key-here")
    print("      BREVO_SENDER_EMAIL=your-email@gmail.com")
    print("      EMAIL_DEV_MODE=false")
    print("   3. Install SDK: pip install sib-api-v3-sdk")
    print("   4. Restart server")

print("\n" + "="*80)
print("Test complete!")
print("="*80 + "\n")
