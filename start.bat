@echo off
echo ========================================
echo   AI Interview Platform - Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Checking backend dependencies...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate

echo [3/4] Installing/Updating backend dependencies...
pip install -r requirements.txt --quiet

echo [4/4] Starting backend server...
start "Backend Server" cmd /k "cd /d %CD% && venv\Scripts\activate && python server.py"

cd ..

echo.
echo [5/6] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing npm packages... (this may take a few minutes)
    call npm install --legacy-peer-deps
)

echo [6/6] Starting frontend server...
start "Frontend Server" cmd /k "cd /d %CD% && npm start"

cd ..

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application in browser...
pause >nul

start http://localhost:3000

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
