from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from typing import Dict, Any, Tuple
import logging
import database
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Restrict CORS to specific origins or localhost
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000"]}})

# Initialize the database
try:
    database.init_db()
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

@app.route('/')
def index():
    """Serves the main HTML page."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serves static frontend files like CSS and JS."""
    allowed_files = ['styles.css', 'app.js', 'particles.js']
    if filename in allowed_files:
        return send_from_directory('.', filename)
    logger.warning(f"Attempted to access forbidden file: {filename}")
    return jsonify({"error": "Not Found"}), 404

# Static Datasets (Managed on Backend)
ACTIONS_DATA = [
  {
    "id": "switch-led",
    "title": "Switch to LED Bulbs",
    "description": "Replace standard incandescent lightbulbs with energy-star certified LEDs.",
    "category": "easy",
    "points": 15,
    "co2Saved": 150
  },
  {
    "id": "unplug-standby",
    "title": "Vanquish Standby Power",
    "description": "Unplug chargers, televisions, and game consoles when not in use, or use smart power strips.",
    "category": "easy",
    "points": 10,
    "co2Saved": 50
  },
  {
    "id": "wash-cold",
    "title": "Wash Laundry on Cold",
    "description": "Use cold water settings for laundry loads. 75% to 90% of washing machine energy goes into heating water.",
    "category": "easy",
    "points": 15,
    "co2Saved": 80
  },
  {
    "id": "meat-free-monday",
    "title": "Meat-Free Days",
    "description": "Commit to eating plant-based meals at least one or two days per week.",
    "category": "easy",
    "points": 20,
    "co2Saved": 180
  },
  {
    "id": "compost-waste",
    "title": "Start Composting Food Scraps",
    "description": "Compost organic waste instead of throwing it in trash, preventing methane emissions in landfills.",
    "category": "medium",
    "points": 30,
    "co2Saved": 200
  },
  {
    "id": "commute-bike",
    "title": "Walk or Bike Short Trips",
    "description": "For trips under 2 miles, walk or ride a bike instead of taking a gasoline vehicle.",
    "category": "medium",
    "points": 40,
    "co2Saved": 450
  },
  {
    "id": "smart-thermostat",
    "title": "Install a Smart Thermostat",
    "description": "Optimize home heating and cooling schedules to save energy when sleeping or away.",
    "category": "medium",
    "points": 35,
    "co2Saved": 320
  },
  {
    "id": "dry-line",
    "title": "Air-Dry Your Clothes",
    "description": "Skip the electric dryer and use a clothesline or drying rack to dry garments.",
    "category": "medium",
    "points": 25,
    "co2Saved": 200
  },
  {
    "id": "solar-panels",
    "title": "Rooftop Solar Panels",
    "description": "Install domestic solar panels to generate zero-emission electricity at home.",
    "category": "hard",
    "points": 100,
    "co2Saved": 1800
  },
  {
    "id": "upgrade-ev",
    "title": "Upgrade to an Electric Vehicle",
    "description": "Replace a traditional gasoline vehicle with an electric or plug-in hybrid vehicle.",
    "category": "hard",
    "points": 90,
    "co2Saved": 2400
  },
  {
    "id": "heat-pump",
    "title": "Switch to a Heat Pump System",
    "description": "Replace standard gas/oil furnace with a high-efficiency electric heat pump.",
    "category": "hard",
    "points": 85,
    "co2Saved": 1400
  }
]

BADGES_DATA = [
  {
    "id": "first-calc",
    "title": "First Eco-Step",
    "description": "Completed your first carbon footprint calculation.",
    "icon": "footprint",
    "requirementText": "Complete calculation"
  },
  {
    "id": "green-advocate",
    "title": "Green Advocate",
    "description": "Committed to 3 carbon-reducing green actions.",
    "icon": "check-circle",
    "requirementText": "3 commitments"
  },
  {
    "id": "points-100",
    "title": "Eco Champion",
    "description": "Earned 100 Eco Points from active commitments.",
    "icon": "award",
    "requirementText": "100 Eco Points"
  },
  {
    "id": "carbon-cutter",
    "title": "Carbon Clipper",
    "description": "Reduced your carbon footprint by 500 kg CO₂e.",
    "icon": "scissors",
    "requirementText": "Save 500 kg CO₂"
  },
  {
    "id": "planet-saver",
    "title": "Planet Guardian",
    "description": "Unleased high-impact reductions (saved 1,500+ kg CO₂e).",
    "icon": "globe",
    "requirementText": "Save 1,500 kg CO₂"
  }
]

@app.route("/api/actions", methods=["GET"])
def get_actions():
    """Returns static green actions database."""
    return jsonify(ACTIONS_DATA)

@app.route("/api/badges", methods=["GET"])
def get_badges():
    """Returns static badges/milestones database."""
    return jsonify(BADGES_DATA)

