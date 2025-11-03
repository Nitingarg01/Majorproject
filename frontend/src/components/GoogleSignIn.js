import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';

const GoogleSignIn = ({ onSuccess, buttonText = "Sign in with Google" }) => {
  const googleButtonRef = useRef(null);
  const { googleLogin } = useAuth();
  const { toast } = useToast();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  const initializeGoogleSignIn = React.useCallback(() => {
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Google Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env');
        return;
      }
      console.log('Initializing Google Sign-In with client ID:', clientId.substring(0, 20) + '...');
      console.log('Current origin:', window.location.origin);

      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.error('Google Identity Services not available');
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        // Clear any existing content
        googleButtonRef.current.innerHTML = '';
        
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          }
        );
        console.log('Google Sign-In button rendered successfully');
      }
      return true;
    } catch (error) {
      console.error('Google Sign-In initialization error:', error);
      console.log('Falling back to demo mode due to OAuth configuration issue');
      setIsGoogleLoaded(false);
      setIsCheckingGoogle(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds total wait time
    let checkInterval;

    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Google Identity Services loaded successfully');
        setIsGoogleLoaded(true);
        setIsCheckingGoogle(false);
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
        
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
      } else {
        console.warn('Google Identity Services failed to load after 5 seconds, using fallback');
        setIsGoogleLoaded(false);
        setIsCheckingGoogle(false);
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      }
    };

    // Check immediately
    checkGoogleLoaded();
    
    // Then check every 100ms
    checkInterval = setInterval(checkGoogleLoaded, 100);

    // Also listen for when the script loads
    const handleGoogleLoad = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Google Identity Services loaded via event listener');
        setIsGoogleLoaded(true);
        setIsCheckingGoogle(false);
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      }
    };

    window.addEventListener('load', handleGoogleLoad);

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.removeEventListener('load', handleGoogleLoad);
    };
  }, [initializeGoogleSignIn]);

  // Re-initialize when button ref changes or Google loads
  useEffect(() => {
    if (isGoogleLoaded && googleButtonRef.current && window.google) {
      console.log('Re-initializing Google button due to ref/state change');
      initializeGoogleSignIn();
    }
  }, [isGoogleLoaded, initializeGoogleSignIn]);

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      console.log('Google credential received, sending to backend...');
      const result = await googleLogin(response.credential);

      if (result.success) {
        console.log('Google login successful');
        toast({
          title: 'Success',
          description: 'Signed in with Google successfully'
        });
        if (onSuccess) onSuccess();
      } else {
        console.error('Backend Google login failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Google sign-in failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Error',
        description: `Google sign-in failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock Google sign-in for development
  const handleMockGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Starting demo Google sign-in...');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For development, we'll create a mock token and call the backend
      const result = await googleLogin('mock_google_token_for_development');

      console.log('Demo Google sign-in result:', result);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Signed in with Google successfully (Demo Mode)'
        });
        if (onSuccess) onSuccess();
      } else {
        console.error('Demo Google sign-in failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Google sign-in failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Demo Google sign-in error:', error);
      toast({
        title: 'Error',
        description: `Google sign-in failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {isCheckingGoogle ? (
        // Loading state while checking for Google services
        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-300 text-slate-500"
          disabled
        >
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
          Loading Google Sign-In...
        </Button>
      ) : isGoogleLoaded ? (
        <div ref={googleButtonRef} className="w-full flex justify-center"></div>
      ) : (
        // Fallback button when Google OAuth is not available
        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-300 hover:bg-slate-50 text-slate-700"
          onClick={handleMockGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      )}
    </div>
  );
};

export default GoogleSignIn;