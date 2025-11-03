#!/bin/bash

echo "========================================"
echo "  AI Interview Platform - Startup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "[1/4] Checking backend dependencies..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate

echo "[3/4] Installing/Updating backend dependencies..."
pip install -r requirements.txt --quiet

echo "[4/4] Starting backend server..."
# Start backend in background
python server.py &
BACKEND_PID=$!
echo "Backend server started (PID: $BACKEND_PID)"

cd ..

echo ""
echo "[5/6] Installing frontend dependencies..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages... (this may take a few minutes)"
    npm install --legacy-peer-deps
fi

echo "[6/6] Starting frontend server..."
# Start frontend in background
npm start &
FRONTEND_PID=$!
echo "Frontend server started (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "========================================"
echo "  Servers Running"
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait
