import os
import sys
import subprocess

def run_tests():
    print("==========================================================")
    print("🔥 Starting Django Backend Test Suite (Python Native Runner) 🔥")
    print("==========================================================")
    
    # Determine directory paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(current_dir, "backend")
    
    if not os.path.exists(backend_dir):
        print("Error: 'backend' directory not found!")
        sys.exit(1)
        
    # Execute the manage.py test under backend folder
    try:
        cmd = ["python3", "manage.py", "test"]
        print(f"Executing: {' '.join(cmd)} in CWD: {backend_dir}")
        result = subprocess.run(cmd, cwd=backend_dir, check=True)
        print("\n==========================================================")
        print("✅ Django Test Suite completed successfully! ✅")
        print("==========================================================")
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        print("\n==========================================================")
        print("❌ Django Test Suite FAILED with exit code:", e.returncode)
        print("==========================================================")
        sys.exit(e.returncode)

if __name__ == "__main__":
    run_tests()
