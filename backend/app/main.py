import logging
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError
from supabase import Client, create_client

from .api import ArticleCreate, ArticleResponse, ArticleUpdate, UserCreate, UserResponse
from .models import Article, User

load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase_service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_service_key)

CHROME_EXTENSION_ID = os.getenv("CHROME_EXTENSION_ID")
app = FastAPI()

# CORS setup remains the same
origins = [
    "https://www.economist.com",
    f"chrome-extension://{CHROME_EXTENSION_ID}",
    "https://127.0.0.1:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate):
    logger.info(f"Attempting to create user with email: {user.email}")
    try:
        # Generate UUID
        user_id = user.uuid or str(uuid.uuid4())
        logger.info(f"Generated user_id: {user_id}")

        # Invite user via email
        invite_response = supabase.auth.admin.invite_user_by_email(user.email)

        if not invite_response.user:
            logger.error("Failed to invite user in Supabase auth")
            raise HTTPException(status_code=400, detail="Failed to invite user")

        logger.info(f"User invited in auth system with ID: {invite_response.user.id}")

        # Prepare user data for database insertion
        new_user = User(id=user_id, email=user.email)
        user_dict = new_user.dict()
        logger.info(f"Prepared user data for insertion: {user_dict}")

        # Insert user data into the database
        response = supabase.table("users").insert(user_dict).execute()

        data = response.data
        count = response.count

        logger.info(f"Insertion response - data: {data}, count: {count}")

        if not data or len(data) == 0:
            logger.error("No data returned after inserting user into database")
            supabase.auth.admin.delete_user(invite_response.user.id)
            raise HTTPException(status_code=500, detail="No data returned after user insertion")

        # Create UserResponse object
        user_response = UserResponse(id=user_id, email=user.email)
        logger.info(f"User successfully invited and inserted into database: {user_response}")
        return user_response

    except APIError as e:
        logger.error(f"Supabase API error: {e}")
        raise HTTPException(status_code=400, detail=f"Supabase API error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.post("/login/", response_model=UserResponse)
async def login(user: UserCreate):
    logger.info(f"Attempting login for user with email: {user.email}")
    if not user.email:
        logger.error("Login attempt with no email provided")
        raise HTTPException(status_code=400, detail="Email is required")

    response = supabase.table("users").select("*").eq("email", user.email).execute()
    logger.info(f"Login query response: {response}")

    if not response.data:
        logger.error(f"User not found for email: {user.email}")
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"User successfully logged in: {user.email}")
    return UserResponse(**response.data[0])


def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


@app.post("/articles/", response_model=ArticleResponse)
async def create_article(
    article: ArticleCreate,
    user_id: str = Header(None, alias="User-Id"),
):
    logger.info(f"Attempting to create/update article for user_id: {user_id}")
    if user_id is None:
        logger.error("Article creation attempt with no user_id")
        raise HTTPException(status_code=400, detail="User ID is required")

    response = supabase.table("articles").select("*").eq("url", article.url).eq("user_id", user_id).execute()
    logger.info(f"Article query response: {response}")

    if response.data and len(response.data) > 0:
        logger.info("Existing article found, updating")
        existing_article = response.data[0]
        update_data = {"read": article.read, "date_read": serialize_datetime(article.date_read)}
        response = supabase.table("articles").update(update_data).eq("id", existing_article["id"]).execute()
    else:
        logger.info("Creating new article")
        new_article_data = {
            "url": article.url,
            "read": article.read,
            "date_read": serialize_datetime(article.date_read),
            "user_id": user_id,
        }
        response = supabase.table("articles").insert(new_article_data).execute()

    logger.info(f"Article creation/update response: {response}")
    if not response.data:
        logger.error("No data returned after article creation/update")
        raise HTTPException(status_code=400, detail="Failed to create/update article")

    logger.info("Article successfully created/updated")
    return ArticleResponse(**response.data[0])


@app.patch("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article: ArticleUpdate,
    user_id: str = Header(None, alias="User-Id"),
):
    logger.info(f"Attempting to update article {article_id} for user_id: {user_id}")
    if user_id is None:
        logger.error("Article update attempt with no user_id")
        raise HTTPException(status_code=400, detail="User ID is required")

    update_data = article.dict(exclude_unset=True)

    # Serialize datetime if present
    if "date_read" in update_data and update_data["date_read"] is not None:
        update_data["date_read"] = serialize_datetime(update_data["date_read"])

    response = supabase.table("articles").update(update_data).eq("id", article_id).eq("user_id", user_id).execute()
    logger.info(f"Article update response: {response}")

    if not response.data:
        logger.error(f"Article not found or update failed: {article_id}")
        raise HTTPException(status_code=404, detail="Article not found")

    logger.info(f"Article {article_id} successfully updated")
    return ArticleResponse(**response.data[0])


@app.get("/articles/", response_model=list[ArticleResponse])
async def read_articles(
    user_id: str = Header(None, alias="User-Id"),
):
    logger.info(f"Fetching articles for user_id: {user_id}")
    if user_id is None:
        logger.error("Article fetch attempt with no user_id")
        raise HTTPException(status_code=400, detail="User ID is required")

    response = supabase.table("articles").select("*").eq("user_id", user_id).execute()
    logger.info(f"Articles fetch response: {response}")

    if not response.data:
        logger.info(f"No articles found for user_id: {user_id}")
        return []

    logger.info(f"Successfully fetched articles for user_id: {user_id}")
    return [ArticleResponse(**article) for article in response.data]


@app.get("/articles/by-url", response_model=list[ArticleResponse])
async def read_article_by_url(
    url: str = Query(...),
    user_id: str = Header(None, alias="User-Id"),
):
    logger.info(f"Fetching article by URL: {url} for user_id: {user_id}")
    if user_id is None:
        logger.error("Article fetch by URL attempt with no user_id")
        raise HTTPException(status_code=400, detail="User ID is required")

    response = supabase.table("articles").select("*").eq("url", url).eq("user_id", user_id).execute()
    logger.info(f"Article fetch by URL response: {response}")

    if not response.data:
        logger.info(f"No article found for URL: {url} and user_id: {user_id}")
        return []

    logger.info(f"Successfully fetched article by URL for user_id: {user_id}")
    return [ArticleResponse(**article) for article in response.data]
