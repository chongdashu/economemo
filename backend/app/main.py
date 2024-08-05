import os
import sys

import uvicorn
from dotenv import load_dotenv

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.server import app

# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    ssl_keyfile = os.getenv("SSL_KEYFILE")
    ssl_certfile = os.getenv("SSL_CERTFILE")
    port = int(os.getenv("PORT", 8000))

    uvicorn_config = {
        "app": "app.server:app",
        "host": "0.0.0.0",
        "port": port,
        "reload": os.getenv("ENVIRONMENT", "dev").lower() == "local",
    }

    if ssl_keyfile and ssl_certfile:
        uvicorn_config.update({"ssl_keyfile": ssl_keyfile, "ssl_certfile": ssl_certfile})

    uvicorn.run(**uvicorn_config)
