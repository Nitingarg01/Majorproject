from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = 'user'  # Everyone is a user (for mock interview practice)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthModel(BaseModel):
    token: str

class ForgotPasswordModel(BaseModel):
    email: EmailStr

class ResetPasswordModel(BaseModel):
    token: str
    newPassword: str

# Interview Models
class ParseResumeResponse(BaseModel):
    parsedData: Dict[str, Any]
    skills: List[str]
    experience: List[Dict[str, Any]]

class NextQuestionRequest(BaseModel):
    interviewId: Optional[str] = None
    section: str
    previousAnswer: Optional[str] = ""
    resumeData: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[Dict[str, Any]]] = []
    candidateInfo: Optional[Dict[str, Any]] = None

class NextQuestionResponse(BaseModel):
    question: str
    section: str
    isComplete: bool

class ConversationItem(BaseModel):
    type: str  # 'question' or 'answer'
    text: str
    section: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class InterviewSubmit(BaseModel):
    interviewId: str
    answers: List[Dict[str, Any]]
    conversationHistory: List[Dict[str, Any]]
    duration: Optional[int] = 0

class FeedbackScores(BaseModel):
    overall: int
    communication: int
    technical: int
    problemSolving: int
    cultural: int

class SectionFeedback(BaseModel):
    section: str
    score: int
    feedback: str

class InterviewFeedback(BaseModel):
    strengths: List[str]
    improvements: List[str]
    sections: List[SectionFeedback]

# Campaign Models
class CampaignCreate(BaseModel):
    title: str
    position: str
    requirements: str
    description: str = ""
    status: str = "active"

class Campaign(BaseModel):
    id: str
    recruiterId: str
    title: str
    position: str
    requirements: str
    status: str = 'active'
    candidatesCount: int = 0
    completedCount: int = 0
    avgScore: float = 0.0
    createdAt: datetime = Field(default_factory=datetime.utcnow)