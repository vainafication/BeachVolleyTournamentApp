import requests
import sys
import json
from datetime import datetime

class VolleyProAPITester:
    def __init__(self, base_url="https://beach-bracket.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tournament_id = None
        self.team_ids = []
        self.match_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {response['user']['name']}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_tournament(self):
        """Test tournament creation"""
        tournament_data = {
            "name": f"Test Tournament {datetime.now().strftime('%H%M%S')}",
            "num_teams": 4,
            "num_groups": 2,
            "teams_advancing_per_group": 2,
            "third_place_match": True,
            "location": "Test Beach",
            "start_date": "2024-08-15",
            "match_rules": {
                "sets_to_win": 2,
                "points_per_set": 21,
                "tiebreak_points": 15,
                "min_lead": 2,
                "cap_points": 30
            }
        }
        
        success, response = self.run_test(
            "Create Tournament",
            "POST",
            "tournaments",
            200,
            data=tournament_data
        )
        
        if success and 'id' in response:
            self.tournament_id = response['id']
            print(f"   Created tournament: {response['name']}")
            return True
        return False

    def test_get_tournaments(self):
        """Test get all tournaments"""
        success, response = self.run_test(
            "Get All Tournaments",
            "GET",
            "tournaments",
            200
        )
        
        if success:
            print(f"   Found {len(response)} tournaments")
        return success

    def test_get_tournament(self):
        """Test get specific tournament"""
        if not self.tournament_id:
            print("❌ No tournament ID available")
            return False
            
        success, response = self.run_test(
            "Get Tournament Details",
            "GET",
            f"tournaments/{self.tournament_id}",
            200
        )
        return success

    def test_add_teams(self):
        """Test adding teams to tournament"""
        teams = [
            {"name": "Team Alpha", "players": ["Alice", "Bob"]},
            {"name": "Team Beta", "players": ["Charlie", "Diana"]},
            {"name": "Team Gamma", "players": ["Eve", "Frank"]},
            {"name": "Team Delta", "players": ["Grace", "Henry"]}
        ]
        
        for i, team_data in enumerate(teams):
            success, response = self.run_test(
                f"Add Team {i+1}",
                "POST",
                f"tournaments/{self.tournament_id}/teams",
                200,
                data=team_data
            )
            
            if success and 'id' in response:
                self.team_ids.append(response['id'])
                print(f"   Added team: {response['name']}")
            else:
                return False
        
        return len(self.team_ids) == 4

    def test_assign_groups(self):
        """Test assigning teams to groups"""
        success, response = self.run_test(
            "Assign Groups",
            "POST",
            f"tournaments/{self.tournament_id}/assign-groups",
            200,
            params={"auto": True}
        )
        
        if success:
            print(f"   Groups assigned with matches generated")
        return success

    def test_enter_group_scores(self):
        """Test entering scores for group matches"""
        # First get tournament to see matches
        success, tournament = self.run_test(
            "Get Tournament for Scoring",
            "GET",
            f"tournaments/{self.tournament_id}",
            200
        )
        
        if not success or 'groups' not in tournament:
            return False
        
        # Enter scores for all group matches
        matches_scored = 0
        for group in tournament['groups']:
            for match in group.get('matches', []):
                match_id = match['id']
                score_data = {
                    "sets": [
                        {"team1": 21, "team2": 18},
                        {"team1": 19, "team2": 21},
                        {"team1": 21, "team2": 16}
                    ]
                }
                
                success, response = self.run_test(
                    f"Enter Score for Match {matches_scored + 1}",
                    "PUT",
                    f"tournaments/{self.tournament_id}/matches/{match_id}/score",
                    200,
                    data=score_data
                )
                
                if success:
                    matches_scored += 1
                    self.match_ids.append(match_id)
                else:
                    return False
        
        print(f"   Scored {matches_scored} group matches")
        return matches_scored > 0

    def test_start_knockout(self):
        """Test starting knockout phase"""
        success, response = self.run_test(
            "Start Knockout Phase",
            "POST",
            f"tournaments/{self.tournament_id}/start-knockout",
            200
        )
        
        if success:
            print(f"   Knockout phase started")
        return success

    def test_enter_knockout_scores(self):
        """Test entering scores for knockout matches"""
        # Get tournament to see knockout matches
        success, tournament = self.run_test(
            "Get Tournament for Knockout Scoring",
            "GET",
            f"tournaments/{self.tournament_id}",
            200
        )
        
        if not success or 'knockout_matches' not in tournament:
            return False
        
        # Enter scores for knockout matches
        knockout_matches_scored = 0
        for match in tournament['knockout_matches']:
            if match.get('team1_id') and match.get('team2_id'):
                match_id = match['id']
                score_data = {
                    "sets": [
                        {"team1": 21, "team2": 15},
                        {"team1": 21, "team2": 18}
                    ]
                }
                
                success, response = self.run_test(
                    f"Enter Knockout Score for {match.get('round_name', 'Match')}",
                    "PUT",
                    f"tournaments/{self.tournament_id}/matches/{match_id}/score",
                    200,
                    data=score_data
                )
                
                if success:
                    knockout_matches_scored += 1
                else:
                    return False
        
        print(f"   Scored {knockout_matches_scored} knockout matches")
        return knockout_matches_scored > 0

    def test_export_results(self):
        """Test exporting tournament results"""
        success, response = self.run_test(
            "Export Tournament Results",
            "GET",
            f"tournaments/{self.tournament_id}/export-pdf",
            200
        )
        
        if success:
            print(f"   Results exported successfully")
        return success

    def test_delete_tournament(self):
        """Test deleting tournament"""
        if not self.tournament_id:
            return True  # Nothing to delete
            
        success, response = self.run_test(
            "Delete Tournament",
            "DELETE",
            f"tournaments/{self.tournament_id}",
            200
        )
        return success

def main():
    print("🏐 Starting VolleyPro API Tests...")
    print("=" * 50)
    
    tester = VolleyProAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("User Registration", tester.test_register),
        ("Get Current User", tester.test_get_me),
        ("Create Tournament", tester.test_create_tournament),
        ("Get All Tournaments", tester.test_get_tournaments),
        ("Get Tournament Details", tester.test_get_tournament),
        ("Add Teams", tester.test_add_teams),
        ("Assign Groups", tester.test_assign_groups),
        ("Enter Group Match Scores", tester.test_enter_group_scores),
        ("Start Knockout Phase", tester.test_start_knockout),
        ("Enter Knockout Scores", tester.test_enter_knockout_scores),
        ("Export Results", tester.test_export_results),
        ("Delete Tournament", tester.test_delete_tournament)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print("\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())