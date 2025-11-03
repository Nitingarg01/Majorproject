import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { 
  ArrowLeft,
  Upload,
  User,
  Briefcase,
  Brain,
  FileText,
  Loader2,
  CheckCircle,
  ArrowRight,
  Building,
  Calendar,
  Target
} from 'lucide-react';

const CreateInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState({
    candidateName: '',
    targetRole: 'software-engineer',
    experienceLevel: 'mid-level',
    company: '',
    interviewType: 'technical',
    duration: 30,
    skills: [],
    projects: [],
    customQuestions: []
  });

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)', description: 'Fresh graduate or early career' },
    { value: 'mid-level', label: 'Mid Level (2-5 years)', description: 'Some professional experience' },
    { value: 'senior-level', label: 'Senior Level (5+ years)', description: 'Experienced professional' },
    { value: 'lead-level', label: 'Lead/Principal (8+ years)', description: 'Leadership and architecture experience' }
  ];

  const jobRoles = [
    { value: 'software-engineer', label: 'Software Engineer', icon: '💻' },
    { value: 'frontend-developer', label: 'Frontend Developer', icon: '🎨' },
    { value: 'backend-developer', label: 'Backend Developer', icon: '⚙️' },
    { value: 'fullstack-developer', label: 'Full Stack Developer', icon: '🔄' },
    { value: 'data-scientist', label: 'Data Scientist', icon: '📊' },
    { value: 'devops-engineer', label: 'DevOps Engineer', icon: '🚀' },
    { value: 'mobile-developer', label: 'Mobile Developer', icon: '📱' },
    { value: 'product-manager', label: 'Product Manager', icon: '📋' }
  ];

  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview', description: 'Focus on coding and technical skills' },
    { value: 'behavioral', label: 'Behavioral Interview', description: 'Focus on soft skills and experience' },
    { value: 'system-design', label: 'System Design', description: 'Architecture and design questions' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Mix of technical and behavioral' }
  ];

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setResumeFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a PDF file',
          variant: 'destructive'
        });
      }
    }
  };

  const extractResumeData = async () => {
    if (!resumeFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/parse-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setExtractedData(result);
        
        // Auto-populate interview config with extracted data
        setInterviewConfig(prev => ({
          ...prev,
          candidateName: result.name || '',
          skills: result.skills || [],
          projects: result.projects || []
        }));

        toast({
          title: 'Resume Analyzed',
          description: 'Candidate information extracted successfully'
        });
        setStep(2);
      } else {
        throw new Error('Failed to analyze resume');
      }
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze resume',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async () => {
    setLoading(true);
    try {
      const interviewData = {
        ...interviewConfig,
        extractedData: extractedData,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(interviewData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Interview Created',
          description: 'AI interview session has been set up successfully'
        });
        
        // Navigate to the interview session
        navigate(`/interview/${result.interviewId}`);
      } else {
        throw new Error('Failed to create interview');
      }
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create interview',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="p-8 bg-white shadow-lg border-0">
      <div className="text-center mb-8">
        <Upload className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Candidate Resume</h2>
        <p className="text-slate-600">We'll extract candidate information to personalize the interview</p>
      </div>

      <div 
        className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer mb-6"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-2">
          {resumeFile ? resumeFile.name : 'Click to upload candidate resume'}
        </p>
        <p className="text-sm text-slate-500">PDF files only • Max 10MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleResumeUpload}
        className="hidden"
      />

      <Button 
        onClick={extractResumeData}
        disabled={!resumeFile || loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing Resume...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5 mr-2" />
            Extract Candidate Info
          </>
        )}
      </Button>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Extracted Candidate Info */}
      <Card className="p-6 bg-white shadow-lg border-0">
        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
          Extracted Candidate Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Candidate Name</label>
            <input
              type="text"
              value={interviewConfig.candidateName}
              onChange={(e) => setInterviewConfig(prev => ({ ...prev, candidateName: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter candidate name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company/Position</label>
            <input
              type="text"
              value={interviewConfig.company}
              onChange={(e) => setInterviewConfig(prev => ({ ...prev, company: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Company name or position"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Extracted Skills ({interviewConfig.skills.length})
          </label>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg min-h-[60px]">
            {interviewConfig.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
            {interviewConfig.skills.length === 0 && (
              <p className="text-slate-500 text-sm">No skills extracted from resume</p>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Extracted Projects ({interviewConfig.projects.length})
          </label>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {interviewConfig.projects.map((project, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900">{project.name || `Project ${index + 1}`}</h4>
                <p className="text-sm text-slate-600 mt-1">{project.description || 'No description'}</p>
                {project.technologies && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.slice(0, 5).map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {interviewConfig.projects.length === 0 && (
              <p className="text-slate-500 text-sm p-4">No projects extracted from resume</p>
            )}
          </div>
        </div>
      </Card>

      {/* Interview Configuration */}
      <Card className="p-6 bg-white shadow-lg border-0">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Target className="w-6 h-6 text-indigo-500 mr-2" />
          Interview Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Target Role</label>
            <div className="grid grid-cols-2 gap-2">
              {jobRoles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setInterviewConfig(prev => ({ ...prev, targetRole: role.value }))}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    interviewConfig.targetRole === role.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{role.icon}</span>
                    <span className="text-sm font-medium">{role.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Experience Level</label>
            <div className="space-y-2">
              {experienceLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setInterviewConfig(prev => ({ ...prev, experienceLevel: level.value }))}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    interviewConfig.experienceLevel === level.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm opacity-75">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interview Type and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Interview Type</label>
            <div className="space-y-2">
              {interviewTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInterviewConfig(prev => ({ ...prev, interviewType: type.value }))}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    interviewConfig.interviewType === type.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm opacity-75">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Duration</label>
            <select
              value={interviewConfig.duration}
              onChange={(e) => setInterviewConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={15}>15 minutes (Quick Screen)</option>
              <option value={30}>30 minutes (Standard)</option>
              <option value={45}>45 minutes (Detailed)</option>
              <option value={60}>60 minutes (Comprehensive)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(1)}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
        
        <Button 
          onClick={createInterview}
          disabled={loading || !interviewConfig.candidateName}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Interview...
            </>
          ) : (
            <>
              Start AI Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-2xl font-bold text-slate-900">Create AI Interview</h1>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </main>
    </div>
  );
};

export default CreateInterview;