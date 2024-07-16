import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_user():
    response = client.post("/users/", json={"uuid": "test-uuid"})
    assert response.status_code == 200
    assert response.json()["id"] == "test-uuid"
    assert response.json()["email"] is None


def test_login_user():
    # First, create a user
    client.post("/users/", json={"email": "testuser@example.com"})

    # Now, test the login endpoint
    response = client.post("/login/", json={"email": "testuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "testuser@example.com"
