import os
import google.generativeai as genai
from groq import Groq
import json
from typing import Dict, List, Any
import pdfplumber
import io
import httpx
import random
from datetime import datetime

# Initialize APIs
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
MISTRAL_API_KEY = os.environ.get('MISTRAL_API_KEY')

# Gemini (for resume parsing and fast questions)
gemini_flash = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
    # Also initialize Gemini 2.0 Flash for fast question generation
    try:
        gemini_flash = genai.GenerativeModel('gemini-2.0-flash-exp')
        print("✅ Gemini 2.0 Flash initialized (FREE, 3x faster)")
    except:
        gemini_flash = None
        print("⚠️ Gemini 2.0 Flash not available, using gemini-pro")

# Groq (primary for questions and feedback)
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq API initialized (FREE & UNLIMITED)")
else:
    groq_client = None

# Mistral AI (FREE tier - excellent for feedback generation)
mistral_client = None
if MISTRAL_API_KEY and MISTRAL_API_KEY != 'your_mistral_key_here':
    mistral_client = httpx.AsyncClient(
        base_url="https://api.mistral.ai/v1",
        headers={
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        },
        timeout=30.0
    )
    print("✅ Mistral AI initialized (FREE tier)")

# OpenRouter client for DeepSeek (Fallback)
openrouter_client = None
if OPENROUTER_API_KEY:
    openrouter_client = httpx.AsyncClient(
        base_url="https://openrouter.ai/api/v1",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Interview System"
        },
        timeout=30.0
    )
    print("✅ OpenRouter API initialized")


