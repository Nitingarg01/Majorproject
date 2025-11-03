import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Zap, Mail, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(email);
    
    if (result.success) {
      setSent(true);
      toast({
        title: 'Success',
        description: 'Password reset link sent to your email'
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-slate-900">My Interview AI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
          <p className="text-slate-600">
            {sent 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to receive a reset link'
            }
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-slate-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Button 
              onClick={() => setSent(false)} 
              variant="outline" 
              className="w-full"
            >
              Resend Email
            </Button>
          </div>
        )}

        <Link 
          to="/login" 
          className="flex items-center justify-center mt-6 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </Card>
    </div>
  );
};

export default ForgotPassword;