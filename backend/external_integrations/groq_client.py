import os
import json
import time
import logging
from typing import Optional

import groq
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Placeholder for GROQ_API_KEY, will be fetched from environment variables
# GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def analyze_text_with_groq(text: str, context: Optional[str] = None) -> dict:
    """
    Analyzes text using the Groq API.

    Args:
        text: The text to analyze.
        context: Optional context for the analysis.

    Returns:
        A dictionary containing the Groq API response.

    Raises:
        ValueError: If the GROQ_API_KEY environment variable is not set.
        HTTPException: If there is an error communicating with the Groq API.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        # Log message added as per requirement
        print("ERROR: GROQ_API_KEY environment variable is not set. This is required for Groq API communication.")
        raise ValueError("GROQ_API_KEY environment variable not set.")

    client = groq.Groq(api_key=groq_api_key)

    prompt = f"Analyze the following text: '{text}'"
    if context:
        prompt += f"\n\nContext: '{context}'"
    
    prompt += "\n\nPlease provide a detailed analysis."

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="mixtral-8x7b-32768", # TODO: Make model configurable if needed
        )
        
        # Assuming the response is JSON and needs parsing.
        # The actual structure of chat_completion.choices[0].message.content might vary.
        # Adjust parsing based on the actual Groq API response format.
        response_content = chat_completion.choices[0].message.content
        if isinstance(response_content, str):
            try:
                parsed_response = json.loads(response_content)
            except json.JSONDecodeError:
                # If it's not a JSON string, wrap it in a dict or handle as needed
                parsed_response = {"analysis": response_content}
        else:
            # If it's already a dict-like object (e.g. Pydantic model), convert to dict
            # This part is speculative and depends on Groq library's return type
            if hasattr(response_content, 'model_dump_json') and callable(getattr(response_content, 'model_dump_json')):
                 parsed_response = json.loads(response_content.model_dump_json())
            elif hasattr(response_content, 'to_dict') and callable(getattr(response_content, 'to_dict')):
                parsed_response = response_content.to_dict()
            elif isinstance(response_content, dict):
                parsed_response = response_content
            else:
                # Fallback if direct conversion or parsing isn't straightforward
                # This might indicate an unexpected response format
                print(f"Unexpected response format: {type(response_content)}")
                parsed_response = {"error": "Unexpected response format from Groq API", "content": str(response_content)}


        return parsed_response

    except groq.APIConnectionError as e:
        print(f"Groq API connection error: {e}")
        raise HTTPException(status_code=500, detail="Error connecting to Groq API.")
    except groq.RateLimitError as e:
        print(f"Groq API rate limit exceeded: {e}")
        raise HTTPException(status_code=429, detail="Groq API rate limit exceeded.")
    except groq.APIStatusError as e:
        print(f"Groq API status error: {e.status_code} {e.response}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"Groq API error: {e.message or 'Unknown API error'}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing the request.")

if __name__ == '__main__':
    # Example usage (requires GROQ_API_KEY to be set in the environment)
    # This part is for testing the module directly and will not be part of the final app.
    # To run this, you would do: python backend/external_integrations/groq_client.py
    print("Attempting to analyze text with Groq...")
    try:
        # Make sure to set the GROQ_API_KEY environment variable before running this
        if not os.environ.get("GROQ_API_KEY"):
            print("Please set the GROQ_API_KEY environment variable to test.")
        else:
            sample_text = "This is a test sentence."
            sample_context = "This is a test context."
            analysis_result = analyze_text_with_groq(sample_text, sample_context)
            print("Analysis Result:")
            print(json.dumps(analysis_result, indent=2))
    except ValueError as ve:
        print(f"Configuration error: {ve}")
    except HTTPException as he:
        print(f"HTTP error during analysis: {he.detail} (status code: {he.status_code})")
    except Exception as ex:
        print(f"Generic error during analysis: {ex}")
