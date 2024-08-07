from fastapi.testclient import TestClient

from app.server import app

client = TestClient(app)


def test_create_user_with_email():
    response = client.post("/users/", json={"email": "newuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "newuser@example.com"


def test_create_user_with_existing_email():
    # Create a user first
    client.post("/users/", json={"email": "existinguser@example.com"})

    # Try to create another user with the same email and expect a 400 status code
    response = client.post("/users/", json={"email": "existinguser@example.com"})
    assert response.status_code == 400
    assert "User with this email already exists" in response.json()["detail"]


def test_login_nonexistent_user():
    response = client.post("/login/", json={"email": "nonexistentuser@example.com"})
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]


def test_login_existing_user():
    # Create a user first
    client.post("/users/", json={"email": "testloginuser@example.com"})

    # Now, test the login endpoint
    response = client.post("/login/", json={"email": "testloginuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "testloginuser@example.com"
