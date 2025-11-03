#!/usr/bin/env python3
"""
Test the next-question API endpoint directly
"""

import requests
import json

# Test data matching what frontend sends
test_data = {
    "interviewId": "test-123",
    "section": "greeting",
    "previousAnswer": "",
    "resumeData": {
        "name": "John Doe",
        "skills": ["Python", "React"]
    },
    "conversationHistory": [],
    "candidateInfo": {
        "name": "John Doe",
        "role": "software-engineer",
        "experience": "mid-level",
        "skills": ["Python", "React"],
        "projects": []
    }
}

print("Testing /api/interview/next-question endpoint...")
print(f"Sending data: {json.dumps(test_data, indent=2)}")

try:
    response = requests.post(
        "http://localhost:8001/api/interview/next-question",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ API endpoint works!")
        result = response.json()
        print(f"Question: {result.get('question')}")
    elif response.status_code == 422:
        print("\n❌ Validation Error (422)")
        print("This means the request data format is wrong")
        print(f"Details: {response.json()}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
