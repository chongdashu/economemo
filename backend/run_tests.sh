#!/bin/bash

# Source the common setup script
source "$(dirname "$0")/run_common.sh"

# When running locally, use a test db so that it doesn't clobber main db
export POSTGRES_DB=chong-u

# Run the FastAPI server with Uvicorn
pytest