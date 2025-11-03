from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# CRITICAL: Load .env BEFORE importing ai_services
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Debug: Print loaded environment variables
print(f"✅ Loading .env from: {ROOT_DIR / '.env'}")
print(f"✅ GEMINI_API_KEY loaded: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"✅ GROQ_API_KEY loaded: {bool(os.getenv('GROQ_API_KEY'))}")

# Import local modules (AFTER loading .env)
from models import (
    UserCreate, UserLogin, GoogleAuthModel, ForgotPasswordModel, ResetPasswordModel,
    NextQuestionRequest, NextQuestionResponse, InterviewSubmit, CampaignCreate
)
from auth_utils import (
    hash_password, verify_password, create_access_token, decode_access_token,
    create_reset_token, verify_reset_token
)
from ai_services import ResumeParser, AIInterviewer, FeedbackGenerator
from email_service import EmailService


print(f"MONGO_URL loaded: {'MONGO_URL' in os.environ}")

# MongoDB connection with timeout settings
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    print("⚠️ WARNING: MONGO_URL not found in environment variables!")
    print("💡 Please set MONGO_URL in backend/.env file")
    mongo_url = 'mongodb://localhost:27017'  # Fallback to local MongoDB

db_name = os.environ.get('DB_NAME', 'interview_ai')

# Add connection parameters to handle DNS timeout issues
try:
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,  # 5 second timeout
        connectTimeoutMS=10000,  # 10 second connection timeout
        socketTimeoutMS=10000,  # 10 second socket timeout
        maxPoolSize=10,
        minPoolSize=1,
        retryWrites=True,
        retryReads=True,
        directConnection=False,  # Use SRV resolution
        tls=True,
        tlsAllowInvalidCertificates=False
    )
    db = client[db_name]
    print("✅ MongoDB client initialized successfully")
except Exception as e:
    print(f"⚠️ MongoDB connection error: {e}")
    print("Server will start but database operations may fail")
    client = None
    db = None

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Dependency to get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"_id": ObjectId(payload['user_id'])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        'id': str(user['_id']),
        'email': user['email'],
        'name': user['name'],
        'role': user.get('role', 'recruiter')  # Default to recruiter if role is missing
    }