@app.route("/api/calculate", methods=["POST"])
def calculate_carbon() -> tuple[Any, int]:
    """
    Computes carbon footprint based on inputs and returns breakdown.
    
    Returns:
        JSON response with the calculated footprint or an error message.
    """
    data = request.json or {}
    
    try:
        # Extract inputs with defaults and type casting
        car_miles = float(data.get("carMiles", 0))
        car_type = str(data.get("carType", "none"))
        public_transit = float(data.get("publicTransit", 0))
        flight_hours = float(data.get("flightHours", 0))
        
        home_members = max(1, int(data.get("homeMembers", 1)))
        electricity_bill = float(data.get("electricityBill", 0))
        clean_energy = bool(data.get("cleanEnergy", False))
        heating_fuel = str(data.get("heatingFuel", "natural-gas"))
        
        diet_type = str(data.get("dietType", "meat-average"))
        food_waste = str(data.get("foodWaste", "average"))
        local_food = bool(data.get("localFood", False))
        
        shopping_level = str(data.get("shoppingLevel", "average"))
        recycling_habits = str(data.get("recyclingHabits", "partial"))
    except (ValueError, TypeError) as e:
        return jsonify({"error": "Invalid input data types", "details": str(e)}), 400

    # 1. Transportation Calculation
    transport_co2 = 0
    if car_type != "none":
        car_factor = 0.4  # Average Gas Sedan
        if car_type == "electric":
            car_factor = 0.1
        elif car_type == "hybrid":
            car_factor = 0.2
        elif car_type == "gas-large":
            car_factor = 0.52
        
        transport_co2 += (car_miles * 52 * car_factor) / 1000.0
        
    transport_co2 += (public_transit * 52 * 1.2) / 1000.0
    transport_co2 += (flight_hours * 90.0) / 1000.0

    # 2. Home Energy Calculation
    energy_co2 = 0
    clean_grid_factor = 0.05 if clean_energy else 0.38
    energy_co2 += (electricity_bill * 12 * clean_grid_factor)
    
    heat_factor = 1200.0  # Natural Gas
    if heating_fuel == "electricity":
        heat_factor = 500.0
    elif heating_fuel == "oil":
        heat_factor = 2200.0
    elif heating_fuel == "none":
        heat_factor = 0.0
        
    energy_co2 += heat_factor
    energy_co2 = (energy_co2 / home_members) / 1000.0

    # 3. Diet Calculation
    food_co2 = 2.5
    if diet_type == "meat-heavy":
        food_co2 = 3.3
    elif diet_type == "pescatarian":
        food_co2 = 1.7
    elif diet_type == "vegetarian":
        food_co2 = 1.4
    elif diet_type == "vegan":
        food_co2 = 0.9
        
    if local_food:
        food_co2 *= 0.9
        
    if food_waste == "low":
        food_co2 *= 0.93
    elif food_waste == "high":
        food_co2 *= 1.15

    # 4. Shopping Calculation
    shopping_co2 = 1.2
    if shopping_level == "minimalist":
        shopping_co2 = 0.5
    elif shopping_level == "heavy":
        shopping_co2 = 2.4
        
    if recycling_habits == "full":
        shopping_co2 *= 0.85
    elif recycling_habits == "none":
        shopping_co2 *= 1.05

    results = {
        "transport": round(transport_co2, 2),
        "energy": round(energy_co2, 2),
        "food": round(food_co2, 2),
        "shopping": round(shopping_co2, 2),
        "total": round(transport_co2 + energy_co2 + food_co2 + shopping_co2, 2)
    }
    
    return jsonify(results), 200

import re

def is_valid_username(username: str) -> bool:
    """Validates the username format."""
    if not isinstance(username, str):
        return False
    # Only allow alphanumeric and underscores, length 1-50
    return bool(re.match(r"^[a-zA-Z0-9_]{1,50}$", username))

@app.route("/api/user/save", methods=["POST"])
def save_user():
    """Saves user data dictionary to the database."""
    req_data = request.json or {}
    username = req_data.get("username", "default_user")
    
    if not is_valid_username(username):
        logger.warning(f"Invalid username attempted: {username}")
        return jsonify({"status": "error", "message": "Invalid username format"}), 400

    state_dict = req_data.get("state", {})
    
    if not state_dict:
        return jsonify({"status": "error", "message": "Missing state data"}), 400
        
    try:
        database.save_user_state(username, state_dict)
        return jsonify({"status": "success", "message": "User state saved successfully"})
    except Exception as e:
        logger.error(f"Error saving user state: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@app.route("/api/user/load", methods=["GET"])
def load_user():
    """Loads user data dictionary from the database."""
    username = request.args.get("username", "default_user")
    
    if not is_valid_username(username):
        logger.warning(f"Invalid username attempted: {username}")
        return jsonify({"status": "error", "message": "Invalid username format"}), 400

    try:
        state_dict = database.load_user_state(username)
        if state_dict is not None:
            return jsonify({"status": "success", "found": True, "state": state_dict})
        else:
            return jsonify({"status": "success", "found": False, "state": None})
    except Exception as e:
        logger.error(f"Error loading user state: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
