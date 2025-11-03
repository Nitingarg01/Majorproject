import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { 
  ArrowLeft,
  Upload,
  FileText,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  History,
  Users,
  Award
} from 'lucide-react';

const ResumeAnalysis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [targetRole, setTargetRole] = useState('software-engineer');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setAnalysis(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a PDF file',
          variant: 'destructive'
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interview/parse-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Enhanced analysis with role-based improvement suggestions and ATS scoring
        const atsAnalysis = calculateATSScore(result, targetRole);
        const enhancedAnalysis = {
          ...result,
          candidateName: result.name || 'Unknown Candidate',
          analysisDate: new Date().toISOString(),
          targetRole: targetRole,
          sectionScores: calculateSectionScores(result, targetRole),
          atsScore: atsAnalysis.score,
          atsDetails: atsAnalysis.details,
          atsIssues: atsAnalysis.issues,
          improvements: generateRoleBasedSuggestions(result, targetRole),
          overallScore: calculateOverallScore(result, targetRole)
        };

        setAnalysis(enhancedAnalysis);
        
        // Add to history
        setAnalysisHistory(prev => [enhancedAnalysis, ...prev.slice(0, 9)]);

        toast({
          title: 'Analysis Complete',
          description: 'Resume has been successfully analyzed with improvement suggestions'
        });
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
      setAnalyzing(false);
    }
  };

  // Role definitions with required skills and expectations
  const roleDefinitions = {
    'software-engineer': {
      name: 'Software Engineer',
      requiredSkills: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Git', 'SQL'],
      preferredSkills: ['TypeScript', 'AWS', 'Docker', 'MongoDB', 'GraphQL'],
      minProjects: 3,
      minExperience: 1,
      keyAreas: ['Technical Skills', 'Projects', 'Problem Solving', 'Code Quality']
    },
    'frontend-developer': {
      name: 'Frontend Developer',
      requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular'],
      preferredSkills: ['TypeScript', 'SCSS', 'Webpack', 'Figma', 'Responsive Design'],
      minProjects: 4,
      minExperience: 1,
      keyAreas: ['UI/UX Skills', 'Frontend Frameworks', 'Design Systems', 'Performance']
    },
    'backend-developer': {
      name: 'Backend Developer',
      requiredSkills: ['Python', 'Java', 'Node.js', 'SQL', 'API', 'Database'],
      preferredSkills: ['Docker', 'Kubernetes', 'AWS', 'Redis', 'Microservices'],
      minProjects: 3,
      minExperience: 1,
      keyAreas: ['Server Technologies', 'Database Design', 'API Development', 'Scalability']
    },
    'fullstack-developer': {
      name: 'Full Stack Developer',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'Git'],
      preferredSkills: ['TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL'],
      minProjects: 4,
      minExperience: 2,
      keyAreas: ['Frontend Skills', 'Backend Skills', 'Database Knowledge', 'DevOps']
    },
    'data-scientist': {
      name: 'Data Scientist',
      requiredSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
      preferredSkills: ['TensorFlow', 'PyTorch', 'Jupyter', 'Tableau', 'AWS', 'Spark'],
      minProjects: 3,
      minExperience: 1,
      keyAreas: ['Data Analysis', 'Machine Learning', 'Statistics', 'Visualization']
    },
    'devops-engineer': {
      name: 'DevOps Engineer',
      requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Git', 'Linux'],
      preferredSkills: ['Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Helm'],
      minProjects: 2,
      minExperience: 2,
      keyAreas: ['Cloud Platforms', 'Containerization', 'CI/CD', 'Monitoring']
    },
    'mobile-developer': {
      name: 'Mobile Developer',
      requiredSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android'],
      preferredSkills: ['Firebase', 'Redux', 'GraphQL', 'App Store', 'Play Store'],
      minProjects: 3,
      minExperience: 1,
      keyAreas: ['Mobile Frameworks', 'Platform Knowledge', 'App Performance', 'User Experience']
    },
    'product-manager': {
      name: 'Product Manager',
      requiredSkills: ['Product Strategy', 'Analytics', 'User Research', 'Agile', 'Roadmapping'],
      preferredSkills: ['SQL', 'A/B Testing', 'Figma', 'Jira', 'Market Research'],
      minProjects: 2,
      minExperience: 2,
      keyAreas: ['Product Strategy', 'User Research', 'Analytics', 'Leadership']
    }
  };

  const calculateATSScore = (resumeData, role) => {
    const roleConfig = roleDefinitions[role];
    let atsScore = 0;
    const maxScore = 100;
    const issues = [];
    const details = {};

    // 1. CONTACT INFORMATION (15 points)
    let contactScore = 0;
    if (resumeData.name && resumeData.name !== 'Unknown Candidate') {
      contactScore += 5;
    } else {
      issues.push({
        category: 'Contact Info',
        issue: 'Name not clearly identified',
        impact: 'ATS cannot identify candidate',
        fix: 'Add full name at the top of resume'
      });
    }

    if (resumeData.email && resumeData.email.includes('@')) {
      contactScore += 4;
    } else {
      issues.push({
        category: 'Contact Info',
        issue: 'Email missing or invalid format',
        impact: 'ATS cannot contact candidate',
        fix: 'Add professional email address'
      });
    }

    if (resumeData.phone) {
      contactScore += 3;
    } else {
      issues.push({
        category: 'Contact Info',
        issue: 'Phone number missing',
        impact: 'Reduces ATS confidence score',
        fix: 'Add phone number in standard format'
      });
    }

    if (resumeData.location) {
      contactScore += 3;
    } else {
      issues.push({
        category: 'Contact Info',
        issue: 'Location not specified',
        impact: 'ATS cannot filter by location',
        fix: 'Add city, state (e.g., "San Francisco, CA")'
      });
    }
    
    details.contactInfo = contactScore;
    atsScore += contactScore;

    // 2. KEYWORD MATCHING (25 points)
    const candidateSkills = resumeData.skills || [];
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
    const allResumeText = `${resumeData.summary || ''} ${candidateSkills.join(' ')} ${resumeData.experience?.map(e => `${e.title} ${e.responsibilities?.join(' ')}`).join(' ')} ${resumeData.projects?.map(p => `${p.description} ${p.technologies?.join(' ')}`).join(' ')}`.toLowerCase();

    // Required keywords matching
    const requiredMatches = roleConfig.requiredSkills.filter(skill =>
      candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase())) ||
      allResumeText.includes(skill.toLowerCase())
    );
    
    const requiredKeywordScore = (requiredMatches.length / roleConfig.requiredSkills.length) * 15;
    
    // Preferred keywords matching  
    const preferredMatches = roleConfig.preferredSkills.filter(skill =>
      candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase())) ||
      allResumeText.includes(skill.toLowerCase())
    );
    
    const preferredKeywordScore = (preferredMatches.length / roleConfig.preferredSkills.length) * 10;
    
    const totalKeywordScore = requiredKeywordScore + preferredKeywordScore;
    details.keywordMatching = Math.round(totalKeywordScore);
    atsScore += totalKeywordScore;

    if (requiredMatches.length < roleConfig.requiredSkills.length * 0.7) {
      const missingRequired = roleConfig.requiredSkills.filter(skill => !requiredMatches.includes(skill));
      issues.push({
        category: 'Keywords',
        issue: `Missing ${missingRequired.length} critical keywords`,
        impact: 'ATS will rank resume very low',
        fix: `Add these keywords: ${missingRequired.slice(0, 5).join(', ')}`
      });
    }

    // 3. RESUME STRUCTURE (20 points)
    let structureScore = 0;
    
    // Professional summary
    if (resumeData.summary && resumeData.summary.length >= 50) {
      structureScore += 5;
    } else {
      issues.push({
        category: 'Structure',
        issue: 'Missing or weak professional summary',
        impact: 'ATS cannot understand candidate value',
        fix: 'Add 2-3 line professional summary with key skills'
      });
    }

    // Work experience section
    if (resumeData.experience && resumeData.experience.length > 0) {
      structureScore += 5;
      
      // Check for proper date formats
      const hasProperDates = resumeData.experience.some(exp => 
        exp.duration && /\d{4}/.test(exp.duration)
      );
      if (hasProperDates) {
        structureScore += 2;
      } else {
        issues.push({
          category: 'Structure',
          issue: 'Inconsistent or missing date formats',
          impact: 'ATS cannot parse employment timeline',
          fix: 'Use consistent date format (e.g., "Jan 2020 - Present")'
        });
      }
    } else {
      issues.push({
        category: 'Structure',
        issue: 'No work experience section',
        impact: 'ATS flags as incomplete resume',
        fix: 'Add work experience, internships, or relevant projects'
      });
    }

    // Skills section
    if (candidateSkills.length >= 5) {
      structureScore += 4;
    } else {
      issues.push({
        category: 'Structure',
        issue: 'Insufficient skills listed',
        impact: 'ATS cannot match to job requirements',
        fix: 'Add technical skills, tools, and technologies'
      });
    }

    // Education section
    if (resumeData.education && resumeData.education.length > 0) {
      structureScore += 2;
    }

    // Projects section (important for technical roles)
    if (resumeData.projects && resumeData.projects.length > 0) {
      structureScore += 2;
    } else if (['software-engineer', 'frontend-developer', 'backend-developer', 'fullstack-developer'].includes(role)) {
      issues.push({
        category: 'Structure',
        issue: 'No projects section for technical role',
        impact: 'ATS flags as inexperienced candidate',
        fix: 'Add projects section with technical projects'
      });
    }

    details.structure = structureScore;
    atsScore += structureScore;

    // 4. CONTENT QUALITY (20 points)
    let contentScore = 0;

    // Quantifiable achievements
    const hasQuantifiableResults = resumeData.experience?.some(exp => 
      exp.responsibilities?.some(resp => /\d+%|\d+x|\$\d+|\d+\s*(users|customers|projects|team|million|thousand|hours|days)/i.test(resp))
    );
    
    if (hasQuantifiableResults) {
      contentScore += 8;
    } else {
      issues.push({
        category: 'Content',
        issue: 'No quantifiable achievements',
        impact: 'ATS cannot assess candidate impact',
        fix: 'Add metrics: "Improved performance by 30%", "Managed team of 5"'
      });
    }

    // Action verbs usage
    const actionVerbs = ['developed', 'built', 'created', 'implemented', 'designed', 'managed', 'led', 'optimized', 'improved', 'achieved'];
    const hasActionVerbs = resumeData.experience?.some(exp =>
      exp.responsibilities?.some(resp =>
        actionVerbs.some(verb => resp.toLowerCase().includes(verb))
      )
    );
    
    if (hasActionVerbs) {
      contentScore += 4;
    } else {
      issues.push({
        category: 'Content',
        issue: 'Weak action verbs in descriptions',
        impact: 'ATS scores content as passive',
        fix: 'Start bullets with: Built, Developed, Implemented, Optimized'
      });
    }

    // Relevant experience
    const hasRelevantExp = resumeData.experience?.some(exp => {
      const expText = `${exp.title} ${exp.responsibilities?.join(' ')}`.toLowerCase();
      return roleConfig.requiredSkills.some(skill => expText.includes(skill.toLowerCase()));
    });
    
    if (hasRelevantExp) {
      contentScore += 4;
    }

    // Technical depth in projects
    const hasTechnicalProjects = resumeData.projects?.some(project =>
      project.technologies && project.technologies.length >= 3
    );
    
    if (hasTechnicalProjects) {
      contentScore += 4;
    }

    details.content = contentScore;
    atsScore += contentScore;

    // 5. FORMATTING & READABILITY (10 points)
    let formatScore = 0;

    // Consistent formatting (simulated check)
    if (resumeData.experience?.length > 0) {
      const hasConsistentTitles = resumeData.experience.every(exp => exp.title && exp.company);
      if (hasConsistentTitles) {
        formatScore += 3;
      } else {
        issues.push({
          category: 'Formatting',
          issue: 'Inconsistent job title/company formatting',
          impact: 'ATS cannot parse work history properly',
          fix: 'Use consistent format: "Job Title | Company Name"'
        });
      }
    }

    // Skills formatting
    if (candidateSkills.length > 0) {
      formatScore += 3;
    }

    // Section headers (assumed present if data exists)
    const sectionsPresent = [
      resumeData.summary ? 1 : 0,
      resumeData.experience?.length > 0 ? 1 : 0,
      candidateSkills.length > 0 ? 1 : 0,
      resumeData.education?.length > 0 ? 1 : 0
    ].reduce((a, b) => a + b, 0);
    
    formatScore += sectionsPresent;

    details.formatting = formatScore;
    atsScore += formatScore;

    // 6. FILE FORMAT & TECHNICAL (10 points)
    let technicalScore = 8; // Assume PDF is good format
    
    // Length check (estimated)
    const estimatedLength = (resumeData.summary?.length || 0) + 
                           (resumeData.experience?.reduce((acc, exp) => acc + (exp.responsibilities?.join(' ').length || 0), 0) || 0) +
                           (resumeData.projects?.reduce((acc, proj) => acc + (proj.description?.length || 0), 0) || 0);
    
    if (estimatedLength < 500) {
      technicalScore -= 3;
      issues.push({
        category: 'Technical',
        issue: 'Resume appears too short',
        impact: 'ATS may flag as incomplete',
        fix: 'Add more detail to experience and projects'
      });
    } else if (estimatedLength > 4000) {
      technicalScore -= 2;
      issues.push({
        category: 'Technical',
        issue: 'Resume may be too long',
        impact: 'ATS may truncate content',
        fix: 'Condense to 1-2 pages, focus on relevant experience'
      });
    }

    details.technical = technicalScore;
    atsScore += technicalScore;

    // Calculate final score and rating
    const finalScore = Math.min(Math.round(atsScore), 100);
    
    let rating = 'Poor';
    let ratingColor = 'text-red-600';
    if (finalScore >= 85) { rating = 'Excellent'; ratingColor = 'text-green-600'; }
    else if (finalScore >= 70) { rating = 'Good'; ratingColor = 'text-blue-600'; }
    else if (finalScore >= 55) { rating = 'Fair'; ratingColor = 'text-yellow-600'; }

    return {
      score: finalScore,
      rating: rating,
      ratingColor: ratingColor,
      details: details,
      issues: issues.slice(0, 8), // Top 8 most critical issues
      keywordMatches: {
        required: requiredMatches,
        preferred: preferredMatches,
        missing: roleConfig.requiredSkills.filter(skill => !requiredMatches.includes(skill))
      }
    };
  };

  const calculateSectionScores = (resumeData, role) => {
    const roleConfig = roleDefinitions[role];
    const scores = {};

    // Contact Information Score (0-100)
    let contactScore = 0;
    if (resumeData.name && resumeData.name !== 'Unknown Candidate') contactScore += 30;
    if (resumeData.email) contactScore += 25;
    if (resumeData.phone) contactScore += 25;
    if (resumeData.location) contactScore += 20;
    scores.contact = contactScore;

    // Professional Summary Score (0-100)
    let summaryScore = 0;
    if (resumeData.summary) {
      if (resumeData.summary.length > 150) summaryScore += 40;
      else if (resumeData.summary.length > 100) summaryScore += 30;
      else if (resumeData.summary.length > 50) summaryScore += 20;
      
      // Check if summary mentions role-relevant keywords
      const summaryLower = resumeData.summary.toLowerCase();
      const roleKeywords = [...roleConfig.requiredSkills, ...roleConfig.preferredSkills];
      const mentionedKeywords = roleKeywords.filter(skill => 
        summaryLower.includes(skill.toLowerCase())
      );
      summaryScore += Math.min(mentionedKeywords.length * 10, 60);
    }
    scores.summary = Math.min(summaryScore, 100);

    // Skills Score (0-100) - Role-specific
    let skillsScore = 0;
    const candidateSkills = resumeData.skills || [];
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
    
    // Required skills matching
    const requiredMatches = roleConfig.requiredSkills.filter(skill =>
      candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()))
    );
    skillsScore += (requiredMatches.length / roleConfig.requiredSkills.length) * 60;
    
    // Preferred skills matching
    const preferredMatches = roleConfig.preferredSkills.filter(skill =>
      candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()))
    );
    skillsScore += (preferredMatches.length / roleConfig.preferredSkills.length) * 30;
    
    // Bonus for having many skills
    if (candidateSkills.length >= 10) skillsScore += 10;
    
    scores.skills = Math.min(skillsScore, 100);

    // Experience Score (0-100)
    let experienceScore = 0;
    const experienceCount = resumeData.experience?.length || 0;
    
    if (experienceCount >= roleConfig.minExperience * 2) experienceScore += 40;
    else if (experienceCount >= roleConfig.minExperience) experienceScore += 30;
    else if (experienceCount > 0) experienceScore += 15;
    
    // Check for detailed experience
    const hasDetailedExp = resumeData.experience?.some(exp => 
      exp.responsibilities && exp.responsibilities.length > 2
    );
    if (hasDetailedExp) experienceScore += 20;
    
    // Check for quantifiable achievements
    const hasQuantifiableAchievements = resumeData.experience?.some(exp => 
      exp.responsibilities?.some(resp => /\d+%|\$\d+|\d+\s*(users|customers|projects|team|million|thousand)/i.test(resp))
    );
    if (hasQuantifiableAchievements) experienceScore += 25;
    
    // Check for role-relevant experience
    const hasRelevantExp = resumeData.experience?.some(exp => {
      const expText = `${exp.title} ${exp.responsibilities?.join(' ')}`.toLowerCase();
      return roleConfig.requiredSkills.some(skill => expText.includes(skill.toLowerCase()));
    });
    if (hasRelevantExp) experienceScore += 15;
    
    scores.experience = Math.min(experienceScore, 100);

    // Projects Score (0-100)
    let projectsScore = 0;
    const projectsCount = resumeData.projects?.length || 0;
    
    if (projectsCount >= roleConfig.minProjects * 2) projectsScore += 30;
    else if (projectsCount >= roleConfig.minProjects) projectsScore += 25;
    else if (projectsCount >= 2) projectsScore += 15;
    else if (projectsCount >= 1) projectsScore += 10;
    
    // Check for detailed projects
    const hasDetailedProjects = resumeData.projects?.some(project => 
      project.description && project.description.length > 100 && project.technologies?.length > 0
    );
    if (hasDetailedProjects) projectsScore += 25;
    
    // Check for role-relevant projects
    const hasRelevantProjects = resumeData.projects?.some(project => {
      const projectText = `${project.description} ${project.technologies?.join(' ')}`.toLowerCase();
      return roleConfig.requiredSkills.some(skill => projectText.includes(skill.toLowerCase()));
    });
    if (hasRelevantProjects) projectsScore += 25;
    
    // Bonus for GitHub/demo links
    const hasLinks = resumeData.projects?.some(project => project.url);
    if (hasLinks) projectsScore += 20;
    
    scores.projects = Math.min(projectsScore, 100);

    // Education Score (0-100)
    let educationScore = 0;
    const educationCount = resumeData.education?.length || 0;
    
    if (educationCount >= 2) educationScore += 40;
    else if (educationCount >= 1) educationScore += 30;
    else educationScore += 10;
    
    // Check for relevant degree
    const hasRelevantDegree = resumeData.education?.some(edu => {
      const degreeText = edu.degree?.toLowerCase() || '';
      return degreeText.includes('computer') || degreeText.includes('engineering') || 
             degreeText.includes('science') || degreeText.includes('technology');
    });
    if (hasRelevantDegree) educationScore += 30;
    
    // Check for high GPA
    const hasHighGPA = resumeData.education?.some(edu => {
      const gpa = parseFloat(edu.gpa);
      return gpa >= 3.5;
    });
    if (hasHighGPA) educationScore += 20;
    
    // Check for achievements
    const hasAchievements = resumeData.education?.some(edu => 
      edu.achievements && edu.achievements.length > 0
    );
    if (hasAchievements) educationScore += 10;
    
    scores.education = Math.min(educationScore, 100);

    // Certifications Score (0-100)
    let certificationsScore = 0;
    const certificationsCount = resumeData.certifications?.length || 0;
    
    if (certificationsCount >= 5) certificationsScore += 50;
    else if (certificationsCount >= 3) certificationsScore += 40;
    else if (certificationsCount >= 2) certificationsScore += 30;
    else if (certificationsCount >= 1) certificationsScore += 20;
    
    // Check for role-relevant certifications
    const hasRelevantCerts = resumeData.certifications?.some(cert => {
      const certText = cert.name?.toLowerCase() || cert.toLowerCase();
      return roleConfig.requiredSkills.some(skill => certText.includes(skill.toLowerCase())) ||
             roleConfig.preferredSkills.some(skill => certText.includes(skill.toLowerCase()));
    });
    if (hasRelevantCerts) certificationsScore += 50;
    
    scores.certifications = Math.min(certificationsScore, 100);

    return scores;
  };

  const generateRoleBasedSuggestions = (resumeData, role) => {
    const roleConfig = roleDefinitions[role];
    const suggestions = [];
    const candidateSkills = resumeData.skills || [];
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
    const projectsCount = resumeData.projects?.length || 0;
    const experienceCount = resumeData.experience?.length || 0;

    // 1. IMMEDIATE ACTION ITEMS (High Priority)
    
    // Missing Critical Skills
    const missingCriticalSkills = roleConfig.requiredSkills.filter(skill =>
      !candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()))
    );
    
    if (missingCriticalSkills.length > 0) {
      const topMissing = missingCriticalSkills.slice(0, 3);
      suggestions.push({
        category: '🚨 Critical Skills Gap',
        priority: 'high',
        suggestion: `URGENT: Learn ${topMissing.join(', ')} immediately. These are non-negotiable for ${roleConfig.name} roles.`,
        action: `Start with free courses: ${topMissing[0]} tutorial on freeCodeCamp or YouTube. Dedicate 2-3 hours daily for 2 weeks.`,
        impact: 'Without these skills, your resume will be filtered out by ATS systems and recruiters.',
        timeframe: '2-4 weeks'
      });
    }

    // No Projects Crisis
    if (projectsCount === 0) {
      suggestions.push({
        category: '🚨 No Projects Found',
        priority: 'high',
        suggestion: `Build ${roleConfig.minProjects} projects ASAP. Your resume has zero projects - this is a major red flag.`,
        action: getProjectSuggestions(role, 'beginner'),
        impact: 'Projects are the #1 way to prove your skills. No projects = no interviews.',
        timeframe: '4-6 weeks'
      });
    }

    // Weak Professional Summary
    if (!resumeData.summary || resumeData.summary.length < 80) {
      suggestions.push({
        category: '📝 Professional Summary Missing',
        priority: 'high',
        suggestion: 'Write a powerful 3-4 line summary that immediately shows your value as a ' + roleConfig.name,
        action: `Template: "Experienced ${roleConfig.name} with X years building [specific type of applications]. Skilled in ${candidateSkills.slice(0, 4).join(', ')}. Proven track record of [specific achievement]. Passionate about [relevant area]."`,
        impact: 'Recruiters spend 6 seconds on your resume. A strong summary hooks them immediately.',
        timeframe: '1 day'
      });
    }

    // 2. SKILL ENHANCEMENT (Medium Priority)
    
    const missingPreferredSkills = roleConfig.preferredSkills.filter(skill =>
      !candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()))
    );
    
    if (missingPreferredSkills.length > 0) {
      const topPreferred = missingPreferredSkills.slice(0, 2);
      suggestions.push({
        category: '⚡ Competitive Edge Skills',
        priority: 'medium',
        suggestion: `Learn ${topPreferred.join(' and ')} to outcompete other candidates.`,
        action: getSkillLearningPath(topPreferred, role),
        impact: 'These skills separate good candidates from great ones. 80% of top candidates have these.',
        timeframe: '3-6 weeks'
      });
    }

    // 3. PROJECT IMPROVEMENTS
    
    if (projectsCount > 0 && projectsCount < roleConfig.minProjects) {
      suggestions.push({
        category: '🛠️ Need More Projects',
        priority: 'medium',
        suggestion: `Build ${roleConfig.minProjects - projectsCount} more projects. Quality over quantity, but you need variety.`,
        action: getProjectSuggestions(role, 'intermediate'),
        impact: `${roleConfig.name} roles expect ${roleConfig.minProjects}+ diverse projects showing different skills.`,
        timeframe: '6-8 weeks'
      });
    }

    // Project Quality Issues
    const hasDetailedProjects = resumeData.projects?.some(p => 
      p.description && p.description.length > 100 && p.technologies?.length > 2
    );
    
    if (projectsCount > 0 && !hasDetailedProjects) {
      suggestions.push({
        category: '📊 Weak Project Descriptions',
        priority: 'medium',
        suggestion: 'Your projects lack detail. Recruiters can\'t understand what you built or how complex it is.',
        action: 'For each project, add: (1) What problem it solves, (2) Key features, (3) Technologies used, (4) Challenges overcome, (5) Results/metrics if possible.',
        impact: 'Detailed projects show technical depth and communication skills.',
        timeframe: '2-3 days'
      });
    }

    // Missing GitHub/Demo Links
    const hasProjectLinks = resumeData.projects?.some(p => p.url);
    if (projectsCount > 0 && !hasProjectLinks) {
      suggestions.push({
        category: '🔗 No Project Links',
        priority: 'medium',
        suggestion: 'Add GitHub repos and live demo links to ALL projects.',
        action: 'Deploy projects on Vercel/Netlify (free). Create clean GitHub repos with README files. Add links to resume.',
        impact: 'Recruiters want to see your actual code and working applications. No links = they assume projects don\'t exist.',
        timeframe: '1 week'
      });
    }

    // 4. EXPERIENCE OPTIMIZATION
    
    const hasQuantifiableResults = resumeData.experience?.some(exp => 
      exp.responsibilities?.some(resp => /\d+%|\d+x|\$\d+|\d+\s*(users|customers|projects|team|million|thousand)/i.test(resp))
    );
    
    if (experienceCount > 0 && !hasQuantifiableResults) {
      suggestions.push({
        category: '📈 No Measurable Impact',
        priority: 'medium',
        suggestion: 'Add numbers and metrics to your work experience. "Improved performance" means nothing.',
        action: 'Rewrite bullets with: "Reduced load time by 40%", "Built feature used by 10K+ users", "Managed team of 5 developers", "Increased conversion by 25%"',
        impact: 'Quantified achievements prove real business impact. They make you memorable.',
        timeframe: '1-2 days'
      });
    }

    // 5. ROLE-SPECIFIC ADVANCED SUGGESTIONS
    
    addRoleSpecificSuggestions(suggestions, resumeData, role, roleConfig);

    // 6. QUICK WINS (Low Priority but Easy)
    
    if (!resumeData.email || !resumeData.phone) {
      suggestions.push({
        category: '📞 Contact Info Incomplete',
        priority: 'high',
        suggestion: 'Add missing contact information immediately.',
        action: 'Add professional email, phone number, city/state, and LinkedIn URL to header.',
        impact: 'Recruiters can\'t contact you if info is missing. This is basic professionalism.',
        timeframe: '5 minutes'
      });
    }

    return suggestions.slice(0, 8); // Limit to top 8 most important suggestions
  };

  // Helper function for project suggestions
  const getProjectSuggestions = (role, level) => {
    const projectIdeas = {
      'software-engineer': {
        beginner: 'Build: (1) Todo app with React + Node.js, (2) Weather app with API integration, (3) Personal portfolio website',
        intermediate: 'Build: (1) E-commerce site with payment integration, (2) Real-time chat app with WebSockets, (3) Task management system with user auth'
      },
      'frontend-developer': {
        beginner: 'Build: (1) Responsive landing page, (2) Interactive dashboard with charts, (3) Movie search app using API',
        intermediate: 'Build: (1) Component library with Storybook, (2) Progressive Web App, (3) Complex form with validation'
      },
      'backend-developer': {
        beginner: 'Build: (1) REST API with authentication, (2) Database-driven blog, (3) File upload service',
        intermediate: 'Build: (1) Microservices architecture, (2) Real-time notification system, (3) API with rate limiting and caching'
      },
      'data-scientist': {
        beginner: 'Build: (1) Data visualization dashboard, (2) Predictive model for house prices, (3) Customer segmentation analysis',
        intermediate: 'Build: (1) Recommendation system, (2) Time series forecasting model, (3) NLP sentiment analysis tool'
      }
    };
    
    return projectIdeas[role]?.[level] || 'Build 3 projects that showcase your technical skills and problem-solving abilities.';
  };

  // Helper function for skill learning paths
  const getSkillLearningPath = (skills, role) => {
    const learningPaths = {
      'TypeScript': 'Complete TypeScript course on freeCodeCamp (20 hours). Practice by converting existing JavaScript projects.',
      'Docker': 'Docker tutorial on YouTube (10 hours). Containerize one of your existing projects.',
      'AWS': 'AWS Cloud Practitioner course (free tier). Deploy a project using EC2 and S3.',
      'GraphQL': 'GraphQL tutorial series (15 hours). Build an API to replace one of your REST APIs.'
    };
    
    return skills.map(skill => learningPaths[skill] || `Complete online course for ${skill}`).join(' ');
  };

  // Helper function for role-specific suggestions
  const addRoleSpecificSuggestions = (suggestions, resumeData, role, roleConfig) => {
    if (role === 'frontend-developer') {
      const hasDesignSkills = resumeData.skills?.some(skill => 
        ['figma', 'sketch', 'adobe', 'ui', 'ux', 'design'].some(design => 
          skill.toLowerCase().includes(design)
        )
      );
      
      if (!hasDesignSkills) {
        suggestions.push({
          category: '🎨 Missing Design Skills',
          priority: 'medium',
          suggestion: 'Frontend developers need basic design skills. Learn Figma and UI/UX principles.',
          action: 'Complete Google UX Design course (free). Learn Figma basics (5 hours). Redesign one of your projects with better UI.',
          impact: 'Design-aware developers are 3x more valuable and get better job offers.',
          timeframe: '3-4 weeks'
        });
      }
    }
    
    if (role === 'data-scientist') {
      const hasMLProjects = resumeData.projects?.some(p => 
        p.description?.toLowerCase().includes('machine learning') || 
        p.description?.toLowerCase().includes('model') ||
        p.technologies?.some(t => ['tensorflow', 'pytorch', 'scikit-learn'].includes(t.toLowerCase()))
      );
      
      if (!hasMLProjects) {
        suggestions.push({
          category: '🤖 No ML Projects',
          priority: 'high',
          suggestion: 'Data Scientists MUST have machine learning projects. This is non-negotiable.',
          action: 'Build: (1) Image classifier with TensorFlow, (2) Recommendation system, (3) Predictive model with real dataset from Kaggle.',
          impact: 'Without ML projects, you\'re not a data scientist - you\'re a data analyst.',
          timeframe: '6-8 weeks'
        });
      }
    }
  };

  const calculateOverallScore = (resumeData, role) => {
    const sectionScores = calculateSectionScores(resumeData, role);
    
    // Weighted scoring based on role importance
    const weights = {
      contact: 0.05,      // 5%
      summary: 0.10,      // 10%
      skills: 0.30,       // 30% - Most important for technical roles
      experience: 0.25,   // 25%
      projects: 0.20,     // 20%
      education: 0.07,    // 7%
      certifications: 0.03 // 3%
    };
    
    let weightedScore = 0;
    Object.keys(weights).forEach(section => {
      weightedScore += (sectionScores[section] || 0) * weights[section];
    });
    
    return Math.round(weightedScore);
  };

  const getPriorityBorderColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-50 to-red-100';
      case 'medium': return 'from-yellow-50 to-yellow-100';
      case 'low': return 'from-green-50 to-green-100';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  const getPriorityTagColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

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
              <h1 className="text-2xl font-bold text-slate-900">Resume Analysis</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setAnalysisHistory([])}
                disabled={analysisHistory.length === 0}
              >
                <History className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-lg border-0">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Resume</h2>
              
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(roleDefinitions).map(([key, role]) => (
                    <option key={key} value={key}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select the role you're targeting for personalized analysis
                </p>
              </div>

              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-500">PDF files only</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button 
                onClick={handleAnalyze}
                disabled={!selectedFile || analyzing}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing for {roleDefinitions[targetRole].name}...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze for {roleDefinitions[targetRole].name}
                  </>
                )}
              </Button>
            </Card>

            {/* Analysis History */}
            {analysisHistory.length > 0 && (
              <Card className="p-6 bg-white shadow-lg border-0 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Analyses</h3>
                <div className="space-y-3">
                  {analysisHistory.slice(0, 5).map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setAnalysis(item)}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.candidateName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.analysisDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-600">{item.overallScore}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="space-y-6">
                {/* Overall Score and ATS Score */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Overall Resume Score</h3>
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="2"
                            strokeDasharray={`${analysis.overallScore}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-indigo-600">{analysis.overallScore}%</span>
                        </div>
                      </div>
                      <p className="text-slate-600">
                        Candidate: <span className="font-semibold">{analysis.candidateName}</span>
                      </p>
                      <p className="text-sm text-slate-500">
                        Role: <span className="font-medium text-indigo-600">{roleDefinitions[analysis.targetRole]?.name}</span>
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-lg border-0">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">ATS Compatibility Score</h3>
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={analysis.atsScore >= 70 ? "#10b981" : analysis.atsScore >= 55 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="2"
                            strokeDasharray={`${analysis.atsScore}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-2xl font-bold ${analysis.atsDetails?.ratingColor || 'text-gray-600'}`}>
                            {analysis.atsScore}%
                          </span>
                        </div>
                      </div>
                      <p className={`font-semibold ${analysis.atsDetails?.ratingColor || 'text-gray-600'}`}>
                        {analysis.atsDetails?.rating || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">
                        How well your resume passes automated screening
                      </p>
                    </div>
                  </Card>
                </div>

                {/* ATS Detailed Breakdown */}
                <Card className="p-6 bg-white shadow-lg border-0 mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    🤖 ATS (Applicant Tracking System) Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Object.entries(analysis.atsDetails?.details || {}).map(([category, score]) => {
                      const categoryNames = {
                        contactInfo: 'Contact Info',
                        keywordMatching: 'Keyword Match',
                        structure: 'Resume Structure',
                        content: 'Content Quality',
                        formatting: 'Formatting',
                        technical: 'Technical'
                      };
                      
                      const maxScores = {
                        contactInfo: 15,
                        keywordMatching: 25,
                        structure: 20,
                        content: 20,
                        formatting: 10,
                        technical: 10
                      };
                      
                      const percentage = Math.round((score / maxScores[category]) * 100);
                      
                      const getScoreColor = (percentage) => {
                        if (percentage >= 80) return 'text-green-600 bg-green-100 border-green-200';
                        if (percentage >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
                        return 'text-red-600 bg-red-100 border-red-200';
                      };
                      
                      return (
                        <div key={category} className={`p-4 rounded-lg border ${getScoreColor(percentage)}`}>
                          <div className="text-center">
                            <p className="text-sm font-medium mb-2">{categoryNames[category]}</p>
                            <p className="text-2xl font-bold mb-1">{percentage}%</p>
                            <p className="text-xs opacity-75">{score}/{maxScores[category]} points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Keyword Matching Details */}
                  {analysis.atsDetails?.keywordMatches && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3">✅ Keywords Found ({analysis.atsDetails.keywordMatches.required.length + analysis.atsDetails.keywordMatches.preferred.length})</h4>
                        <div className="space-y-2">
                          {analysis.atsDetails.keywordMatches.required.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-1">Required Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {analysis.atsDetails.keywordMatches.required.map((keyword, index) => (
                                  <span key={index} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.atsDetails.keywordMatches.preferred.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-1">Preferred Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {analysis.atsDetails.keywordMatches.preferred.map((keyword, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-3">❌ Missing Keywords ({analysis.atsDetails.keywordMatches.missing.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysis.atsDetails.keywordMatches.missing.slice(0, 10).map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        {analysis.atsDetails.keywordMatches.missing.length > 10 && (
                          <p className="text-xs text-red-600 mt-2">
                            +{analysis.atsDetails.keywordMatches.missing.length - 10} more missing
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* ATS Issues & Fixes */}
                {analysis.atsIssues && analysis.atsIssues.length > 0 && (
                  <Card className="p-6 bg-white shadow-lg border-0 mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                      🔧 ATS Issues & Quick Fixes
                    </h3>
                    <div className="space-y-4">
                      {analysis.atsIssues.map((issue, index) => (
                        <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-red-800">{issue.category}: {issue.issue}</h4>
                            <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">
                              ATS Issue
                            </span>
                          </div>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Impact:</strong> {issue.impact}
                          </p>
                          <p className="text-sm text-red-600 bg-white p-2 rounded border">
                            <strong>Fix:</strong> {issue.fix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Section Scores */}
                <Card className="p-6 bg-white shadow-lg border-0">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Resume Section Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(analysis.sectionScores || {}).map(([section, score]) => {
                      const sectionNames = {
                        contact: 'Contact Info',
                        summary: 'Summary',
                        skills: 'Skills',
                        experience: 'Experience',
                        projects: 'Projects',
                        education: 'Education',
                        certifications: 'Certifications'
                      };
                      
                      const getScoreColor = (score) => {
                        if (score >= 80) return 'text-green-600 bg-green-100';
                        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
                        return 'text-red-600 bg-red-100';
                      };
                      
                      return (
                        <div key={section} className="text-center p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">
                            {sectionNames[section]}
                          </p>
                          <p className={`text-2xl font-bold px-3 py-1 rounded-full ${getScoreColor(score)}`}>
                            {Math.round(score)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Candidate Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {analysis.name || 'Not found'}</p>
                      <p><span className="font-medium">Email:</span> {analysis.email || 'Not found'}</p>
                      <p><span className="font-medium">Phone:</span> {analysis.phone || 'Not found'}</p>
                      <p><span className="font-medium">Location:</span> {analysis.location || 'Not specified'}</p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Professional Summary</h3>
                    <p className="text-slate-700 leading-relaxed">
                      {analysis.summary || 'No summary available'}
                    </p>
                  </Card>
                </div>

                {/* Skills and Technologies */}
                <Card className="p-6 bg-white shadow-lg border-0 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Technical Skills ({analysis.skills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    )) || <p className="text-slate-500">No skills extracted</p>}
                  </div>
                </Card>

                {/* Experience and Projects */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Work Experience */}
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 text-blue-500 mr-2" />
                      Work Experience ({analysis.experience?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {analysis.experience?.map((exp, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-900">{exp.title || 'Position'}</h4>
                            <span className="text-sm text-slate-500">{exp.duration || 'Duration not specified'}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 mb-2">{exp.company || 'Company'}</p>
                          {exp.location && <p className="text-xs text-slate-500 mb-2">{exp.location}</p>}
                          {exp.responsibilities && exp.responsibilities.length > 0 && (
                            <ul className="text-sm text-slate-600 space-y-1">
                              {exp.responsibilities.slice(0, 3).map((resp, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {resp}
                                </li>
                              ))}
                            </ul>
                          )}
                          {exp.technologies && exp.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {exp.technologies.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )) || <p className="text-slate-500">No work experience found</p>}
                    </div>
                  </Card>

                  {/* Projects */}
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 text-purple-500 mr-2" />
                      Projects ({analysis.projects?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {analysis.projects?.map((project, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border-l-4 border-purple-500">
                          <h4 className="font-semibold text-slate-900 mb-2">{project.name || `Project ${index + 1}`}</h4>
                          <p className="text-sm text-slate-600 mb-2">{project.description || 'No description available'}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {project.technologies.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.url && (
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                              View Project →
                            </a>
                          )}
                        </div>
                      )) || <p className="text-slate-500">No projects found</p>}
                    </div>
                  </Card>
                </div>

                {/* Education and Certifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Education */}
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Award className="w-5 h-5 text-green-500 mr-2" />
                      Education ({analysis.education?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {analysis.education?.map((edu, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <h4 className="font-semibold text-slate-900">{edu.degree || 'Degree'}</h4>
                          <p className="text-sm text-slate-700">{edu.institution || 'Institution'}</p>
                          <p className="text-xs text-slate-500">{edu.duration || 'Duration not specified'}</p>
                          {edu.gpa && <p className="text-xs text-slate-600">GPA: {edu.gpa}</p>}
                        </div>
                      )) || <p className="text-slate-500">No education information found</p>}
                    </div>
                  </Card>

                  {/* Certifications */}
                  <Card className="p-6 bg-white shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 text-orange-500 mr-2" />
                      Certifications ({analysis.certifications?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {analysis.certifications?.map((cert, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-900">{cert.name || cert}</p>
                          {cert.organization && <p className="text-sm text-slate-600">{cert.organization}</p>}
                        </div>
                      )) || <p className="text-slate-500">No certifications found</p>}
                    </div>
                  </Card>
                </div>

                {/* Actionable Improvement Plan */}
                <Card className="p-6 bg-white shadow-lg border-0">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 text-purple-500 mr-2" />
                    Your Personalized Improvement Plan
                  </h3>
                  <div className="space-y-6">
                    {analysis.improvements?.map((improvement, index) => (
                      <div key={index} className={`p-5 rounded-xl border-l-4 ${getPriorityBorderColor(improvement.priority)} bg-gradient-to-r ${getPriorityBgColor(improvement.priority)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg text-slate-900">{improvement.category}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityTagColor(improvement.priority)}`}>
                              {improvement.priority.toUpperCase()}
                            </span>
                            {improvement.timeframe && (
                              <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                                ⏱️ {improvement.timeframe}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-slate-800 font-medium mb-2">{improvement.suggestion}</p>
                        </div>
                        
                        {improvement.action && (
                          <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg">
                            <p className="text-sm font-medium text-slate-700 mb-1">🎯 Action Steps:</p>
                            <p className="text-sm text-slate-700">{improvement.action}</p>
                          </div>
                        )}
                        
                        <div className="flex items-start space-x-2">
                          <span className="text-sm font-medium text-slate-600">💡 Why this matters:</span>
                          <p className="text-sm text-slate-600 flex-1">{improvement.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {analysis.improvements?.length > 0 && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-2">🚀 Pro Tip</h4>
                      <p className="text-sm text-indigo-800">
                        Focus on HIGH priority items first. Complete 1-2 suggestions per week for maximum impact. 
                        Track your progress and update your resume as you implement these changes.
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-12 bg-white shadow-lg border-0 text-center">
                <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Ready to Analyze</h3>
                <p className="text-slate-500">
                  Upload a PDF resume to get detailed analysis with improvement suggestions
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeAnalysis;