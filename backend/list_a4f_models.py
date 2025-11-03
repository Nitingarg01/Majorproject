"""
List all available models from A4F API
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

A4F_API_KEY = os.environ.get('A4F_API_KEY')

async def list_models():
    print("=" * 70)
    print("📋 A4F Available Models")
    print("=" * 70)
    
    if not A4F_API_KEY or A4F_API_KEY == 'your_a4f_api_key_here':
        print("❌ A4F_API_KEY not set")
        return
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.a4f.co/v1/models",
                headers={
                    "Authorization": f"Bearer {A4F_API_KEY}"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                models = result.get('data', [])
                
                print(f"\n✅ Found {len(models)} models\n")
                
                # Filter for DeepSeek models
                deepseek_models = [m for m in models if 'deepseek' in m['id'].lower()]
                
                print("🤖 DeepSeek Models:")
                print("-" * 70)
                for model in deepseek_models:
                    model_id = model['id']
                    base_model = model.get('base_model', 'N/A')
                    context = model.get('context_window', 'N/A')
                    print(f"   ID: {model_id}")
                    print(f"   Base: {base_model}")
                    print(f"   Context: {context} tokens")
                    print()
                
                # Show other popular models
                print("\n🌟 Other Popular Models:")
                print("-" * 70)
                popular = ['gpt', 'claude', 'gemini', 'llama']
                for keyword in popular:
                    matching = [m for m in models if keyword in m['id'].lower()]
                    if matching:
                        print(f"\n   {keyword.upper()} Models:")
                        for m in matching[:3]:  # Show first 3
                            print(f"      - {m['id']}")
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    asyncio.run(list_models())
