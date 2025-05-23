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

def analyze_text_with_groq(text: str, context: Optional[str] = None, model: str = "llama-3.1-8b-instant", max_retries: int = 3) -> dict:
    """
    Analyze text using Groq API for emotional intelligence insights
    
    Args:
        text: The text to analyze
        context: Optional context to provide additional information for analysis
        model: Groq model to use (default: llama-3.1-8b-instant)
        max_retries: Maximum number of retry attempts for transient failures
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY not found in environment variables")
        raise HTTPException(status_code=500, detail="GROQ API key not configured")
    
    if not text or not text.strip():
        logger.warning("Empty or whitespace-only text provided")
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    client = groq.Groq(api_key=api_key)
    
    # Enhanced prompt for emotional intelligence analysis
    context_info = f"\n\nAdditional context: {context}" if context else ""
    prompt = f"""You are an expert emotional intelligence analyst. Analyze the following message comprehensively and provide insights that help understand the emotional state, communication patterns, and relationship dynamics.{context_info}

Provide a JSON response with this exact structure:
{{
    "sentiment": "positive/negative/neutral",
    "emotional_tone": "Detailed description of the emotional undertones and feelings expressed",
    "communication_style": "Analysis of how the person communicates (direct, passive, assertive, etc.)",
    "potential_triggers": ["specific phrases or topics that might cause emotional reactions"],
    "suggestions": ["actionable advice for better emotional communication"],
    "confidence_score": 0.85,
    "emotional_flags": ["any concerning patterns like anger, desperation, manipulation, etc."],
    "relationship_insights": "How this communication might affect relationships",
    "emotional_maturity_level": "Assessment of emotional awareness and regulation shown"
}}

Message to analyze: "{text}"

Important: Respond ONLY with valid JSON. No additional text, explanations, or formatting."""

    for attempt in range(max_retries):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert emotional intelligence analyst. Always respond with valid JSON only."
                    },
                    {
                        "role": "user", 
                        "content": prompt,
                    }
                ],
                model=model,
                temperature=0.2,  # Slightly higher for more nuanced responses
                max_tokens=1500,  # Increased for more detailed analysis
                top_p=0.9
            )
            
            response_content = chat_completion.choices[0].message.content
            logger.info(f"Groq API raw response (attempt {attempt + 1}): {response_content[:200]}...")
            
            # Try to parse the JSON response
            try:
                # Clean the response content
                cleaned_response = response_content.strip()
                
                # Remove any markdown code blocks if present
                if cleaned_response.startswith("```json"):
                    cleaned_response = cleaned_response.replace("```json", "").replace("```", "").strip()
                elif cleaned_response.startswith("```"):
                    cleaned_response = cleaned_response.replace("```", "").strip()
                
                parsed_response = json.loads(cleaned_response)
                
                # Validate required fields
                required_fields = ["sentiment", "emotional_tone", "communication_style", "confidence_score"]
                if all(field in parsed_response for field in required_fields):
                    logger.info("Successfully parsed Groq API response")
                    return parsed_response
                else:
                    raise ValueError("Missing required fields in response")
                    
            except (json.JSONDecodeError, ValueError) as parse_error:
                logger.warning(f"Failed to parse JSON response (attempt {attempt + 1}): {parse_error}")
                
                # Extract JSON from response if it's wrapped in text
                import re
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    try:
                        parsed_response = json.loads(json_match.group())
                        required_fields = ["sentiment", "emotional_tone", "communication_style"]
                        if all(field in parsed_response for field in required_fields):
                            return parsed_response
                    except json.JSONDecodeError:
                        pass
                
                # If this is the last attempt, return fallback
                if attempt == max_retries - 1:
                    logger.error(f"Failed to parse JSON after {max_retries} attempts")
                    return create_fallback_response(text, response_content)
                else:
                    continue  # Try again
    
        except groq.RateLimitError as e:
            logger.error(f"Groq API rate limit error: {e}")
            raise HTTPException(status_code=429, detail="API rate limit exceeded. Please try again later.")
        
        except groq.APIStatusError as e:
            logger.error(f"Groq API status error: {e}")
            if e.status_code == 400:
                raise HTTPException(status_code=400, detail=f"Invalid request to Groq API: {str(e)}")
            elif e.status_code in [500, 502, 503, 504]:
                # Server errors - retry if not last attempt
                if attempt < max_retries - 1:
                    logger.warning(f"Server error (attempt {attempt + 1}), retrying: {e}")
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                else:
                    raise HTTPException(status_code=503, detail="Groq API is temporarily unavailable")
            else:
                raise HTTPException(status_code=e.status_code or 500, detail=f"Groq API error: {str(e)}")
        
        except groq.APIConnectionError as e:
            logger.error(f"Groq API connection error: {e}")
            if attempt < max_retries - 1:
                logger.warning(f"Connection error (attempt {attempt + 1}), retrying: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            else:
                raise HTTPException(status_code=503, detail="Unable to connect to Groq API. Please try again later.")
        
        except Exception as e:
            logger.error(f"Unexpected error calling Groq API: {e}")
            if attempt < max_retries - 1:
                logger.warning(f"Unexpected error (attempt {attempt + 1}), retrying: {e}")
                time.sleep(1)
                continue
            else:
                raise HTTPException(status_code=500, detail="Internal server error during text analysis")
    
    # This should never be reached, but just in case
    return create_fallback_response(text, "Max retries exceeded")


def create_fallback_response(text: str, error_info: str = "") -> dict:
    """Create a fallback response when API analysis fails"""
    return {
        "sentiment": "neutral",
        "emotional_tone": "Unable to analyze emotional tone due to technical issues",
        "communication_style": "Analysis temporarily unavailable",
        "potential_triggers": [],
        "suggestions": ["Please try again later when the analysis service is available"],
        "confidence_score": 0.0,
        "emotional_flags": ["analysis_failed"],
        "relationship_insights": "Analysis unavailable due to technical issues",
        "emotional_maturity_level": "Cannot be determined at this time",
        "fallback_reason": error_info[:200] if error_info else "Technical difficulties"
    }

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
            analysis_result = analyze_text_with_groq(sample_text)
            print("Analysis Result:")
            print(json.dumps(analysis_result, indent=2))
    except ValueError as ve:
        print(f"Configuration error: {ve}")
    except HTTPException as he:
        print(f"HTTP error during analysis: {he.detail} (status code: {he.status_code})")
    except Exception as ex:
        print(f"Generic error during analysis: {ex}")
