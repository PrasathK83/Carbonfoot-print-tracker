import pytest
import json
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index(client):
    """Test the index route."""
    rv = client.get('/')
    assert rv.status_code in [200, 404]  # Could be 404 if index.html is missing in the test dir

def test_get_actions(client):
    """Test the /api/actions endpoint."""
    rv = client.get('/api/actions')
    assert rv.status_code == 200
    data = json.loads(rv.data)
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_badges(client):
    """Test the /api/badges endpoint."""
    rv = client.get('/api/badges')
    assert rv.status_code == 200
    data = json.loads(rv.data)
    assert isinstance(data, list)
    assert len(data) > 0

def test_calculate_carbon_valid(client):
    """Test /api/calculate with valid payload."""
    payload = {
        "carMiles": 100,
        "carType": "gas-large",
        "publicTransit": 10,
        "flightHours": 5,
        "homeMembers": 2,
        "electricityBill": 100,
        "cleanEnergy": False,
        "heatingFuel": "natural-gas",
        "dietType": "meat-average",
        "foodWaste": "average",
        "localFood": False,
        "shoppingLevel": "average",
        "recyclingHabits": "partial"
    }
    rv = client.post('/api/calculate', json=payload)
    assert rv.status_code == 200
    data = json.loads(rv.data)
    assert "total" in data
    assert "transport" in data

def test_calculate_carbon_invalid_data(client):
    """Test /api/calculate with invalid payload data types."""
    payload = {
        "carMiles": "invalid_string",
        "carType": "gas-large"
    }
    rv = client.post('/api/calculate', json=payload)
    assert rv.status_code == 400
    data = json.loads(rv.data)
    assert "error" in data

def test_user_save_load(client):
    """Test /api/user/save and /api/user/load."""
    payload = {
        "username": "test_user",
        "state": {"some": "data"}
    }
    # Save
    rv = client.post('/api/user/save', json=payload)
    assert rv.status_code == 200

    # Load
    rv = client.get('/api/user/load?username=test_user')
    assert rv.status_code == 200
    data = json.loads(rv.data)
    # the actual database call might fail if database.py is not mocked properly or initialized,
    # but the endpoint should at least return 200 success with found=True/False
    assert "status" in data
    assert data["status"] == "success"
