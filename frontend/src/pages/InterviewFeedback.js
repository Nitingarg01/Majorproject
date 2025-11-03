import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  MessageSquare,
  Lightbulb,
  Flag,
  User,
  Briefcase,
  Calendar,
  Clock,
  Download,
  Loader2
} from 'lucide-react';

const InterviewFeedback = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInterviewFeedback();
  }, [interviewId]);

  const fetchInterviewFeedback = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data);
        setFeedback(data.feedback);
        
        // Auto-generate feedback if it doesn't exist and interview is completed
        if (!data.feedback && data.status === 'completed' && data.conversation && data.conversation.length > 0) {
          console.log('No feedback found, auto-generating...');
          await generateFeedback();
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId: interviewId,
          conversationHistory: interview?.conversation || [],
          answers: interview?.answers || interview?.conversation?.filter(c => c.type === 'answer').map(c => c.text) || [],
          duration: interview?.duration || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        
        // Refresh to get updated interview data
        const refreshResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/${interviewId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setInterview(refreshedData);
        }
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'STRONG_HIRE': return 'bg-green-100 text-green-800 border-green-300';
      case 'HIRE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MAYBE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'NO_HIRE': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecommendationIcon = (rec) => {
    switch (rec) {
      case 'STRONG_HIRE': return <Star className="w-5 h-5" />;
      case 'HIRE': return <CheckCircle className="w-5 h-5" />;
      case 'MAYBE': return <AlertCircle className="w-5 h-5" />;
      case 'NO_HIRE': return <XCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading interview feedback...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Not Found</h2>
            <p className="text-slate-600 mb-6">The interview you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Feedback Yet</h2>
            <p className="text-slate-600 mb-6">
              This interview hasn't been analyzed yet. Generate comprehensive feedback now.
            </p>
            <Button
              onClick={generateFeedback}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Feedback...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Feedback
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const scores = feedback.scores || {};
  const sections = feedback.sections || [];
  const strengths = feedback.strengths || [];
  const improvements = feedback.improvements || [];
  const highlights = feedback.highlights || [];
  const redFlags = feedback.redFlags || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Interview Feedback</h1>
              <div className="flex items-center space-x-4 text-slate-600">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {interview.candidateName}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {interview.targetRole}
                </div>
                {interview.completedAt && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(interview.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Recommendation Banner */}
        {feedback.recommendation && (
          <Card className={`p-6 mb-8 border-2 ${getRecommendationColor(feedback.recommendation)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getRecommendationIcon(feedback.recommendation)}
                <div>
                  <h3 className="text-lg font-bold">Hiring Recommendation</h3>
                  <p className="text-sm opacity-80">{feedback.recommendation.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{scores.overall}%</div>
                <div className="text-sm opacity-80">Overall Score</div>
              </div>
            </div>
          </Card>
        )}

        {/* Summary */}
        {feedback.summary && (
          <Card className="p-6 mb-8 bg-white">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
              Executive Summary
            </h3>
            <p className="text-slate-700 leading-relaxed">{feedback.summary}</p>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card className="p-6 mb-8 bg-white">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-600" />
            Score Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(scores).map(([category, score]) => (
              <div key={category} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className={`text-3xl font-bold mb-1 ${
                  score >= 80 ? 'text-green-600' :
                  score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {score}%
                </div>
                <div className="text-sm text-slate-600 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Highlights */}
        {highlights.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-green-600" />
              Interview Highlights
            </h3>
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700">{highlight}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <Card className="p-6 bg-white">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Key Strengths
            </h3>
            <div className="space-y-3">
              {strengths.map((strength, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700">{strength}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Improvements */}
          <Card className="p-6 bg-white">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-yellow-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700">{improvement}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section-wise Feedback */}
        {sections.length > 0 && (
          <Card className="p-6 mb-8 bg-white">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-indigo-600" />
              Section-wise Analysis
            </h3>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{section.section}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(section.score)}`}>
                      {section.score}%
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{section.feedback}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Flag className="w-5 h-5 mr-2 text-red-600" />
              Concerns & Red Flags
            </h3>
            <div className="space-y-3">
              {redFlags.map((flag, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700">{flag}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Next Steps */}
        {feedback.nextSteps && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600" />
              Recommended Next Steps
            </h3>
            <p className="text-slate-700 leading-relaxed">{feedback.nextSteps}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterviewFeedback;
