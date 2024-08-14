import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.server import app

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
    response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article1",
            "date_first_accessed": "2023-12-01T00:00:00",
            "date_last_accessed": "2023-12-01T00:00:00",
        },
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://example.com/article1"

    article_id = response.json()["id"]
    read_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": test_user.id},
        json={"date_read": "2023-12-01T00:30:00"},
    )
    assert read_response.status_code == 200
    assert read_response.json()["date_read"] is not None


def test_read_articles(test_user):
    # Create an article first
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article1",
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
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article2",
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
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article3",
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
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article4",
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
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article5",
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
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article6",
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
