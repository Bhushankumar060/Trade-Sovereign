#!/usr/bin/env python3
"""
Trade Sovereign Backend API Testing
Tests all endpoints for the trading super app
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class TradeSovereignAPITester:
    def __init__(self, base_url="https://demobackend.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            self.failed_tests.append(f"{test_name}: {details}")
    
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None, headers: Dict = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            result_data = {}
            
            try:
                if response.content:
                    result_data = response.json()
            except:
                result_data = {"content": response.text[:200]}

            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}, Response: {result_data}"
            
            self.log_result(name, success, details if not success else "")
            return success, result_data

        except Exception as e:
            error_msg = str(e)
            self.log_result(name, False, f"Error: {error_msg}")
            return False, {"error": error_msg}

    def test_health_check(self):
        """Test health check endpoint"""
        print("\n🔍 Testing Health Check...")
        success, response = self.run_test(
            "Health Check",
            "GET", 
            "api/healthz",
            200
        )
        return success and response.get("status") == "ok"

    def test_categories_list(self):
        """Test categories list endpoint"""
        print("\n🔍 Testing Categories...")
        success, response = self.run_test(
            "Categories List",
            "GET",
            "api/categories", 
            200
        )
        if success:
            categories = response.get("categories", [])
            total = response.get("total", 0)
            print(f"   Found {total} categories")
            return True
        return False

    def test_products_list(self):
        """Test products list endpoint"""
        print("\n🔍 Testing Products...")
        success, response = self.run_test(
            "Products List",
            "GET",
            "api/products",
            200
        )
        if success:
            products = response.get("products", [])
            total = response.get("total", 0)
            print(f"   Found {total} products")
            return True
        return False

    def test_media_list(self):
        """Test media list endpoint"""
        print("\n🔍 Testing Media...")
        success, response = self.run_test(
            "Media List",
            "GET",
            "api/media",
            200
        )
        if success:
            items = response.get("items", [])
            total = response.get("total", 0)
            print(f"   Found {total} media items")
            return True
        return False

    def test_subscription_plans(self):
        """Test subscription plans endpoint"""
        print("\n🔍 Testing Subscription Plans...")
        success, response = self.run_test(
            "Subscription Plans",
            "GET",
            "api/subscriptions/plans",
            200
        )
        if success:
            plans = response.get("plans", [])
            print(f"   Found {len(plans)} subscription plans")
            return True
        return False

    def test_unauthenticated_endpoints(self):
        """Test endpoints that should work without authentication"""
        print("\n🔍 Testing Unauthenticated Endpoints...")
        
        # Test AI search (public endpoint)
        success, _ = self.run_test(
            "AI Search",
            "POST",
            "api/ai/search",
            200,
            data={"query": "trading"}
        )
        
        # Test pages list
        success2, _ = self.run_test(
            "Pages List",
            "GET",
            "api/pages",
            200
        )
        
        return success and success2

    def test_auth_required_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔍 Testing Auth Required Endpoints...")
        
        # Test user profile (should fail without auth)
        success, response = self.run_test(
            "Profile (No Auth) - Should Fail",
            "GET",
            "api/auth/me",
            401
        )
        
        # Test orders (should fail without auth)  
        success2, response2 = self.run_test(
            "Orders (No Auth) - Should Fail",
            "GET", 
            "api/orders",
            401
        )
        
        # Test AI chat (should fail without auth)
        success3, response3 = self.run_test(
            "AI Chat (No Auth) - Should Fail",
            "POST",
            "api/ai/chat",
            401,
            data={"message": "test"}
        )
        
        return success and success2 and success3

    def test_admin_endpoints_without_auth(self):
        """Test admin endpoints without authentication (should fail)"""
        print("\n🔍 Testing Admin Endpoints (No Auth)...")
        
        endpoints = [
            ("Admin Stats", "GET", "api/admin/stats"),
            ("Admin Products", "GET", "api/admin/products"), 
            ("Admin Users", "GET", "api/admin/users"),
            ("Admin Analytics", "GET", "api/admin/analytics")
        ]
        
        all_passed = True
        for name, method, endpoint in endpoints:
            success, _ = self.run_test(
                f"{name} (No Auth) - Should Fail",
                method,
                endpoint,
                401
            )
            all_passed = all_passed and success
            
        return all_passed

    def test_cors_headers(self):
        """Test CORS headers"""
        print("\n🔍 Testing CORS Headers...")
        try:
            response = requests.options(f"{self.base_url}/api/healthz", timeout=5)
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods', 
                'Access-Control-Allow-Headers'
            ]
            
            has_cors = any(header in response.headers for header in cors_headers)
            self.log_result("CORS Headers", has_cors, "Missing CORS headers" if not has_cors else "")
            return has_cors
        except Exception as e:
            self.log_result("CORS Headers", False, str(e))
            return False

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test 404 for non-existent endpoints
        success, _ = self.run_test(
            "404 Error Handling",
            "GET",
            "api/nonexistent",
            404
        )
        
        # Test invalid product ID
        success2, _ = self.run_test(
            "Invalid Product ID",
            "GET", 
            "api/products/invalid-id-format",
            400  # Or 404 depending on implementation
        )
        
        # We'll accept either 400 or 404 for invalid IDs
        if not success2:
            success2, _ = self.run_test(
                "Invalid Product ID (404)",
                "GET",
                "api/products/invalid-id-format", 
                404
            )
        
        return success and success2

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🚀 Trade Sovereign Backend API Testing")
        print("=" * 60)
        
        test_groups = [
            ("Health Check", self.test_health_check),
            ("Categories", self.test_categories_list),
            ("Products", self.test_products_list), 
            ("Media", self.test_media_list),
            ("Subscription Plans", self.test_subscription_plans),
            ("Unauthenticated Endpoints", self.test_unauthenticated_endpoints),
            ("Auth Required Endpoints", self.test_auth_required_endpoints),
            ("Admin Endpoints (No Auth)", self.test_admin_endpoints_without_auth),
            ("CORS Headers", self.test_cors_headers),
            ("Error Handling", self.test_error_handling)
        ]
        
        group_results = []
        for group_name, test_func in test_groups:
            try:
                result = test_func()
                group_results.append((group_name, result))
            except Exception as e:
                print(f"❌ {group_name} - Critical Error: {e}")
                group_results.append((group_name, False))
        
        # Print Summary
        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        print("\n📋 Group Results:")
        for group_name, result in group_results:
            status = "✅" if result else "❌"
            print(f"   {status} {group_name}")
        
        # Return overall success
        return self.tests_passed >= self.tests_run * 0.8  # 80% pass rate

def main():
    tester = TradeSovereignAPITester()
    success = tester.run_all_tests()
    
    # Write detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": tester.tests_run - tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "failures": tester.failed_tests
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())