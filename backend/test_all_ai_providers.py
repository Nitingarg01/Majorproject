#!/usr/bin/env python3
"""
Comprehensive AI Provider Testing Script
Tests ALL AI providers to ensure they're working properly
"""

import os
import asyncio
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test imports
try:
    import google.generativeai as genai
    from groq import Groq
    import httpx
    print("✅ All required packages imported successfully\n")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Run: pip install google-generativeai groq httpx python-dotenv")
    sys.exit(1)

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ️  {msg}{RESET}")

# Test prompt
TEST_PROMPT = "What is 2+2? Answer in one sentence."

async def test_gemini_flash():
    """Test Gemini 2.0 Flash (fastest for questions)"""
    print("\n" + "="*60)
    print("🧪 Testing Gemini 2.0 Flash (Question Generation)")
    print("="*60)
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'your_gemini_key_here':
        print_error("GEMINI_API_KEY not configured in .env")
        return False
    
    print_info(f"API Key: {api_key[:20]}...")
    
    try:
        genai.configure(api_key=api_key)
        
        # Test Gemini 2.0 Flash
        print_info("Testing Gemini 2.0 Flash...")
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = await model.generate_content_async(
            TEST_PROMPT,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=50
            )
        )
        result = response.text.strip()
        print_success(f"Gemini 2.0 Flash Response: {result}")
        print_success("Gemini 2.0 Flash is working! (FASTEST - 0.2s)")
        return True
        
    except Exception as e:
        print_error(f"Gemini 2.0 Flash failed: {e}")
        
        # Try fallback to gemini-pro
        try:
            print_info("Trying fallback to gemini-pro...")
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(TEST_PROMPT)
            result = response.text.strip()
            print_success(f"Gemini Pro Response: {result}")
            print_warning("Gemini Pro works but Flash is unavailable")
            return True
        except Exception as e2:
            print_error(f"Gemini Pro also failed: {e2}")
            return False

async def test_groq():
    """Test Groq (reliable backup)"""
    print("\n" + "="*60)
    print("🧪 Testing Groq (Backup for Questions & Feedback)")
    print("="*60)
    
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key or api_key == 'your_groq_key_here':
        print_error("GROQ_API_KEY not configured in .env")
        return False
    
    print_info(f"API Key: {api_key[:20]}...")
    
    try:
        client = Groq(api_key=api_key)
        
        # Test Llama3-70B (for feedback)
        print_info("Testing Groq Llama-3.3-70B...")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": TEST_PROMPT}
            ],
            temperature=0.7,
            max_tokens=50
        )
        result = completion.choices[0].message.content.strip()
        print_success(f"Groq Response: {result}")
        print_success("Groq is working! (FREE & UNLIMITED)")
        return True
        
    except Exception as e:
        print_error(f"Groq failed: {e}")
        return False

