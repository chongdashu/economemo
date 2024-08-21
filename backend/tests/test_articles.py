import pytest
from fastapi.testclient import TestClient
from freezegun import freeze_time
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


def test_access_article_no_creation(test_user):
    article_data = {
        "url": VALID_ARTICLE_URL,
    }
    response = client.post("/articles/access", json=article_data, headers={"User-Id": test_user.id})
    assert response.status_code == 404


def test_access_article_with_creation(test_user):
    article_data = {
        "url": VALID_ARTICLE_URL,
        "create_if_not_exist": True,
    }
    response = client.post("/articles/access", json=article_data, headers={"User-Id": test_user.id})
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == article_data["url"]
    assert not data["date_read"]


def test_access_article_unsupported_site(test_user):
    article_data = {
        "url": INVALID_ARTICLE_URL,
    }
    response = client.post("/articles/access", json=article_data, headers={"User-Id": test_user.id})
    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported website"


def test_access_article_no_user_in_headers():
    article_data = {
        "url": VALID_ARTICLE_URL,
        "date_first_accessed": "2023-08-16T12:00:00",
        "date_last_accessed": "2023-08-16T12:00:00",
    }
    response = client.post("/articles/access", json=article_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "User ID is required"


def test_mark_article_as_read(test_user):
    # First, access an article
    with freeze_time("2024-08-21T10:00:00") as frozen_time:
        article_data = {
            "url": VALID_ARTICLE_URL,
            "create_if_not_exist": True,
        }

        response = client.post("/articles/access", json=article_data, headers={"User-Id": test_user.id})
        article = response.json()

        frozen_time.move_to("2024-08-21T10:30:00")

        # Now, update the article
        update_data = {
            "read": True,
        }
        response = client.patch(f"/articles/{article['id']}/read", json=update_data, headers={"User-Id": test_user.id})
        assert response.status_code == 200
        data = response.json()
        assert data["url"] == VALID_ARTICLE_URL
        assert data["date_first_accessed"] == "2024-08-21T10:00:00"
        assert data["date_last_accessed"] == "2024-08-21T10:30:00"
        assert data["date_read"] == "2024-08-21T10:30:00"


def test_mark_article_as_unread(test_user):
    # First, access an article
    with freeze_time("2024-08-21T10:00:00") as frozen_time:
        article_data = {
            "url": VALID_ARTICLE_URL,
            "create_if_not_exist": True,
        }

        response = client.post("/articles/access", json=article_data, headers={"User-Id": test_user.id})
        article = response.json()

        frozen_time.move_to("2024-08-21T10:30:00")

        # (1) read it
        update_data = {
            "read": True,
        }
        response = client.patch(f"/articles/{article['id']}/read", json=update_data, headers={"User-Id": test_user.id})
        assert response.status_code == 200
        data = response.json()
        assert data["url"] == VALID_ARTICLE_URL
        assert data["date_first_accessed"] == "2024-08-21T10:00:00"
        assert data["date_last_accessed"] == "2024-08-21T10:30:00"
        assert data["date_read"] == "2024-08-21T10:30:00"

        frozen_time.move_to("2024-08-21T11:00:00")

        # (2) unread it
        update_data = {
            "read": False,
        }
        response = client.patch(f"/articles/{article['id']}/read", json=update_data, headers={"User-Id": test_user.id})
        assert response.status_code == 200
        data = response.json()
        assert data["url"] == VALID_ARTICLE_URL
        assert data["date_first_accessed"] == "2024-08-21T10:00:00"
        assert data["date_last_accessed"] == "2024-08-21T11:00:00"
        assert not data["date_read"]
