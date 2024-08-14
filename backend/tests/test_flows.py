import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import get_db
from app.server import app

client = TestClient(app)


@pytest.fixture(scope="module")
def db():
    db = next(get_db())
    yield db
    db.close()


def test_new_user_reads_multiple_articles(db: Session):
    """
    This test simulates a new user registering, logging in, and then reading
    multiple articles over a period of time. It checks that the user can
    successfully track their reading history.
    """
    # User registration and login
    register_response = client.post("/user/register/", json={"email": "newreader@example.com"})
    assert register_response.status_code == 200
    user_id = register_response.json()["id"]

    login_response = client.post("/user/login/", json={"email": "newreader@example.com"})
    assert login_response.status_code == 200

    # Read first article
    article1_response = client.post(
        "/articles/",
        headers={"User-Id": user_id},
        json={
            "url": "http://example.com/article1",
            "date_first_accessed": "2023-12-01T10:00:00",
            "date_last_accessed": "2023-12-01T10:00:00",
        },
    )
    assert article1_response.status_code == 200
    article1_id = article1_response.json()["id"]

    client.patch(
        f"/articles/{article1_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-01T10:30:00"},
    )

    # Read second article
    article2_response = client.post(
        "/articles/",
        headers={"User-Id": user_id},
        json={
            "url": "http://example.com/article2",
            "date_first_accessed": "2023-12-02T14:00:00",
            "date_last_accessed": "2023-12-02T14:00:00",
        },
    )
    assert article2_response.status_code == 200
    article2_id = article2_response.json()["id"]

    client.patch(
        f"/articles/{article2_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-02T14:45:00"},
    )

    # Verify reading history
    history_response = client.get("/articles/", headers={"User-Id": user_id})
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 2
    assert all(article["date_read"] is not None for article in history)


def test_user_marks_article_unread_then_read_again(db: Session):
    """
    This test simulates a user reading an article, marking it as unread,
    and then reading it again. It verifies that the article's read status
    and timestamps are updated correctly throughout this process.
    """
    # User registration and login
    register_response = client.post("/user/register/", json={"email": "changingmind@example.com"})
    assert register_response.status_code == 200
    user_id = register_response.json()["id"]

    login_response = client.post("/user/login/", json={"email": "changingmind@example.com"})
    assert login_response.status_code == 200

    # Read an article
    article_response = client.post(
        "/articles/",
        headers={"User-Id": user_id},
        json={
            "url": "http://example.com/interesting_article",
            "date_first_accessed": "2023-12-05T09:00:00",
            "date_last_accessed": "2023-12-05T09:00:00",
        },
    )
    assert article_response.status_code == 200
    article_id = article_response.json()["id"]

    client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-05T09:30:00"},
    )

    # Mark article as unread (by setting date_read to null)
    unread_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": None},
    )
    assert unread_response.status_code == 200
    assert unread_response.json()["date_read"] is None

    # Update last accessed time
    client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": user_id},
        json={"date_last_accessed": "2023-12-06T10:00:00"},
    )

    # Mark article as read again
    reread_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-07T11:30:00"},
    )
    assert reread_response.status_code == 200
    assert reread_response.json()["date_read"] == "2023-12-07T11:30:00"


def test_user_accesses_article_multiple_times_before_reading(db: Session):
    """
    This test simulates a user accessing an article multiple times before
    finally reading it. It checks that the first access date remains unchanged
    while the last access date is updated with each visit.
    """
    # User registration and login
    register_response = client.post("/user/register/", json={"email": "procrastinator@example.com"})
    assert register_response.status_code == 200
    user_id = register_response.json()["id"]

    login_response = client.post("/user/login/", json={"email": "procrastinator@example.com"})
    assert login_response.status_code == 200

    # First access
    first_access_response = client.post(
        "/articles/",
        headers={"User-Id": user_id},
        json={
            "url": "http://example.com/long_article",
            "date_first_accessed": "2023-12-10T08:00:00",
            "date_last_accessed": "2023-12-10T08:00:00",
        },
    )
    assert first_access_response.status_code == 200
    article_id = first_access_response.json()["id"]

    # Second access
    second_access_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": user_id},
        json={"date_last_accessed": "2023-12-11T09:00:00"},
    )
    assert second_access_response.status_code == 200

    # Third access and finally read
    third_access_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": user_id},
        json={"date_last_accessed": "2023-12-12T10:00:00"},
    )
    assert third_access_response.status_code == 200

    read_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-12T10:30:00"},
    )
    assert read_response.status_code == 200

    # Verify article history
    article_response = client.get("/articles/by-url?url=http://example.com/long_article", headers={"User-Id": user_id})
    assert article_response.status_code == 200
    article = article_response.json()[0]
    assert article["date_first_accessed"] == "2023-12-10T08:00:00"
    assert article["date_last_accessed"] == "2023-12-12T10:30:00"  # This should be updated to the read time
    assert article["date_read"] == "2023-12-12T10:30:00"


def test_user_reads_article_from_multiple_devices(db: Session):
    """
    This test simulates a user reading the same article from multiple devices.
    It ensures that the article's read status is consistent across devices and
    that the last access date is updated appropriately.
    """
    # User registration and login
    register_response = client.post("/user/register/", json={"email": "multidevice@example.com"})
    assert register_response.status_code == 200
    user_id = register_response.json()["id"]

    login_response = client.post("/user/login/", json={"email": "multidevice@example.com"})
    assert login_response.status_code == 200

    # Access from first device (e.g., smartphone)
    smartphone_response = client.post(
        "/articles/",
        headers={"User-Id": user_id},
        json={
            "url": "http://example.com/tech_article",
            "date_first_accessed": "2023-12-15T07:00:00",
            "date_last_accessed": "2023-12-15T07:15:00",
        },
    )
    assert smartphone_response.status_code == 200
    article_id = smartphone_response.json()["id"]

    # Access from second device (e.g., laptop) and read
    laptop_access_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": user_id},
        json={"date_last_accessed": "2023-12-15T20:00:00"},
    )
    assert laptop_access_response.status_code == 200

    laptop_read_response = client.patch(
        f"/articles/{article_id}/read",
        headers={"User-Id": user_id},
        json={"date_read": "2023-12-15T20:30:00"},
    )
    assert laptop_read_response.status_code == 200
    assert laptop_read_response.json()["date_read"] == "2023-12-15T20:30:00"

    # Access from third device (e.g., tablet) after reading
    tablet_response = client.patch(
        f"/articles/{article_id}/access",
        headers={"User-Id": user_id},
        json={"date_last_accessed": "2023-12-16T10:00:00"},
    )
    assert tablet_response.status_code == 200

    # Verify article status
    article_response = client.get("/articles/by-url?url=http://example.com/tech_article", headers={"User-Id": user_id})
    assert article_response.status_code == 200
    article = article_response.json()[0]
    assert article["date_first_accessed"] == "2023-12-15T07:00:00"
    assert article["date_last_accessed"] == "2023-12-16T10:00:00"
    assert article["date_read"] == "2023-12-15T20:30:00"
