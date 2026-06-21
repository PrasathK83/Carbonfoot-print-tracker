import sqlite3
import json
import os
import contextlib

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    with contextlib.closing(get_db_connection()) as conn:
        with conn:
            cursor = conn.cursor()
            # Table to store complete user profile state (inputs, commitments, badges, points, results)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_state (
                    username TEXT PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

def save_user_state(username, state_dict):
    """Saves or updates the user state dict as JSON in the database."""
    state_json = json.dumps(state_dict)
    
    with contextlib.closing(get_db_connection()) as conn:
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_state (username, state_json, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(username) DO UPDATE SET
                    state_json = excluded.state_json,
                    updated_at = CURRENT_TIMESTAMP
            """, (username, state_json))

def load_user_state(username):
    """Loads and returns the user state dictionary. Returns None if not found."""
    with contextlib.closing(get_db_connection()) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT state_json FROM user_state WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if row:
            return json.loads(row["state_json"])
        return None
