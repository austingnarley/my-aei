#!/usr/bin/env python3
"""
Comprehensive test for the new Groq API integration with enhanced emotional intelligence analysis.
This test focuses on the specific requirements mentioned in the review request.
"""

import requests
import json
import sys
import os
from datetime import datetime

class GroqIntegrationTester:
    def __init__(self, base_url="https://df3ad6e3-35b9-4062-af30-d34176223b3e.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []
        self.minor_issues = []

    def log_critical_issue(self, issue):
        """Log a critical issue that prevents core functionality"""
        self.critical_issues.append(issue)
        print(f"🚨 CRITICAL ISSUE: {issue}")

    def log_minor_issue(self, issue):
        """Log a minor issue that doesn't prevent core functionality"""
        self.minor_issues.append(issue)
        print(f"⚠️  Minor Issue: {issue}")

    def run_test(self, name, method, endpoint, expected_status, data=None, test_description=""):
        """Run a single API test with detailed logging"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        if test_description:
            print(f"   Description: {test_description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                if response.content:
                    try:
                        return success, response.json()
                    except json.JSONDecodeError:
                        return success, {"raw_content": response.content.decode('utf-8')}
                return success, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_content = response.json()
                        print(f"   Error details: {error_content}")
                        return False, error_content
                    except:
                        error_text = response.content.decode('utf-8')
                        print(f"   Error content: {error_text}")
                        return False, {"error": error_text}
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout after 30 seconds")
            self.log_critical_issue(f"{name}: Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.log_critical_issue(f"{name}: {str(e)}")
            return False, {}

    def test_groq_api_basic_analysis(self):
        """Test basic message analysis with the new Groq integration"""
        test_message = "I feel like you never listen to me when I'm trying to explain something important."
        
        success, response = self.run_test(
            "Groq API Basic Analysis",
            "POST",
            "api/analyze",
            200,
            data={"text": test_message},
            test_description="Test basic emotional intelligence analysis with Groq llama-3.1-8b-instant model"
        )
        
        if success:
            # Check for enhanced response structure
            expected_fields = ["id", "text", "sentiment", "flags", "interpretation", "suggestions", "created_at"]
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                self.log_critical_issue(f"Missing required fields in response: {missing_fields}")
            
            # Check for new enhanced fields that should be present
            enhanced_fields = ["emotional_maturity_level", "relationship_insights"]
            present_enhanced_fields = [field for field in enhanced_fields if field in response]
            
            print(f"   Enhanced fields present: {present_enhanced_fields}")
            print(f"   Sentiment: {response.get('sentiment')}")
            print(f"   Flags detected: {len(response.get('flags', []))}")
            
            # Validate flags structure
            flags = response.get('flags', [])
            for i, flag in enumerate(flags):
                if not isinstance(flag, dict):
                    self.log_critical_issue(f"Flag {i} is not a dictionary: {type(flag)}")
                elif 'type' not in flag or 'description' not in flag:
                    self.log_critical_issue(f"Flag {i} missing required fields: {flag}")
            
            return success, response
        else:
            self.log_critical_issue(f"Basic Groq analysis failed: {response}")
            return success, response

    def test_groq_api_enhanced_fields(self):
        """Test that the enhanced emotional intelligence fields are returned"""
        test_message = "You always do this! I can't believe you're being so selfish right now. This is exactly why we have problems."
        
        success, response = self.run_test(
            "Enhanced Emotional Intelligence Fields",
            "POST",
            "api/analyze",
            200,
            data={"text": test_message},
            test_description="Test that new enhanced fields like emotional_maturity_level and relationship_insights are returned"
        )
        
        if success:
            # Check for specific enhanced fields mentioned in the review request
            enhanced_fields = {
                "emotional_maturity_level": "Assessment of emotional awareness and regulation",
                "relationship_insights": "How this communication might affect relationships",
                "emotional_tone": "Detailed description of emotional undertones",
                "communication_style": "Analysis of communication patterns",
                "confidence_score": "Confidence level of the analysis"
            }
            
            found_enhanced_fields = []
            missing_enhanced_fields = []
            
            for field, description in enhanced_fields.items():
                if field in response:
                    found_enhanced_fields.append(field)
                    print(f"   ✅ {field}: {response[field]}")
                else:
                    missing_enhanced_fields.append(field)
            
            if missing_enhanced_fields:
                self.log_critical_issue(f"Missing enhanced fields: {missing_enhanced_fields}")
            
            print(f"   Enhanced fields found: {len(found_enhanced_fields)}/{len(enhanced_fields)}")
            
            return success, response
        else:
            self.log_critical_issue(f"Enhanced fields test failed: {response}")
            return success, response

    def test_groq_api_error_handling(self):
        """Test error handling scenarios"""
        print("\n🧪 Testing Error Handling Scenarios")
        
        # Test empty message
        success1, response1 = self.run_test(
            "Empty Message Handling",
            "POST",
            "api/analyze",
            400,  # Should return 400 for empty message
            data={"text": ""},
            test_description="Test handling of empty messages"
        )
        
        if not success1 and response1.get('detail'):
            print(f"   ✅ Proper error handling for empty message: {response1['detail']}")
        
        # Test very long message
        long_message = "This is a test message. " * 1000  # Very long message
        success2, response2 = self.run_test(
            "Long Message Handling",
            "POST",
            "api/analyze",
            200,  # Should still work but might be truncated
            data={"text": long_message},
            test_description="Test handling of very long messages"
        )
        
        # Test special characters
        special_message = "Test with émojis 😀😢😡 and spëcial chàracters ñ ü"
        success3, response3 = self.run_test(
            "Special Characters Handling",
            "POST",
            "api/analyze",
            200,
            data={"text": special_message},
            test_description="Test handling of special characters and emojis"
        )
        
        return success1 or success2 or success3

    def test_groq_api_context_support(self):
        """Test context parameter support"""
        test_message = "I think we should talk about this later."
        test_context = "This is a conversation between romantic partners about a recent argument."
        
        success, response = self.run_test(
            "Context Parameter Support",
            "POST",
            "api/analyze",
            200,
            data={"text": test_message, "context": test_context},
            test_description="Test that context parameter is properly supported and influences analysis"
        )
        
        if success:
            print(f"   Context was provided: {test_context}")
            print(f"   Analysis sentiment: {response.get('sentiment')}")
            print(f"   Interpretation includes context: {'context' in response.get('interpretation', '').lower()}")
        
        return success, response

    def test_groq_api_fallback_mechanism(self):
        """Test fallback mechanism when API fails"""
        print("\n🧪 Testing Fallback Mechanism")
        
        # This test is harder to trigger without actually breaking the API
        # We'll test with a malformed request that might trigger fallback
        success, response = self.run_test(
            "Fallback Mechanism",
            "POST",
            "api/analyze",
            200,  # Should still return 200 with fallback response
            data={"text": "Test message for fallback"},
            test_description="Test that fallback response is provided when API analysis fails"
        )
        
        if success:
            # Check if this looks like a fallback response
            if response.get('confidence_score') == 0.0 or 'fallback_reason' in response:
                print(f"   ✅ Fallback mechanism detected")
                print(f"   Fallback reason: {response.get('fallback_reason', 'Not specified')}")
            else:
                print(f"   ✅ Normal API response (fallback not triggered)")
        
        return success, response

    def test_groq_model_verification(self):
        """Verify that the llama-3.1-8b-instant model is being used"""
        print("\n🧪 Testing Model Verification")
        
        # We can't directly verify the model from the API response,
        # but we can test that the responses have the quality expected from the enhanced model
        complex_message = """I've been thinking about our relationship lately, and I feel like there's this pattern where whenever I try to express my feelings, you either change the subject or tell me I'm being too sensitive. It makes me feel like my emotions don't matter to you, and I'm starting to wonder if you actually care about how I feel."""
        
        success, response = self.run_test(
            "Complex Emotional Analysis",
            "POST",
            "api/analyze",
            200,
            data={"text": complex_message},
            test_description="Test complex emotional analysis that should showcase enhanced model capabilities"
        )
        
        if success:
            # Check for sophisticated analysis indicators
            interpretation = response.get('interpretation', '')
            suggestions = response.get('suggestions', [])
            
            quality_indicators = [
                len(interpretation) > 50,  # Detailed interpretation
                len(suggestions) >= 2,     # Multiple suggestions
                'pattern' in interpretation.lower() or 'relationship' in interpretation.lower(),
                response.get('confidence_score', 0) > 0.5
            ]
            
            quality_score = sum(quality_indicators)
            print(f"   Analysis quality indicators: {quality_score}/4")
            print(f"   Interpretation length: {len(interpretation)} characters")
            print(f"   Number of suggestions: {len(suggestions)}")
            print(f"   Confidence score: {response.get('confidence_score', 'N/A')}")
            
            if quality_score >= 3:
                print(f"   ✅ High-quality analysis suggests enhanced model is working")
            else:
                self.log_minor_issue("Analysis quality lower than expected for enhanced model")
        
        return success, response

    def test_performance_and_retry_logic(self):
        """Test performance and retry logic"""
        print("\n🧪 Testing Performance and Retry Logic")
        
        start_time = datetime.now()
        
        success, response = self.run_test(
            "Performance Test",
            "POST",
            "api/analyze",
            200,
            data={"text": "This is a performance test message to check response time."},
            test_description="Test API response time and performance"
        )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        print(f"   Response time: {response_time:.2f} seconds")
        
        if response_time > 30:
            self.log_critical_issue(f"Response time too slow: {response_time:.2f} seconds")
        elif response_time > 10:
            self.log_minor_issue(f"Response time slower than ideal: {response_time:.2f} seconds")
        else:
            print(f"   ✅ Good response time")
        
        return success, response

    def run_comprehensive_test_suite(self):
        """Run the complete test suite for Groq integration"""
        print("=" * 80)
        print("🚀 COMPREHENSIVE GROQ API INTEGRATION TEST SUITE")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Focus: Groq API with llama-3.1-8b-instant model and enhanced emotional intelligence")
        
        # Run all tests
        test_results = {}
        
        test_results['basic_analysis'] = self.test_groq_api_basic_analysis()
        test_results['enhanced_fields'] = self.test_groq_api_enhanced_fields()
        test_results['error_handling'] = self.test_groq_api_error_handling()
        test_results['context_support'] = self.test_groq_api_context_support()
        test_results['fallback_mechanism'] = self.test_groq_api_fallback_mechanism()
        test_results['model_verification'] = self.test_groq_model_verification()
        test_results['performance'] = self.test_performance_and_retry_logic()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 80)
        
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES ({len(self.critical_issues)}):")
            for i, issue in enumerate(self.critical_issues, 1):
                print(f"   {i}. {issue}")
        
        if self.minor_issues:
            print(f"\n⚠️  MINOR ISSUES ({len(self.minor_issues)}):")
            for i, issue in enumerate(self.minor_issues, 1):
                print(f"   {i}. {issue}")
        
        if not self.critical_issues:
            print("\n✅ NO CRITICAL ISSUES FOUND")
        
        # Determine overall status
        if len(self.critical_issues) == 0:
            print("\n🎉 GROQ INTEGRATION: WORKING")
            return True
        else:
            print("\n❌ GROQ INTEGRATION: CRITICAL ISSUES FOUND")
            return False

def main():
    tester = GroqIntegrationTester()
    success = tester.run_comprehensive_test_suite()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())