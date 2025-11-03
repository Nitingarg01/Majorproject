# My Interview AI - Interview Platform Project Guide

## 🎯 Project Overview
My Interview AI is a complete AI-powered interview platform with recruiter dashboard, candidate interview interface, resume parsing, and dynamic multi-turn AI conversations.

## 📋 Quick Context (Use this next time)
**Copy and paste this to AI:**
```
This is a My Interview AI platform with React frontend + FastAPI backend + MongoDB Atlas. 

Key features:
1. Landing page with authentication (email/password + Google OAuth)
2. Recruiter Dashboard - view interviews, campaigns, analytics
3. AI Interview System - resume upload/parsing, dynamic questions with Groq AI
4. Multi-turn conversations (Greeting → Resume → Projects → Behavioral → Technical → Closing)
5. Comprehensive feedback generation with scores

Tech Stack: React + FastAPI + MongoDB Atlas + Groq + Gemini + Resend
All API keys are configured in /app/backend/.env
```

## 🏗️ Architecture

### Frontend (React)
- **Location:** `/app/frontend/src/`
- **Main Files:**
  - `App.js` - Main routing and app structure
  - `contexts/AuthContext.js` - Authentication context with JWT
  - `pages/Landing.js` - Landing page
  - `pages/Login.js` - Login page
  - `pages/Signup.js` - Signup page
  - `pages/ForgotPassword.js` - Password reset
  - `pages/RecruiterDashboard.js` - Dashboard for recruiters
  - `pages/CandidateInterview.js` - AI interview interface
  - `pages/InterviewReport.js` - Interview feedback/reports
  - `mockData.js` - Mock data for development

### Backend (FastAPI)
- **Location:** `/app/backend/`
- **Main Files:**
  - `server.py` - Main API server with all endpoints
  - `models.py` - Pydantic models for API
  - `auth_utils.py` - JWT authentication utilities
  - `ai_services.py` - Groq/Gemini AI integrations
  - `email_service.py` - Resend email service
  - `.env` - All API keys and configuration

## 🔑 API Keys Configuration
**File:** `/app/backend/.env`

```env
# MongoDB Atlas
MONGO_URL=mongodb+srv://gargn4034:...
DB_NAME=Cluster0

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=192014009251-...
GOOGLE_CLIENT_SECRET=GOCSPX-...

# AI Services
GROQ_API_KEY=gsk_Su6jlgV3...
GEMINI_API_KEY=AIzaSyDACB304...
OPENROUTER_API_KEY=sk-or-v1-462ba610...

# Email
RESEND_API_KEY=re_6du5ktnD_...

# Optional
ELEVENLABS_API_KEY=sk_9f3bbfeb...
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset password

### Interviews
- `POST /api/interview/parse-resume` - Upload & parse resume (Gemini)
- `POST /api/interview/next-question` - Get AI question (Groq)
- `POST /api/interview/submit` - Submit completed interview
- `GET /api/interviews` - List all interviews (recruiter)
- `GET /api/interview/:id` - Get interview details

### Campaigns
- `GET /api/campaigns` - List campaigns (recruiter)
- `POST /api/campaigns` - Create campaign

## 🗄️ Database Collections (MongoDB Atlas)

### users
```js
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  role: 'recruiter' | 'candidate',
  googleId: String (optional),
  createdAt: Date
}
```

### interviews
```js
{
  _id: ObjectId,
  candidateId: ObjectId,
  candidateName: String,
  candidateEmail: String,
  position: String,
  resumeData: Object,
  conversation: Array[{type, text, section, timestamp}],
  status: 'in_progress' | 'completed',
  scores: {overall, communication, technical, problemSolving, cultural},
  feedback: {strengths[], improvements[], sections[]},
  createdAt: Date,
  completedAt: Date
}
```

### campaigns
```js
{
  _id: ObjectId,
  recruiterId: ObjectId,
  title: String,
  position: String,
  requirements: String,
  status: 'active' | 'closed',
  candidatesCount: Number,
  completedCount: Number,
  avgScore: Number,
  createdAt: Date
}
```

## 🤖 AI Integration Details

### Groq API (Primary AI)
- **Model:** mixtral-8x7b-32768
- **Used for:** 
  - Dynamic question generation
  - Multi-turn conversation follow-ups
  - Interview feedback analysis
- **Features:** Context-aware, references resume data & previous answers

### Gemini API
- **Model:** gemini-pro
- **Used for:** Resume PDF parsing
- **Extracts:** Name, email, skills, experience, education, projects

### Interview Flow Sections
1. **Greeting** (1 question) - Introduction
2. **Resume** (3 questions) - Work experience discussion
3. **Projects** (4 questions) - Deep-dive with follow-ups
4. **Behavioral** (3 questions) - STAR method questions
5. **Technical** (4 questions) - Skills assessment
6. **Closing** (1 question) - Candidate questions

## 🚀 Running the Application

### Start Services
```bash
sudo supervisorctl restart all
```

### Check Status
```bash
sudo supervisorctl status
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/backend.err.log
```

### URLs
- **Frontend:** https://api-key-repair.preview.emergentagent.com
- **Backend:** Internal on port 8001 (accessed via /api prefix)

## 🔧 Common Development Tasks

### Install New Frontend Package
```bash
cd /app/frontend
yarn add package-name
sudo supervisorctl restart frontend
```

### Install New Backend Package
```bash
cd /app/backend
pip install package-name
pip freeze > requirements.txt
sudo supervisorctl restart backend
```

### Update Environment Variables
1. Edit `/app/backend/.env`
2. Restart backend: `sudo supervisorctl restart backend`

## 🐛 Troubleshooting

### Frontend Not Loading
```bash
# Check logs
tail -f /var/log/supervisor/frontend.err.log

