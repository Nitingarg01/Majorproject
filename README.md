# My Interview AI 🤖

An AI-powered interview platform that conducts intelligent, multi-turn technical interviews with real-time feedback and comprehensive candidate evaluation.
- Deployed Link https://majorproject-36la.vercel.app/

## ✨ Features

- **AI-Powered Interviews**: Dynamic question generation using Groq's Mixtral model
- **Resume Analysis**: Automatic resume parsing with Google Gemini
- **Multi-Turn Conversations**: Natural interview flow across 6 sections (Greeting, Resume, Projects, Behavioral, Technical, Closing)
- **Comprehensive Feedback**: Detailed scoring across communication, technical skills, problem-solving, and cultural fit
- **Recruiter Dashboard**: Track interviews, manage campaigns, and view analytics
- **Authentication**: Email/password and Google OAuth support
- **Performance Analytics**: Aggregated statistics and trends across all interviews

## 🚀 Tech Stack

### Frontend
- React 19
- React Router
- Tailwind CSS + Shadcn UI
- Axios for API calls
- Voice Activity Detection (VAD)

### Backend
- FastAPI (Python)
- Motor (Async MongoDB)
- JWT Authentication
- Groq AI (Interview questions)
- Google Gemini (Resume parsing)
- Resend (Email service)

### Database
- MongoDB Atlas

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.8+
- MongoDB Atlas account (free tier available)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/my-interview-ai.git
cd my-interview-ai
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add your API keys (see below)
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
# or
yarn install

# Create environment file
cp .env.example .env
```

### 4. Get API Keys

#### Required (Free Tiers Available):

1. **MongoDB Atlas** - Database
   - Sign up: https://www.mongodb.com/cloud/atlas
   - Create cluster and get connection string
   - Add to `MONGO_URL` in `backend/.env`

2. **Groq API** - AI Interview Questions
   - Sign up: https://console.groq.com
   - Get API key from dashboard
   - Add to `GROQ_API_KEY` in `backend/.env`

3. **Google Gemini** - Resume Parsing
   - Get key: https://makersuite.google.com/app/apikey
   - Add to `GEMINI_API_KEY` in `backend/.env`

4. **Resend** - Email Service
   - Sign up: https://resend.com (100 emails/day free)
   - Add to `RESEND_API_KEY` in `backend/.env`

5. **JWT Secret** - Authentication
   - Generate any random string
   - Add to `JWT_SECRET` in `backend/.env`

#### Optional:
- Google OAuth (for Google Sign-In)
- ElevenLabs (text-to-speech)
- AssemblyAI/Deepgram (enhanced speech-to-text)

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# or
yarn start
```

### 6. Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api

## 📖 Usage

1. **Sign Up** as a recruiter
2. **Create Interview** - Upload candidate resume
3. **Start Interview** - AI conducts multi-turn conversation
4. **View Feedback** - Get comprehensive evaluation with scores
5. **Dashboard** - Track all interviews and analytics

## 🏗️ Project Structure

```
├── backend/
│   ├── server.py           # Main API server
│   ├── ai_services.py      # AI integrations (Groq, Gemini)
│   ├── auth_utils.py       # JWT authentication
│   ├── models.py           # Pydantic models
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   └── contexts/       # Auth context
│   └── package.json        # Node dependencies
└── README.md
```

## 🔒 Security Notes

- Never commit `.env` files to Git
- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- CORS configured (restrict in production)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed troubleshooting guide.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using AI technology
