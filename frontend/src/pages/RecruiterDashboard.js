import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { 
  LogOut,
  Plus,
  FileText,
  BarChart3,
  Brain,
  Users,
  TrendingUp,
  Upload,
  Activity,
  Award
} from 'lucide-react';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [resumeAnalyses, setResumeAnalyses] = useState([]);

  useEffect(() => {
    // Load interview data from API
    const fetchData = async () => {
      try {
        const interviewsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (interviewsResponse.ok) {
          const interviewsData = await interviewsResponse.json();
          setInterviews(interviewsData);
        }

        // TODO: Fetch resume analyses when endpoint is ready
        // const resumeResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/resume-analyses`, {
        //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        // });
        // if (resumeResponse.ok) {
        //   const resumeData = await resumeResponse.json();
        //   setResumeAnalyses(resumeData);
        // }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearDemoData = async () => {
    if (!window.confirm('Are you sure you want to clear all demo data? This will delete all interviews and campaigns.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interviews/clear-demo-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setInterviews([]);
        setResumeAnalyses([]);
        
        toast({
          title: 'Demo Data Cleared',
          description: `Deleted ${result.deletedInterviews} interviews and ${result.deletedCampaigns} campaigns`
        });
      } else {
        throw new Error('Failed to clear demo data');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear demo data',
        variant: 'destructive'
      });
    }
  };

  // Main dashboard actions
  const mainActions = [
    {
      title: 'Create Interview',
      description: 'Start a new AI-powered interview session with resume-driven questions',
      icon: Plus,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      action: () => navigate('/interview/create')
    },
    {
      title: 'Resume Analysis',
      description: 'Deeply analyze resumes to extract projects, skills, and provide improvement suggestions',
      icon: FileText,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      action: () => navigate('/resume-analysis')
    },
    {
      title: 'Performance Stats',
      description: 'View interview feedback and candidate performance analytics with detailed insights',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      action: () => navigate('/performance-stats')
    }
  ];

  const stats = [
    {
      title: 'Total Interviews',
      value: interviews.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Resume Analyses',
      value: resumeAnalyses.length,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      title: 'Average Score',
      value: Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length) || 0,
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">My Interview AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Recruiter'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              {interviews.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearDemoData}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Clear Demo Data
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-slate-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to Your AI-Powered Recruitment Hub
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Streamline your hiring process with intelligent interview management, 
            deep resume analysis, and comprehensive performance insights.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {mainActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className={`p-8 ${action.color} ${action.hoverColor} text-white cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-xl border-0`}
                onClick={action.action}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{action.title}</h3>
                  <p className="text-white text-opacity-90 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="mt-6">
                    <div className="inline-flex items-center text-white font-medium">
                      Get Started
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="p-8 bg-white shadow-lg border-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Recent Interview Activity</h3>
            <Button 
              onClick={() => navigate('/performance-stats')} 
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              View All Performance Stats
            </Button>
          </div>
          
          {interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.slice(0, 5).map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {interview.candidateName?.split(' ').map(n => n[0]).join('') || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-lg">{interview.candidateName || 'Candidate'}</p>
                      <p className="text-sm text-slate-600">{interview.position || 'Position'}</p>
                      <p className="text-xs text-slate-500">{interview.date || 'Recent'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    {interview.status === 'completed' && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Performance Score</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {interview.feedback?.scores?.overall || interview.scores?.overall || 0}%
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={() => navigate(`/interview-feedback/${interview.interviewId || interview.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Feedback
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-slate-600 mb-2">No interviews yet</h4>
              <p className="text-slate-500 mb-6">Start by creating your first interview or analyzing a resume</p>
              <Button 
                onClick={() => navigate('/interview/create')}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Interview
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default RecruiterDashboard;