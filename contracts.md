# API Contracts & Implementation Plan

## Frontend-Backend Integration

### Mock Data to Replace
From `mockData.js`:
- mockInterviews → Backend `/api/interviews` endpoint
- mockCampaigns → Backend `/api/campaigns` endpoint  
- mockUser → Backend `/api/auth/*` endpoints
- mockInterviewQuestions → Backend `/api/interview/next-question` with AI generation

## API Endpoints

### Authentication
1. **POST /api/auth/signup**
   - Input: { name, email, password, role }
   - Output: { token, user }
   - Creates user in MongoDB, hashes password with bcrypt

2. **POST /api/auth/login**
   - Input: { email, password }
   - Output: { token, user }
   - Validates credentials, returns JWT

3. **POST /api/auth/google**
   - Input: { token }
   - Output: { token, user }
   - Validates Google OAuth token, creates/login user

4. **POST /api/auth/forgot-password**
   - Input: { email }
   - Output: { success }
   - Sends password reset email via Resend

5. **POST /api/auth/reset-password**
   - Input: { token, newPassword }
   - Output: { success }
   - Resets password using token

### Interviews
6. **POST /api/interview/parse-resume**
   - Input: FormData with PDF file
   - Output: { parsedData, skills, experience }
   - Uses Gemini API to parse PDF and extract info

7. **POST /api/interview/next-question**
   - Input: { interviewId, section, previousAnswer, resumeData, conversationHistory }
   - Output: { question, section, isComplete }
   - Uses Groq/OpenRouter for dynamic question generation
   - Multi-turn conversations with follow-ups

8. **GET /api/interviews**
   - Auth required (recruiter)
   - Output: [ { id, candidateName, score, status, ... } ]
   - Returns all interviews for recruiter

9. **GET /api/interview/:id**
   - Auth required
   - Output: { interview details, feedback, conversation }
   - Returns specific interview report

10. **POST /api/interview/submit**
    - Input: { interviewId, answers, conversationHistory }
    - Output: { feedback, scores }
    - Analyzes all answers and generates comprehensive feedback

### Campaigns
11. **GET /api/campaigns**
    - Auth required (recruiter)
    - Output: [ { id, title, candidatesCount, avgScore, ... } ]

12. **POST /api/campaigns**
    - Auth required (recruiter)
    - Input: { title, position, requirements }
    - Output: { campaign }

## Database Collections

### users
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String ('recruiter'|'candidate'),
  googleId: String (optional),
  createdAt: Date
}
```

### interviews
```
{
  _id: ObjectId,
  candidateId: ObjectId,
  campaignId: ObjectId (optional),
  candidateName: String,
  candidateEmail: String,
  position: String,
  resumeData: Object,
  conversation: [{ type, text, section, timestamp }],
  status: String ('in_progress'|'completed'),
  scores: {
    overall: Number,
    communication: Number,
    technical: Number,
    problemSolving: Number,
    cultural: Number
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    sections: [{ section, score, feedback }]
  },
  createdAt: Date,
  completedAt: Date
}
```

### campaigns
```
{
  _id: ObjectId,
  recruiterId: ObjectId,
  title: String,
  position: String,
  requirements: String,
  status: String ('active'|'closed'),
  candidatesCount: Number,
  completedCount: Number,
  avgScore: Number,
  createdAt: Date
}
```

## AI Integration

### Groq API (Primary)
- Model: mixtral-8x7b-32768 or llama2-70b-4096
- Used for: Question generation, answer analysis, feedback

### Gemini API  
- Model: gemini-pro
- Used for: Resume PDF parsing and extraction

### ElevenLabs (Optional - Frontend)
- Used for: Text-to-speech of AI questions
- Can be implemented client-side

### OpenRouter (Backup)
- Model: deepseek-chat
- Fallback if Groq fails

## Frontend Integration Points

1. Replace all mock imports with actual API calls
2. AuthContext - already uses API endpoints
3. RecruiterDashboard - fetch real interviews/campaigns
4. CandidateInterview - connect to resume parser and AI question API
5. InterviewReport - fetch real interview data and feedback

## Implementation Order

1. ✅ Setup .env with all API keys
2. Install backend dependencies (PyJWT, passlib, google-auth, groq, resend, PyPDF2)
3. Create auth endpoints with JWT
4. Create resume parser with Gemini
5. Create AI interview engine with Groq
6. Create interview management endpoints
7. Test with frontend
8. Generate feedback and scores
