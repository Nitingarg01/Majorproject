"""
Switch between DeepSeek and Groq for AI Interview
"""

import sys

MODELS = {
    'deepseek': {
        'name': 'DeepSeek Chat',
        'provider': 'OpenRouter',
        'strengths': [
            '✅ Excellent reasoning and logic',
            '✅ Better at catching subtle loopholes',
            '✅ More natural conversation flow',
            '✅ Stronger analytical capabilities'
        ],
        'cost': '~$0.14 per 1M tokens (very cheap)',
        'speed': 'Medium (2-4 seconds per response)'
    },
    'groq': {
        'name': 'Llama 3 (via Groq)',
        'provider': 'Groq',
        'strengths': [
            '✅ Completely FREE',
            '✅ Very fast (0.5-1 second per response)',
            '✅ Good quality responses',
            '✅ Reliable and stable'
        ],
        'cost': 'FREE (unlimited)',
        'speed': 'Very Fast (0.5-1 seconds per response)'
    }
}

def show_comparison():
    print("=" * 70)
    print("🤖 AI Model Comparison for Interview System")
    print("=" * 70)
    
    for model_key, model_info in MODELS.items():
        print(f"\n📊 {model_info['name']} ({model_info['provider']})")
        print("-" * 70)
        print(f"💰 Cost: {model_info['cost']}")
        print(f"⚡ Speed: {model_info['speed']}")
        print("\n🎯 Strengths:")
        for strength in model_info['strengths']:
            print(f"   {strength}")
    
    print("\n" + "=" * 70)
    print("\n📝 Current Configuration:")
    print("   Interview Questions: DeepSeek Chat")
    print("   Answer Analysis: DeepSeek Chat")
    print("   Resume Parsing: Mixtral (Groq)")
    print("   Feedback: Llama 3 (Groq)")
    print("\n" + "=" * 70)

def show_usage():
    print("\n💡 To switch back to Groq:")
    print("   1. Open: backend/ai_services.py")
    print("   2. Find line ~670: 'deepseek/deepseek-chat'")
    print("   3. Comment out DeepSeek block, uncomment Groq block")
    print("\n   Or just let me know and I'll switch it back!")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    show_comparison()
    show_usage()
