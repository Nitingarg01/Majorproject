# Setup Instructions

## Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- MongoDB Atlas account (or local MongoDB)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your API keys
# Required keys:
# - MONGO_URL (MongoDB Atlas connection string)
# - GROQ_API_KEY (for AI questions)
# - GEMINI_API_KEY (for resume parsing)
# - JWT_SECRET (any random secret string)
# - RESEND_API_KEY (for password reset emails)
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file from example
cp .env.example .env

# Edit .env if needed (default values should work for local development)
```

### 4. Get API Keys

#### Required Keys:
1. **MongoDB Atlas** (Free tier available)
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get connection string
   - Add to `MONGO_URL` in backend/.env

2. **Groq API** (Free tier available)
   - Sign up at https://console.groq.com
   - Get API key from dashboard
   - Add to `GROQ_API_KEY` in backend/.env

3. **Google Gemini API** (Free tier available)
   - Get key from https://makersuite.google.com/app/apikey
   - Add to `GEMINI_API_KEY` in backend/.env

4. **Resend** (Free tier: 100 emails/day)
   - Sign up at https://resend.com
   - Get API key
   - Add to `RESEND_API_KEY` in backend/.env

#### Optional Keys:
- **Google OAuth**: For Google Sign-In
- **ElevenLabs**: For text-to-speech
- **AssemblyAI/Deepgram**: For enhanced speech-to-text

### 5. Run the Application

#### Start Backend (Terminal 1):
```bash
cd backend
uvicorn server:app --reload --port 8001
```

#### Start Frontend (Terminal 2):
```bash
cd frontend
npm start
# or
yarn start
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api

## Default Credentials
Create a new account through the signup page.

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas Network Access
- Check connection string format in .env

### API Key Errors
- Verify all required API keys are set in backend/.env
- Check API key validity on respective provider dashboards

### Port Already in Use
- Change ports in frontend/.env (REACT_APP_BACKEND_URL)
- Or kill processes using ports 3000 and 8001

## Project Structure
```
├── backend/          # FastAPI backend
│   ├── server.py     # Main API server
│   ├── ai_services.py # AI integrations
│   └── .env          # Backend environment variables
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # React pages
│   │   └── components/ # React components
│   └── .env          # Frontend environment variables
└── README.md         # Project documentation
```

## Support
For issues, please check the documentation files or create an issue on GitHub.
