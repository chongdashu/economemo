import os
import sys
from typing import Any, Dict

import uvicorn
from dotenv import load_dotenv

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
load_dotenv()


def get_uvicorn_config() -> Dict[str, Any]:
    config: Dict[str, Any] = {
        "app": "app.server:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", "8000")),
        "reload": os.getenv("ENVIRONMENT", "dev").lower() == "local",
    }

    ssl_keyfile = os.getenv("SSL_KEYFILE")
    ssl_certfile = os.getenv("SSL_CERTFILE")

    if ssl_keyfile and ssl_certfile:
        config["ssl_keyfile"] = ssl_keyfile
        config["ssl_certfile"] = ssl_certfile

    return config


if __name__ == "__main__":
    uvicorn_config = get_uvicorn_config()
    uvicorn.run(**uvicorn_config)
