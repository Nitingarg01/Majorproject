import os

# Try to import Brevo (preferred - works with any email, no domain verification)
try:
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException
    BREVO_AVAILABLE = True
except ImportError:
    BREVO_AVAILABLE = False

# Fallback to Resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

# Configuration
BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'noreply@example.com')
BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'My Interview AI')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
DEV_MODE = os.environ.get('EMAIL_DEV_MODE', 'false').lower() == 'true'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Initialize APIs
if BREVO_API_KEY and BREVO_AVAILABLE and not DEV_MODE:
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    print("✅ Using Brevo Email Service (300 free emails/day)")
elif RESEND_API_KEY and RESEND_AVAILABLE and not DEV_MODE:
    resend.api_key = RESEND_API_KEY
    print("✅ Using Resend Email Service")
else:
    print("📧 Email DEV_MODE enabled - links will print to console")


class EmailService:
    """Handle email sending via Brevo or Resend"""
    
    @staticmethod
    async def send_password_reset(email: str, reset_token: str):
        """Send password reset email"""
        try:
            reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
            
            # DEVELOPMENT MODE: Print to console
            if DEV_MODE:
                print("\n" + "="*80)
                print("📧 PASSWORD RESET EMAIL (Development Mode - Email Not Sent)")
                print("="*80)
                print(f"To: {email}")
                print(f"Subject: Reset Your My Interview AI Password")
                print(f"\n🔗 Copy this reset link and paste in browser:")
                print(f"\n{reset_url}\n")
                print("="*80 + "\n")
                return True
            
            # Try Brevo first (preferred - no domain verification needed)
            if BREVO_API_KEY and BREVO_AVAILABLE:
                return await EmailService._send_via_brevo(email, reset_url, "password_reset")
            
            # Fallback to Resend
            if RESEND_API_KEY and RESEND_AVAILABLE:
                return await EmailService._send_via_resend(email, reset_url, "password_reset")
            
            print("⚠️ No email service configured. Set BREVO_API_KEY or RESEND_API_KEY")
            return False
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    @staticmethod
    async def _send_via_brevo(email: str, reset_url: str, email_type: str):
        """Send email via Brevo"""
        try:
            api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
            
            subject = "Reset Your My Interview AI Password"
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">My Interview AI</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                        <h2 style="color: #1f2937;">Reset Your Password</h2>
                        <p style="color: #4b5563; line-height: 1.6;">
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_url}" 
                               style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                            Or copy and paste this URL into your browser:<br>
                            {reset_url}
                        </p>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            © 2025 My Interview AI. All rights reserved.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": email}],
                sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
                subject=subject,
                html_content=html_content
            )
            
            api_response = api_instance.send_transac_email(send_smtp_email)
            print(f"✅ Password reset email sent to {email} via Brevo")
            return True
            
        except ApiException as e:
            print(f"❌ Brevo API error: {e}")
            return False
    
    @staticmethod
    async def _send_via_resend(email: str, reset_url: str, email_type: str):
        """Send email via Resend"""
        try:
            params = {
                "from": "My Interview AI <onboarding@resend.dev>",
                "to": [email],
                "subject": "Reset Your My Interview AI Password",
                "html": f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">My Interview AI</h1>
                        </div>
                        <div style="padding: 30px; background: #f9fafb;">
                            <h2 style="color: #1f2937;">Reset Your Password</h2>
                            <p style="color: #4b5563; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{reset_url}" 
                                   style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    Reset Password
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">
                                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                                Or copy and paste this URL into your browser:<br>
                                {reset_url}
                            </p>
                        </div>
                        <div style="background: #1f2937; padding: 20px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2025 My Interview AI. All rights reserved.
                            </p>
                        </div>
                    </body>
                </html>
                """
            }
            
            email_result = resend.Emails.send(params)
            print(f"✅ Password reset email sent to {email} via Resend")
            return True
            
        except Exception as e:
            print(f"❌ Resend error: {e}")
            return False
    
    @staticmethod
    async def send_interview_completion(recruiter_email: str, candidate_name: str, interview_id: str, score: int):
        """Send interview completion notification to recruiter"""
        try:
            interview_url = f"https://api-key-repair.preview.emergentagent.com/interview-report/{interview_id}"
            
            params = {
                "from": "My Interview AI <notifications@resend.dev>",
                "to": [recruiter_email],
                "subject": f"Interview Completed - {candidate_name}",
                "html": f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">My Interview AI</h1>
                        </div>
                        <div style="padding: 30px; background: #f9fafb;">
                            <h2 style="color: #1f2937;">Interview Completed! 🎉</h2>
                            <p style="color: #4b5563; line-height: 1.6;">
                                <strong>{candidate_name}</strong> has completed their AI interview.
                            </p>
                            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                                <h3 style="margin: 0 0 10px 0; color: #1f2937;">Overall Score</h3>
                                <div style="font-size: 36px; font-weight: bold; color: #4f46e5;">{score}/100</div>
                            </div>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{interview_url}" 
                                   style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    View Full Report
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">
                                The detailed interview report includes section-wise scores, AI feedback, and conversation transcript.
                            </p>
                        </div>
                        <div style="background: #1f2937; padding: 20px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2025 My Interview AI. All rights reserved.
                            </p>
                        </div>
                    </body>
                </html>
                """
            }
            
            email_result = resend.Emails.send(params)
            return True
            
        except Exception as e:
            print(f"Error sending interview completion email: {e}")
            return False