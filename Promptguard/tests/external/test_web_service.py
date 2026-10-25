import pytest

from app.services.external.web_service import (
    InvalidURL,
    SSRFBlocked,
    WebService,
)


@pytest.mark.asyncio
async def test_rejects_non_http_url():
    service = WebService()

    with pytest.raises(InvalidURL):
        await service.fetch("file:///etc/passwd")


@pytest.mark.asyncio
async def test_rejects_javascript_url():
    service = WebService()

    with pytest.raises(InvalidURL):
        await service.fetch("javascript:alert(1)")


@pytest.mark.asyncio
async def test_rejects_localhost():
    service = WebService()

    with pytest.raises(SSRFBlocked):
        await service.fetch("http://127.0.0.1")


@pytest.mark.asyncio
async def test_rejects_private_ip():
    service = WebService()

    with pytest.raises(SSRFBlocked):
        await service.fetch("http://192.168.1.1")


@pytest.mark.asyncio
async def test_rejects_embedded_credentials():
    service = WebService()

    with pytest.raises(InvalidURL):
        await service.fetch("https://user:password@example.com")


@pytest.mark.asyncio
async def test_rejects_link_local_metadata():
    service = WebService()

    with pytest.raises(SSRFBlocked):
        await service.fetch("http://169.254.169.254/latest/meta-data")


@pytest.mark.asyncio
async def test_rejects_ipv6_mapped_loopback():
    service = WebService()

    with pytest.raises(SSRFBlocked):
        await service.fetch("http://[::ffff:127.0.0.1]/")


@pytest.mark.asyncio
async def test_rejects_decimal_loopback():
    service = WebService()

    with pytest.raises(SSRFBlocked):
        await service.fetch("http://2130706433/")


@pytest.mark.asyncio
async def test_request_pins_resolved_address(monkeypatch):
    service = WebService()
    captured = {}

    async def fake_safe_get(self, client, url, headers=None, extensions=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["extensions"] = extensions
        raise AssertionError("stop after pin")

    monkeypatch.setattr(WebService, "_safe_get", fake_safe_get)

    class DummyClient:
        pass

    with pytest.raises(AssertionError):
        await service._request(
            DummyClient(),
            "https://example.com/path",
            ["8.8.8.8"],
        )

    assert captured["url"].startswith("https://8.8.8.8/")
    assert captured["headers"]["Host"] == "example.com"
    assert captured["extensions"]["sni_hostname"] == "example.com"
