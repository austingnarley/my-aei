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

    def test_get_analysis(self, analysis_id):
        """Test retrieving a specific analysis"""
        return self.run_test(
            "Get Analysis by ID",
            "GET",
            f"api/analysis/{analysis_id}",
            200
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

def main():
    # Setup
    tester = MyAITester()
    test_message = "You are always so dramatic. This would not have happened if you just listened to me in the first place. I cannot believe I have to deal with this after all I have done for you."
    
    # Run tests
    print("\n===== Testing My ÆI API =====")
    
    # Test health check
    health_success, health_data = tester.test_health_check()
    if health_success:
        print(f"Health check response: {health_data}")
    
    # Test message analysis
    analysis_success, analysis_data = tester.test_analyze_message(test_message)
    if analysis_success:
        print("\nAnalysis results:")
        print(f"- ID: {analysis_data.get('id')}")
        print(f"- Overall sentiment: {analysis_data.get('overall_sentiment')}")
        print(f"- Flags detected: {len(analysis_data.get('flags', []))}")
        
        # Print detected flags
        for flag in analysis_data.get('flags', []):
            print(f"  - {flag.get('type')} (severity: {flag.get('severity')})")
            print(f"    Evidence: \"{flag.get('evidence')}\"")
        
        # Print suggested reframe
        if analysis_data.get('suggested_reframe'):
            print(f"\nSuggested reframe: \"{analysis_data.get('suggested_reframe')}\"")
        
        # Test getting analysis by ID
        if 'id' in analysis_data:
            analysis_id = analysis_data['id']
            get_success, get_data = tester.test_get_analysis(analysis_id)
            if get_success:
                print(f"\nSuccessfully retrieved analysis with ID: {analysis_id}")
    
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
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
