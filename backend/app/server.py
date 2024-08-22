import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.articles.route import router as article_router
from app.db import Base, database, engine
from app.health.route import router as health_router
from app.models import Article, User  # noqa: F401
from app.streak.route import router as user_router
from app.user.route import router as streak_router

################################################################################
## DATABASE ##
################################################################################

Base.metadata.create_all(bind=engine)

################################################################################
## APP LIFECYCLE ##
################################################################################

app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()


app.router.lifespan_context = lifespan

################################################################################
## MIDDLEWARES ##
################################################################################

# Get the environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev").lower()

if ENVIRONMENT == "local":
    CORS_ORIGINS = [
        "http://localhost:3000",
        "https://127.0.0.1:8000",
    ]
else:
    # For non-local environments, use the DOMAIN env var
    domain = os.getenv("DOMAIN")
    if domain:
        CORS_ORIGINS = [f"https://{domain}"]
    else:
        raise ValueError("DOMAIN environment variable is not set for non-local environment")

CHROME_EXTENSION_IDS = os.getenv("CHROME_EXTENSION_IDS", "").split(",")

CORS_ORIGINS.extend([f"chrome-extension://{chrome_extension_id}" for chrome_extension_id in CHROME_EXTENSION_IDS])

SUPPORTED_SITES = [
    "https://www.economist.com",
]

CORS_ORIGINS.extend(SUPPORTED_SITES)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

################################################################################
## ROUTERS ##
################################################################################

app.include_router(user_router, tags=["users"])
app.include_router(article_router, tags=["articles"])
app.include_router(health_router, tags=["health"])
app.include_router(streak_router, tags=["streaks"])
