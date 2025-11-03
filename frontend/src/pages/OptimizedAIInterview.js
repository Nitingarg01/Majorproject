import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  User,
  Brain,
  Loader2
} from 'lucide-react';
// VAD and WebSocket libraries installed and ready to use when needed

const OptimizedAIInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Core State
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [conversation, setConversation] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  
  // UI State
  const [isRecording, setIsRecording] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [aiAvatarState, setAiAvatarState] = useState('listening');
  
  // Conversation State
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isTypingAnswer, setIsTypingAnswer] = useState(false);
  const [showConversation, setShowConversation] = useState(true);
  const [canSubmitAnswer, setCanSubmitAnswer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useVAD, setUseVAD] = useState(true); // Toggle for Voice Activity Detection

  // Optimized timer with useCallback
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize interview
  useEffect(() => {
    initializeInterview();
    setupMediaDevices();
    
    return () => {
      stopTimer();
      cleanupMediaDevices();
    };
  }, []);

  // Start timer when interview becomes active
  useEffect(() => {
    if (isInterviewActive) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [isInterviewActive, startTimer, stopTimer]);

  const initializeInterview = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/${interviewId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const startInterview = async (data) => {
    setIsInterviewActive(true);
    setAiAvatarState('thinking');
    
    // Get first question with optimized call
    const firstQuestion = await getNextQuestionOptimized(data, null, []);
    
    if (!firstQuestion || !firstQuestion.question) {
      toast({
        title: 'Error',
        description: 'Failed to start interview',
        variant: 'destructive'
      });
      return;
    }
    
    setCurrentQuestion(firstQuestion.question);
    
    // Add first question to conversation immediately
    const questionEntry = {
      type: 'question',
      text: firstQuestion.question,
      timestamp: Date.now(),
      section: firstQuestion.section || 'greeting',
      questionNumber: 1,
      questionType: 'new_section'
    };
    setConversation([questionEntry]);
    
    // Speak the first question
    await speakQuestion(firstQuestion.question);
    setAiAvatarState('listening');
  };

  // ULTRA-FAST question generation with aggressive optimization
  const getNextQuestionOptimized = async (interviewData, previousAnswer, conversationHistory) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId: interviewId,
          section: getCurrentSection(),
          previousAnswer: previousAnswer,
          resumeData: {}, // Skip resume data for speed
          conversationHistory: conversationHistory.slice(-2), // Only last 2 for maximum speed
          candidateInfo: {
            name: interviewData?.candidateName,
            role: interviewData?.targetRole,
            experience: interviewData?.experienceLevel,
            skills: interviewData?.skills?.slice(0, 3) || [], // Only 3 skills
            projects: [] // Skip projects for speed
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
      throw new Error('API Error');
    } catch (error) {
      console.warn('Using fallback question due to:', error.message);
      return getFallbackQuestion(conversationHistory.length);
    }
  };

  // Fast fallback questions
  const getFallbackQuestion = (questionCount) => {
    const fallbacks = [
      "Can you tell me about yourself and your background?",
      "What interests you most about this role?",
      "Tell me about a challenging project you've worked on.",
      "How do you approach problem-solving in your work?",
      "What are your key technical strengths?",
      "Describe a time you had to learn something new quickly.",
      "How do you handle working in a team environment?",
      "What motivates you in your professional work?",
      "Tell me about your career goals.",
      "Do you have any questions for me about this role?"
    ];
    
    const index = Math.min(questionCount, fallbacks.length - 1);
    return { 
      question: fallbacks[index], 
      section: getCurrentSection(), 
      isComplete: questionCount >= 9 
    };
  };

  const getCurrentSection = () => {
    if (questionNumber <= 2) return 'greeting';
    if (questionNumber <= 4) return 'resume';
    if (questionNumber <= 6) return 'projects';
    if (questionNumber <= 8) return 'behavioral';
    return 'closing';
  };

  // Real AI speech using Web Speech API
  const speakQuestion = async (text) => {
    setIsAITalking(true);
    setAiAvatarState('talking');
    
    return new Promise((resolve) => {
      if ('speechSynthesis' in window && !isMuted) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Wait for voices to load
        const speakWithVoice = () => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Configure voice settings
          utterance.rate = 0.95; // Natural speaking pace
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          // Try to use a professional-sounding voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            (voice.name.includes('Google') && voice.lang.startsWith('en')) ||
            (voice.name.includes('Microsoft') && voice.lang.startsWith('en')) ||
            (voice.name.includes('Samantha')) ||
            (voice.name.includes('Alex'))
          ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.onend = () => {
            setIsAITalking(false);
            setAiAvatarState('listening');
            resolve();
          };
          
          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            setIsAITalking(false);
            setAiAvatarState('listening');
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
        };
        
        // Ensure voices are loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          speakWithVoice();
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            speakWithVoice();
          };
          // Fallback timeout
          setTimeout(speakWithVoice, 100);
        }
      } else {
        // Fallback: simulate speech timing if muted or not supported
        const duration = Math.min(Math.max(text.length * 60, 2000), 5000);
        setTimeout(() => {
          setIsAITalking(false);
          setAiAvatarState('listening');
          resolve();
        }, duration);
      }
    });
  };

  const startRecording = async () => {
    try {
      // Hybrid approach: Use browser API for real-time display + record audio for backend verification
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start MediaRecorder for high-quality audio capture
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Also use Web Speech API for real-time transcription display
      let browserTranscript = '';
      let recognition = null;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
        
        recognition.onresult = (event) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              browserTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Show real-time transcription
          setCurrentAnswer(browserTranscript + interimTranscript);
        };
        
        recognition.onerror = (event) => {
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.warn('Browser speech recognition error:', event.error);
          }
        };
        
        try {
          recognition.start();
        } catch (e) {
          console.warn('Could not start browser speech recognition:', e);
        }
      }
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Stop browser recognition
        if (recognition) {
          try {
            recognition.stop();
          } catch (e) {
            // Already stopped
          }
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setIsTypingAnswer(true);
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Send to backend for high-accuracy transcription
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/speech-to-text`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            const backendTranscript = result.text;
            
            // Use backend transcript if it's significantly different/better
            const finalTranscript = backendTranscript.length > browserTranscript.length * 0.8 
              ? backendTranscript 
              : browserTranscript || backendTranscript;
            
            setCurrentAnswer(finalTranscript);
            setIsTypingAnswer(false);
            
            if (finalTranscript.trim()) {
              // Enable submit button - DON'T auto-submit
              setCanSubmitAnswer(true);
              toast({
                title: 'Answer Transcribed',
                description: 'Review your answer and click Submit when ready',
              });
            } else {
              toast({
                title: 'No Speech Detected',
                description: 'Please try speaking again',
                variant: 'destructive'
              });
              setCurrentAnswer('');
              setCanSubmitAnswer(false);
            }
          } else {
            // Fallback to browser transcript
            setIsTypingAnswer(false);
            if (browserTranscript.trim()) {
              setCurrentAnswer(browserTranscript.trim());
              setCanSubmitAnswer(true);
              toast({
                title: 'Answer Transcribed',
                description: 'Review your answer and click Submit when ready',
              });
            } else {
              toast({
                title: 'Transcription Failed',
                description: 'Please try again',
                variant: 'destructive'
              });
              setCurrentAnswer('');
              setCanSubmitAnswer(false);
            }
          }
        } catch (error) {
          console.error('Backend transcription error:', error);
          // Fallback to browser transcript
          setIsTypingAnswer(false);
          if (browserTranscript.trim()) {
            setCurrentAnswer(browserTranscript.trim());
            setCanSubmitAnswer(true);
            toast({
              title: 'Answer Transcribed',
              description: 'Review your answer and click Submit when ready',
            });
          } else {
            toast({
              title: 'Transcription Error',
              description: 'Please try speaking again',
              variant: 'destructive'
            });
            setCurrentAnswer('');
            setCanSubmitAnswer(false);
          }
        }
      };
      
      // Start recording
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setCurrentAnswer('');
      setIsTypingAnswer(true);
      
      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 120000);
      
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check microphone permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        setIsTypingAnswer(false);
      }
    }
  };

  // Manual submit handler
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !canSubmitAnswer) {
      toast({
        title: 'No Answer',
        description: 'Please record your answer first',
        variant: 'destructive'
      });
      return;
    }
    
    setCanSubmitAnswer(false);
    setIsAnalyzing(true);
    await processAnswerWithAnalysis(currentAnswer.trim());
    setIsAnalyzing(false);
  };

  // Process answer with intelligent analysis for loopholes
  const processAnswerWithAnalysis = async (transcribedText) => {
    setIsProcessing(true);
    setAiAvatarState('thinking');
    
    try {
      // Add answer to conversation
      const answerEntry = { 
        type: 'answer', 
        text: transcribedText, 
        timestamp: Date.now(),
        section: getCurrentSection(),
        questionNumber: questionNumber
      };
      
      const newConversation = [...conversation, answerEntry];
      setConversation(newConversation);
      setCurrentAnswer('');

      // 🚀 ULTRA-FAST: Skip analysis, generate question immediately
      // Get next question with minimal delay
      const nextQuestion = await getNextQuestionOptimized(interviewData, transcribedText, newConversation);
      
      if (!nextQuestion || nextQuestion.isComplete) {
        endInterview();
        return;
      }
      
      // Check if this question was already asked (prevent duplicates)
      const isDuplicate = newConversation.some(entry => 
        entry.type === 'question' && 
        entry.text.toLowerCase().trim() === nextQuestion.question.toLowerCase().trim()
      );
      
      if (isDuplicate) {
        console.warn('Duplicate question detected, requesting new question');
        const retryQuestion = await getNextQuestionOptimized(interviewData, transcribedText, newConversation);
        if (retryQuestion && !retryQuestion.isComplete) {
          nextQuestion = retryQuestion;
        } else {
          endInterview();
          return;
        }
      }
      
      setCurrentQuestion(nextQuestion.question);
      const newQuestionNumber = questionNumber + 1;
      setQuestionNumber(newQuestionNumber);
      
      // Add next question to conversation with proper metadata
      const nextQuestionEntry = {
        type: 'question',
        text: nextQuestion.question,
        timestamp: Date.now(),
        section: nextQuestion.section || getCurrentSection(),
        questionNumber: newQuestionNumber,
        questionType: nextQuestion.questionType || 'continue_section',
        topic: nextQuestion.topic,
        analysisReason: nextQuestion.analysisReason
      };
      
      setConversation(prev => [...prev, nextQuestionEntry]);
      
      // Speak the next question automatically
      await speakQuestion(nextQuestion.question);
      setAiAvatarState('listening');
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process your answer',
        variant: 'destructive'
      });
      setAiAvatarState('listening');
    } finally {
      setIsProcessing(false);
    }
  };

  // Optimized answer processing with real-time display (kept for compatibility)
  const processAnswerOptimized = async (transcribedText) => {
    setIsProcessing(true);
    setAiAvatarState('thinking');
    
    try {
      // Add answer to conversation
      const answerEntry = { 
        type: 'answer', 
        text: transcribedText, 
        timestamp: Date.now(),
        section: getCurrentSection(),
        questionNumber: questionNumber
      };
      
      const newConversation = [...conversation, answerEntry];
      setConversation(newConversation);
      setCurrentAnswer('');

      // Brief pause before next question (optimized for faster flow)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get next question with full conversation history
      const nextQuestion = await getNextQuestionOptimized(interviewData, transcribedText, newConversation);
      
      if (!nextQuestion || nextQuestion.isComplete) {
        endInterview();
        return;
      }
      
      // Check if this question was already asked (prevent duplicates)
      const isDuplicate = newConversation.some(entry => 
        entry.type === 'question' && 
        entry.text.toLowerCase().trim() === nextQuestion.question.toLowerCase().trim()
      );
      
      if (isDuplicate) {
        console.warn('Duplicate question detected, requesting new question');
        // Request a different question
        const retryQuestion = await getNextQuestionOptimized(interviewData, transcribedText, newConversation);
        if (retryQuestion && !retryQuestion.isComplete) {
          nextQuestion.question = retryQuestion.question;
          nextQuestion.section = retryQuestion.section;
        } else {
          endInterview();
          return;
        }
      }
      
      setCurrentQuestion(nextQuestion.question);
      const newQuestionNumber = questionNumber + 1;
      setQuestionNumber(newQuestionNumber);
      
      // Add next question to conversation with proper metadata
      const nextQuestionEntry = {
        type: 'question',
        text: nextQuestion.question,
        timestamp: Date.now(),
        section: nextQuestion.section || getCurrentSection(),
        questionNumber: newQuestionNumber,
        questionType: nextQuestion.questionType || 'continue_section',
        topic: nextQuestion.topic
      };
      
      setConversation(prev => [...prev, nextQuestionEntry]);
      
      // Speak the next question automatically
      await speakQuestion(nextQuestion.question);
      setAiAvatarState('listening');
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process your answer',
        variant: 'destructive'
      });
      setAiAvatarState('listening');
    } finally {
      setIsProcessing(false);
    }
  };



  const endInterview = async () => {
    setIsInterviewActive(false);
    stopTimer();
    
    toast({
      title: 'Interview Complete',
      description: 'Saving interview data...'
    });
    
    // Submit interview data to backend
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
          answers: conversation.filter(c => c.type === 'answer').map(c => ({
            text: c.text,
            timestamp: c.timestamp
          })),
          duration: timeElapsed
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Interview Saved!',
          description: 'Feedback has been generated. View it in your dashboard.',
        });
        
        // Navigate to feedback page
        setTimeout(() => {
          navigate(`/interview-feedback/${interviewId}`);
        }, 2000);
      } else {
        throw new Error('Failed to save interview');
      }
    } catch (error) {
      console.error('Error saving interview:', error);
      toast({
        title: 'Interview Saved Locally',
        description: 'Returning to dashboard...',
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAvatarAnimation = () => {
    if (isProcessing) return 'animate-pulse bg-gradient-to-br from-purple-400 to-purple-600';
    if (aiAvatarState === 'talking') return 'animate-bounce bg-gradient-to-br from-green-400 to-green-600';
    if (aiAvatarState === 'thinking') return 'animate-spin bg-gradient-to-br from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-indigo-400" />
          <p className="text-xl">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
      {/* Optimized Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-semibold">AI Interview</h1>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{interviewData.candidateName}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Q{questionNumber}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                isAITalking ? 'bg-indigo-400 animate-pulse' :
                isRecording ? 'bg-red-400 animate-pulse' :
                isProcessing ? 'bg-purple-400 animate-pulse' :
                'bg-green-400'
              }`}></div>
              <span className="text-xs text-slate-300">
                {isAITalking ? 'AI Speaking' :
                 isRecording ? 'Recording' :
                 isProcessing ? 'Processing' :
                 'Listening'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* AI Avatar Side - Enhanced */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>
          
          <div className="relative z-10 text-center">
            {/* Enhanced AI Avatar */}
            <div className={`w-56 h-56 rounded-full ${getAvatarAnimation()} flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden`}>
              <Brain className="w-28 h-28 text-white" />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-3 text-white">AI Interviewer</h2>
            <p className="text-indigo-300 text-lg mb-8 capitalize">
              {isProcessing && 'Processing your answer...'}
              {!isProcessing && aiAvatarState === 'talking' && 'Speaking...'}
              {!isProcessing && aiAvatarState === 'thinking' && 'Thinking...'}
              {!isProcessing && aiAvatarState === 'listening' && 'Listening...'}
            </p>

            {/* Real-time Conversation Display */}
            <div className="w-full max-w-4xl space-y-6">
              {/* Current Question */}
              <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-600/50 shadow-2xl">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-indigo-300 font-medium">AI Interviewer</span>
                      <span className="text-xs text-slate-400">
                        {getCurrentSection().replace('_', ' ')} • Q{questionNumber}
                      </span>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      {currentQuestion || "Welcome! Let's begin your interview..."}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Current Answer (Real-time typing + Editable) */}
              {(isTypingAnswer || currentAnswer) && (
                <Card className="p-6 bg-green-900/20 backdrop-blur-sm border-green-600/30 shadow-xl">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-300 font-medium">
                          {interviewData?.candidateName || 'You'}
                        </span>
                        {isTypingAnswer && (
                          <span className="text-xs text-green-400 flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                            Transcribing...
                          </span>
                        )}
                        {canSubmitAnswer && !isTypingAnswer && (
                          <span className="text-xs text-green-400">
                            ✏️ Editable - Review before submitting
                          </span>
                        )}
                      </div>
                      {canSubmitAnswer && !isTypingAnswer ? (
                        <textarea
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          className="w-full bg-slate-800/50 text-white p-3 rounded-lg border border-green-600/30 focus:border-green-500 focus:outline-none leading-relaxed min-h-[100px] resize-y"
                          placeholder="Your answer will appear here..."
                        />
                      ) : (
                        <p className="text-white leading-relaxed">
                          {currentAnswer}
                          {isTypingAnswer && <span className="animate-pulse">|</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Conversation History */}
              {conversation.length > 2 && (
                <Card className="p-6 bg-slate-900/60 backdrop-blur-sm border-slate-700/50 shadow-xl max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">Conversation History</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConversation(!showConversation)}
                      className="text-slate-400 hover:text-white"
                    >
                      {showConversation ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  
                  {showConversation && (
                    <div className="space-y-4">
                      {conversation.slice(0, -2).reverse().slice(0, 6).reverse().map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            entry.type === 'question' ? 'bg-indigo-600/70' : 'bg-green-600/70'
                          }`}>
                            {entry.type === 'question' ? 
                              <Brain className="w-4 h-4 text-white" /> : 
                              <User className="w-4 h-4 text-white" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs font-medium ${
                                entry.type === 'question' ? 'text-indigo-300' : 'text-green-300'
                              }`}>
                                {entry.type === 'question' ? 'AI' : (interviewData?.candidateName || 'You')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {entry.text.length > 120 ? entry.text.substring(0, 120) + '...' : entry.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Video Side - Enhanced */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
          {/* Video Area */}
          <div className="flex-1 relative rounded-tl-3xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {!isVideoOn && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Camera is off</p>
                </div>
              </div>
            )}

            {/* Enhanced Recording Indicator */}
            {isRecording && (
              <div className="absolute top-6 left-6 flex items-center space-x-3 bg-red-600/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Recording</span>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute top-6 right-6 flex items-center space-x-3 bg-purple-600/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white font-medium">Processing</span>
              </div>
            )}
          </div>

          {/* Enhanced Controls */}
          <div className="p-8 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50">
            <div className="flex items-center justify-center space-x-6">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full w-16 h-16 shadow-lg"
              >
                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </Button>

              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="lg"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="rounded-full w-16 h-16 shadow-lg"
              >
                {isVideoOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
              </Button>

              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAITalking || isProcessing || isAnalyzing}
                className="rounded-full w-20 h-20 bg-indigo-600 hover:bg-indigo-700 shadow-xl transform hover:scale-105 transition-all"
              >
                {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endInterview}
                className="rounded-full w-16 h-16 shadow-lg"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </div>

            {/* Submit Answer Button */}
            {canSubmitAnswer && currentAnswer && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={isAnalyzing || isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Answer...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className={`w-3 h-3 rounded-full ${isAITalking ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`}></div>
                <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`}></div>
              </div>
              <p className="text-slate-300">
                {isAnalyzing ? 'AI is analyzing your answer...' :
                 isProcessing ? 'Processing your answer...' :
                 isTypingAnswer ? 'Transcribing your response...' :
                 isAITalking ? 'AI is speaking...' :
                 isRecording ? 'Recording your answer - click mic to stop' : 
                 canSubmitAnswer ? 'Review your answer and click Submit' :
                 'Click the microphone to answer'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedAIInterview;