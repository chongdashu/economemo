#!/bin/bash

# Ensure we are in the backend directory (where this script lives)
cd "$(dirname "$0")"

# Activate the virtual environment
source venv/bin/activate

# Get the IP address of WSL
WSL_IP=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')

# Export the WSL IP as an environment variable for PostgreSQL host
export POSTGRES_HOST=$WSL_IP

# Run the FastAPI server with Uvicorn
pytest