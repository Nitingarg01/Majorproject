import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { 
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  User,
  Brain
} from 'lucide-react';

const AIInterviewSession = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const lastSpokenTextRef = useRef('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // State
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  
  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Derived state
  const candidate_name = interviewData?.candidateName || 'Candidate';
  
  // AI Avatar
  const [aiAvatarState, setAiAvatarState] = useState('listening'); // listening, talking, thinking

  useEffect(() => {
    // Only initialize once on mount
    initializeInterview();
    setupMediaDevices();
    
    return () => {
      cleanupMediaDevices();
    };
  }, []); // Empty dependency array - run only once on mount

  useEffect(() => {
    // Separate timer effect
    const timer = setInterval(() => {
      if (isInterviewActive) {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isInterviewActive]); // Timer depends on isInterviewActive

  const initializeInterview = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInterviewData(data);
        startInterview(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load interview data',
        variant: 'destructive'
      });
    }
  };

  const setupMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: 'Media Access Required',
        description: 'Please allow camera and microphone access',
        variant: 'destructive'
      });
    }
  };

  const cleanupMediaDevices = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const startInterview = async (data) => {
    setIsInterviewActive(true);
    setAiAvatarState('thinking');
    
    // Get first question
    const firstQuestion = await getNextQuestion(data, null, []);
    setCurrentQuestion(firstQuestion.question);
    
    // Convert to speech and play
    await speakQuestion(firstQuestion.question);
    setAiAvatarState('listening');
  };

  const getNextQuestion = async (interviewDataParam, previousAnswer, conversationHistory) => {
    try {
      // Use parameter if provided, otherwise fall back to state
      const dataToUse = interviewDataParam || interviewData;
      
      if (!dataToUse) {
        console.error('No interview data available');
        return { question: "Can you tell me about yourself and your background?" };
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId: interviewId,
          section: getCurrentSection(),
          previousAnswer: previousAnswer || "",
          resumeData: dataToUse?.extractedData || {},
          conversationHistory: conversationHistory || [],
          candidateInfo: {
            name: dataToUse?.candidateName || "Candidate",
            role: dataToUse?.targetRole || "software-engineer",
            experience: dataToUse?.experienceLevel || "mid-level",
            skills: dataToUse?.skills || [],
            projects: dataToUse?.projects || []
          }
        })
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to get next question');
    } catch (error) {
      console.error('Error getting next question:', error);
      return { question: "Can you tell me about yourself and your background?" };
    }
  };

  const getCurrentSection = () => {
    if (questionNumber <= 2) return 'greeting';
    if (questionNumber <= 5) return 'resume';
    if (questionNumber <= 9) return 'projects';
    if (questionNumber <= 12) return 'behavioral';
    if (questionNumber <= 16) return 'technical';
    return 'closing';
  };

  const speakQuestion = async (text) => {
    try {
      // Prevent duplicate speaking of the same text
      if (isSpeakingRef.current || lastSpokenTextRef.current === text) {
        console.log('Already speaking or same text, skipping...');
        return;
      }

      isSpeakingRef.current = true;
      lastSpokenTextRef.current = text;
      setIsAITalking(true);
      setAiAvatarState('talking');

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsAITalking(false);
          setAiAvatarState('listening');
          isSpeakingRef.current = false;
        };
        
        if (!isMuted) {
          await audio.play();
        } else {
          setIsAITalking(false);
          setAiAvatarState('listening');
          isSpeakingRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      isSpeakingRef.current = false;
      setIsAITalking(false);
      setAiAvatarState('listening');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAnswer(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAnswer = async (audioBlob) => {
    try {
      setAiAvatarState('thinking');
      
      // Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const transcriptionResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/speech-to-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (transcriptionResponse.ok) {
        const { text } = await transcriptionResponse.json();
        setCandidateAnswer(text);
        
        // Add to conversation with enhanced metadata
        const questionEntry = { 
          type: 'question', 
          text: currentQuestion, 
          timestamp: Date.now(),
          section: getCurrentSection(),
          questionNumber: questionNumber
        };
        
        const answerEntry = { 
          type: 'answer', 
          text: text, 
          timestamp: Date.now(),
          section: getCurrentSection(),
          questionNumber: questionNumber
        };
        
        const newConversation = [...conversation, questionEntry, answerEntry];
        setConversation(newConversation);

        // Get next question with enhanced context
        const nextQuestion = await getNextQuestion(interviewData, text, newConversation);
        
        if (nextQuestion.isComplete) {
          endInterview();
        } else {
          setCurrentQuestion(nextQuestion.question);
          
          // Only increment question number for new topics/sections, not follow-ups
          if (nextQuestion.questionType !== 'follow_up') {
            setQuestionNumber(prev => prev + 1);
          }
          
          // Add visual indicator for follow-up questions
          if (nextQuestion.questionType === 'follow_up') {
            setAiAvatarState('thinking');
            // Brief pause before follow-up to make it feel natural
            setTimeout(async () => {
              await speakQuestion(nextQuestion.question);
            }, 1500);
          } else {
            await speakQuestion(nextQuestion.question);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Processing Error',
        description: 'Failed to process your answer',
        variant: 'destructive'
      });
      setAiAvatarState('listening');
    }
  };

  const endInterview = async () => {
    setIsInterviewActive(false);
    setAiAvatarState('thinking');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId: interviewId,
          conversationHistory: conversation,
          answers: conversation.filter(c => c.type === 'answer').map(c => c.text),
          duration: timeElapsed
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Interview Complete',
          description: 'Thank you for completing the interview!'
        });
        navigate(`/interview-report/${result.interviewId}`);
      }
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: 'Failed to submit interview',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAvatarAnimation = () => {
    switch (aiAvatarState) {
      case 'talking':
        return 'animate-pulse bg-gradient-to-br from-green-400 to-green-600';
      case 'thinking':
        return 'animate-spin bg-gradient-to-br from-yellow-400 to-yellow-600';
      case 'listening':
      default:
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
    }
  };

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <p className="text-xl">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white overflow-hidden">
      {/* Compact Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-indigo-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AI Interview</h1>
              <p className="text-xs text-slate-400">{interviewData.candidateName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-sm">{formatTime(timeElapsed)}</span>
            </div>
            <div className="bg-indigo-600/20 px-3 py-1.5 rounded-full text-xs font-medium">
              Q{questionNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Main Interview Area */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* AI Avatar Side - Smaller, Top-Aligned */}
        <div className="w-2/5 flex flex-col bg-slate-900/50 backdrop-blur-sm p-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* AI Avatar at Top - Smaller */}
          <div className="relative z-10 text-center mb-4 pt-4">
            <div className="relative inline-block mb-3">
              <div className={`w-24 h-24 rounded-full ${getAvatarAnimation()} flex items-center justify-center shadow-2xl transition-all duration-500 transform ${
                aiAvatarState === 'talking' ? 'scale-110' : 'scale-100'
              }`}>
                <Brain className={`w-12 h-12 text-white transition-transform duration-300 ${
                  aiAvatarState === 'thinking' ? 'animate-spin' : ''
                }`} />
              </div>
              {/* Pulse Ring Animation */}
              {aiAvatarState === 'talking' && (
                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
              )}
            </div>
            
            <h2 className="text-base font-semibold mb-1">AI Interviewer</h2>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                aiAvatarState === 'talking' ? 'bg-green-400 animate-pulse' :
                aiAvatarState === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                'bg-blue-400'
              }`}></div>
              <p className="text-xs text-slate-300 capitalize">
                {aiAvatarState === 'talking' && '🗣️ Speaking'}
                {aiAvatarState === 'thinking' && '🤔 Thinking'}
                {aiAvatarState === 'listening' && '👂 Listening'}
              </p>
            </div>
          </div>

          {/* Current Question - Centered */}
          <div className="flex-1 flex items-center justify-center px-2">
            <Card className="p-4 bg-slate-800/80 backdrop-blur-sm border-indigo-500/30 w-full shadow-xl">
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-indigo-300 uppercase tracking-wide font-semibold">
                      {getCurrentSection().replace('_', ' ')}
                    </span>
                    {aiAvatarState === 'thinking' && (
                      <span className="text-xs text-yellow-400 animate-pulse">
                        ⚡ Generating...
                      </span>
                    )}
                  </div>
                  <p className="text-slate-100 leading-relaxed text-sm">
                    {currentQuestion || "Welcome! Let's begin the interview..."}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Compact Conversation History at Bottom */}
          {conversation.length > 0 && (
            <div className="mt-3 space-y-2 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-slate-800 px-2">
              <h4 className="text-xs text-slate-400 font-medium flex items-center">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mr-2"></span>
                Recent
              </h4>
              {conversation.slice(-3).map((entry, index) => (
                <div key={index} className={`p-2 rounded-lg text-xs backdrop-blur-sm transition-all duration-300 hover:scale-102 ${
                  entry.type === 'question' 
                    ? 'bg-indigo-900/40 border-l-2 border-indigo-400' 
                    : 'bg-green-900/40 border-l-2 border-green-400'
                }`}>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className={`text-xs font-medium ${
                      entry.type === 'question' ? 'text-indigo-300' : 'text-green-300'
                    }`}>
                      {entry.type === 'question' ? '🤖 AI' : '👤 You'}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {entry.text.length > 100 ? entry.text.substring(0, 100) + '...' : entry.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candidate Video Side - Larger */}
        <div className="w-3/5 flex flex-col bg-slate-900">
          {/* Video Area */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <VideoOff className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-400">Camera is off</p>
                </div>
              </div>
            )}

            {/* Recording Indicator with Animation */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-full shadow-lg animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}

            {/* AI Status Overlay */}
            {isAITalking && (
              <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-75"></div>
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="text-sm font-medium">AI Speaking</span>
                </div>
              </div>
            )}
          </div>

          {/* Compact Controls */}
          <div className="p-4 bg-slate-900/90 backdrop-blur-sm border-t border-indigo-500/20">
            <div className="flex items-center justify-center space-x-3">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full w-12 h-12 transition-all duration-300 hover:scale-110"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="lg"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="rounded-full w-12 h-12 transition-all duration-300 hover:scale-110"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAITalking}
                className={`rounded-full w-16 h-16 transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                } hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endInterview}
                className="rounded-full w-12 h-12 transition-all duration-300 hover:scale-110 hover:rotate-12"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-center mt-3">
              <p className="text-slate-400 text-xs">
                {isRecording ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span>Recording your answer...</span>
                  </span>
                ) : isAITalking ? (
                  <span className="text-green-400">🎤 AI is speaking, please wait...</span>
                ) : (
                  <span>🎙️ Click microphone to answer</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Scrollbar */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-indigo-600::-webkit-scrollbar-thumb {
          background-color: rgb(79, 70, 229);
          border-radius: 2px;
        }
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: rgb(30, 41, 59);
        }
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default AIInterviewSession;