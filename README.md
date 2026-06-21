# Carbon Tracker

Carbon Tracker is a web application designed to help you calculate, monitor, and reduce your carbon footprint. By tracking your daily habits across transportation, energy usage, diet, and shopping, you can gain insights into your environmental impact and commit to actionable green initiatives.

## Features

- **Carbon Footprint Calculator**: Get a detailed breakdown of your emissions in categories like Transport, Energy, Food, and Shopping.
- **Green Actions**: Commit to eco-friendly actions (e.g., switching to LED bulbs, walking short distances) to earn Eco Points and track CO2 saved.
- **Badges and Milestones**: Unlock achievements such as "First Eco-Step" and "Green Advocate" as you make progress.
- **User State Management**: Save and load your progress locally to continue your sustainability journey.

## Tech Stack

- **Backend**: Python, Flask, Flask-CORS
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: SQLite

## Project Structure

- `app.py`: Main Flask application handling API routes and carbon calculations.
- `database.py`: SQLite database initialization and operations for user state.
- `app.js`: Frontend logic for interacting with the backend and managing the UI.
- `index.html`: Main application interface.
- `styles.css`: Styling for the application.
- `particles.js`: Background animation script.
- `requirements.txt`: Python dependencies.

## Installation and Setup

1. **Navigate to the project directory:**
   ```bash
   cd carbon-tracker
   ```

2. **Install the required Python dependencies:**
   Ensure you have Python installed. Then, install the dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask backend server:**
   ```bash
   python app.py
   ```

4. **Access the application:**
   The backend runs on `http://127.0.0.1:5000` by default. Open `index.html` in your web browser to start using the Carbon Tracker.

## Usage

- Fill out the questionnaire to calculate your initial footprint.
- Browse the actions section to find new ways to reduce your emissions.
- Check your badges to see your earned milestones.
- Your progress is saved so you can return and update your habits over time.

## License

This project is open-source and available for educational and personal use.
