import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useToast } from '../hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Upload, 
  FileText, 
  Loader2,
  CheckCircle2,
  MessageSquare,
  Volume2,
  VolumeX
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CandidateInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stage, setStage] = useState('upload'); // upload, interview, completed
  const [resume, setResume] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [conversation, setConversation] = useState([]);
  const [interviewSection, setInterviewSection] = useState('greeting');
  const [progress, setProgress] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const sections = [
    { id: 'greeting', name: 'Introduction', questions: 1 },
    { id: 'resume', name: 'Resume Discussion', questions: 3 },
    { id: 'projects', name: 'Projects Deep-Dive', questions: 4 },
    { id: 'behavioral', name: 'Behavioral', questions: 3 },
    { id: 'technical', name: 'Technical', questions: 4 },
    { id: 'closing', name: 'Closing', questions: 1 }
  ];

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setCurrentAnswer(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    setResume(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await axios.post(`${API}/interview/parse-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResumeData(response.data);
      toast({
        title: 'Success',
        description: 'Resume parsed successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse resume',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const startInterview = async () => {
    if (!resumeData) {
      toast({
        title: 'Error',
        description: 'Please upload your resume first',
        variant: 'destructive'
      });
      return;
    }

    setStage('interview');
    // Get first question
    await getNextQuestion('greeting', '');
  };

  const getNextQuestion = async (section, previousAnswer) => {
    try {
      const response = await axios.post(`${API}/interview/next-question`, {
        interviewId,
        section,
        previousAnswer,
        resumeData,
        conversationHistory: conversation
      });

      const { question, section: newSection, isComplete } = response.data;

      if (isComplete) {
        setStage('completed');
        return;
      }

      setCurrentQuestion(question);
      setInterviewSection(newSection);
      setQuestionCount(prev => prev + 1);
      setProgress((questionCount / 16) * 100);

      // Speak the question
      speakText(question);

      // Add to conversation
      setConversation(prev => [...prev, { type: 'question', text: question, section: newSection }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get next question',
        variant: 'destructive'
      });
    }
  };

  const speakText = (text) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide an answer',
        variant: 'destructive'
      });
      return;
    }

    // Stop listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    // Add answer to conversation
    setConversation(prev => [...prev, { type: 'answer', text: currentAnswer, section: interviewSection }]);

    // Get next question
    await getNextQuestion(interviewSection, currentAnswer);

    // Clear current answer
    setCurrentAnswer('');
  };

  const skipQuestion = async () => {
    await getNextQuestion(interviewSection, '');
    setCurrentAnswer('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Interview</h1>
          <p className="text-slate-600">Powered by My Interview AI</p>
        </div>

        {/* Resume Upload Stage */}
        {stage === 'upload' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Your Resume</h2>
              <p className="text-slate-600">We'll use it to personalize your interview questions</p>
            </div>

            <div className="max-w-md mx-auto">
              <label 
                htmlFor="resume-upload" 
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="mb-2 text-sm text-slate-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">PDF (MAX. 5MB)</p>
                  {resume && (
                    <p className="mt-4 text-sm font-medium text-indigo-600">{resume.name}</p>
                  )}
                </div>
                <input 
                  id="resume-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleResumeUpload}
                />
              </label>

              {uploading && (
                <div className="mt-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  <p className="mt-2 text-sm text-slate-600">Parsing your resume...</p>
                </div>
              )}

              {resumeData && (
                <div className="mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Resume parsed successfully!</span>
                    </div>
                  </div>
                  <Button 
                    onClick={startInterview} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    Start Interview
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Interview Stage */}
        {stage === 'interview' && (
          <>
            {/* Progress Bar */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {sections.find(s => s.id === interviewSection)?.name || 'Interview'}
                </span>
                <span className="text-sm text-slate-600">
                  Question {questionCount} of 16
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </Card>

            {/* Interview Card */}
            <Card className="p-8">
              {/* AI Avatar */}
              <div className="flex items-start space-x-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none p-6">
                    <p className="text-slate-900 text-lg leading-relaxed">{currentQuestion}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleSpeaking}
                      className={isSpeaking ? 'text-indigo-600' : ''}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Answer Section */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-6 min-h-32">
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {currentAnswer || 'Your answer will appear here...'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      size="lg"
                      onClick={toggleListening}
                      className={`${
                        isListening 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    {isListening && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Recording...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" onClick={skipQuestion}>
                      Skip
                    </Button>
                    <Button 
                      onClick={submitAnswer}
                      disabled={!currentAnswer.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Submit Answer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Conversation History */}
            {conversation.length > 0 && (
              <Card className="mt-6 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversation History</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.map((item, index) => (
                    <div key={index} className={`flex ${item.type === 'answer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3xl ${
                        item.type === 'question' 
                          ? 'bg-slate-100' 
                          : 'bg-indigo-100'
                      } rounded-lg p-4`}>
                        <p className="text-sm text-slate-900">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Completed Stage */}
        {stage === 'completed' && (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Interview Completed!</h2>
            <p className="text-lg text-slate-600 mb-8">
              Thank you for completing the interview. Your responses are being analyzed.
            </p>
            <Button 
              onClick={() => navigate('/interview-feedback')} 
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              View Feedback
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CandidateInterview;