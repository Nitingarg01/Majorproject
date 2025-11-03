import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  MessageSquare,
  Briefcase,
  Brain,
  Users,
  Target
} from 'lucide-react';
import axios from 'axios';
import { mockInterviews } from '../mockData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviewData();
  }, [id]);

  const loadInterviewData = async () => {
    try {
      // For now, use mock data
      const mockInterview = mockInterviews.find(i => i.id === id);
      setInterview(mockInterview);
      setLoading(false);
    } catch (error) {
      console.error('Error loading interview:', error);
      setLoading(false);
    }
  };

  if (loading || !interview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading interview report...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Communication',
      value: interview.feedback?.communication || 0,
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      label: 'Technical Skills',
      value: interview.feedback?.technical || 0,
      icon: Brain,
      color: 'bg-purple-500'
    },
    {
      label: 'Problem Solving',
      value: interview.feedback?.problemSolving || 0,
      icon: Target,
      color: 'bg-green-500'
    },
    {
      label: 'Cultural Fit',
      value: interview.feedback?.cultural || 0,
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Interview Report</h1>
                <p className="text-slate-600">{interview.candidateName}</p>
              </div>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 col-span-1">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">
                  {interview.candidateName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{interview.candidateName}</h2>
              <p className="text-slate-600 mb-4">{interview.candidateEmail}</p>
              <div className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                <Briefcase className="w-4 h-4 mr-1" />
                {interview.position}
              </div>
            </div>
          </Card>

          <Card className="p-6 col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Overall Score</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Above Average</span>
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#6366f1"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - interview.score / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <div className="text-5xl font-bold text-slate-900">{interview.score}</div>
                  <div className="text-slate-600 text-sm">out of 100</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600 mb-1">Interview Date</p>
                <p className="text-lg font-semibold text-slate-900">{interview.date}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Duration</p>
                <p className="text-lg font-semibold text-slate-900">45 min</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Questions</p>
                <p className="text-lg font-semibold text-slate-900">16</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Detailed Assessment</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 ${metric.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-slate-900">{metric.label}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI Feedback */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Feedback Summary</h3>
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>Excellent communication skills with clear articulation</li>
                <li>Strong technical knowledge in React and modern web technologies</li>
                <li>Demonstrated problem-solving abilities with practical examples</li>
                <li>Good cultural fit with collaborative mindset</li>
              </ul>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <h4 className="font-semibold text-amber-900 mb-2">Areas for Improvement</h4>
              <ul className="list-disc list-inside text-amber-800 space-y-1">
                <li>Could provide more specific metrics when discussing project impact</li>
                <li>More depth needed in system design discussions</li>
                <li>Consider elaborating on leadership experiences</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Section-wise Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Section-wise Performance</h3>
          <div className="space-y-6">
            {[
              { section: 'Introduction', score: 90, feedback: 'Confident and professional introduction' },
              { section: 'Resume Discussion', score: 85, feedback: 'Clear explanation of past experiences' },
              { section: 'Projects Deep-Dive', score: 88, feedback: 'Strong technical understanding demonstrated' },
              { section: 'Behavioral Questions', score: 82, feedback: 'Good examples with STAR method' },
              { section: 'Technical Assessment', score: 80, feedback: 'Solid fundamentals, room for advanced topics' },
              { section: 'Closing', score: 92, feedback: 'Thoughtful questions about role and company' }
            ].map((item, index) => (
              <div key={index} className="pb-6 border-b border-slate-200 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{item.section}</h4>
                  <span className="text-sm font-semibold text-indigo-600">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-2 mb-2" />
                <p className="text-sm text-slate-600">{item.feedback}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InterviewReport;