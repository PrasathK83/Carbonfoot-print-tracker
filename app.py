from flask import Flask, request, jsonify
from flask_cors import CORS
import database

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all domains

# Initialize the database
database.init_db()

import os
from flask import send_from_directory

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
def calculate_carbon():
    """Computes carbon footprint based on inputs and returns breakdown."""
    data = request.json or {}
    
    # Extract inputs with defaults
    car_miles = float(data.get("carMiles", 0))
    car_type = data.get("carType", "none")
    public_transit = float(data.get("publicTransit", 0))
    flight_hours = float(data.get("flightHours", 0))
    
    home_members = max(1, int(data.get("homeMembers", 1)))
    electricity_bill = float(data.get("electricityBill", 0))
    clean_energy = bool(data.get("cleanEnergy", False))
    heating_fuel = data.get("heatingFuel", "natural-gas")
    
    diet_type = data.get("dietType", "meat-average")
    food_waste = data.get("foodWaste", "average")
    local_food = bool(data.get("localFood", False))
    
    shopping_level = data.get("shoppingLevel", "average")
    recycling_habits = data.get("recyclingHabits", "partial")

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
    
    return jsonify(results)

@app.route("/api/user/save", methods=["POST"])
def save_user():
    """Saves user data dictionary to the database."""
    req_data = request.json or {}
    username = req_data.get("username", "default_user")
    state_dict = req_data.get("state", {})
    
    if not state_dict:
        return jsonify({"status": "error", "message": "Missing state data"}), 400
        
    database.save_user_state(username, state_dict)
    return jsonify({"status": "success", "message": "User state saved successfully"})

@app.route("/api/user/load", methods=["GET"])
def load_user():
    """Loads user data dictionary from the database."""
    username = request.args.get("username", "default_user")
    state_dict = database.load_user_state(username)
    
    if state_dict:
        return jsonify({"status": "success", "found": True, "state": state_dict})
    else:
        return jsonify({"status": "success", "found": False, "state": None})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
