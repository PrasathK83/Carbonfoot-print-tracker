import sys
import subprocess
import importlib
import os

def check_and_install_dependencies():
    print("Checking backend Python dependencies...")
    dependencies = ["flask", "flask_cors"]
    missing = []
    
    for dep in dependencies:
        try:
            importlib.import_module(dep)
        except ImportError:
            # map module name to package name in requirements.txt if different
            package_name = "flask-cors" if dep == "flask_cors" else dep
            missing.append(package_name)
            
    if missing:
        print(f"Missing dependencies found: {', '.join(missing)}")
        print("Installing dependencies via pip...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", *missing])
            print("Dependencies successfully installed!")
        except Exception as e:
            print(f"Error installing dependencies: {e}")
            print("Please run: pip install flask flask-cors")
            sys.exit(1)
    else:
        print("All dependencies are satisfied!")

if __name__ == "__main__":
    # Ensure working directory is the folder of run.py
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Auto install missing packages
    check_and_install_dependencies()
    
    print("\nStarting EcoTrace Backend Server on http://127.0.0.1:5000")
    print("Press Ctrl+C to stop the server.\n")
    
    try:
        from app import app
        app.run(debug=True, host="127.0.0.1", port=5000)
    except Exception as e:
        print(f"Failed to start the server: {e}")
        sys.exit(1)
