import requests
import sys
import json
from datetime import datetime

class MyAITester:
    def __init__(self, base_url="https://1d6f390f-7a6f-4c4b-978c-434bddb957a6.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        return success, response.json()
                    except json.JSONDecodeError:
                        return success, {"raw_content": response.content.decode('utf-8')}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_content = response.json()
                        print(f"Error details: {error_content}")
                    except:
                        print(f"Error content: {response.content.decode('utf-8')}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_analyze_message(self, message_text):
        """Test message analysis"""
        return self.run_test(
            "Message Analysis",
            "POST",
            "api/analyze",
            200,
            data={"text": message_text}
        )
        
    def test_analyze_conversation(self, their_message, your_response):
        """Test two-sided conversation analysis"""
        conversation_text = f"Their message: {their_message}\n\nYour response: {your_response}"
        return self.run_test(
            "Two-sided Conversation Analysis",
            "POST",
            "api/analyze",
            200,
            data={"text": conversation_text}
        )

    def test_get_analysis_history(self):
        """Test retrieving analysis history"""
        return self.run_test(
            "Get Analysis History",
            "GET",
            "api/history",
            200
        )
        
    def test_get_dashboard_data(self):
        """Test retrieving dashboard data"""
        return self.run_test(
            "Get Dashboard Data",
            "GET",
            "api/dashboard",
            200
        )
    
    def test_get_relationships(self):
        """Test retrieving relationships"""
        return self.run_test(
            "Get Relationships",
            "GET",
            "api/relationships",
            200
        )
    
    def test_create_relationship(self):
        """Test creating a relationship"""
        test_relationship = {
            "name": "Test Relationship",
            "type": "Friend",
            "notes": "Created for testing purposes"
        }
        return self.run_test(
            "Create Relationship",
            "POST",
            "api/relationships",
            200,
            data=test_relationship
        )
    
    def test_get_relationship_by_id(self, relationship_id):
        """Test retrieving a specific relationship"""
        return self.run_test(
            "Get Relationship by ID",
            "GET",
            f"api/relationships/{relationship_id}",
            200
        )
    
    def test_update_relationship(self, relationship_id, update_data):
        """Test updating a relationship"""
        return self.run_test(
            "Update Relationship",
            "PUT",
            f"api/relationships/{relationship_id}",
            200,
            data=update_data
        )
    
    def test_delete_relationship(self, relationship_id):
        """Test deleting a relationship"""
        return self.run_test(
            "Delete Relationship",
            "DELETE",
            f"api/relationships/{relationship_id}",
            200
        )
    
    def test_analyze_relationship_message(self, relationship_id, message_text):
        """Test analyzing a message in the context of a relationship"""
        return self.run_test(
            "Analyze Relationship Message",
            "POST",
            f"api/relationships/{relationship_id}/analyze",
            200,
            data={"text": message_text}
        )
    
    def test_get_relationship_history(self, relationship_id):
        """Test getting the history and analytics for a relationship"""
        return self.run_test(
            "Get Relationship History",
            "GET",
            f"api/relationships/{relationship_id}/history",
            200
        )
    
    def test_get_growth_plan(self):
        """Test retrieving growth plan"""
        return self.run_test(
            "Get Growth Plan",
            "GET",
            "api/growth-plan",
            200
        )

def main():
    # Setup
    tester = MyAITester()
    test_message = "You are always so dramatic. This would not have happened if you just listened to me in the first place. I cannot believe I have to deal with this after all I have done for you."
    
    # Two-sided conversation test data
    their_message = "I didn't say that. You're imagining things again. I never said I would help with the project."
    your_response = "I already told you multiple times. It's not my fault you don't remember. Stop blaming me for your poor memory."
    
    # Run tests
    print("\n===== Testing Emotional Intelligence API =====")
    print(f"Testing against: {tester.base_url}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test health check
    health_success, health_data = tester.test_health_check()
    if health_success:
        print(f"Health check response: {health_data}")
    
    # Test message analysis
    analysis_success, analysis_data = tester.test_analyze_message(test_message)
    if analysis_success:
        print("\nAnalysis results:")
        print(f"- ID: {analysis_data.get('id')}")
        print(f"- Sentiment: {analysis_data.get('sentiment')}")
        print(f"- Flags detected: {len(analysis_data.get('flags', []))}")
        
        # Print detected flags
        for flag in analysis_data.get('flags', []):
            print(f"  - {flag.get('type')}: {flag.get('description')}")
        
        # Print suggestions
        if analysis_data.get('suggestions'):
            print("\nSuggestions:")
            for suggestion in analysis_data.get('suggestions', []):
                print(f"  - {suggestion}")
    
    # Test two-sided conversation analysis
    print("\n===== Testing Two-sided Conversation Analysis =====")
    conversation_success, conversation_data = tester.test_analyze_conversation(their_message, your_response)
    if conversation_success:
        print("\nTwo-sided Conversation Analysis results:")
        print(f"- ID: {conversation_data.get('id')}")
        print(f"- Sentiment: {conversation_data.get('sentiment')}")
        print(f"- Flags detected: {len(conversation_data.get('flags', []))}")
        
        # Print detected flags
        for flag in conversation_data.get('flags', []):
            print(f"  - {flag.get('type')}: {flag.get('description')}")
        
        # Print interpretation
        print(f"\nInterpretation: {conversation_data.get('interpretation')}")
        
        # Print suggestions
        if conversation_data.get('suggestions'):
            print("\nSuggestions:")
            for suggestion in conversation_data.get('suggestions', []):
                print(f"  - {suggestion}")
    
    # Test analysis history
    history_success, history_data = tester.test_get_analysis_history()
    if history_success:
        print(f"\nRetrieved {len(history_data)} analysis records from history")
    
    # Test dashboard data
    dashboard_success, dashboard_data = tester.test_get_dashboard_data()
    if dashboard_success:
        print("\nDashboard data:")
        print(f"- Health score: {dashboard_data.get('health_score')}")
        print(f"- Total analyses: {dashboard_data.get('total_analyses')}")
        print(f"- Total flags detected: {dashboard_data.get('total_flags_detected')}")
        print(f"- Flag counts: {dashboard_data.get('flag_counts')}")
    
    # Test relationships endpoints
    relationships_success, relationships_data = tester.test_get_relationships()
    if relationships_success:
        print(f"\nRetrieved {len(relationships_data)} relationships")
    
    # Test creating a relationship
    create_rel_success, created_relationship = tester.test_create_relationship()
    if create_rel_success and 'id' in created_relationship:
        relationship_id = created_relationship['id']
        print(f"\nCreated relationship with ID: {relationship_id}")
        
        # Test getting relationship by ID
        get_rel_success, relationship_data = tester.test_get_relationship_by_id(relationship_id)
        if get_rel_success:
            print(f"Retrieved relationship: {relationship_data.get('name')}")
    
    # Test growth plan
    growth_plan_success, growth_plan_data = tester.test_get_growth_plan()
    if growth_plan_success:
        print("\nGrowth plan data:")
        print(f"- ID: {growth_plan_data.get('id')}")
        print(f"- Theme: {growth_plan_data.get('current_week', {}).get('theme')}")
        print(f"- Number of activities: {len(growth_plan_data.get('current_week', {}).get('days', []))}")
        print(f"- Number of goals: {len(growth_plan_data.get('goals', []))}")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
