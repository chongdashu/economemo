import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.server import app

from .common import INVALID_ARTICLE_URL, VALID_ARTICLE_URL

client = TestClient(app)


@pytest.fixture(scope="function")
def test_user():
    db: Session = next(get_db())
    user = User(id="test-uuid")
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def test_create_article(test_user):
    article_data = {
        "url": VALID_ARTICLE_URL,
        "date_first_accessed": "2023-08-16T12:00:00",
        "date_last_accessed": "2023-08-16T12:00:00",
        "date_read": "2023-08-16T12:30:00",
    }
    response = client.post("/articles/create", json=article_data, headers={"User-Id": test_user.id})
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == article_data["url"]
    assert data["date_read"] == article_data["date_read"]


def test_create_article_unsupported_site(test_user):
    article_data = {
        "url": INVALID_ARTICLE_URL,
        "date_first_accessed": "2023-08-16T12:00:00",
        "date_last_accessed": "2023-08-16T12:00:00",
    }
    response = client.post("/articles/create", json=article_data, headers={"User-Id": test_user.id})
    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported website"


def test_create_article_no_user_id():
    article_data = {
        "url": VALID_ARTICLE_URL,
        "date_first_accessed": "2023-08-16T12:00:00",
        "date_last_accessed": "2023-08-16T12:00:00",
    }
    response = client.post("/articles/create", json=article_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "User ID is required"


def test_update_existing_article(test_user):
    # First, create an article
    article_data = {
        "url": VALID_ARTICLE_URL,
        "date_first_accessed": "2023-08-16T12:00:00",
        "date_last_accessed": "2023-08-16T12:00:00",
    }
    client.post("/articles/create", json=article_data, headers={"User-Id": test_user.id})

    # Now, update the article
    update_data = {
        "url": VALID_ARTICLE_URL,
        "date_last_accessed": "2023-08-16T13:00:00",
        "date_read": "2023-08-16T13:30:00",
    }
    response = client.post("/articles/create", json=update_data, headers={"User-Id": test_user.id})
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == update_data["url"]
    assert data["date_read"] == update_data["date_read"]
    assert data["date_last_accessed"] == update_data["date_last_accessed"]


def test_read_articles(test_user):
    # Create an article first
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_id = create_response.json()["id"]

    client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": "2023-12-01T00:30:00"},
    )

    response = client.get("/articles/", headers={"User-Id": test_user.id})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_read_article_by_url(test_user):
    # First, create an article
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_url = create_response.json()["url"]
    article_id = create_response.json()["id"]

    client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": "2023-12-01T00:30:00"},
    )

    # Now, test the read_article_by_url endpoint
    response = client.get(f"/articles/by-url?url={article_url}", headers={"User-Id": test_user.id})
    assert response.status_code == 200
    articles = response.json()
    assert isinstance(articles, list)
    assert len(articles) > 0
    assert articles[0]["url"] == article_url


def test_mark_article_as_unread(test_user):
    # Create and mark an article as read
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_id = create_response.json()["id"]

    client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": "2023-12-01T00:30:00"},
    )

    # Mark the article as unread
    unread_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": None},
    )
    assert unread_response.status_code == 200
    assert unread_response.json()["date_read"] is None

    # Update last accessed
    access_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": test_user.id},
        json={"date_last_accessed": "2023-12-02T00:00:00"},
    )
    assert access_response.status_code == 200
    assert access_response.json()["date_last_accessed"] == "2023-12-02T00:00:00"


def test_mark_article_as_read_when_already_read(test_user):
    # Create and mark an article as read
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_id = create_response.json()["id"]

    client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": "2023-12-01T00:30:00"},
    )

    # Mark the article as read again with a new date
    new_read_date = "2023-12-02T00:00:00"
    response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": new_read_date},
    )
    assert response.status_code == 200
    assert response.json()["date_read"] == new_read_date
    assert response.json()["date_last_accessed"] == new_read_date


def test_mark_article_as_unread_when_already_unread(test_user):
    # Create an article but don't mark it as read
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_id = create_response.json()["id"]

    # Try to mark the article as unread again
    unread_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": None},
    )
    assert unread_response.status_code == 200
    assert unread_response.json()["date_read"] is None

    # Update last accessed
    new_access_date = "2023-12-02T00:00:00"
    access_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": test_user.id},
        json={"date_last_accessed": new_access_date},
    )
    assert access_response.status_code == 200
    assert access_response.json()["date_last_accessed"] == new_access_date


def test_mark_article_as_read_when_previously_unread(test_user):
    # Create an article and mark it as unread
    create_response = client.post(
        "/articles/create/",
        headers={"User-Id": test_user.id},
        json={
            "url": VALID_ARTICLE_URL,
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    article_id = create_response.json()["id"]

    # Mark the article as read
    new_read_date = "2023-12-02T00:00:00"
    response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": new_read_date},
    )
    assert response.status_code == 200
    assert response.json()["date_read"] == new_read_date
    assert response.json()["date_last_accessed"] == new_read_date
