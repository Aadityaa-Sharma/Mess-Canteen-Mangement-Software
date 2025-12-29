import subprocess
import signal
import sys
import time
from pathlib import Path

processes = []

def run_command(command, cwd=None, background=False):
    """Run a command cross-platform."""
    if background:
        p = subprocess.Popen(
            command,
            cwd=cwd,
            shell=True
        )
        processes.append(p)
        return p
    else:
        subprocess.check_call(command, cwd=cwd, shell=True)

def cleanup(signum=None, frame=None):
    print("\nStopping all services...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

print("============================================")
print("   Mess Management System - Local Dev       ")
print("============================================")

# ------------------ CHECK ENV FILE ------------------
backend_dir = Path("backend")
env_file = backend_dir / ".env"

if not env_file.exists():
    print("⚠️  WARNING: backend/.env file not found!")
    print("   Please create backend/.env with your configuration.")
    print("   Required variables: DATABASE_URL, JWT_SECRET, PORT, ALLOWED_ORIGINS")
    print("")

# ------------------ CHECK AND INSTALL DEPENDENCIES ------------------
root_dir = Path(".")
node_modules = root_dir / "node_modules"

if not node_modules.exists():
    print("[0/3] Installing dependencies (this may take a minute)...")
    run_command("npm install")
    print("✅ Dependencies installed!")
else:
    print("[0/3] Dependencies found, skipping install...")

# ------------------ START BACKEND ------------------
print("[1/3] Starting Backend Server...")
backend_process = run_command(
    "npm run server",
    background=True
)

# Wait a moment for backend to start
time.sleep(2)

# ------------------ START FRONTEND ------------------
print("[2/3] Starting Frontend...")
frontend_process = run_command(
    "npm run client",
    background=True
)

# ------------------ INFO ------------------
print("")
print("[3/3] ✅ All Systems Operational!")
print("")
print("============================================")
print("   Backend:  http://localhost:5000          ")
print("   Frontend: http://localhost:3000          ")
print("============================================")
print("Press Ctrl+C to stop everything.")
print("")

# ------------------ WAIT ------------------
while True:
    time.sleep(1)
