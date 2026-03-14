"""
Trade Sovereign Backend API Tests
Tests for health check, copy trading, broker, auto execution, products, and subscriptions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trade-sovereign-1.preview.emergentagent.com').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_healthz_returns_ok(self):
        """Test that /api/healthz returns status ok"""
        response = requests.get(f"{BASE_URL}/api/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestCopyTrading:
    """Copy Trading API tests"""
    
    def test_list_traders_returns_traders(self):
        """Test that /api/copy-trading/traders returns list of traders"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/traders")
        assert response.status_code == 200
        data = response.json()
        assert "traders" in data
        assert "total" in data
        assert isinstance(data["traders"], list)
        # Should have seeded traders
        assert data["total"] >= 4
        
    def test_traders_have_required_fields(self):
        """Test that traders have all required fields"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/traders")
        data = response.json()
        if data["traders"]:
            trader = data["traders"][0]
            required_fields = ["id", "displayName", "totalReturn", "winRate", "copiers"]
            for field in required_fields:
                assert field in trader, f"Missing field: {field}"

    def test_list_signals_returns_200(self):
        """Test that /api/copy-trading/signals returns 200"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/signals")
        assert response.status_code == 200
        data = response.json()
        assert "signals" in data


class TestBrokerStatus:
    """Broker Status API tests - requires authentication"""
    
    def test_broker_status_requires_auth(self):
        """Test that /api/broker/status returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/broker/status")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


class TestAutoExecution:
    """Auto Execution API tests - requires authentication"""
    
    def test_auto_execution_settings_requires_auth(self):
        """Test that /api/auto-execution/settings returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auto-execution/settings")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_pending_signals_requires_auth(self):
        """Test that /api/auto-execution/pending returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auto-execution/pending")
        assert response.status_code == 401


class TestProducts:
    """Products API tests"""
    
    def test_list_products_returns_products(self):
        """Test that /api/products returns list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert isinstance(data["products"], list)
        # Should have seeded products
        assert data["total"] >= 4
        
    def test_products_have_required_fields(self):
        """Test that products have all required fields"""
        response = requests.get(f"{BASE_URL}/api/products")
        data = response.json()
        if data["products"]:
            product = data["products"][0]
            required_fields = ["id", "name", "price"]
            for field in required_fields:
                assert field in product, f"Missing field: {field}"


class TestSubscriptions:
    """Subscription Plans API tests"""
    
    def test_list_subscription_plans(self):
        """Test that /api/subscriptions/plans returns plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        # Should have Free, Pro, and Elite plans
        assert len(data["plans"]) >= 3
        
    def test_subscription_plans_have_required_fields(self):
        """Test that subscription plans have all required fields"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        if data["plans"]:
            plan = data["plans"][0]
            required_fields = ["id", "name", "price", "features"]
            for field in required_fields:
                assert field in plan, f"Missing field: {field}"


class TestMedia:
    """Media API tests"""
    
    def test_list_media_returns_200(self):
        """Test that /api/media returns 200"""
        response = requests.get(f"{BASE_URL}/api/media")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


class TestCategories:
    """Categories API tests"""
    
    def test_list_categories_returns_200(self):
        """Test that /api/categories returns 200"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data


class TestPages:
    """Pages API tests"""
    
    def test_list_pages_returns_200(self):
        """Test that /api/pages returns 200"""
        response = requests.get(f"{BASE_URL}/api/pages")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data


class TestAdminEndpoints:
    """Admin endpoints require authentication"""
    
    def test_admin_stats_requires_auth(self):
        """Test that /api/admin/stats returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401

    def test_admin_products_requires_auth(self):
        """Test that /api/admin/products returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 401
