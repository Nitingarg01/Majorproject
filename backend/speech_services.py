"""
Enhanced Speech-to-Text Services with Multiple Providers
Supports: AssemblyAI, Deepgram, OpenAI Whisper, and fallback to browser API
"""

import os
import asyncio
import aiohttp
import json
from typing import Optional, Dict, Any
import base64

# API Keys
ASSEMBLYAI_API_KEY = os.environ.get('ASSEMBLYAI_API_KEY')
DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')


class EnhancedSpeechToText:
    """Multi-provider speech-to-text with automatic fallback"""
    
    @staticmethod
    async def transcribe_audio(audio_data: bytes, provider: str = 'auto') -> Dict[str, Any]:
        """
        Transcribe audio using the best available provider
        
        Args:
            audio_data: Audio file bytes (wav, mp3, webm, etc.)
            provider: 'auto', 'assemblyai', 'deepgram', 'whisper', 'groq'
        
        Returns:
            {
                'text': 'transcribed text',
                'confidence': 0.95,
                'provider': 'assemblyai',
                'words': [...],  # word-level timestamps if available
                'success': True
            }
        """
        
        if provider == 'auto':
            # Try providers in order: FREE → FAST → ACCURATE
            # Groq is FREE, fast, and accurate - perfect primary choice
            providers = ['groq', 'deepgram', 'assemblyai', 'whisper']
        else:
            providers = [provider]
        
        last_error = None
        
        for prov in providers:
            try:
                if prov == 'whisper' and OPENAI_API_KEY:
                    result = await EnhancedSpeechToText._transcribe_whisper(audio_data)
                    if result['success']:
                        return result
                
                elif prov == 'assemblyai' and ASSEMBLYAI_API_KEY:
                    result = await EnhancedSpeechToText._transcribe_assemblyai(audio_data)
                    if result['success']:
                        return result
                
                elif prov == 'deepgram' and DEEPGRAM_API_KEY:
                    result = await EnhancedSpeechToText._transcribe_deepgram(audio_data)
                    if result['success']:
                        return result
                
                elif prov == 'groq' and GROQ_API_KEY:
                    result = await EnhancedSpeechToText._transcribe_groq_whisper(audio_data)
                    if result['success']:
                        return result
                        
            except Exception as e:
                last_error = str(e)
                print(f"Provider {prov} failed: {e}")
                continue
        
        # All providers failed
        return {
            'text': '',
            'confidence': 0.0,
            'provider': 'none',
            'success': False,
            'error': last_error or 'All speech-to-text providers failed'
        }
    
    @staticmethod
    async def _transcribe_whisper(audio_data: bytes) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper API (highest accuracy)"""
        try:
            import aiofiles
            import tempfile
            
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name
            
            async with aiohttp.ClientSession() as session:
                with open(temp_path, 'rb') as audio_file:
                    form = aiohttp.FormData()
                    form.add_field('file', audio_file, filename='audio.webm', content_type='audio/webm')
                    form.add_field('model', 'whisper-1')
                    form.add_field('language', 'en')
                    form.add_field('response_format', 'verbose_json')
                    
                    async with session.post(
                        'https://api.openai.com/v1/audio/transcriptions',
                        headers={'Authorization': f'Bearer {OPENAI_API_KEY}'},
                        data=form
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            
                            # Clean up temp file
                            os.unlink(temp_path)
                            
                            return {
                                'text': result.get('text', ''),
                                'confidence': 0.95,  # Whisper is highly accurate
                                'provider': 'whisper',
                                'words': result.get('words', []),
                                'success': True
                            }
                        else:
                            error_text = await response.text()
                            print(f"Whisper API error: {error_text}")
                            os.unlink(temp_path)
                            return {'success': False, 'error': error_text}
        
        except Exception as e:
            print(f"Whisper transcription error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _transcribe_groq_whisper(audio_data: bytes) -> Dict[str, Any]:
        """Transcribe using Groq's Whisper implementation (fast and free)"""
        try:
            import tempfile
            from groq import Groq
            
            client = Groq(api_key=GROQ_API_KEY)
            
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name
            
            # Transcribe with Groq Whisper
            with open(temp_path, 'rb') as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3",
                    language="en",
                    response_format="verbose_json"
                )
            
            # Clean up
            os.unlink(temp_path)
            
            return {
                'text': transcription.text,
                'confidence': 0.92,
                'provider': 'groq-whisper',
                'success': True
            }
        
        except Exception as e:
            print(f"Groq Whisper error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _transcribe_assemblyai(audio_data: bytes) -> Dict[str, Any]:
        """Transcribe using AssemblyAI (excellent accuracy with word-level timestamps)"""
        try:
            async with aiohttp.ClientSession() as session:
                # Step 1: Upload audio
                upload_response = await session.post(
                    'https://api.assemblyai.com/v2/upload',
                    headers={'authorization': ASSEMBLYAI_API_KEY},
                    data=audio_data
                )
                
                if upload_response.status != 200:
                    return {'success': False, 'error': 'Upload failed'}
                
                upload_data = await upload_response.json()
                audio_url = upload_data['upload_url']
                
                # Step 2: Request transcription
                transcript_request = {
                    'audio_url': audio_url,
                    'language_code': 'en',
                    'punctuate': True,
                    'format_text': True
                }
                
                transcript_response = await session.post(
                    'https://api.assemblyai.com/v2/transcript',
                    headers={'authorization': ASSEMBLYAI_API_KEY},
                    json=transcript_request
                )
                
                if transcript_response.status != 200:
                    return {'success': False, 'error': 'Transcription request failed'}
                
                transcript_data = await transcript_response.json()
                transcript_id = transcript_data['id']
                
                # Step 3: Poll for completion
                max_attempts = 60
                for _ in range(max_attempts):
                    await asyncio.sleep(1)
                    
                    status_response = await session.get(
                        f'https://api.assemblyai.com/v2/transcript/{transcript_id}',
                        headers={'authorization': ASSEMBLYAI_API_KEY}
                    )
                    
                    status_data = await status_response.json()
                    
                    if status_data['status'] == 'completed':
                        return {
                            'text': status_data['text'],
                            'confidence': status_data.get('confidence', 0.9),
                            'provider': 'assemblyai',
                            'words': status_data.get('words', []),
                            'success': True
                        }
                    elif status_data['status'] == 'error':
                        return {'success': False, 'error': status_data.get('error', 'Unknown error')}
                
                return {'success': False, 'error': 'Timeout waiting for transcription'}
        
        except Exception as e:
            print(f"AssemblyAI error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _transcribe_deepgram(audio_data: bytes) -> Dict[str, Any]:
        """Transcribe using Deepgram (fast real-time transcription)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true&language=en',
                    headers={
                        'Authorization': f'Token {DEEPGRAM_API_KEY}',
                        'Content-Type': 'audio/webm'
                    },
                    data=audio_data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        transcript = result['results']['channels'][0]['alternatives'][0]
                        
                        return {
                            'text': transcript['transcript'],
                            'confidence': transcript.get('confidence', 0.9),
                            'provider': 'deepgram',
                            'words': transcript.get('words', []),
                            'success': True
                        }
                    else:
                        error_text = await response.text()
                        return {'success': False, 'error': error_text}
        
        except Exception as e:
            print(f"Deepgram error: {e}")
            return {'success': False, 'error': str(e)}


class AnswerAnalyzer:
    """Analyze candidate answers for loopholes, inconsistencies, and follow-up opportunities"""
    
    @staticmethod
    async def analyze_answer(
        question: str,
        answer: str,
        candidate_background: Dict[str, Any],
        conversation_history: list
    ) -> Dict[str, Any]:
        """
        Deep analysis of candidate's answer to identify:
        - Loopholes or vague statements
        - Inconsistencies with previous answers
        - Missing technical details
        - Exaggerations or red flags
        - Follow-up opportunities
        """
        
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            
            # Build context from conversation
            recent_qa = []
            for i, entry in enumerate(conversation_history[-10:]):
                if entry.get('type') == 'question':
                    q_text = entry['text']
                    # Find corresponding answer
                    if i + 1 < len(conversation_history) and conversation_history[i + 1].get('type') == 'answer':
                        a_text = conversation_history[i + 1]['text']
                        recent_qa.append(f"Q: {q_text}\nA: {a_text}")
            
            context = "\n\n".join(recent_qa[-3:]) if recent_qa else "No previous context"
            
            prompt = f"""You are an expert interviewer analyzing a candidate's answer for quality, consistency, and follow-up opportunities.

CANDIDATE BACKGROUND:
- Skills: {', '.join(candidate_background.get('skills', [])[:10])}
- Experience: {candidate_background.get('experience', 'Not specified')}
- Role: {candidate_background.get('role', 'Not specified')}

RECENT CONVERSATION:
{context}

CURRENT QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

ANALYZE THIS ANSWER FOR:
1. **Loopholes**: Vague statements, missing details, hand-waving over complexity
2. **Inconsistencies**: Contradictions with previous answers or claimed background
3. **Red Flags**: Exaggerations, taking credit for team work, unclear role
4. **Missing Details**: Technical specifics, metrics, outcomes, decision rationale
5. **Follow-up Opportunities**: Interesting points to explore deeper

Return ONLY valid JSON:
{{
    "quality_score": <0-100>,
    "analysis": {{
        "loopholes": [
            {{"issue": "description", "severity": "high/medium/low", "quote": "relevant quote from answer"}}
        ],
        "inconsistencies": [
            {{"issue": "description", "previous_statement": "what they said before", "current_statement": "what they said now"}}
        ],
        "red_flags": [
            {{"flag": "description", "concern": "why this is concerning"}}
        ],
        "missing_details": [
            {{"area": "what's missing", "importance": "why it matters"}}
        ],
        "strengths": [
            "positive aspects of the answer"
        ]
    }},
    "follow_up_questions": [
        {{"question": "specific follow-up question", "reason": "why ask this", "priority": "high/medium/low"}}
    ],
    "should_probe_deeper": true/false,
    "overall_assessment": "brief assessment of answer quality"
}}

Be thorough but fair. Look for genuine issues, not nitpicks."""

            # Try DeepSeek (Priority: A4F > OpenRouter > Groq)
            A4F_API_KEY = os.environ.get('A4F_API_KEY')
            OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
            result_text = None
            
            # Try A4F first
            if A4F_API_KEY and A4F_API_KEY != 'your_a4f_api_key_here':
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=30.0) as client_http:
                        response = await client_http.post(
                            "https://api.a4f.co/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {A4F_API_KEY}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": "provider-1/deepseek-v3.1",  # A4F format
                                "messages": [
                                    {"role": "system", "content": "You are an expert interviewer and answer analyzer. Identify loopholes, inconsistencies, and follow-up opportunities in candidate answers."},
                                    {"role": "user", "content": prompt}
                                ],
                                "temperature": 0.3,
                                "max_tokens": 1500
                            }
                        )
                        if response.status_code == 200:
                            result = response.json()
                            result_text = result['choices'][0]['message']['content'].strip()
                            print("✅ Answer analysis using A4F DeepSeek")
                except Exception as e:
                    print(f"⚠️ A4F failed: {e}, trying OpenRouter...")
            
            # Fallback to OpenRouter
            if not result_text and OPENROUTER_API_KEY:
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=30.0) as client_http:
                        response = await client_http.post(
                            "https://openrouter.ai/api/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                                "HTTP-Referer": "http://localhost:3000",
                                "X-Title": "AI Interview System"
                            },
                            json={
                                "model": "deepseek/deepseek-chat",
                                "messages": [
                                    {"role": "system", "content": "You are an expert interviewer and answer analyzer. Identify loopholes, inconsistencies, and follow-up opportunities in candidate answers."},
                                    {"role": "user", "content": prompt}
                                ],
                                "temperature": 0.3,
                                "max_tokens": 1500
                            }
                        )
                        if response.status_code == 200:
                            result = response.json()
                            result_text = result['choices'][0]['message']['content'].strip()
                            print("✅ Answer analysis using OpenRouter DeepSeek")
                except Exception as e:
                    print(f"⚠️ OpenRouter failed: {e}, trying Groq...")
            
            # Final fallback to Groq
            if not result_text:
                completion = client.chat.completions.create(
                    model="llama3-70b-8192",
                    messages=[
                        {"role": "system", "content": "You are an expert interviewer and answer analyzer. Identify loopholes, inconsistencies, and follow-up opportunities in candidate answers."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1500
                )
                result_text = completion.choices[0].message.content.strip()
                print("✅ Answer analysis using Groq Llama3")
            
            # Clean JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0]
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0]
            
            analysis = json.loads(result_text.strip())
            return analysis
        
        except Exception as e:
            print(f"Answer analysis error: {e}")
            return {
                'quality_score': 70,
                'analysis': {
                    'loopholes': [],
                    'inconsistencies': [],
                    'red_flags': [],
                    'missing_details': [],
                    'strengths': ['Answer provided']
                },
                'follow_up_questions': [],
                'should_probe_deeper': False,
                'overall_assessment': 'Unable to analyze answer'
            }
