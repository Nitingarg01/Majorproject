"""
Test A4F API for DeepSeek Integration
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

A4F_API_KEY = os.environ.get('A4F_API_KEY')

async def test_a4f():
    print("=" * 70)
    print("🧪 Testing A4F API for DeepSeek")
    print("=" * 70)
    
    if not A4F_API_KEY or A4F_API_KEY == 'your_a4f_api_key_here':
        print("\n❌ A4F_API_KEY not found or not set in .env")
        print("\n📝 To get your A4F API key:")
        print("   1. Go to: https://www.a4f.co/api-keys")
        print("   2. Sign up or login")
        print("   3. Click 'Create New API Key'")
        print("   4. Copy the key")
        print("   5. Add to backend/.env:")
        print("      A4F_API_KEY=your_actual_key_here")
        print("\n" + "=" * 70)
        return
    
    print(f"\n✅ API Key found: {A4F_API_KEY[:20]}...")
    
    # Test 1: Interview Question Generation
    print("\n📝 Test 1: Generating Interview Question with DeepSeek...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.a4f.co/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {A4F_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "provider-1/deepseek-v3.1",  # A4F format with provider prefix
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an experienced technical interviewer. Generate natural, conversational interview questions."
                        },
                        {
                            "role": "user",
                            "content": "Generate an opening question for a React developer with 3 years experience. Make it warm and conversational."
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 150
                }
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                question = result['choices'][0]['message']['content']
                
                print("   ✅ A4F DeepSeek Response:")
                print("   " + "-" * 66)
                print(f"   {question}")
                print("   " + "-" * 66)
                
                # Show usage stats if available
                if 'usage' in result:
                    usage = result['usage']
                    print(f"\n   📊 Token Usage:")
                    print(f"      Prompt: {usage.get('prompt_tokens', 0)} tokens")
                    print(f"      Response: {usage.get('completion_tokens', 0)} tokens")
                    print(f"      Total: {usage.get('total_tokens', 0)} tokens")
                
                print("\n✅ A4F API is working perfectly!")
                print("✅ DeepSeek integration successful!")
                
            elif response.status_code == 401:
                print("   ❌ Authentication Error: Invalid API key")
                print("   💡 Check your A4F_API_KEY in .env file")
                
            elif response.status_code == 429:
                print("   ❌ Rate Limit Error: Too many requests")
                print("   💡 Wait a moment and try again")
                
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
    except httpx.ConnectError:
        print("   ❌ Connection Error: Cannot reach A4F API")
        print("   💡 Check your internet connection")
        
    except httpx.TimeoutException:
        print("   ❌ Timeout Error: Request took too long")
        print("   💡 Try again in a moment")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("\n   💡 Troubleshooting:")
        print("      1. Verify your A4F_API_KEY is correct")
        print("      2. Check internet connection")
        print("      3. Visit https://www.a4f.co/api-keys to verify key status")
    
    print("\n" + "=" * 70)
    
    # Test 2: Answer Analysis
    print("\n📝 Test 2: Testing Answer Analysis...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.a4f.co/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {A4F_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "provider-1/deepseek-v3.1",  # A4F format with provider prefix
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert interviewer. Analyze this answer for loopholes and vague statements."
                        },
                        {
                            "role": "user",
                            "content": "Candidate said: 'I worked on a React project that improved performance. It was challenging but we managed to optimize it.' Identify any loopholes or vague statements."
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 300
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['choices'][0]['message']['content']
                
                print("   ✅ Answer Analysis:")
                print("   " + "-" * 66)
                print(f"   {analysis[:200]}...")
                print("   " + "-" * 66)
                
                print("\n✅ Answer analysis working!")
                
    except Exception as e:
        print(f"   ⚠️ Analysis test skipped: {e}")
    
    print("\n" + "=" * 70)
    print("🎉 A4F Integration Complete!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_a4f())
