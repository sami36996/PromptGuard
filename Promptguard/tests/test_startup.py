from fastapi.testclient import TestClient

from app.main import app


def test_app_imports_and_exposes_docs(client: TestClient):
    response = client.get("/docs")
    assert response.status_code == 200


def test_required_routes_are_registered():
    paths = set(app.openapi()["paths"])

    assert "/auth/login" in paths
    assert "/auth/register" in paths
    assert "/api/chat" in paths
    assert "/api/policy" in paths
    assert "/api/policy/reset" in paths
    assert "/users/me" in paths
    assert "/company/me" in paths
    assert "/admin/stats" in paths
    assert "/admin/companies" in paths
    assert "/admin/agents/global" in paths
    assert "/admin/threats/global" in paths
    assert "/api/external/web" in paths


def test_unauthenticated_stats_are_rejected(client: TestClient):
    response = client.get("/api/stats")
    assert response.status_code == 401


def test_unauthenticated_web_scan_is_rejected(client: TestClient):
    response = client.post(
        "/api/external/web",
        json={"url": "https://example.com"},
    )
    assert response.status_code == 401
