import os
import sys
import tempfile
import uuid
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

_TEST_DB = tempfile.NamedTemporaryFile(
    prefix="promptguard-test-",
    suffix=".db",
    delete=False,
)

os.environ["SECRET_KEY"] = "unit-test-secret-key-32-characters"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.name}"
os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://127.0.0.1:3000"
os.environ["LLM_BASE_URL"] = ""
os.environ["LLM_API_KEY"] = ""
os.environ["LLM_MODEL"] = ""

from app.core.config import get_settings

get_settings.cache_clear()

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.main import app
from app.models.user import User


def pytest_sessionfinish(session, exitstatus):
    try:
        os.unlink(_TEST_DB.name)
    except OSError:
        pass


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def register_company(client):
    counter = {"value": 0}

    def _register(
        *,
        email: str | None = None,
        password: str = "password123",
        company_name: str | None = None,
        full_name: str = "Company Administrator",
    ):
        counter["value"] += 1
        suffix = f"{counter['value']}-{uuid.uuid4().hex[:8]}"
        payload = {
            "email": email or f"owner{suffix}@example.com",
            "password": password,
            "full_name": full_name,
            "company_name": company_name or f"Example Company {suffix}",
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {
            "token": token,
            "headers": _auth_header(token),
            "email": payload["email"],
            "password": password,
            "company_name": payload["company_name"],
        }

    return _register


@pytest.fixture
def company_a(register_company):
    return register_company(full_name="Alpha Owner")


@pytest.fixture
def company_b(register_company):
    return register_company(full_name="Beta Owner")


@pytest.fixture
def super_admin(client, db_session: Session):
    email = f"platform-admin-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Platform Admin",
            "company_name": f"Platform Ops {uuid.uuid4().hex[:8]}",
        },
    )
    assert response.status_code == 200, response.text
    user = (
        db_session.query(User)
        .filter(User.email == email)
        .first()
    )
    assert user is not None
    user.is_platform_admin = True
    db_session.commit()

    login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "password123",
        },
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"token": token, "headers": _auth_header(token)}
