import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Zap, Mail, Lock, User, Loader2 } from 'lucide-react';
import GoogleSignIn from '../components/GoogleSignIn';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'recruiter'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const result = await signup(formData.name, formData.email, formData.password, formData.role);
    
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Account created successfully'
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleGoogleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-slate-900">My Interview AI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-600">Start hiring with AI today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>I am a</Label>
            <RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recruiter" id="recruiter" />
                <Label htmlFor="recruiter" className="cursor-pointer">Recruiter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="candidate" id="candidate" />
                <Label htmlFor="candidate" className="cursor-pointer">Candidate</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-4">
            <GoogleSignIn onSuccess={handleGoogleSuccess} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;