class ResumeParser:
    """Enhanced resume parser using multiple AI models and strategies"""
    
    @staticmethod
    async def parse_pdf(pdf_content: bytes) -> Dict[str, Any]:
        """Extract text from PDF and parse with enhanced AI analysis"""
        try:
            # Enhanced PDF text extraction
            text = ResumeParser._extract_text_from_pdf(pdf_content)
            
            if not text.strip():
                raise Exception("No text could be extracted from the PDF")
            
            print(f"Extracted text length: {len(text)} characters")
            
            # Try Groq first (reliable and fast)
            try:
                result = await ResumeParser._parse_with_groq(text)
                if result and ResumeParser._validate_parsing_result(result):
                    print("Successfully parsed with Groq")
                    return result
            except Exception as e:
                print(f"Groq parsing failed: {e}")
            
            # Fallback to Gemini if Groq fails
            try:
                result = await ResumeParser._parse_with_gemini(text)
                if result and ResumeParser._validate_parsing_result(result):
                    print("Successfully parsed with Gemini")
                    return result
            except Exception as e:
                print(f"Gemini parsing failed: {e}")
            
            # If both fail, return structured mock data
            return ResumeParser._generate_fallback_data(text)
            
        except Exception as e:
            print(f"Error in resume parsing: {e}")
            return ResumeParser._generate_fallback_data("")
    
    @staticmethod
    def _extract_text_from_pdf(pdf_content: bytes) -> str:
        """Enhanced PDF text extraction with multiple strategies"""
        text = ""
        
        try:
            # Strategy 1: pdfplumber (best for most PDFs)
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
        
        # Strategy 2: PyPDF2 fallback if pdfplumber fails
        if not text.strip():
            try:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            except Exception as e:
                print(f"PyPDF2 extraction failed: {e}")
        
        return text.strip()
    
    @staticmethod
    async def _parse_with_gemini(text: str) -> Dict[str, Any]:
        """Parse resume using Gemini AI with enhanced prompts"""
        if not GEMINI_API_KEY:
            raise Exception("Gemini API key not available")
        
        # Enhanced prompt for better project and skill extraction
        prompt = f"""You are an expert resume parser specializing in extracting technical projects and skills. Analyze this resume text and extract ALL information in structured JSON format.

CRITICAL INSTRUCTIONS:
1. Look for projects in ALL sections (work experience, personal projects, academic projects, side projects)
2. Extract skills from ALL contexts (job descriptions, project descriptions, education, certifications)
3. Be thorough in finding project details even if they're embedded in work experience
4. Return ONLY valid JSON, no other text

Extract these fields with MAXIMUM detail:

{{
  "name": "Full candidate name",
  "email": "Email address",
  "phone": "Phone number", 
  "location": "City, State/Country",
  "summary": "Professional summary (extract or create from context)",
  "skills": [
    "List ALL technical skills, programming languages, frameworks, tools, databases, cloud platforms, methodologies found ANYWHERE in the resume"
  ],
  "experience": [
    {{
      "company": "Company name",
      "title": "Job title",
      "duration": "Start - End dates",
      "location": "Work location",
      "responsibilities": [
        "Each responsibility or achievement as separate item"
      ],
      "technologies": [
        "Technologies mentioned in this role"
      ]
    }}
  ],
  "education": [
    {{
      "institution": "School/University name",
      "degree": "Degree and field of study",
      "duration": "Start - End year",
      "gpa": "GPA if mentioned",
      "achievements": ["Academic honors, relevant coursework, thesis topics"]
    }}
  ],
  "projects": [
    {{
      "name": "Project name or title",
      "description": "Detailed description of what the project does, problems solved, features built",
      "technologies": ["All technologies, frameworks, tools used"],
      "duration": "Time period or development time",
      "url": "GitHub, demo, or portfolio link if mentioned",
      "achievements": ["Specific outcomes, metrics, impact, user numbers, performance improvements"],
      "type": "personal/work/academic/freelance"
    }}
  ],
  "certifications": [
    {{
      "name": "Certification name",
      "organization": "Issuing organization",
      "date": "Issue date if mentioned"
    }}
  ],
  "languages": ["Programming and spoken languages with proficiency"],
  "achievements": ["Awards, publications, recognitions, competitions won"]
}}

SPECIAL FOCUS ON PROJECTS:
- Look for projects mentioned in work experience descriptions
- Find personal projects, side projects, open source contributions
- Extract academic projects, capstone projects, thesis work
- Look for freelance or consulting projects
- Find hackathon projects or competition entries
- Extract any software, apps, websites, or systems built

SPECIAL FOCUS ON SKILLS:
- Programming languages (Python, JavaScript, Java, etc.)
- Frameworks and libraries (React, Django, TensorFlow, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, etc.)
- Cloud platforms (AWS, Azure, GCP, etc.)
- Tools and software (Git, Docker, Jenkins, etc.)
- Methodologies (Agile, Scrum, DevOps, etc.)

Resume Text:
{text[:10000]}

JSON Response:"""
        
        response = gemini_model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up the response
        result_text = ResumeParser._clean_json_response(result_text)
        
        try:
            parsed_data = json.loads(result_text)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response: {result_text[:500]}")
            raise Exception("Failed to parse JSON response from Gemini")
        
        # Enhance the parsed data
        enhanced_data = ResumeParser._enhance_parsed_data(parsed_data, text)
        
        return {
            'name': enhanced_data.get('name', 'Unknown Candidate'),
            'email': enhanced_data.get('email', ''),
            'phone': enhanced_data.get('phone', ''),
            'location': enhanced_data.get('location', ''),
            'summary': enhanced_data.get('summary', ''),
            'skills': enhanced_data.get('skills', []),
            'experience': enhanced_data.get('experience', []),
            'education': enhanced_data.get('education', []),
            'projects': enhanced_data.get('projects', []),
            'certifications': enhanced_data.get('certifications', []),
            'languages': enhanced_data.get('languages', []),
            'achievements': enhanced_data.get('achievements', []),
            'parsedData': enhanced_data
        }
    
    @staticmethod
    async def _parse_with_groq(text: str) -> Dict[str, Any]:
        """Parse resume using Groq (primary method)"""
        if not GROQ_API_KEY:
            raise Exception("Groq API key not available")
        
        print(f"Using Groq API for resume parsing...")
        
        prompt = f"""You are an expert resume parser. Extract comprehensive information from this resume with special focus on finding ALL projects and technical skills.

CRITICAL: Look for projects EVERYWHERE - in work experience, personal projects section, education, and any project descriptions embedded in job roles.

Return ONLY valid JSON with this exact structure:

{{
  "name": "Full candidate name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State/Country", 
  "summary": "Professional summary or create one from context",
  "skills": [
    "Extract ALL technical skills from entire resume - programming languages, frameworks, databases, cloud platforms, tools, methodologies"
  ],
  "experience": [
    {{
      "company": "Company name",
      "title": "Job title",
      "duration": "Start - End dates", 
      "location": "Work location",
      "responsibilities": [
        "Each bullet point or responsibility as separate item"
      ],
      "technologies": ["Technologies used in this role"]
    }}
  ],
  "education": [
    {{
      "institution": "University/School name",
      "degree": "Degree type and field of study",
      "duration": "Start - End year",
      "gpa": "GPA if mentioned",
      "achievements": ["Honors, relevant coursework, projects"]
    }}
  ],
  "projects": [
    {{
      "name": "Project name or title",
      "description": "Comprehensive description - what it does, problems solved, features",
      "technologies": ["ALL technologies, frameworks, libraries used"],
      "duration": "Development timeframe",
      "url": "GitHub, demo, or live link if available",
      "achievements": ["Specific results, metrics, impact, user adoption"],
      "type": "personal/work/academic/freelance/hackathon"
    }}
  ],
  "certifications": [
    {{
      "name": "Full certification name",
      "organization": "Issuing organization",
      "date": "Date obtained if mentioned"
    }}
  ],
  "languages": ["All programming and spoken languages"],
  "achievements": ["Awards, publications, recognitions, competitions"]
}}

EXTRACTION PRIORITIES:
1. PROJECTS: Find every project mentioned - work projects, personal projects, academic projects, hackathons, open source contributions
2. SKILLS: Extract from job descriptions, project descriptions, education, certifications
3. QUANTIFIABLE RESULTS: Look for numbers, percentages, user counts, performance improvements
4. TECHNOLOGIES: Be comprehensive - include databases, cloud services, frameworks, tools

Resume Text:
{text[:8000]}

Return only the JSON object:"""
        
        if not groq_client:
            raise Exception("Groq client not initialized - GROQ_API_KEY missing")
        
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated model for better parsing
                messages=[
                    {"role": "system", "content": "You are an expert resume parser. Extract comprehensive information and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2500
            )
            
            result_text = completion.choices[0].message.content.strip()
            print(f"✅ Groq raw response length: {len(result_text)}")
            
            result_text = ResumeParser._clean_json_response(result_text)
            
            try:
                parsed_data = json.loads(result_text)
                print("Successfully parsed JSON from Groq")
            except json.JSONDecodeError as e:
                print(f"JSON decode error from Groq: {e}")
                print(f"Cleaned response: {result_text[:500]}")
                raise Exception("Failed to parse JSON response from Groq")
            
            enhanced_data = ResumeParser._enhance_parsed_data(parsed_data, text)
            
            return {
                'name': enhanced_data.get('name', 'Unknown Candidate'),
                'email': enhanced_data.get('email', ''),
                'phone': enhanced_data.get('phone', ''),
                'location': enhanced_data.get('location', ''),
                'summary': enhanced_data.get('summary', ''),
                'skills': enhanced_data.get('skills', []),
                'experience': enhanced_data.get('experience', []),
                'education': enhanced_data.get('education', []),
                'projects': enhanced_data.get('projects', []),
                'certifications': enhanced_data.get('certifications', []),
                'languages': enhanced_data.get('languages', []),
                'achievements': enhanced_data.get('achievements', []),
                'parsedData': enhanced_data
            }
            
        except Exception as e:
            print(f"Error in Groq parsing: {e}")
            raise
    
    @staticmethod
    def _clean_json_response(text: str) -> str:
        """Clean up AI response to extract valid JSON"""
        # Remove markdown code blocks
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        
        # Remove any leading/trailing text that's not JSON
        text = text.strip()
        
        # Find the first { and last }
        start = text.find('{')
        end = text.rfind('}')
        
        if start != -1 and end != -1 and end > start:
            text = text[start:end+1]
        
        return text
    
    @staticmethod
    def _enhance_parsed_data(data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Enhance parsed data with additional processing"""
        # Ensure skills is a list and clean it up
        if isinstance(data.get('skills'), str):
            data['skills'] = [s.strip() for s in data['skills'].split(',') if s.strip()]
        elif not isinstance(data.get('skills'), list):
            data['skills'] = []
        
        # Clean up skills list
        data['skills'] = [skill.strip() for skill in data.get('skills', []) if skill.strip()]
        
        # Ensure experience is properly formatted
        if not isinstance(data.get('experience'), list):
            data['experience'] = []
        
        # Ensure projects is properly formatted
        if not isinstance(data.get('projects'), list):
            data['projects'] = []
        
        # Extract additional skills from text if not found
        if len(data.get('skills', [])) < 3:
            additional_skills = ResumeParser._extract_skills_from_text(original_text)
            data['skills'] = list(set(data.get('skills', []) + additional_skills))
        
        return data
    
    @staticmethod
    def _extract_skills_from_text(text: str) -> List[str]:
        """Extract technical skills from text using pattern matching"""
        import re
        
        # Common technical skills patterns
        skill_patterns = [
            r'\b(Python|Java|JavaScript|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin)\b',
            r'\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|Laravel)\b',
            r'\b(HTML|CSS|SCSS|SASS|Bootstrap|Tailwind)\b',
            r'\b(MySQL|PostgreSQL|MongoDB|Redis|SQLite|Oracle)\b',
            r'\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|GitHub)\b',
            r'\b(Machine Learning|AI|Data Science|TensorFlow|PyTorch)\b'
        ]
        
        skills = []
        text_upper = text.upper()
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            skills.extend(matches)
        
        return list(set(skills))
    
    @staticmethod
    def _validate_parsing_result(result: Dict[str, Any]) -> bool:
        """Validate that parsing result has minimum required information"""
        return (
            result.get('name') and 
            (result.get('skills') or result.get('experience') or result.get('projects'))
        )
    
    @staticmethod
    def _generate_fallback_data(text: str) -> Dict[str, Any]:
        """Generate structured fallback data when parsing fails"""
        # Try to extract basic info with regex
        import re
        
        name = "Unknown Candidate"
        email = ""
        phone = ""
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            email = email_match.group()
        
        # Extract phone
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        if phone_match:
            phone = phone_match.group()
        
        # Extract basic skills
        skills = ResumeParser._extract_skills_from_text(text)
        
        return {
            'name': name,
            'email': email,
            'phone': phone,
            'location': '',
            'summary': 'Professional with diverse experience',
            'skills': skills,
            'experience': [],
            'education': [],
            'projects': [],
            'certifications': [],
            'languages': [],
            'achievements': [],
            'parsedData': {
                'name': name,
                'email': email,
                'phone': phone,
                'skills': skills,
                'experience': [],
                'projects': []
            }
        }


class AIInterviewer:
    """AI-powered interview engine with dynamic multi-turn conversations"""
    
    SECTIONS = [
        {
            'id': 'greeting', 
            'name': 'Introduction & Welcome', 
            'min_questions': 1, 
            'max_questions': 2,
            'topics': ['introduction', 'background_overview']
        },
        {
            'id': 'resume', 
            'name': 'Resume Discussion', 
            'min_questions': 3, 
            'max_questions': 6,
            'topics': ['work_experience', 'career_progression', 'achievements', 'skills_application']
        },
        {
            'id': 'projects', 
            'name': 'Projects Deep-Dive', 
            'min_questions': 4, 
            'max_questions': 8,
            'topics': ['project_overview', 'technical_challenges', 'problem_solving', 'architecture_decisions', 'outcomes']
        },
        {
            'id': 'behavioral', 
            'name': 'Behavioral Assessment', 
            'min_questions': 3, 
            'max_questions': 6,
            'topics': ['teamwork', 'leadership', 'conflict_resolution', 'adaptability', 'learning']
        },
        {
            'id': 'technical', 
            'name': 'Technical Expertise', 
            'min_questions': 4, 
            'max_questions': 8,
            'topics': ['technical_knowledge', 'best_practices', 'system_design', 'problem_solving', 'code_quality']
        },
        {
            'id': 'closing', 
            'name': 'Wrap-up & Questions', 
            'min_questions': 1, 
            'max_questions': 2,
            'topics': ['candidate_questions', 'final_thoughts']
        }
    ]
    
    @staticmethod
    async def generate_question(
        section: str,
        previous_answer: str,
        resume_data: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        candidate_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate next interview question with dynamic follow-ups using AI"""
        try:
            # SPECIAL CASE: First question ONLY (when conversation is completely empty)
            total_questions = len([c for c in conversation_history if c.get('type') == 'question'])
            if total_questions == 0:
                candidate_name = candidate_info.get('name', 'there') if candidate_info else 'there'
                target_role = candidate_info.get('role', 'this position') if candidate_info else 'this position'
                
                intro_questions = [
                    f"Hello {candidate_name}! Thank you for joining us today. To start, could you please introduce yourself and tell me a bit about your background?",
                    f"Hi {candidate_name}! Welcome to the interview. I'd love to hear about your journey - could you introduce yourself and share what brings you to apply for {target_role}?",
                    f"Good to meet you, {candidate_name}! Let's begin by having you introduce yourself. Tell me about your background and what excites you about this opportunity.",
                    f"Welcome {candidate_name}! Before we dive in, I'd like to get to know you better. Could you introduce yourself and walk me through your professional background?",
                ]
                
                intro_question = random.choice(intro_questions)
                
                print(f"🎯 First question - asking for introduction")
                return {
                    'question': intro_question,
                    'section': 'greeting',
                    'isComplete': False,
                    'questionType': 'introduction',
                    'topic': 'introduction',
                    'questionStyle': 'introduction',
                    'followUpOpportunities': ['background', 'experience', 'motivation']
                }
            
            # Analyze conversation context for intelligent flow control
            conversation_analysis = AIInterviewer._analyze_conversation_context(
                conversation_history, section, previous_answer, candidate_info
            )
            
            # Determine if we should ask a follow-up or move to next topic/section
            should_follow_up = AIInterviewer._should_ask_follow_up(
                conversation_analysis, section, conversation_history
            )
            
            # Get current section configuration
            section_config = next((s for s in AIInterviewer.SECTIONS if s['id'] == section), None)
            if not section_config:
                return {'question': '', 'section': 'closing', 'isComplete': True}
            
            # Count questions in current section
            section_questions = [c for c in conversation_history if c.get('type') == 'question' and c.get('section') == section]
            
            # Determine next action: follow-up, new topic, or new section
            if should_follow_up and len(section_questions) < section_config['max_questions']:
                # Generate follow-up question
                question_type = 'follow_up'
                current_topic = conversation_analysis.get('current_topic', section_config['topics'][0])
            elif len(section_questions) < section_config['min_questions']:
                # Continue with current section, new topic
                question_type = 'new_topic'
                current_topic = AIInterviewer._get_next_topic(section_config, conversation_history)
            elif len(section_questions) >= section_config['max_questions'] or conversation_analysis.get('section_complete', False):
                # Move to next section
                current_idx = next(i for i, s in enumerate(AIInterviewer.SECTIONS) if s['id'] == section)
                if current_idx + 1 < len(AIInterviewer.SECTIONS):
                    section = AIInterviewer.SECTIONS[current_idx + 1]['id']
                    section_config = AIInterviewer.SECTIONS[current_idx + 1]
                    question_type = 'new_section'
                    current_topic = section_config['topics'][0]
                else:
                    return {'question': '', 'section': 'closing', 'isComplete': True}
            else:
                # Continue with current section, potentially new topic
                question_type = 'continue_section'
                current_topic = AIInterviewer._get_next_topic(section_config, conversation_history)
            
            # Build DETAILED resume context for AI
            candidate_name = candidate_info.get('name', 'Candidate') if candidate_info else 'Candidate'
            target_role = candidate_info.get('role', 'software-engineer') if candidate_info else 'software-engineer'
            experience_level = candidate_info.get('experience', 'mid-level') if candidate_info else 'mid-level'
            
            # Extract introduction/background from first answer if available
            introduction_context = ""
            if len(conversation_history) >= 2:
                first_answer = next((c for c in conversation_history if c.get('type') == 'answer'), None)
                if first_answer:
                    intro_text = first_answer.get('text', '')[:300]  # First 300 chars
                    introduction_context = f"\n\nCANDIDATE'S INTRODUCTION (USE THIS IN YOUR QUESTIONS):\n{intro_text}\n"
            
            # Extract comprehensive skills
            skills = resume_data.get('skills', [])
            if candidate_info and candidate_info.get('skills'):
                skills = candidate_info['skills']
            skills_text = ', '.join(skills[:10]) if skills else 'various technologies'
            
            # Extract detailed projects with technologies
            projects = candidate_info.get('projects', []) if candidate_info else resume_data.get('projects', [])
            projects_detail = []
            for p in projects[:3]:
                proj_name = p.get('name', 'Project')
                proj_tech = ', '.join(p.get('technologies', [])[:3]) if p.get('technologies') else ''
                proj_desc = p.get('description', '')[:100]
                projects_detail.append({
                    'name': proj_name,
                    'tech': proj_tech,
                    'desc': proj_desc
                })
            
            # Extract work experience with companies
            experience = resume_data.get('experience', [])
            experience_detail = []
            for exp in experience[:3]:
                exp_detail = {
                    'title': exp.get('title', 'Role'),
                    'company': exp.get('company', 'Company'),
                    'responsibilities': exp.get('responsibilities', [])[:2],
                    'technologies': exp.get('technologies', [])[:3]
                }
                experience_detail.append(exp_detail)
            
            # Build conversation context
            recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
            history_text = "\n".join([
                f"{'AI' if c['type'] == 'question' else candidate_name}: {c['text']}"
                for c in recent_history
            ])
            
            # Dynamic prompts based on question type and context
            if question_type == 'follow_up':
                follow_up_prompts = AIInterviewer._get_follow_up_prompts(
                    conversation_analysis, candidate_name, target_role, previous_answer
                )
                section_prompt = follow_up_prompts.get(
                    conversation_analysis['follow_up_opportunities'][0] if conversation_analysis['follow_up_opportunities'] else 'elaborate',
                    f"Ask {candidate_name} to elaborate on their previous answer with more specific details."
                )
            else:
                # Topic-specific prompts for each section with resume details
                section_prompt = AIInterviewer._get_topic_prompts(
                    section, current_topic, candidate_name, target_role, experience_level, 
                    skills_text, projects_detail, experience_detail
                )
            
            # Enhanced context for dynamic conversations
            conversation_context = ""
            if question_type == 'follow_up':
                conversation_context = f"This is a FOLLOW-UP question to dig deeper into their previous answer about: {previous_answer[:100]}..."
            elif question_type == 'new_section':
                conversation_context = f"This is the START of the {section.upper()} section. Transition smoothly from the previous topic."
            else:
                conversation_context = f"Continue the conversation naturally in the {section} section, topic: {current_topic}."

            # Extract already asked questions to avoid repetition
            asked_questions = [c['text'] for c in conversation_history if c.get('type') == 'question']
            asked_questions_text = "\n".join([f"- {q}" for q in asked_questions[-5:]]) if asked_questions else "None yet"
            
            prompt = f"""You are an experienced, friendly interviewer conducting a natural {target_role} interview conversation.

CONTEXT:
- Candidate: {candidate_name} ({experience_level} level)
- Target Role: {target_role}
- Current Section: {section} ({current_topic})
- Question Type: {question_type}
- {conversation_context}
{introduction_context}

CANDIDATE'S RESUME DETAILS (USE THESE IN YOUR QUESTIONS):
Skills: {skills_text}

Work Experience:
{chr(10).join([f"- {exp['title']} at {exp['company']}" + (f" (Tech: {', '.join(exp['technologies'])})" if exp['technologies'] else "") for exp in experience_detail]) if experience_detail else '- No experience listed'}

Projects:
{chr(10).join([f"- {p['name']}" + (f" using {p['tech']}" if p['tech'] else "") + (f": {p['desc']}" if p['desc'] else "") for p in projects_detail]) if projects_detail else '- No projects listed'}

IMPORTANT: Reference these SPECIFIC skills, projects, companies, AND details from their introduction in your questions to make them highly personalized!

RECENT CONVERSATION:
{history_text}

CANDIDATE'S LAST ANSWER: 
{previous_answer if previous_answer else 'No previous answer (this is the first question)'}

ALREADY ASKED QUESTIONS (DO NOT REPEAT):
{asked_questions_text}

YOUR TASK: {section_prompt}

CRITICAL REQUIREMENTS:
1. DO NOT repeat or rephrase any question from "ALREADY ASKED QUESTIONS"
2. Ask a COMPLETELY NEW question that hasn't been covered
3. REFERENCE THEIR INTRODUCTION: Use details they shared about themselves in their first answer
4. REFERENCE SPECIFIC RESUME DETAILS: Mention actual project names, companies, or skills from their resume
5. Be conversational like a real human interviewer who remembers what they said
6. If this is a follow-up, directly reference their previous answer: "You mentioned... can you tell me more about..."
7. Show active listening: "That's interesting..." "I see..." "Building on what you said..." "Earlier you mentioned..."
8. Use the candidate's name occasionally (not every question)
9. Ask ONE focused question only
10. Keep it appropriate for {experience_level} level
11. Make it relevant to {target_role} work
12. Be encouraging and positive
13. PERSONALIZE: Use phrases like "I see you worked at [Company]..." or "Your [Project] project..." or "You mentioned in your introduction that..." or "You have experience with [Skill]..."

INTERVIEW STYLE MIX (ROTATE CONSTANTLY):
- Behavioral (STAR): "Tell me about a time when..." "Describe a situation where..."
- Situational: "How would you handle..." "What would you do if..."
- Technical Deep: "Explain how... works" "What's your understanding of..."
- Project Walkthrough: "Walk me through..." "Can you describe the process..."
- Problem-Solving: "If you encountered X, what steps..." "How would you approach..."
- Opinion-Based: "What do you think about..." "What's your view on..."
- Comparison: "What's the difference between..." "How do you choose between..."
- Experience-Specific: "In your work with X, how..." "Given your background in Y..."

CRITICAL: DO NOT use the same question format twice in a row. ROTATE between these styles constantly.

RESPONSE FORMAT:
- Generate ONLY the question text, nothing else
- No preamble, no explanation, no multiple questions
- 1-2 sentences maximum
- Natural, conversational tone
- Must be a NEW question not asked before

Question:"""
            
            # Generate question using AI (Priority: Groq > A4F > OpenRouter)
            question = None
            
            # Determine question style to force variety
            question_styles = [
                'behavioral_star',      # "Tell me about a time when..."
                'situational',          # "How would you handle..."
                'technical_deep',       # "Explain how... works"
                'project_walkthrough',  # "Walk me through..."
                'problem_solving',      # "If you encountered X, what would you do?"
                'opinion_based',        # "What do you think about..."
                'comparison',           # "What's the difference between..."
                'experience_specific'   # "In your experience with X, how did you..."
            ]
            
            # Track which styles have been used recently
            recent_styles = [c.get('questionStyle') for c in conversation_history[-5:] if c.get('type') == 'question' and c.get('questionStyle')]
            
            # Choose a style that hasn't been used recently
            available_styles = [s for s in question_styles if s not in recent_styles]
            if not available_styles:
                available_styles = question_styles  # Reset if all used
            
            chosen_style = random.choice(available_styles)
            
            # Add style instruction to prompt
            style_instructions = {
                'behavioral_star': "Use STAR format: 'Tell me about a time when...' or 'Describe a situation where...'",
                'situational': "Ask a hypothetical: 'How would you handle...' or 'What would you do if...'",
                'technical_deep': "Ask for technical explanation: 'Explain how... works' or 'What's your understanding of...'",
                'project_walkthrough': "Ask for detailed walkthrough: 'Walk me through...' or 'Can you describe the process of...'",
                'problem_solving': "Present a problem: 'If you encountered... what steps would you take?' or 'How would you approach...'",
                'opinion_based': "Ask for opinion: 'What do you think about...' or 'What's your view on...'",
                'comparison': "Ask for comparison: 'What's the difference between... and...' or 'How do you choose between...'",
                'experience_specific': "Reference their experience: 'In your work with X, how did you...' or 'Given your background in Y, tell me about...'"
            }
            
            style_instruction = style_instructions.get(chosen_style, "Ask a unique question")
            enhanced_prompt = f"{prompt}\n\nQUESTION STYLE REQUIREMENT: {style_instruction}\nYou MUST use this style for this question."
            
            # System message emphasizing conversational flow and context awareness
            system_message = f"""You are an experienced, empathetic technical interviewer conducting a natural conversation.

CORE PRINCIPLES:
1. LISTEN to their previous answers and build on them
2. REFERENCE specific details from their INTRODUCTION and resume (companies, projects, skills, background)
3. USE information they shared about themselves in their introduction to personalize questions
4. VARY your question style - use {chosen_style} format this time
5. BE CONVERSATIONAL - like a real human interviewer who remembers what they said
6. SHOW INTEREST in their work and experiences
7. NEVER repeat questions or patterns

You're having a real conversation, not conducting a robotic Q&A session. Remember what they told you about themselves!"""
            
            # Try Gemini 2.0 Flash FIRST (FASTEST - 0.2s, 4x faster than Groq)
            if gemini_flash:
                try:
                    print(f"🎯 Generating question with Gemini 2.0 Flash (Style: {chosen_style})...")
                    response = await gemini_flash.generate_content_async(
                        f"{system_message}\n\n{enhanced_prompt}",
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.9,
                            max_output_tokens=120,
                            top_p=0.95
                        )
                    )
                    question = response.text.strip()
                    print(f"✅ Generated with Gemini 2.0 Flash (Style: {chosen_style}) - 0.2s ⚡")
                except Exception as e:
                    print(f"⚠️ Gemini Flash failed: {e}, trying Groq...")
            
            # Fallback to Groq (Fast and reliable)
            if not question and groq_client:
                try:
                    print(f"🎯 Generating question with Groq (Style: {chosen_style})...")
                    completion = groq_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",  # Updated model (replaces deprecated llama3-70b-8192)
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": enhanced_prompt}
                        ],
                        temperature=0.9,   # High for variety and natural conversation
                        max_tokens=120,    # Allow detailed questions
                        top_p=0.95,        # High diversity
                        frequency_penalty=0.8,  # Strong penalty against repetition
                        presence_penalty=0.6,   # Encourage new topics
                        stream=False
                    )
                    question = completion.choices[0].message.content.strip()
                    print(f"✅ Generated with Groq Llama-3.3-70B (Style: {chosen_style})")
                except Exception as e:
                    print(f"⚠️ Groq failed: {e}, trying OpenRouter...")
            
            # Final fallback to OpenRouter
            if not question and openrouter_client:
                try:
                    response = await openrouter_client.post(
                        "/chat/completions",
                        json={
                            "model": "deepseek/deepseek-chat",
                            "messages": [
                                {"role": "system", "content": system_message},
                                {"role": "user", "content": enhanced_prompt}
                            ],
                            "temperature": 0.9,
                            "max_tokens": 120,
                            "top_p": 0.95,
                            "frequency_penalty": 0.7,
                            "presence_penalty": 0.5
                        }
                    )
                    if response.status_code == 200:
                        result = response.json()
                        question = result['choices'][0]['message']['content'].strip()
                        print(f"✅ Generated with OpenRouter DeepSeek (Style: {chosen_style})")
                except Exception as e:
                    print(f"⚠️ OpenRouter failed: {e}")
            
            if not question:
                raise Exception("All AI providers failed")
            
            return {
                'question': question,
                'section': section,
                'isComplete': False,
                'questionType': question_type,
                'topic': current_topic,
                'questionStyle': chosen_style,  # Track the style used
                'followUpOpportunities': conversation_analysis.get('follow_up_opportunities', [])
            }
            
        except Exception as e:
            print(f"Error generating question: {e}")
            # Fallback questions
            fallback = {
                'greeting': "Hello! Thank you for joining us today. Could you please introduce yourself and tell me a bit about your background?",
                'resume': "I see you have experience with React. Can you tell me about a project where you used it?",
                'projects': "What was the biggest technical challenge in that project, and how did you overcome it?",
                'behavioral': "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
                'technical': "Can you explain the difference between props and state in React?",
                'closing': "Do you have any questions for us about the role or the company?"
            }
            return {
                'question': fallback.get(section, "Can you tell me more about your experience?"),
                'section': section,
                'isComplete': False,
                'questionType': 'fallback',
                'topic': 'general'
            }

    @staticmethod
    def _analyze_conversation_context(conversation_history, current_section, previous_answer, candidate_info):
        """Analyze conversation to determine follow-up opportunities"""
        analysis = {
            'current_topic': None,
            'answer_depth': 'shallow',
            'follow_up_opportunities': [],
            'section_complete': False,
            'mentioned_keywords': [],
            'emotional_tone': 'neutral'
        }
        
        if not previous_answer:
            return analysis
        
        answer_length = len(previous_answer.split())
        
        # Analyze answer depth
        if answer_length < 20:
            analysis['answer_depth'] = 'shallow'
            analysis['follow_up_opportunities'].append('elaborate')
        elif answer_length < 50:
            analysis['answer_depth'] = 'moderate'
            analysis['follow_up_opportunities'].append('details')
        else:
            analysis['answer_depth'] = 'detailed'
            analysis['follow_up_opportunities'].append('clarification')
        
        # Look for follow-up triggers in the answer
        answer_lower = previous_answer.lower()
        
        # Technical follow-ups
        if any(word in answer_lower for word in ['challenge', 'difficult', 'problem', 'issue']):
            analysis['follow_up_opportunities'].append('challenges')
        
        if any(word in answer_lower for word in ['built', 'created', 'developed', 'implemented']):
            analysis['follow_up_opportunities'].append('technical_details')
        
        if any(word in answer_lower for word in ['team', 'collaborated', 'worked with']):
            analysis['follow_up_opportunities'].append('teamwork')
        
        if any(word in answer_lower for word in ['learned', 'discovered', 'realized']):
            analysis['follow_up_opportunities'].append('learning')
        
        # Project-specific triggers
        if current_section == 'projects':
            if any(word in answer_lower for word in ['architecture', 'design', 'structure']):
                analysis['follow_up_opportunities'].append('architecture_decisions')
            
            if any(word in answer_lower for word in ['performance', 'optimization', 'scale']):
                analysis['follow_up_opportunities'].append('performance')
        
        # Behavioral triggers
        if current_section == 'behavioral':
            if any(word in answer_lower for word in ['conflict', 'disagreement', 'difficult person']):
                analysis['follow_up_opportunities'].append('conflict_resolution')
            
            if any(word in answer_lower for word in ['leadership', 'led', 'managed']):
                analysis['follow_up_opportunities'].append('leadership_style')
        
        return analysis
    
    @staticmethod
    def _should_ask_follow_up(conversation_analysis, section, conversation_history):
        """Determine if a follow-up question should be asked"""
        # Always follow up on shallow answers
        if conversation_analysis['answer_depth'] == 'shallow':
            return True
        
        # Follow up if there are interesting opportunities
        if len(conversation_analysis['follow_up_opportunities']) > 0:
            # Don't ask more than 1 follow-up in a row to keep conversation flowing
            recent_questions = conversation_history[-2:]  # Last Q&A pair
            follow_up_count = sum(1 for q in recent_questions 
                                if q.get('type') == 'question' and q.get('questionType') == 'follow_up')
            return follow_up_count < 1
        
        return False
    
    @staticmethod
    def _get_next_topic(section_config, conversation_history):
        """Get the next topic to explore in the current section"""
        # Find topics already covered
        covered_topics = set()
        for entry in conversation_history:
            if entry.get('type') == 'question' and entry.get('topic'):
                covered_topics.add(entry['topic'])
        
        # Return first uncovered topic
        for topic in section_config['topics']:
            if topic not in covered_topics:
                return topic
        
        # If all topics covered, return the first one (for potential follow-ups)
        return section_config['topics'][0]
    
    @staticmethod
    def _get_follow_up_prompts(conversation_analysis, candidate_name, target_role, previous_answer):
        """Generate contextual follow-up prompts based on conversation analysis"""
        return {
            'elaborate': f"Ask {candidate_name} to provide more specific details about what they just mentioned. Use phrases like 'Can you elaborate on that?' or 'Tell me more about...' or 'What specifically did you do?'",
            
            'challenges': f"Since {candidate_name} mentioned challenges or difficulties, ask them to dive deeper: 'What specific challenges did you face?' or 'How did you overcome those obstacles?' or 'What made that particularly difficult?'",
            
            'technical_details': f"Ask {candidate_name} for more technical depth: 'Can you walk me through the technical implementation?' or 'What technologies did you use and why?' or 'How did you architect that solution?'",
            
            'teamwork': f"Since {candidate_name} mentioned working with others, explore the collaboration aspect: 'How did you work with your team on this?' or 'What was your role in the team?' or 'How did you handle different opinions?'",
            
            'learning': f"Explore the learning aspect: 'What did you learn from that experience?' or 'How did that change your approach?' or 'What would you do differently now?'",
            
            'architecture_decisions': f"Dive into the technical decisions: 'Why did you choose that architecture?' or 'What alternatives did you consider?' or 'How did you make that design decision?'",
            
            'performance': f"Ask about performance considerations: 'How did you optimize for performance?' or 'What metrics did you track?' or 'How did you measure success?'",
            
            'conflict_resolution': f"Explore conflict resolution skills: 'How did you handle that conflict?' or 'What was your approach to resolving the disagreement?' or 'What was the outcome?'",
            
            'leadership_style': f"Ask about leadership approach: 'What's your leadership style?' or 'How do you motivate team members?' or 'How do you handle underperforming team members?'",
            
            'details': f"Ask for more specific details: 'Can you give me a specific example?' or 'What exactly did that involve?' or 'Walk me through your process step by step.'",
            
            'clarification': f"Ask for clarification on their detailed answer: 'Just to clarify, when you said... what did you mean?' or 'Can you explain that concept in simpler terms?' or 'How does that relate to {target_role} work?'"
        }
    
    @staticmethod
    def _get_topic_prompts(section, topic, candidate_name, target_role, experience_level, skills_text, projects_detail, experience_detail):
        """Generate topic-specific prompts with resume context for each section"""
        
        # Helper to get specific resume references
        first_company = experience_detail[0]['company'] if experience_detail else 'your previous company'
        first_role = experience_detail[0]['title'] if experience_detail else 'your previous role'
        first_project = projects_detail[0]['name'] if projects_detail else 'one of your projects'
        first_project_tech = projects_detail[0]['tech'] if projects_detail and projects_detail[0]['tech'] else skills_text.split(',')[0] if skills_text else 'the technologies'
        
        prompts = {
            'greeting': {
                'introduction': f"Welcome {candidate_name} warmly to the {target_role} interview. Ask them to introduce themselves and tell you about their background in a conversational way.",
                'background_overview': f"Ask {candidate_name} to give you a brief overview of their professional journey and what brought them to apply for this {target_role} position."
            },
            
            'resume': {
                'work_experience': f"Ask {candidate_name} about their work at {first_company} as {first_role}. Reference SPECIFIC responsibilities or achievements from their resume. Example: 'I see you worked at {first_company} as {first_role}. Can you tell me about...'",
                'career_progression': f"Explore {candidate_name}'s career progression by referencing their actual companies: 'I noticed you moved from [Company A] to [Company B]. What motivated that transition?' Use their ACTUAL company names from resume.",
                'achievements': f"Ask {candidate_name} about a specific achievement at {first_company} or in {first_project}. Reference something concrete from their resume: 'In your role at {first_company}, what accomplishment are you most proud of?'",
                'skills_application': f"Ask {candidate_name} how they've used a SPECIFIC skill from their resume ({skills_text.split(',')[0] if skills_text else 'a key skill'}) in real work. Example: 'I see you have experience with {skills_text.split(',')[0] if skills_text else 'X'}. Can you describe a project where you used it?'"
            },
            
            'projects': {
                'project_overview': f"Ask {candidate_name} about their SPECIFIC project '{first_project}'. Reference details from their resume: 'I'd love to hear about your {first_project} project. What was your role and what did you build?'",
                'technical_challenges': f"Dive into technical challenges in their SPECIFIC project. Example: 'In your {first_project} project where you used {first_project_tech}, what was the biggest technical challenge you faced?'",
                'problem_solving': f"Explore problem-solving in a SPECIFIC project context: 'When building {first_project}, how did you approach [specific technical decision]?' Reference actual technologies they used.",
                'architecture_decisions': f"Ask about architecture decisions in their SPECIFIC project: 'For {first_project}, why did you choose {first_project_tech}? What alternatives did you consider?'",
                'outcomes': f"Ask about SPECIFIC outcomes from their project: 'What was the impact of your {first_project} project? How many users? What metrics improved?'"
            },
            
            'behavioral': {
                'teamwork': f"Ask {candidate_name} about teamwork at a SPECIFIC company: 'Tell me about a time you collaborated with your team at {first_company}. How did you work together?' Use STAR method.",
                'leadership': f"Explore leadership in a SPECIFIC context: 'During your time at {first_company} or working on {first_project}, tell me about a time you had to lead or influence others.'",
                'conflict_resolution': f"Ask about conflict resolution with SPECIFIC context: 'In your role at {first_company}, describe a time you had to resolve a disagreement with a colleague or stakeholder.'",
                'adaptability': f"Explore adaptability with SPECIFIC examples: 'When you transitioned to {first_company} or started {first_project}, what new challenges did you face and how did you adapt?'",
                'learning': f"Ask about learning with SPECIFIC technology: 'I see you used {first_project_tech} in {first_project}. If that was new to you, how did you learn it? Or how do you stay current with {skills_text.split(',')[0] if skills_text else 'new technologies'}?'"
            },
            
            'technical': {
                'technical_knowledge': f"Ask {candidate_name} about SPECIFIC technical expertise: 'I see you have experience with {skills_text.split(',')[0] if skills_text else 'X'}. Can you explain how you've used it and what challenges you've solved with it?'",
                'best_practices': f"Explore best practices in SPECIFIC context: 'In your {first_project} project or at {first_company}, what coding/development best practices did you follow? How did you ensure quality?'",
                'system_design': f"Ask system design with SPECIFIC context: 'If you had to redesign {first_project} from scratch today, how would you architect it? What would you change?'",
                'problem_solving': f"Present problem-solving with SPECIFIC technology: 'If you encountered a performance issue in a {first_project_tech} application, how would you debug and optimize it?'",
                'code_quality': f"Ask about code quality in SPECIFIC context: 'In your work at {first_company} or on {first_project}, how did you ensure code maintainability? What was your code review process?'"
            },
            
            'closing': {
                'candidate_questions': f"Ask {candidate_name} if they have questions: 'What questions do you have about the {target_role} role or our company?' Mention something positive like 'I really enjoyed hearing about your {first_project} project.'",
                'final_thoughts': f"Wrap up warmly: 'Is there anything else you'd like to share about your experience at {first_company} or your {first_project} project that we haven't covered?' Thank them for their time."
            }
        }
        
        return prompts.get(section, {}).get(topic, f"Ask {candidate_name} about {topic} in the context of {target_role}, referencing their resume details.")


