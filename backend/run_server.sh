#!/bin/bash

# Source the common setup script
source "$(dirname "$0")/run_common.sh"

# Run the FastAPI server with Uvicorn
uvicorn app.main:app --reload --ssl-keyfile=key.pem --ssl-certfile=cert.pem