async def test_huggingface():
    """Test Hugging Face (primary for feedback)"""
    print("\n" + "="*60)
    print("🧪 Testing Hugging Face Llama-3.1-70B (Primary Feedback)")
    print("="*60)
    
    api_key = os.getenv('HUGGINGFACE_API_KEY')
    if not api_key or not api_key.startswith('hf_'):
        print_error("HUGGINGFACE_API_KEY not configured or invalid in .env")
        print_info("Get free token from: https://huggingface.co/settings/tokens")
        return False
    
    print_info(f"API Key: {api_key[:20]}...")
    
    try:
        client = httpx.AsyncClient(
            base_url="https://api-inference.huggingface.co",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
        
        print_info("Testing Hugging Face Llama-3.1-70B-Instruct...")
        response = await client.post(
            "/models/meta-llama/Meta-Llama-3.1-70B-Instruct",
            json={
                "inputs": TEST_PROMPT,
                "parameters": {
                    "max_new_tokens": 50,
                    "temperature": 0.7,
                    "do_sample": True
                }
            }
        )
        
        if response.status_code == 503:
            print_warning("Model is loading (cold start). This is normal for first request.")
            print_info("Waiting 20 seconds for model to load...")
            await asyncio.sleep(20)
            
            # Retry
            response = await client.post(
                "/models/meta-llama/Meta-Llama-3.1-70B-Instruct",
                json={
                    "inputs": TEST_PROMPT,
                    "parameters": {
                        "max_new_tokens": 50,
                        "temperature": 0.7,
                        "do_sample": True
                    }
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get('generated_text', '')
                # Extract only new content
                if TEST_PROMPT in generated_text:
                    answer = generated_text.split(TEST_PROMPT)[-1].strip()
                else:
                    answer = generated_text.strip()
                print_success(f"Hugging Face Response: {answer}")
                print_success("Hugging Face is working! (FREE 1000/day, BEST QUALITY)")
                await client.aclose()
                return True
            else:
                print_error(f"Unexpected response format: {result}")
                await client.aclose()
                return False
        else:
            print_error(f"API error: {response.status_code} - {response.text}")
            await client.aclose()
            return False
            
    except Exception as e:
        print_error(f"Hugging Face failed: {e}")
        return False

async def test_mistral():
    """Test Mistral AI (backup for feedback)"""
    print("\n" + "="*60)
    print("🧪 Testing Mistral AI Large (Backup Feedback)")
    print("="*60)
    
    api_key = os.getenv('MISTRAL_API_KEY')
    if not api_key or api_key == 'your_mistral_key_here':
        print_error("MISTRAL_API_KEY not configured in .env")
        print_info("Get free key from: https://console.mistral.ai/")
        return False
    
    print_info(f"API Key: {api_key[:20]}...")
    
    try:
        client = httpx.AsyncClient(
            base_url="https://api.mistral.ai/v1",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
        
        print_info("Testing Mistral Large...")
        response = await client.post(
            "/chat/completions",
            json={
                "model": "mistral-large-latest",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": TEST_PROMPT}
                ],
                "temperature": 0.7,
                "max_tokens": 50
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content'].strip()
            print_success(f"Mistral Response: {answer}")
            print_success("Mistral AI is working! (FREE TIER)")
            await client.aclose()
            return True
        else:
            print_error(f"API error: {response.status_code} - {response.text}")
            await client.aclose()
            return False
            
    except Exception as e:
        print_error(f"Mistral AI failed: {e}")
        return False

async def test_a4f():
    """Test A4F DeepSeek (fallback)"""
    print("\n" + "="*60)
    print("🧪 Testing A4F DeepSeek (Fallback)")
    print("="*60)
    
    api_key = os.getenv('A4F_API_KEY')
    if not api_key or api_key == 'your_a4f_api_key_here':
        print_error("A4F_API_KEY not configured in .env")
        return False
    
    print_info(f"API Key: {api_key[:20]}...")
    
    try:
        client = httpx.AsyncClient(
            base_url="https://api.a4f.co/v1",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
        
        print_info("Testing A4F DeepSeek v3.1...")
        response = await client.post(
            "/chat/completions",
            json={
                "model": "provider-1/deepseek-v3.1",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": TEST_PROMPT}
                ],
                "temperature": 0.7,
                "max_tokens": 50
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content'].strip()
            print_success(f"A4F Response: {answer}")
            print_success("A4F DeepSeek is working!")
            await client.aclose()
            return True
        else:
            print_error(f"API error: {response.status_code} - {response.text}")
            await client.aclose()
            return False
            
    except Exception as e:
        print_error(f"A4F failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 AI PROVIDER COMPREHENSIVE TEST")
    print("="*60)
    print("Testing all AI providers to ensure they work properly\n")
    
    results = {}
    
    # Test all providers
    results['Gemini 2.0 Flash'] = await test_gemini_flash()
    results['Groq'] = await test_groq()
    results['Hugging Face'] = await test_huggingface()
    results['Mistral AI'] = await test_mistral()
    results['A4F DeepSeek'] = await test_a4f()
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    working = []
    failed = []
    
    for provider, status in results.items():
        if status:
            print_success(f"{provider}: WORKING")
            working.append(provider)
        else:
            print_error(f"{provider}: FAILED")
            failed.append(provider)
    
    print("\n" + "="*60)
    print(f"✅ Working: {len(working)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    print("="*60)
    
    if len(working) >= 2:
        print_success("\n🎉 SUCCESS! You have at least 2 working AI providers!")
        print_info("\nRecommended Priority Order:")
        if results.get('Gemini 2.0 Flash'):
            print("  1. Gemini 2.0 Flash (Questions) - FASTEST ⚡")
        if results.get('Hugging Face'):
            print("  2. Hugging Face (Feedback) - BEST QUALITY 🏆")
        if results.get('Mistral AI'):
            print("  3. Mistral AI (Feedback Backup) - RELIABLE 🔄")
        if results.get('Groq'):
            print("  4. Groq (Universal Backup) - UNLIMITED 🚀")
        if results.get('A4F DeepSeek'):
            print("  5. A4F DeepSeek (Final Fallback) - RELIABLE 🛡️")
    elif len(working) >= 1:
        print_warning("\n⚠️  Only 1 provider working. System will work but no fallback!")
        print_info("Consider fixing the failed providers for better reliability.")
    else:
        print_error("\n❌ CRITICAL: No AI providers working!")
        print_error("Your interview system will NOT work!")
        print_info("\nTroubleshooting:")
        print("  1. Check your .env file has correct API keys")
        print("  2. Verify API keys are valid (not expired)")
        print("  3. Check internet connection")
        print("  4. Try regenerating API keys")
    
    if failed:
        print("\n" + "="*60)
        print("🔧 FAILED PROVIDERS - TROUBLESHOOTING")
        print("="*60)
        for provider in failed:
            if provider == 'Gemini 2.0 Flash':
                print(f"\n{provider}:")
                print("  • Check GEMINI_API_KEY in .env")
                print("  • Get free key: https://makersuite.google.com/app/apikey")
                print("  • Limit: 1500 requests/day (FREE)")
            elif provider == 'Groq':
                print(f"\n{provider}:")
                print("  • Check GROQ_API_KEY in .env")
                print("  • Get free key: https://console.groq.com/keys")
                print("  • Limit: UNLIMITED (FREE)")
            elif provider == 'Hugging Face':
                print(f"\n{provider}:")
                print("  • Check HUGGINGFACE_API_KEY in .env")
                print("  • Must start with 'hf_'")
                print("  • Get free token: https://huggingface.co/settings/tokens")
                print("  • Limit: 1000 requests/day (FREE)")
                print("  • Note: First request may take 20s (model loading)")
            elif provider == 'Mistral AI':
                print(f"\n{provider}:")
                print("  • Check MISTRAL_API_KEY in .env")
                print("  • Get free key: https://console.mistral.ai/")
                print("  • Limit: FREE tier available")
            elif provider == 'A4F DeepSeek':
                print(f"\n{provider}:")
                print("  • Check A4F_API_KEY in .env")
                print("  • Verify API key is valid")
    
    print("\n" + "="*60)
    print("✅ Test Complete!")
    print("="*60)
    
    return len(working) >= 2

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
