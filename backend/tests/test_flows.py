import pytest
from fastapi.testclient import TestClient
from freezegun import freeze_time
from sqlalchemy.orm import Session

from app.db import get_db
from app.server import app

from .common import ANOTHER_VALID_ARTICLE_URL, VALID_ARTICLE_URL

client = TestClient(app)


@pytest.fixture(scope="function")
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
        "/articles/access/",
        headers={"User-Id": user_id},
        json={
            "url": VALID_ARTICLE_URL,
            "create_if_not_exist": True,
        },
    )
    assert article1_response.status_code == 200, "first article failed access"
    article1_id = article1_response.json()["id"]

    client.patch(
        f"/articles/{article1_id}/read",
        headers={"User-Id": user_id},
        json={"read": True},
    )

    # Read second article
    article2_response = client.post(
        "/articles/access/",
        headers={"User-Id": user_id},
        json={
            "url": ANOTHER_VALID_ARTICLE_URL,
            "create_if_not_exist": True,
        },
    )
    assert article2_response.status_code == 200, "second article failed creation"
    article2_id = article2_response.json()["id"]

    client.patch(
        f"/articles/{article2_id}/read",
        headers={"User-Id": user_id},
        json={"read": True},
    )

    # Verify reading history
    history_response = client.get("/articles/all", headers={"User-Id": user_id})
    assert history_response.status_code == 200, "failed to get all articles"
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

    with freeze_time("2024-08-21T10:00:00") as frozen_time:
        # Access article
        article_response = client.post(
            "/articles/access/",
            headers={"User-Id": user_id},
            json={
                "url": VALID_ARTICLE_URL,
                "create_if_not_exist": True,
            },
        )

        assert article_response.status_code == 200, "Failed to access article"
        article_id = article_response.json()["id"]

        frozen_time.move_to("2024-08-21T10:30:00")

        # Read article
        read_response = client.patch(
            f"/articles/{article_id}/read",
            headers={"User-Id": user_id},
            json={"read": True},
        )

        assert read_response.status_code == 200, "Failed to mark article as read"
        assert read_response.json()["date_read"] == "2024-08-21T10:30:00"

        frozen_time.move_to("2024-08-21T11:00:00")

        # Access article
        client.patch(
            f"/articles/{article_id}/access",
            headers={"User-Id": user_id},
            json={"url": VALID_ARTICLE_URL},
        )

        frozen_time.move_to("2024-08-21T11:05:00")

        # Unread article
        reread_response = client.patch(
            f"/articles/{article_id}/read",
            headers={"User-Id": user_id},
            json={"read": False},
        )
        assert reread_response.status_code == 200, "Failed to mark article as unread"
        assert not reread_response.json()["date_read"]

        frozen_time.move_to("2024-08-21T11:10:00")

        # Read article
        read_response = client.patch(
            f"/articles/{article_id}/read",
            headers={"User-Id": user_id},
            json={"read": True},
        )

        assert read_response.status_code == 200, "Failed to mark article as read"
        assert read_response.json()["date_read"] == "2024-08-21T11:10:00"


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

    with freeze_time("2024-08-21T08:00:00") as frozen_time:
        # First access
        first_access_response = client.post(
            "/articles/access",
            headers={"User-Id": user_id},
            json={
                "url": VALID_ARTICLE_URL,
                "create_if_not_exist": True,
            },
        )
        assert first_access_response.status_code == 200, "Failed to access article"
        article_id = first_access_response.json()["id"]

        frozen_time.move_to("2024-08-21T09:00:00")

        # Second access
        second_access_response = client.post(
            "/articles/access",
            headers={"User-Id": user_id},
            json={
                "url": VALID_ARTICLE_URL,
            },
        )
        assert second_access_response.status_code == 200, "Failed to access article a second time"

        frozen_time.move_to("2024-08-21T10:00:00")

        # Third access and finally read
        third_access_response = client.post(
            "/articles/access",
            headers={"User-Id": user_id},
            json={
                "url": VALID_ARTICLE_URL,
            },
        )
        assert third_access_response.status_code == 200, "Failed to access article a third time"

        frozen_time.move_to("2024-08-21T11:00:00")

        read_response = client.patch(
            f"/articles/{article_id}/read",
            headers={"User-Id": user_id},
            json={"read": True},
        )
        assert read_response.status_code == 200

        # Verify article history
        article_response = client.get("/articles/all", headers={"User-Id": user_id})
        assert article_response.status_code == 200, "Failed to access all articles"

        assert len(article_response.json()) == 1
        article = article_response.json()[0]
        assert article["date_first_accessed"] == "2024-08-21T08:00:00"
        assert article["date_last_accessed"] == "2024-08-21T11:00:00"
        assert article["date_read"] == "2024-08-21T11:00:00"
