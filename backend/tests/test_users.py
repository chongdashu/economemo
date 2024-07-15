import pytest
from fastapi.testclient import TestClient
from app.main import app, get_db
from app.db import SessionLocal, engine
from app.models import Base, User

Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


def test_create_user(client: TestClient):
    response = client.post("/users/", json={"email": "testuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "testuser@example.com"


def test_login_user(client: TestClient, db_session):
    user = User(email="loginuser@example.com")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.post("/login/", json={"email": "loginuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "loginuser@example.com"
