import resend
import os

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


class EmailService:
    """Handle email sending via Resend"""
    
    @staticmethod
    async def send_password_reset(email: str, reset_token: str):
        """Send password reset email"""
        try:
            # In production, this would be your actual domain
            reset_url = f"https://api-key-repair.preview.emergentagent.com/reset-password?token={reset_token}"
            
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
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
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