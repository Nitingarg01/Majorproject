# 🚀 Quick Start Guide

## For Experienced Developers

### 1. Prerequisites Check
```bash
node --version  # Should be v16+
python --version  # Should be 3.8+
```

### 2. Clone & Install
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn python-multipart pymongo motor python-dotenv groq google-generativeai httpx PyPDF2 pydantic bcrypt python-jose passlib

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### 3. Configure Environment

**backend/.env:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_interview
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
```

**frontend/.env:**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 4. Run
```bash
# Terminal 1 - Backend
cd backend
python server.py

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Get API Keys (FREE)

1. **Groq**: https://console.groq.com/ → API Keys
2. **Gemini**: https://makersuite.google.com/app/apikey
3. **MongoDB**: https://cloud.mongodb.com/ → Create Cluster → Connect

---

## Troubleshooting

**Port in use?**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000 && taskkill /PID <PID> /F  # Windows
```

**Module errors?**
```bash
pip install -r requirements.txt
npm install --legacy-peer-deps
```

**MongoDB connection failed?**
- Check MONGODB_URI format
- Whitelist IP in MongoDB Atlas
- Verify credentials

---

## Done! 🎉

Visit http://localhost:3000 and create your first account!