# Restart
sudo supervisorctl restart frontend
```

### Backend Errors
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Check if running
curl http://localhost:8001/api/

# Restart
sudo supervisorctl restart backend
```

### Database Connection Issues
- Check MONGO_URL in `/app/backend/.env`
- Verify MongoDB Atlas IP whitelist (should allow 0.0.0.0/0)
- Test connection from backend logs

## 📝 Key Features Implemented

### ✅ Complete Features
1. **Landing Page** - Hero, features, pricing, CTA
2. **Authentication** - Signup/login with JWT, password reset
3. **Recruiter Dashboard** - Interviews list, campaigns, analytics
4. **AI Interview** - Resume upload, dynamic questions, speech-to-text
5. **Feedback System** - Comprehensive scoring and analysis
6. **Campaign Management** - Create and track hiring campaigns

### 🚧 Partial/Mock Features
1. **Google OAuth** - Placeholder (needs implementation)
2. **ElevenLabs TTS** - Optional text-to-speech
3. **Video Recording** - Not implemented (only audio transcript)

## 🔐 Security Notes

- JWT tokens expire after 7 days
- Passwords hashed with bcrypt
- Reset tokens expire after 1 hour
- Role-based access control on all protected routes
- CORS enabled for all origins (restrict in production)

## 📦 Dependencies

### Frontend (package.json)
- React 19, React Router
- Axios for API calls
- Shadcn UI components
- Tailwind CSS
- Lucide React icons

### Backend (requirements.txt)
- FastAPI, Uvicorn
- Motor (async MongoDB)
- PyJWT, Passlib (auth)
- Groq, Google Generative AI
- Resend (emails)
- PyPDF2, pdfplumber (resume parsing)

## 🎨 UI/UX Notes

- **Colors:** Indigo-600 primary, purple accents
- **Components:** Shadcn UI components in `/app/frontend/src/components/ui/`
- **Toast notifications:** Already configured
- **Responsive:** Mobile-friendly design

## 📄 Important Files to Reference

1. `/app/contracts.md` - API contracts and implementation plan
2. `/app/backend/server.py` - All API endpoints
3. `/app/frontend/src/App.js` - Routing structure
4. `/app/frontend/src/mockData.js` - Mock data examples

## 💡 Next Development Steps

1. Implement actual Google OAuth verification
2. Add ElevenLabs voice for AI questions
3. Add video recording capability
4. Create admin panel for analytics
5. Add email notifications for interview completion
6. Implement interview scheduling
7. Add multi-language support
8. Create mobile app version

---

## 🆘 Quick Help Commands

**When AI asks "What is this project?"** → Share "Quick Context" section above

**When debugging:** Share specific error logs from supervisor

**When adding features:** Reference the existing API structure in server.py

**When styling:** Use Tailwind + Shadcn components, follow existing color scheme
