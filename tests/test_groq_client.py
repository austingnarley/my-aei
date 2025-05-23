import os
import unittest
from unittest.mock import patch, MagicMock
import json

# Attempt to import groq errors; if groq is not installed, create mock error types for testing
try:
    import groq
    APIConnectionError = groq.APIConnectionError
    RateLimitError = groq.RateLimitError
    APIStatusError = groq.APIStatusError
except ImportError:
    # Create dummy error classes if groq is not available
    # This allows tests to be defined, though they might not run correctly without groq
    # or proper mocking of these errors if they are raised by the client constructor.
    class APIConnectionError(Exception):
        pass
    class RateLimitError(Exception):
        pass
    class APIStatusError(Exception):
        def __init__(self, message, *, response=None, body=None, status_code=None):
            super().__init__(message)
            self.response = response
            self.body = body
            self.status_code = status_code
            self.message = message


from fastapi import HTTPException
from backend.external_integrations.groq_client import analyze_text_with_groq

class TestGroqClient(unittest.TestCase):

    def setUp(self):
        # Store original API key value if it exists
        self.original_api_key = os.environ.get("GROQ_API_KEY")
        # Ensure a clean slate for API key unless explicitly set by a test
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]

    def tearDown(self):
        # Restore original API key
        if self.original_api_key:
            os.environ["GROQ_API_KEY"] = self.original_api_key
        elif "GROQ_API_KEY" in os.environ:
            # If it was set during a test but wasn't there originally
            del os.environ["GROQ_API_KEY"]

    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_successful_api_call(self, MockGroq):
        # Set API key for this test
        os.environ["GROQ_API_KEY"] = "test_api_key"

        mock_groq_instance = MockGroq.return_value
        mock_chat_completion = MagicMock()
        
        # Simulate the structure: response.choices[0].message.content
        mock_message = MagicMock()
        mock_message.content = json.dumps({
            "flags": [{"type": "test_flag", "description": "A test flag"}],
            "interpretation": "Test interpretation",
            "suggestions": ["Test suggestion"],
            "sentiment": "neutral"
        })
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_chat_completion.choices = [mock_choice]
        
        mock_groq_instance.chat.completions.create.return_value = mock_chat_completion

        test_text = "This is a test."
        test_context = "Test context."
        result = analyze_text_with_groq(test_text, test_context)

        expected_result = {
            "flags": [{"type": "test_flag", "description": "A test flag"}],
            "interpretation": "Test interpretation",
            "suggestions": ["Test suggestion"],
            "sentiment": "neutral"
        }
        self.assertEqual(result, expected_result)
        mock_groq_instance.chat.completions.create.assert_called_once()
        # You can also assert the arguments passed to create if needed
        args, kwargs = mock_groq_instance.chat.completions.create.call_args
        self.assertEqual(kwargs['model'], "mixtral-8x7b-32768")
        self.assertIn(test_text, kwargs['messages'][0]['content'])
        self.assertIn(test_context, kwargs['messages'][0]['content'])


    def test_missing_api_key(self):
        # Ensure API key is not set (setUp should handle this, but explicit check is good)
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
            
        with self.assertRaises(ValueError) as context:
            analyze_text_with_groq("test text")
        self.assertEqual(str(context.exception), "GROQ_API_KEY environment variable not set.")

    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_api_connection_error(self, MockGroq):
        """Test handling of API connection errors."""
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        
        # Create a mock request object for APIConnectionError
        mock_request = MagicMock()
        mock_request.url = "https://api.groq.com/test"
        
        # Set up the mock to raise an APIConnectionError with the correct signature
        mock_error = APIConnectionError(
            message="Connection failed", 
            request=mock_request
        )
        mock_groq_instance.chat.completions.create.side_effect = mock_error
        
        with self.assertRaises(HTTPException) as context:
            analyze_text_with_groq("test text")
        
        self.assertEqual(context.exception.status_code, 503)
        self.assertIn("Unable to connect", context.exception.detail)

    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_rate_limit_error(self, MockGroq):
        """Test handling of rate limit errors."""
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        
        # Create a mock response object for RateLimitError
        mock_response = MagicMock()
        mock_response.status_code = 429
        
        # Set up the mock to raise a RateLimitError with the correct signature
        mock_groq_instance.chat.completions.create.side_effect = RateLimitError(
            "Rate limit exceeded", 
            response=mock_response, 
            body={"error": {"message": "Rate limit exceeded"}}
        )
        
        with self.assertRaises(HTTPException) as context:
            analyze_text_with_groq("test text")
        
        self.assertEqual(context.exception.status_code, 429)
        self.assertIn("rate limit", context.exception.detail.lower())

    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_api_status_error(self, MockGroq):
        """Test handling of API status errors."""
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        
        # Create a mock response object for APIStatusError
        mock_response = MagicMock()
        mock_response.status_code = 500
        
        # Set up the mock to raise an APIStatusError with the correct signature
        mock_error = APIStatusError(
            "Server error", 
            response=mock_response, 
            body={"error": {"message": "Internal server error"}}
        )
        mock_error.status_code = 500  # Set the status_code attribute
        mock_groq_instance.chat.completions.create.side_effect = mock_error
        
        with self.assertRaises(HTTPException) as context:
            analyze_text_with_groq("test text")
        
        self.assertEqual(context.exception.status_code, 503)  # Updated to match retry logic
        self.assertIn("temporarily unavailable", context.exception.detail)
        
    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_api_status_error_no_message(self, MockGroq):
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        mock_groq_instance.chat.completions.create.side_effect = APIStatusError(
            message=None, # Simulate no message
            status_code=504,
            response=MagicMock()
        )
        with self.assertRaises(HTTPException) as context:
            analyze_text_with_groq("test text")
        self.assertEqual(context.exception.status_code, 504)
        self.assertEqual(context.exception.detail, "Groq API error: Unknown API error")


    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_invalid_json_response_string(self, MockGroq):
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        mock_chat_completion = MagicMock()
        
        mock_message = MagicMock()
        mock_message.content = "This is not JSON, just a plain string." 
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_chat_completion.choices = [mock_choice]
        
        mock_groq_instance.chat.completions.create.return_value = mock_chat_completion

        result = analyze_text_with_groq("test text")
        # As per current groq_client.py, non-JSON string is wrapped
        self.assertEqual(result, {"analysis": "This is not JSON, just a plain string."})

    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_malformed_json_response_string(self, MockGroq):
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        mock_chat_completion = MagicMock()
        
        mock_message = MagicMock()
        # Malformed JSON string (missing closing brace)
        mock_message.content = '{"flags": [], "interpretation": "Test interpretation", "suggestions": ["Test suggestion"], "sentiment": "neutral"'
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_chat_completion.choices = [mock_choice]
        
        mock_groq_instance.chat.completions.create.return_value = mock_chat_completion

        # Current implementation with json.loads(str) then json.JSONDecodeError:
        # will wrap it in {"analysis": malformed_json_string}
        result = analyze_text_with_groq("test text")
        self.assertEqual(result, {"analysis": mock_message.content})


    @patch('backend.external_integrations.groq_client.groq.Groq')
    def test_unexpected_error_during_api_call(self, MockGroq):
        os.environ["GROQ_API_KEY"] = "test_api_key"
        mock_groq_instance = MockGroq.return_value
        mock_groq_instance.chat.completions.create.side_effect = Exception("Something totally unexpected happened")

        with self.assertRaises(HTTPException) as context:
            analyze_text_with_groq("test text")
        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail, "An unexpected error occurred while processing the request.")

if __name__ == '__main__':
    unittest.main()
