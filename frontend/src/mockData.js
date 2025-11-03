// Mock data for frontend development

export const mockInterviews = [
  {
    id: '1',
    candidateName: 'John Doe',
    candidateEmail: 'john@example.com',
    position: 'Senior Frontend Developer',
    status: 'completed',
    date: '2025-01-20',
    score: 85,
    resumeUrl: '/resumes/john_doe.pdf',
    feedback: {
      communication: 88,
      technical: 82,
      problemSolving: 87,
      cultural: 85
    }
  },
  {
    id: '2',
    candidateName: 'Jane Smith',
    candidateEmail: 'jane@example.com',
    position: 'Backend Engineer',
    status: 'in_progress',
    date: '2025-01-22',
    score: 0,
    resumeUrl: '/resumes/jane_smith.pdf'
  },
  {
    id: '3',
    candidateName: 'Mike Johnson',
    candidateEmail: 'mike@example.com',
    position: 'Full Stack Developer',
    status: 'completed',
    date: '2025-01-18',
    score: 92,
    resumeUrl: '/resumes/mike_johnson.pdf',
    feedback: {
      communication: 90,
      technical: 95,
      problemSolving: 93,
      cultural: 89
    }
  }
];

export const mockCampaigns = [
  {
    id: '1',
    title: 'Frontend Developer Hiring - Q1 2025',
    position: 'Senior Frontend Developer',
    candidatesCount: 15,
    completedCount: 8,
    avgScore: 78,
    createdAt: '2025-01-15',
    status: 'active'
  },
  {
    id: '2',
    title: 'Backend Engineer Recruitment',
    position: 'Backend Engineer',
    candidatesCount: 10,
    completedCount: 6,
    avgScore: 82,
    createdAt: '2025-01-10',
    status: 'active'
  }
];

export const mockUser = {
  id: '1',
  name: 'Recruiter Admin',
  email: 'recruiter@example.com',
  role: 'recruiter',
  company: 'TechCorp Inc.'
};

export const mockInterviewQuestions = [
  {
    section: 'greeting',
    question: 'Hello! Thank you for joining us today. Could you please introduce yourself and tell me a bit about your background?',
    type: 'open'
  },
  {
    section: 'resume',
    question: 'I see you have experience with React. Can you tell me about a challenging project you worked on using React?',
    type: 'technical'
  },
  {
    section: 'projects',
    question: 'What was the biggest technical challenge you faced in that project, and how did you overcome it?',
    type: 'followup'
  },
  {
    section: 'behavioral',
    question: 'Tell me about a time when you had to work with a difficult team member. How did you handle the situation?',
    type: 'behavioral'
  },
  {
    section: 'technical',
    question: 'Can you explain the difference between useMemo and useCallback in React?',
    type: 'technical'
  },
  {
    section: 'closing',
    question: 'Do you have any questions for us about the role or the company?',
    type: 'open'
  }
];