# ========== AUTHENTICATION ENDPOINTS ==========

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    """Create new user account"""
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_doc = {
            "name": user_data.name,
            "email": user_data.email,
            "password": hash_password(user_data.password),
            "role": user_data.role,
            "createdAt": datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create token
        token = create_access_token(user_id, user_data.email, user_data.role)
        
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "role": user_data.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    try:
        # Find user
        user = await db.users.find_one({"email": credentials.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(credentials.password, user['password']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        user_id = str(user['_id'])
        user_role = user.get('role', 'recruiter')  # Default to recruiter if role is missing
        token = create_access_token(user_id, user['email'], user_role)
        
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": user['name'],
                "email": user['email'],
                "role": user_role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@api_router.post("/auth/google")
async def google_auth(auth_data: GoogleAuthModel):
    """Google OAuth login"""
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
        
        # Verify the Google token
        try:
            # Check if this is a development mock token
            if auth_data.token == 'mock_google_token_for_development':
                # Mock Google user for development
                google_user = {
                    'email': 'demo.user@gmail.com',
                    'name': 'Demo Google User',
                    'google_id': 'mock_google_id_123',
                    'picture': 'https://via.placeholder.com/96/4285f4/ffffff?text=DU'
                }
                logger.info("Using mock Google authentication for development")
            else:
                # Real Google token verification
                GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
                if not GOOGLE_CLIENT_ID:
                    raise HTTPException(status_code=500, detail="Google Client ID not configured")
                logger.info(f"Using Google Client ID: {GOOGLE_CLIENT_ID[:20]}...")
                
                # Verify the token
                idinfo = id_token.verify_oauth2_token(
                    auth_data.token, 
                    google_requests.Request(), 
                    GOOGLE_CLIENT_ID
                )
                
                # Extract user info from Google token
                google_user = {
                    'email': idinfo['email'],
                    'name': idinfo['name'],
                    'google_id': idinfo['sub'],
                    'picture': idinfo.get('picture', '')
                }
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        # Check if user exists
        user = await db.users.find_one({"email": google_user['email']})
        
        if not user:
            # Create new user
            user_doc = {
                "name": google_user['name'],
                "email": google_user['email'],
                "googleId": google_user['google_id'],
                "picture": google_user['picture'],
                "role": "recruiter",
                "createdAt": datetime.utcnow()
            }
            result = await db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user['_id'])
            # Update Google ID if not set
            if not user.get('googleId'):
                await db.users.update_one(
                    {"_id": user['_id']},
                    {"$set": {"googleId": google_user['google_id'], "picture": google_user['picture']}}
                )
        
        # Create token
        token = create_access_token(user_id, google_user['email'], 'recruiter')
        
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": google_user['name'],
                "email": google_user['email'],
                "role": "recruiter",
                "picture": google_user.get('picture', '')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Google authentication failed")


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordModel):
    """Send password reset email"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": data.email})
        if not user:
            # Don't reveal if email exists
            return {"success": True, "message": "If the email exists, a reset link has been sent"}
        
        # Create reset token
        reset_token = create_reset_token(data.email)
        
        # Send email
        await EmailService.send_password_reset(data.email, reset_token)
        
        return {"success": True, "message": "Password reset email sent"}
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordModel):
    """Reset password using token"""
    try:
        # Verify token
        email = verify_reset_token(data.token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        # Update password
        hashed_password = hash_password(data.newPassword)
        await db.users.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )
        
        return {"success": True, "message": "Password reset successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


# ========== INTERVIEW ENDPOINTS ==========

@api_router.post("/interview/parse-resume")
async def parse_resume(resume: UploadFile = File(...)):
    """Parse uploaded resume"""
    try:
        # Read file content
        content = await resume.read()
        
        # Parse with AI
        result = await ResumeParser.parse_pdf(content)
        
        return result
    except Exception as e:
        logger.error(f"Resume parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")


@api_router.post("/interview/next-question")
async def get_next_question(request: NextQuestionRequest):
    """Get next interview question"""
    try:
        logger.info(f"📝 Generating next question for section: {request.section}")
        logger.info(f"   Previous answer length: {len(request.previousAnswer) if request.previousAnswer else 0}")
        logger.info(f"   Conversation history length: {len(request.conversationHistory)}")
        
        # Extract candidate info from request (handle None case)
        candidate_info = {}
        if request.candidateInfo:
            candidate_info = {
                'name': request.candidateInfo.get('name'),
                'role': request.candidateInfo.get('role'),
                'experience': request.candidateInfo.get('experience'),
                'skills': request.candidateInfo.get('skills', []),
                'projects': request.candidateInfo.get('projects', [])
            }
        
        result = await AIInterviewer.generate_question(
            section=request.section,
            previous_answer=request.previousAnswer or "",
            resume_data=request.resumeData or {},
            conversation_history=request.conversationHistory or [],
            candidate_info=candidate_info
        )
        
        logger.info(f"✅ Question generated successfully for section: {result.get('section')}")
        
        # Ensure response matches NextQuestionResponse model
        response = {
            'question': result.get('question', ''),
            'section': result.get('section', request.section),
            'isComplete': result.get('isComplete', False)
        }
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Next question error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {str(e)}")


@api_router.post("/interview/create")
async def create_interview(interview_data: dict, current_user: dict = Depends(get_current_user)):
    """Create new AI interview session"""
    try:
        # Generate unique interview ID
        import uuid
        interview_id = str(uuid.uuid4())
        
        logger.info(f"📝 Creating interview with ID: {interview_id}")
        logger.info(f"   Candidate: {interview_data.get('candidateName')}")
        logger.info(f"   Role: {interview_data.get('targetRole')}")
        
        # Save interview configuration
        interview_doc = {
            "interviewId": interview_id,
            "candidateName": interview_data.get('candidateName'),
            "candidateEmail": interview_data.get('candidateEmail', ''),
            "targetRole": interview_data.get('targetRole'),
            "experienceLevel": interview_data.get('experienceLevel'),
            "company": interview_data.get('company'),
            "interviewType": interview_data.get('interviewType'),
            "duration": interview_data.get('duration'),
            "skills": interview_data.get('skills', []),
            "projects": interview_data.get('projects', []),
            "extractedData": interview_data.get('extractedData', {}),
            "createdBy": current_user['id'],
            "status": "active",
            "createdAt": datetime.utcnow(),
            "conversation": [],
            "answers": []
        }
        
        result = await db.interviews.insert_one(interview_doc)
        logger.info(f"✅ Interview created successfully - MongoDB _id: {result.inserted_id}")
        
        return {"interviewId": interview_id}
    except Exception as e:
        logger.error(f"❌ Create interview error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create interview")


@api_router.get("/interview/{interview_id}")
async def get_interview_data(interview_id: str):
    """Get interview configuration data and feedback"""
    try:
        logger.info(f"📥 Fetching interview: {interview_id}")
        interview = await db.interviews.find_one({"interviewId": interview_id})
        
        if not interview:
            logger.warning(f"❌ Interview not found by interviewId: {interview_id}")
            # Try to find by _id as fallback
            try:
                from bson import ObjectId
                interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
                if interview:
                    logger.info(f"✅ Found interview by _id instead")
                    # If found by _id, use the interviewId field from the document
                    interview_id = interview.get('interviewId', interview_id)
            except Exception as e:
                logger.error(f"Error trying _id lookup: {e}")
        
        if not interview:
            raise HTTPException(status_code=404, detail=f"Interview not found: {interview_id}")
        
        # Always use the interviewId from the document
        actual_interview_id = interview.get('interviewId', interview_id)
        logger.info(f"✅ Interview found - ID: {actual_interview_id}, Status: {interview.get('status')}, Has feedback: {bool(interview.get('feedback'))}")
        
        return {
            "interviewId": actual_interview_id,
            "candidateName": interview.get('candidateName'),
            "targetRole": interview.get('targetRole'),
            "experienceLevel": interview.get('experienceLevel'),
            "company": interview.get('company'),
            "interviewType": interview.get('interviewType'),
            "duration": interview.get('duration'),
            "skills": interview.get('skills', []),
            "projects": interview.get('projects', []),
            "extractedData": interview.get('extractedData', {}),
            "conversation": interview.get('conversation', []),
            "answers": interview.get('answers', []),
            "feedback": interview.get('feedback', None),
            "scores": interview.get('scores', {}),
            "status": interview.get('status', 'pending'),
            "recommendation": interview.get('recommendation', None),
            "completedAt": interview.get('completedAt', None)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get interview error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get interview data")


@api_router.post("/interview/text-to-speech")
async def text_to_speech(request: dict):
    """Convert text to speech using ElevenLabs"""
    try:
        text = request.get('text', '')
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Use ElevenLabs API for text-to-speech
        elevenlabs_api_key = os.environ.get('ELEVENLABS_API_KEY')
        if not elevenlabs_api_key:
            # Fallback to a simple response
            return {"message": "ElevenLabs API key not configured"}
        
        import requests
        
        # ElevenLabs API call
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Default voice
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            from fastapi.responses import Response
            return Response(content=response.content, media_type="audio/mpeg")
        else:
            logger.error(f"ElevenLabs API error: {response.status_code}")
            raise HTTPException(status_code=500, detail="Text-to-speech failed")
            
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail="Failed to convert text to speech")


@api_router.post("/interview/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """Enhanced speech-to-text with multiple providers for better accuracy"""
    try:
        from speech_services import EnhancedSpeechToText
        
        # Read audio file
        audio_content = await audio.read()
        
        # Use enhanced multi-provider transcription
        result = await EnhancedSpeechToText.transcribe_audio(audio_content, provider='auto')
        
        if result['success']:
            return {
                "text": result['text'],
                "confidence": result.get('confidence', 0.9),
                "provider": result.get('provider', 'unknown'),
                "words": result.get('words', [])
            }
        else:
            # Fallback to basic Groq Whisper if all providers fail
            if GROQ_API_KEY:
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    temp_file.write(audio_content)
                    temp_file_path = temp_file.name
                
                try:
                    with open(temp_file_path, "rb") as audio_file:
                        transcription = groq_client.audio.transcriptions.create(
                            file=audio_file,
                            model="whisper-large-v3",
                            response_format="text"
                        )
                    
                    import os
                    os.unlink(temp_file_path)
                    
                    return {
                        "text": transcription,
                        "confidence": 0.85,
                        "provider": "groq-fallback"
                    }
                except Exception as e:
                    import os
                    if os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
                    raise e
            else:
                raise HTTPException(status_code=500, detail="All speech-to-text providers failed")
            
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert speech to text: {str(e)}")


@api_router.post("/interview/analyze-answer")
async def analyze_answer(request: dict):
    """Analyze candidate's answer for loopholes and follow-up opportunities"""
    try:
        from speech_services import AnswerAnalyzer
        
        question = request.get('question', '')
        answer = request.get('answer', '')
        candidate_background = request.get('candidateBackground', {})
        conversation_history = request.get('conversationHistory', [])
        
        # Analyze the answer
        analysis = await AnswerAnalyzer.analyze_answer(
            question=question,
            answer=answer,
            candidate_background=candidate_background,
            conversation_history=conversation_history
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Answer analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze answer")


@api_router.post("/interview/submit")
async def submit_interview(data: InterviewSubmit):
    """Submit completed interview and generate comprehensive feedback"""
    try:
        logger.info(f"📝 Submitting interview: {data.interviewId}")
        logger.info(f"   Conversation length: {len(data.conversationHistory)}")
        logger.info(f"   Answers count: {len(data.answers)}")
        
        # Get interview data for candidate info
        interview = await db.interviews.find_one({"interviewId": data.interviewId})
        
        # Try finding by _id if not found by interviewId
        if not interview:
            try:
                from bson import ObjectId
                interview = await db.interviews.find_one({"_id": ObjectId(data.interviewId)})
                if interview:
                    logger.info(f"✅ Found interview by _id for submission")
            except:
                pass
        
        if not interview:
            logger.error(f"❌ Interview not found for submission: {data.interviewId}")
            raise HTTPException(status_code=404, detail="Interview not found")
        
        candidate_info = {
            'name': interview.get('candidateName', 'Candidate'),
            'role': interview.get('targetRole', 'Position'),
            'experience': interview.get('experienceLevel', 'mid-level')
        }
        
        logger.info(f"🤖 Generating feedback for {candidate_info['name']}...")
        
        # Generate comprehensive feedback
        feedback_data = await FeedbackGenerator.generate_feedback(
            conversation_history=data.conversationHistory,
            resume_data=interview.get('extractedData', {}) if interview else {},
            candidate_info=candidate_info
        )
        
        logger.info(f"✅ Feedback generated - Overall score: {feedback_data.get('scores', {}).get('overall', 0)}")
        
        # Update interview in database with feedback
        # Try to update by interviewId first, then by _id
        update_result = await db.interviews.update_one(
            {"interviewId": data.interviewId},
            {
                "$set": {
                    "conversation": data.conversationHistory,
                    "answers": data.answers,
                    "scores": feedback_data.get('scores', {}),
                    "feedback": feedback_data,
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                    "duration": data.duration,
                    "recommendation": feedback_data.get('recommendation', 'MAYBE')
                }
            }
        )
        
        # If not updated by interviewId, try by _id
        if update_result.modified_count == 0:
            try:
                from bson import ObjectId
                update_result = await db.interviews.update_one(
                    {"_id": ObjectId(data.interviewId)},
                    {
                        "$set": {
                            "conversation": data.conversationHistory,
                            "answers": data.answers,
                            "scores": feedback_data.get('scores', {}),
                            "feedback": feedback_data,
                            "status": "completed",
                            "completedAt": datetime.utcnow(),
                            "duration": data.duration,
                            "recommendation": feedback_data.get('recommendation', 'MAYBE')
                        }
                    }
                )
                if update_result.modified_count > 0:
                    logger.info(f"✅ Updated interview by _id")
            except:
                pass
        
        if update_result.modified_count > 0:
            logger.info(f"✅ Interview {data.interviewId} completed with feedback saved to database")
        else:
            logger.warning(f"⚠️ Interview {data.interviewId} - No documents modified")
        
        return {
            "interviewId": data.interviewId,
            "feedback": feedback_data,
            "scores": feedback_data.get('scores', {}),
            "recommendation": feedback_data.get('recommendation', 'MAYBE')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Submit interview error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit interview")


@api_router.get("/interviews/performance-stats")
async def get_performance_stats(current_user: dict = Depends(get_current_user)):
    """Get aggregated performance statistics from all completed interviews"""
    try:
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all completed interviews
        interviews = await db.interviews.find({
            "createdBy": current_user['id'],
            "status": "completed"
        }).to_list(length=1000)
        
        if not interviews:
            return {
                "totalInterviews": 0,
                "averageScores": {},
                "recommendations": {},
                "trends": [],
                "topStrengths": [],
                "commonImprovements": [],
                "recentInterviews": []
            }
        
        # Calculate aggregate statistics
        total_interviews = len(interviews)
        
        # Average scores
        score_totals = {
            'overall': 0,
            'communication': 0,
            'technical': 0,
            'problemSolving': 0,
            'behavioral': 0,
            'cultural': 0
        }
        
        # Recommendation counts
        recommendations = {
            'STRONG_HIRE': 0,
            'HIRE': 0,
            'MAYBE': 0,
            'NO_HIRE': 0
        }
        
        # Collect all strengths and improvements
        all_strengths = []
        all_improvements = []
        
        # Process each interview
        for interview in interviews:
            feedback = interview.get('feedback', {})
            scores = feedback.get('scores', {})
            
            # Aggregate scores
            for key in score_totals.keys():
                score_totals[key] += scores.get(key, 0)
            
            # Count recommendations
            rec = feedback.get('recommendation', 'MAYBE')
            if rec in recommendations:
                recommendations[rec] += 1
            
            # Collect strengths and improvements
            all_strengths.extend(feedback.get('strengths', []))
            all_improvements.extend(feedback.get('improvements', []))
        
        # Calculate averages
        average_scores = {
            key: round(total / total_interviews, 1) if total_interviews > 0 else 0
            for key, total in score_totals.items()
        }
        
        # Get top strengths and improvements (simplified - count frequency)
        from collections import Counter
        strength_keywords = []
        for s in all_strengths:
            strength_keywords.extend(s.lower().split()[:3])  # First 3 words
        top_strengths = [word for word, count in Counter(strength_keywords).most_common(10) if len(word) > 4]
        
        improvement_keywords = []
        for i in all_improvements:
            improvement_keywords.extend(i.lower().split()[:3])
        common_improvements = [word for word, count in Counter(improvement_keywords).most_common(10) if len(word) > 4]
        
        # Recent interviews (last 10)
        recent_interviews = sorted(interviews, key=lambda x: x.get('completedAt', datetime.min), reverse=True)[:10]
        recent_list = [
            {
                'interviewId': i.get('interviewId'),
                'candidateName': i.get('candidateName'),
                'targetRole': i.get('targetRole'),
                'overallScore': i.get('feedback', {}).get('scores', {}).get('overall', 0),
                'recommendation': i.get('feedback', {}).get('recommendation', 'MAYBE'),
                'completedAt': i.get('completedAt').isoformat() if i.get('completedAt') else None
            }
            for i in recent_interviews
        ]
        
        # Calculate trends (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_completed = [i for i in interviews if i.get('completedAt') and i.get('completedAt') > thirty_days_ago]
        
        trends = {
            'last30Days': len(recent_completed),
            'averageScoreTrend': round(sum(i.get('feedback', {}).get('scores', {}).get('overall', 0) for i in recent_completed) / len(recent_completed), 1) if recent_completed else 0
        }
        
        return {
            "totalInterviews": total_interviews,
            "averageScores": average_scores,
            "recommendations": recommendations,
            "trends": trends,
            "topStrengths": top_strengths[:5],
            "commonImprovements": common_improvements[:5],
            "recentInterviews": recent_list,
            "summary": {
                "strongHireRate": round((recommendations.get('STRONG_HIRE', 0) / total_interviews * 100), 1) if total_interviews > 0 else 0,
                "hireRate": round(((recommendations.get('STRONG_HIRE', 0) + recommendations.get('HIRE', 0)) / total_interviews * 100), 1) if total_interviews > 0 else 0,
                "averageOverallScore": average_scores.get('overall', 0)
            }
        }
    except Exception as e:
        logger.error(f"Performance stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get performance stats")


@api_router.post("/interviews/create-demo-data")
async def create_demo_data(current_user: dict = Depends(get_current_user)):
    """Create sample interview data for testing feedback and performance stats"""
    try:
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        from datetime import timedelta
        import uuid
        
        # Sample interview data with feedback
        demo_interviews = [
            {
                "interviewId": f"demo-{uuid.uuid4().hex[:8]}",
                "candidateName": "John Doe",
                "candidateEmail": "john.doe@example.com",
                "targetRole": "Senior Software Engineer",
                "experienceLevel": "senior",
                "company": "Tech Corp",
                "status": "completed",
                "createdBy": current_user['id'],
                "createdAt": datetime.utcnow() - timedelta(days=5),
                "completedAt": datetime.utcnow() - timedelta(days=5),
                "duration": 1800,
                "conversation": [
                    {"type": "question", "text": "Tell me about yourself", "section": "greeting"},
                    {"type": "answer", "text": "I'm a senior software engineer with 8 years of experience in building scalable web applications."},
                    {"type": "question", "text": "What's your experience with React?", "section": "technical"},
                    {"type": "answer", "text": "I've been using React for 5 years in production applications, building complex UIs."}
                ],
                "scores": {
                    "overall": 85,
                    "communication": 88,
                    "technical": 82,
                    "problemSolving": 86,
                    "behavioral": 84,
                    "cultural": 85
                },
                "feedback": {
                    "scores": {
                        "overall": 85,
                        "communication": 88,
                        "technical": 82,
                        "problemSolving": 86,
                        "behavioral": 84,
                        "cultural": 85
                    },
                    "strengths": [
                        "Strong technical knowledge in React and Node.js",
                        "Excellent communication skills",
                        "Good problem-solving approach"
                    ],
                    "improvements": [
                        "Could provide more specific examples",
                        "Consider discussing system design patterns"
                    ],
                    "recommendation": "HIRE",
                    "summary": "Strong candidate with excellent technical skills and communication."
                },
                "recommendation": "HIRE"
            },
            {
                "interviewId": f"demo-{uuid.uuid4().hex[:8]}",
                "candidateName": "Jane Smith",
                "candidateEmail": "jane.smith@example.com",
                "targetRole": "Full Stack Developer",
                "experienceLevel": "mid-level",
                "company": "Startup Inc",
                "status": "completed",
                "createdBy": current_user['id'],
                "createdAt": datetime.utcnow() - timedelta(days=3),
                "completedAt": datetime.utcnow() - timedelta(days=3),
                "duration": 1500,
                "conversation": [
                    {"type": "question", "text": "Tell me about your background", "section": "greeting"},
                    {"type": "answer", "text": "I'm a full stack developer with 4 years of experience building web applications."},
                ],
                "scores": {
                    "overall": 78,
                    "communication": 80,
                    "technical": 75,
                    "problemSolving": 79,
                    "behavioral": 77,
                    "cultural": 80
                },
                "feedback": {
                    "scores": {
                        "overall": 78,
                        "communication": 80,
                        "technical": 75,
                        "problemSolving": 79,
                        "behavioral": 77,
                        "cultural": 80
                    },
                    "strengths": [
                        "Good understanding of full stack development",
                        "Enthusiastic and eager to learn"
                    ],
                    "improvements": [
                        "Needs more experience with system design",
                        "Could improve technical depth"
                    ],
                    "recommendation": "MAYBE",
                    "summary": "Promising candidate with room for growth."
                },
                "recommendation": "MAYBE"
            },
            {
                "interviewId": f"demo-{uuid.uuid4().hex[:8]}",
                "candidateName": "Mike Johnson",
                "candidateEmail": "mike.j@example.com",
                "targetRole": "Senior Backend Engineer",
                "experienceLevel": "senior",
                "company": "Enterprise Co",
                "status": "completed",
                "createdBy": current_user['id'],
                "createdAt": datetime.utcnow() - timedelta(days=1),
                "completedAt": datetime.utcnow() - timedelta(days=1),
                "duration": 2100,
                "conversation": [
                    {"type": "question", "text": "Introduce yourself", "section": "greeting"},
                    {"type": "answer", "text": "I'm a backend engineer specializing in distributed systems with 10 years of experience."},
                ],
                "scores": {
                    "overall": 92,
                    "communication": 90,
                    "technical": 95,
                    "problemSolving": 93,
                    "behavioral": 89,
                    "cultural": 91
                },
                "feedback": {
                    "scores": {
                        "overall": 92,
                        "communication": 90,
                        "technical": 95,
                        "problemSolving": 93,
                        "behavioral": 89,
                        "cultural": 91
                    },
                    "strengths": [
                        "Exceptional technical expertise in distributed systems",
                        "Strong problem-solving skills",
                        "Excellent system design knowledge"
                    ],
                    "improvements": [
                        "Could improve presentation skills slightly"
                    ],
                    "recommendation": "STRONG_HIRE",
                    "summary": "Outstanding candidate with deep technical expertise."
                },
                "recommendation": "STRONG_HIRE"
            }
        ]
        
        # Insert demo interviews
        result = await db.interviews.insert_many(demo_interviews)
        
        logger.info(f"Created {len(result.inserted_ids)} demo interviews for user {current_user['id']}")
        
        return {
            "success": True,
            "message": f"Created {len(result.inserted_ids)} demo interviews with feedback",
            "count": len(result.inserted_ids),
            "interviews": [
                {"name": i["candidateName"], "role": i["targetRole"], "score": i["scores"]["overall"]}
                for i in demo_interviews
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create demo data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create demo data")


@api_router.delete("/interviews/clear-demo-data")
async def clear_demo_data(current_user: dict = Depends(get_current_user)):
    """Clear all demo/test interview data"""
    try:
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete all interviews
        interviews_result = await db.interviews.delete_many({})
        
        # Delete all campaigns if they exist
        campaigns_result = await db.campaigns.delete_many({})
        
        logger.info(f"Cleared {interviews_result.deleted_count} interviews and {campaigns_result.deleted_count} campaigns for user {current_user['id']}")
        
        return {
            "success": True,
            "message": f"Cleared {interviews_result.deleted_count} interviews and {campaigns_result.deleted_count} campaigns",
            "deletedInterviews": interviews_result.deleted_count,
            "deletedCampaigns": campaigns_result.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clear demo data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear demo data")


@api_router.get("/interviews")
async def get_interviews(current_user: dict = Depends(get_current_user)):
    """Get all interviews for recruiter"""
    try:
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        interviews = await db.interviews.find().to_list(1000)
        
        result = []
        for interview in interviews:
            result.append({
                "id": str(interview['_id']),
                "candidateName": interview.get('candidateName', 'Unknown'),
                "candidateEmail": interview.get('candidateEmail', ''),
                "position": interview.get('position', 'Position'),
                "status": interview.get('status', 'completed'),
                "date": interview.get('createdAt', datetime.utcnow()).strftime('%Y-%m-%d'),
                "score": interview.get('scores', {}).get('overall', 0),
                "feedback": interview.get('scores', {})
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get interviews error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch interviews")


# Removed duplicate route - using the one at line 384 instead


# ========== CAMPAIGN ENDPOINTS ==========

@api_router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    """Get all campaigns for recruiter"""
    try:
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        campaigns = await db.campaigns.find({"recruiterId": current_user['id']}).to_list(1000)
        
        result = []
        for campaign in campaigns:
            result.append({
                "id": str(campaign['_id']),
                "title": campaign.get('title', ''),
                "position": campaign.get('position', ''),
                "candidatesCount": campaign.get('candidatesCount', 0),
                "completedCount": campaign.get('completedCount', 0),
                "avgScore": campaign.get('avgScore', 0),
                "status": campaign.get('status', 'active'),
                "createdAt": campaign.get('createdAt', datetime.utcnow()).strftime('%Y-%m-%d')
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get campaigns error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaigns")


@api_router.post("/campaigns")
async def create_campaign(campaign_data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    """Create new campaign"""
    try:
        logger.info(f"Creating campaign for user: {current_user}")
        if current_user['role'] != 'recruiter':
            raise HTTPException(status_code=403, detail="Access denied")
        
        campaign_doc = {
            "recruiterId": current_user['id'],
            "title": campaign_data.title,
            "position": campaign_data.position,
            "requirements": campaign_data.requirements,
            "description": getattr(campaign_data, 'description', ''),
            "status": getattr(campaign_data, 'status', 'active'),
            "candidatesCount": 0,
            "completedCount": 0,
            "avgScore": 0.0,
            "createdAt": datetime.utcnow()
        }
        
        logger.info(f"Inserting campaign: {campaign_doc}")
        result = await db.campaigns.insert_one(campaign_doc)
        logger.info(f"Campaign created with ID: {result.inserted_id}")
        
        return {
            "id": str(result.inserted_id),
            "title": campaign_data.title,
            "position": campaign_data.position,
            "requirements": campaign_data.requirements,
            "status": getattr(campaign_data, 'status', 'active')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create campaign error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create campaign")


# Health check endpoints
@api_router.get("/")
async def root():
    return {"message": "My Interview AI API", "status": "running"}


@api_router.get("/health")
async def health_check():
    """Comprehensive health check including database connectivity"""
    health_status = {
        "status": "healthy",
        "api": "running",
        "database": "unknown",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check database connection
    if client is None:
        health_status["status"] = "degraded"
        health_status["database"] = "not_initialized"
        health_status["message"] = "Database client not initialized"
        return health_status
    
    try:
        # Ping database with short timeout
        await client.admin.command('ping')
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"
        health_status["error"] = str(e)
        health_status["message"] = "Database connection failed. Check network/DNS settings."
    
    return health_status


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    """Test database connection on startup"""
    if client is None:
        print("⚠️ WARNING: MongoDB client not initialized. Database operations will fail.")
        print("💡 Run: python backend/use_local_mongodb.py to switch to local MongoDB")
        return
    
    print("🔄 Testing MongoDB connection...")
    try:
        # Test the connection with a very short timeout
        await asyncio.wait_for(
            client.admin.command('ping'),
            timeout=3.0  # 3 second timeout
        )
        print("✅ MongoDB connection successful!")
        
        # List available databases
        try:
            db_list = await asyncio.wait_for(
                client.list_database_names(),
                timeout=2.0
            )
            print(f"📊 Available databases: {db_list}")
        except:
            pass  # Skip if listing fails
        
    except asyncio.TimeoutError:
        print("⚠️ MongoDB connection timeout (DNS/Network issue)")
        print("💡 Server will start but database operations may fail")
        print("💡 Solutions:")
        print("   1. Run: python backend/use_local_mongodb.py (Use local MongoDB)")
        print("   2. Check MongoDB Atlas Network Access whitelist")
        print("   3. Disable Windows Firewall temporarily")
        print("   4. Change DNS to 8.8.8.8 (Google DNS)")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {str(e)[:100]}")
        print("💡 Server will start but database operations may fail")
        print("💡 Run: python backend/use_local_mongodb.py to use local MongoDB")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    if client:
        client.close()
        print("🔌 MongoDB connection closed")