import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CreateCampaign from './pages/CreateCampaign';
import ResumeAnalysis from './pages/ResumeAnalysis';
import PerformanceStats from './pages/PerformanceStats';
import InterviewFeedback from './pages/InterviewFeedback';
import CreateInterview from './pages/CreateInterview';
import OptimizedAIInterview from './pages/OptimizedAIInterview';
import CandidateInterview from './pages/CandidateInterview';
import InterviewReport from './pages/InterviewReport';
import TestGoogleAuth from './pages/TestGoogleAuth';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-campaign" 
            element={
              <ProtectedRoute requiredRole="recruiter">
                <CreateCampaign />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/resume-analysis" 
            element={
              <ProtectedRoute>
                <ResumeAnalysis />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/performance-stats" 
            element={
              <ProtectedRoute>
                <PerformanceStats />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/interview-feedback/:interviewId" 
            element={
              <ProtectedRoute>
                <InterviewFeedback />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/interview/create" 
            element={
              <ProtectedRoute>
                <CreateInterview />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/interview/:interviewId" 
            element={
              <ProtectedRoute>
                <OptimizedAIInterview />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/candidate-interview/:interviewId" 
            element={<CandidateInterview />}
          />
          
          <Route 
            path="/interview-report/:id" 
            element={
              <ProtectedRoute>
                <InterviewReport />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/interview-feedback" 
            element={<InterviewReport />}
          />
          
          <Route 
            path="/demo-interview" 
            element={<CandidateInterview />}
          />
          
          <Route 
            path="/test-google-auth" 
            element={<TestGoogleAuth />}
          />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;