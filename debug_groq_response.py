#!/usr/bin/env python3
"""
Debug script to check the actual Groq API response structure
"""

import requests
import json

def test_analyze_endpoint():
    url = "https://df3ad6e3-35b9-4062-af30-d34176223b3e.preview.emergentagent.com/api/analyze"
    
    test_data = {
        "text": "I feel like you never listen to me when I'm trying to explain something important.",
        "context": "This is a conversation between romantic partners."
    }
    
    response = requests.post(url, json=test_data)
    
    print("Status Code:", response.status_code)
    print("Response Headers:", dict(response.headers))
    print("\nFull Response JSON:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_analyze_endpoint()