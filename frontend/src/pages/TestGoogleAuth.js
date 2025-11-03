import React from 'react';
import { Card } from '../components/ui/card';
import GoogleSignIn from '../components/GoogleSignIn';
import { useNavigate } from 'react-router-dom';

const TestGoogleAuth = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('Google sign-in successful!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Test Google Authentication</h1>
          <p className="text-slate-600">Click the button below to test Google Sign-In</p>
        </div>
        
        <GoogleSignIn onSuccess={handleSuccess} />
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default TestGoogleAuth;