class FeedbackGenerator:
    """Generate comprehensive interview feedback with detailed analysis"""
    
    @staticmethod
    async def generate_feedback(
        conversation_history: List[Dict[str, Any]], 
        resume_data: Dict[str, Any],
        candidate_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Analyze interview and generate detailed feedback"""
        try:
            # Extract all Q&A pairs
            qa_pairs = []
            for i, entry in enumerate(conversation_history):
                if entry['type'] == 'question' and i + 1 < len(conversation_history):
                    if conversation_history[i + 1]['type'] == 'answer':
                        qa_pairs.append({
                            'question': entry['text'],
                            'answer': conversation_history[i + 1]['text'],
                            'section': entry.get('section', 'unknown')
                        })
            
            # Build comprehensive conversation text
            conversation_text = "\n\n".join([
                f"[{qa['section'].upper()}]\nQ: {qa['question']}\nA: {qa['answer']}"
                for qa in qa_pairs[:15]  # Limit to 15 Q&A pairs
            ])
            
            candidate_name = candidate_info.get('name', 'Candidate') if candidate_info else 'Candidate'
            target_role = candidate_info.get('role', 'the position') if candidate_info else 'the position'
            
            prompt = f"""You are an expert HR analyst and technical interviewer. Analyze this interview comprehensively and provide detailed, actionable feedback.

CANDIDATE: {candidate_name}
ROLE: {target_role}
TOTAL QUESTIONS: {len(qa_pairs)}

INTERVIEW TRANSCRIPT:
{conversation_text}

Provide a comprehensive analysis in ONLY valid JSON format:

{{
    "scores": {{
        "overall": <0-100>,
        "communication": <0-100>,
        "technical": <0-100>,
        "problemSolving": <0-100>,
        "behavioral": <0-100>,
        "cultural": <0-100>
    }},
    "strengths": [
        "Specific strength with example from interview",
        "Another strength with evidence",
        "..."
    ],
    "improvements": [
        "Specific area to improve with actionable advice",
        "Another improvement area with how to fix it",
        "..."
    ],
    "sections": [
        {{
            "section": "Introduction",
            "score": <0-100>,
            "feedback": "Detailed feedback for this section"
        }},
        {{
            "section": "Technical Skills",
            "score": <0-100>,
            "feedback": "Detailed feedback"
        }},
        {{
            "section": "Problem Solving",
            "score": <0-100>,
            "feedback": "Detailed feedback"
        }},
        {{
            "section": "Behavioral",
            "score": <0-100>,
            "feedback": "Detailed feedback"
        }}
    ],
    "highlights": [
        "Best moment or answer from the interview",
        "Another impressive response",
        "..."
    ],
    "redFlags": [
        "Concerning pattern or response (if any)",
        "..."
    ],
    "recommendation": "STRONG_HIRE | HIRE | MAYBE | NO_HIRE",
    "summary": "2-3 sentence overall assessment of the candidate",
    "nextSteps": "Recommended next steps for this candidate"
}}

ANALYSIS CRITERIA:
- Communication: Clarity, articulation, listening skills
- Technical: Depth of knowledge, problem-solving approach
- Problem Solving: Analytical thinking, creativity, approach
- Behavioral: Teamwork, leadership, conflict resolution
- Cultural: Values alignment, motivation, growth mindset

Be specific, constructive, and balanced. Reference actual answers from the interview."""

            # Try Groq first (FREE, excellent quality for feedback)
            result_text = None
            if groq_client:
                try:
                    print("🎯 Generating feedback with Groq Llama-3.3-70B (FREE & UNLIMITED)...")
                    result_text = await FeedbackGenerator._generate_with_groq(prompt)
                except Exception as e:
                    print(f"⚠️ Groq failed: {e}")
                    result_text = None
            
            # If Groq fails, raise error (will use fallback feedback)
            if not result_text:
                raise Exception("All feedback generation providers failed")
            
            # Clean up JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0]
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0]
            
            feedback = json.loads(result_text.strip())
            
            # Add metadata
            feedback['interviewDate'] = datetime.utcnow().isoformat()
            feedback['totalQuestions'] = len(qa_pairs)
            feedback['candidateName'] = candidate_name
            feedback['targetRole'] = target_role
            
            return feedback
            
        except Exception as e:
            print(f"Error generating feedback: {e}")
            # Return comprehensive mock feedback
            return FeedbackGenerator._get_fallback_feedback(conversation_history, candidate_info)
    
    @staticmethod
    async def _generate_with_groq(prompt: str) -> str:
        """Generate feedback using Groq as fallback"""
        if not groq_client:
            raise Exception("Groq client not initialized - GROQ_API_KEY missing")
        
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated model (replaces deprecated llama3-70b-8192)
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst providing comprehensive interview feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000,
                stream=False
            )
            print("✅ Feedback generated with Groq")
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"❌ Groq feedback generation failed: {e}")
            raise
    
    @staticmethod
    def _get_fallback_feedback(conversation_history: List[Dict[str, Any]], candidate_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate fallback feedback if AI fails"""
        qa_count = len([c for c in conversation_history if c['type'] == 'answer'])
        candidate_name = candidate_info.get('name', 'Candidate') if candidate_info else 'Candidate'
        target_role = candidate_info.get('role', 'the position') if candidate_info else 'the position'
        
        return {
            'scores': {
                'overall': 75,
                'communication': 78,
                'technical': 72,
                'problemSolving': 76,
                'behavioral': 74,
                'cultural': 75
            },
            'strengths': [
                'Demonstrated clear communication throughout the interview',
                'Showed enthusiasm and interest in the role',
                'Provided relevant examples from past experience'
            ],
            'improvements': [
                'Could provide more specific technical details in answers',
                'Consider using the STAR method for behavioral questions',
                'Elaborate more on problem-solving approaches'
            ],
            'sections': [
                {'section': 'Introduction', 'score': 80, 'feedback': 'Good introduction and background overview'},
                {'section': 'Technical Skills', 'score': 72, 'feedback': 'Adequate technical knowledge, could be more detailed'},
                {'section': 'Problem Solving', 'score': 75, 'feedback': 'Reasonable approach to problem-solving'},
                {'section': 'Behavioral', 'score': 73, 'feedback': 'Provided examples but could be more structured'}
            ],
            'highlights': [
                'Strong opening and professional demeanor',
                'Good examples of past project work'
            ],
            'redFlags': [],
            'recommendation': 'MAYBE',
            'summary': f'{candidate_name} showed adequate preparation and relevant experience for {target_role}. With some additional technical depth and structured responses, they could be a strong candidate.',
            'nextSteps': 'Consider a technical deep-dive interview or take-home assignment',
            'interviewDate': datetime.utcnow().isoformat(),
            'totalQuestions': qa_count,
            'candidateName': candidate_name,
            'targetRole': target_role
        }