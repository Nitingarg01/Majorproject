# AI Interview Platform - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)
7. [API Keys Setup](#api-keys-setup)

---

## 🔧 Prerequisites

### Required Software

#### 1. **Node.js** (v16 or higher)
- **Download**: https://nodejs.org/
- **Verify Installation**:
  ```bash
  node --version
  npm --version
  ```
- Should show v16.x.x or higher

#### 2. **Python** (v3.8 or higher)
- **Download**: https://www.python.org/downloads/
- **Verify Installation**:
  ```bash
  python --version
  # or
  python3 --version
  ```
- Should show Python 3.8.x or higher

#### 3. **MongoDB**
Choose ONE of these options:

**Option A: MongoDB Atlas (Cloud - Recommended)**
- Sign up at: https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string

**Option B: Local MongoDB**
- **Download**: https://www.mongodb.com/try/download/community
- **Install** and start MongoDB service
- Default connection: `mongodb://localhost:27017`

#### 4. **Git** (Optional but recommended)
- **Download**: https://git-scm.com/downloads
- **Verify Installation**:
  ```bash
  git --version
  ```

---

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **Internet**: Stable connection for API calls

### Recommended Requirements
- **RAM**: 8GB or more
- **CPU**: Multi-core processor
- **Storage**: 5GB free space

---

## 📥 Installation Steps

### Step 1: Download/Clone the Project

**Option A: If you have Git**
```bash
git clone <repository-url>
cd Major_project_3
```

**Option B: If you downloaded ZIP**
1. Extract the ZIP file
2. Open terminal/command prompt
3. Navigate to the project folder:
   ```bash
   cd path/to/Major_project_3
   ```

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

**If requirements.txt doesn't exist, install manually:**
```bash
pip install fastapi uvicorn python-multipart pymongo motor python-dotenv groq google-generativeai httpx PyPDF2 pydantic bcrypt python-jose passlib
```

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install Node packages
npm install

# If you encounter errors, try:
npm install --legacy-peer-deps
```

---

## ⚙️ Configuration

### Step 1: Backend Environment Variables

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Create `.env` file** (copy from `.env.example` or create new):
   ```bash
   # On Windows:
   copy .env.example .env
   # On macOS/Linux:
   cp .env.example .env
   ```

3. **Edit `backend/.env` file** with your settings:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_interview?retryWrites=true&w=majority
# OR for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/ai_interview

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI API Keys (Get from respective providers)
GROQ_API_KEY=your-groq-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Additional AI providers
OPENROUTER_API_KEY=your-openrouter-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

### Step 2: Frontend Environment Variables

1. **Navigate to frontend folder**:
   ```bash
   cd frontend
   ```

2. **Create `.env` file**:
   ```bash
   # On Windows:
   copy .env.example .env
   # On macOS/Linux:
   cp .env.example .env
   ```

3. **Edit `frontend/.env` file**:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000

# Google OAuth (Optional - for Google Sign-In)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
```

---

## 🔑 API Keys Setup

### 1. **Groq API Key** (FREE & Required)
1. Visit: https://console.groq.com/
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy and paste into `backend/.env` as `GROQ_API_KEY`

### 2. **Google Gemini API Key** (FREE & Recommended)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into `backend/.env` as `GEMINI_API_KEY`

### 3. **MongoDB Connection String**

**For MongoDB Atlas (Cloud):**
1. Go to: https://cloud.mongodb.com/
2. Sign up/Login
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password
7. Paste into `backend/.env` as `MONGODB_URI`

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/ai_interview
```

### 4. **Google OAuth** (Optional - for Google Sign-In)
1. Go to: https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Copy Client ID to `frontend/.env`

---

## 🚀 Running the Application

### Method 1: Run Both Servers Separately (Recommended)

**Terminal 1 - Backend Server:**
```bash
# Navigate to backend folder
cd backend

# Activate virtual environment (if not already activated)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start backend server
python server.py
# OR
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend Server:**
```bash
# Navigate to frontend folder
cd frontend

# Start frontend development server
npm start
```

### Method 2: Using Start Scripts (if configured)

**From project root:**
```bash
# Start both servers
npm run dev
```

---

## 🌐 Accessing the Application

Once both servers are running:

1. **Frontend**: Open browser and go to:
   ```
   http://localhost:3000
   ```

2. **Backend API**: Available at:
   ```
   http://localhost:8000
   ```

3. **API Documentation**: Visit:
   ```
   http://localhost:8000/docs
   ```

---

## ✅ Verification Steps

### 1. Check Backend is Running
```bash
# Open browser or use curl
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### 2. Check Frontend is Running
- Browser should automatically open to `http://localhost:3000`
- You should see the login/signup page

### 3. Test Database Connection
- Try creating a new account
- If successful, MongoDB is connected properly

### 4. Test AI Integration
- Start an interview
- If questions are generated, AI APIs are working

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Module not found" errors

**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install --legacy-peer-deps
```

#### Issue 2: Port already in use

**Solution:**
```bash
# Find and kill process using port 8000 (backend)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# For port 3000 (frontend)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

#### Issue 3: MongoDB connection failed

**Solution:**
1. Check `MONGODB_URI` in `backend/.env`
2. Verify MongoDB is running (if local)
3. Check network connectivity (if Atlas)
4. Whitelist your IP in MongoDB Atlas

#### Issue 4: CORS errors

**Solution:**
1. Ensure backend is running on port 8000
2. Check `REACT_APP_BACKEND_URL` in `frontend/.env`
3. Restart both servers

#### Issue 5: AI API errors

**Solution:**
1. Verify API keys in `backend/.env`
2. Check API key validity on provider websites
3. Ensure you have API credits/quota remaining

#### Issue 6: Python virtual environment issues

**Solution:**
```bash
# Delete and recreate virtual environment
cd backend
rm -rf venv  # or rmdir /s venv on Windows
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

---

## 📦 Project Structure

```
Major_project_3/
├── backend/
│   ├── server.py           # Main FastAPI server
│   ├── ai_services.py      # AI integration
│   ├── models.py           # Data models
│   ├── auth_utils.py       # Authentication
│   ├── speech_services.py  # Text-to-speech
│   ├── .env               # Backend environment variables
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   └── contexts/      # React contexts
│   ├── public/            # Static files
│   ├── .env              # Frontend environment variables
│   ├── package.json       # Node dependencies
│   └── node_modules/      # Installed packages
│
└── README.md              # This file
```

---

## 🔒 Security Notes

### Important Security Practices:

1. **Never commit `.env` files** to version control
2. **Change default JWT_SECRET** in production
3. **Use strong passwords** for MongoDB
4. **Keep API keys secret** - don't share publicly
5. **Enable MongoDB authentication** in production
6. **Use HTTPS** in production environment

---

## 📝 Default Credentials

### First Time Setup:
1. No default accounts exist
2. Create new account via signup page
3. First user can be made admin via database

### Creating Admin User:
```javascript
// In MongoDB, update user document:
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "recruiter" } }
)
```

---

## 🔄 Updating the Application

### Pull Latest Changes:
```bash
git pull origin main
```

### Update Backend Dependencies:
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Update Frontend Dependencies:
```bash
cd frontend
npm install
```

---

## 🛑 Stopping the Application

### Stop Backend:
- Press `Ctrl + C` in backend terminal

### Stop Frontend:
- Press `Ctrl + C` in frontend terminal

### Deactivate Virtual Environment:
```bash
deactivate
```

---

## 📞 Support

### If you encounter issues:

1. **Check logs** in terminal for error messages
2. **Verify all environment variables** are set correctly
3. **Ensure all services** (MongoDB, APIs) are accessible
4. **Check firewall settings** if connection issues occur
5. **Review troubleshooting section** above

### Common Commands Reference:

```bash
# Check Python version
python --version

# Check Node version
node --version

# Check npm version
npm --version

# List installed Python packages
pip list

# List installed npm packages
npm list --depth=0

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Success!

If you see:
- ✅ Backend running on `http://localhost:8000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ Can create account and login
- ✅ Can start interview and get AI questions

**Congratulations! Your AI Interview Platform is ready to use!** 🚀

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Groq API Documentation**: https://console.groq.com/docs
- **Google Gemini API**: https://ai.google.dev/

---

## 📄 License

[Your License Here]

---

## 👥 Contributors

[Your Name/Team]

---

**Last Updated**: November 2, 2025
