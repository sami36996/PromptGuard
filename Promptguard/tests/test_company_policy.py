from fastapi.testclient import TestClient


def test_company_policy_defaults_and_update(client: TestClient, company_a):
    loaded = client.get("/api/policy", headers=company_a["headers"])
    assert loaded.status_code == 200, loaded.text
    body = loaded.json()
    assert body["maxRisk"] == 70
    assert body["autoBlock"] is True
    assert body["allowedModels"] == []
    assert body["blockedKeywords"] == []

    updated = client.put(
        "/api/policy",
        headers=company_a["headers"],
        json={
            "maxRisk": 40,
            "maxChainRisk": 55,
            "autoBlock": True,
            "allowedModels": ["gpt-4"],
            "blockedKeywords": ["credential theft"],
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["maxRisk"] == 40
    assert updated.json()["blockedKeywords"] == ["credential theft"]


def test_company_policy_is_tenant_scoped(client: TestClient, company_a, company_b):
    client.put(
        "/api/policy",
        headers=company_a["headers"],
        json={
            "maxRisk": 20,
            "maxChainRisk": 20,
            "autoBlock": True,
            "allowedModels": [],
            "blockedKeywords": ["alpha-only"],
        },
    )

    other = client.get("/api/policy", headers=company_b["headers"])
    assert other.status_code == 200
    assert "alpha-only" not in other.json()["blockedKeywords"]
    assert other.json()["maxRisk"] == 70


def test_blocked_keyword_enforces_company_policy(client: TestClient, company_a):
    client.put(
        "/api/policy",
        headers=company_a["headers"],
        json={
            "maxRisk": 70,
            "maxChainRisk": 70,
            "autoBlock": True,
            "allowedModels": [],
            "blockedKeywords": ["credential theft"],
        },
    )

    response = client.post(
        "/api/chat",
        headers=company_a["headers"],
        json={"prompt": "Please discuss credential theft in general terms."},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "blocked"
    assert body["analysis"]["decision"] == "block"


def test_auto_block_can_be_disabled(client: TestClient, company_a):
    client.put(
        "/api/policy",
        headers=company_a["headers"],
        json={
            "maxRisk": 10,
            "maxChainRisk": 70,
            "autoBlock": False,
            "allowedModels": [],
            "blockedKeywords": ["credential theft"],
        },
    )

    response = client.post(
        "/api/chat",
        headers=company_a["headers"],
        json={"prompt": "Please discuss credential theft in general terms."},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["analysis"]["decision"] == "review"
    assert body["status"] == "allowed"


def test_policy_reset_restores_defaults(client: TestClient, company_a):
    client.put(
        "/api/policy",
        headers=company_a["headers"],
        json={
            "maxRisk": 15,
            "maxChainRisk": 15,
            "autoBlock": False,
            "allowedModels": ["gpt-4"],
            "blockedKeywords": ["malware"],
        },
    )
    reset = client.post("/api/policy/reset", headers=company_a["headers"])
    assert reset.status_code == 200
    body = reset.json()
    assert body["maxRisk"] == 70
    assert body["autoBlock"] is True
    assert body["allowedModels"] == []
    assert body["blockedKeywords"] == []
