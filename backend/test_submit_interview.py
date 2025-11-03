#!/usr/bin/env python3
"""
Test the interview submit endpoint
"""

import requests
import json

# Test data
test_data = {
    "interviewId": "6904bba2fd6c63728050b19c",  # Your interview ID from logs
    "conversationHistory": [
        {"type": "question", "text": "Tell me about yourself", "section": "greeting"},
        {"type": "answer", "text": "I am a software engineer with 3 years of experience"}
    ],
    "answers": ["I am a software engineer with 3 years of experience"],
    "duration": 300
}

print("Testing /api/interview/submit endpoint...")
print(f"Interview ID: {test_data['interviewId']}")

try:
    response = requests.post(
        "http://localhost:8001/api/interview/submit",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Submit works!")
    elif response.status_code == 401:
        print("\n❌ 401 Unauthorized - Need authentication token")
    elif response.status_code == 404:
        print("\n❌ 404 Not Found - Interview not found in database")
    elif response.status_code == 422:
        print("\n❌ 422 Validation Error - Data format wrong")
    else:
        print(f"\n❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
