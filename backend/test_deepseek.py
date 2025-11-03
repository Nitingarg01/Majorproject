"""
Test DeepSeek AI for Interview Questions
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')

async def test_deepseek():
    print("=" * 70)
    print("🧪 Testing DeepSeek AI for Interview")
    print("=" * 70)
    
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY not found in .env")
        return
    
    print(f"\n✅ API Key found: {OPENROUTER_API_KEY[:20]}...")
    
    # Test question generation
    print("\n📝 Test 1: Generating Interview Question...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AI Interview System"
                },
                json={
                    "model": "deepseek/deepseek-chat",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an experienced technical interviewer. Generate natural, conversational interview questions."
                        },
                        {
                            "role": "user",
                            "content": "Generate an opening question for a software engineer interview. The candidate has 3 years of experience with React and Node.js. Make it warm and conversational."
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 150
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                question = result['choices'][0]['message']['content']
                
                print("✅ DeepSeek Response:")
                print("-" * 70)
                print(question)
                print("-" * 70)
                
                # Show usage stats
                if 'usage' in result:
                    usage = result['usage']
                    print(f"\n📊 Token Usage:")
                    print(f"   Prompt: {usage.get('prompt_tokens', 0)} tokens")
                    print(f"   Response: {usage.get('completion_tokens', 0)} tokens")
                    print(f"   Total: {usage.get('total_tokens', 0)} tokens")
                    
                    # Calculate cost (DeepSeek is ~$0.14 per 1M tokens)
                    cost = (usage.get('total_tokens', 0) / 1_000_000) * 0.14
                    print(f"   Cost: ${cost:.6f} (very cheap!)")
                
                print("\n✅ DeepSeek is working perfectly!")
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your OPENROUTER_API_KEY is valid")
        print("   2. Check internet connection")
        print("   3. Try again in a few seconds")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    asyncio.run(test_deepseek())
