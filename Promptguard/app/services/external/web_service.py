from __future__ import annotations

import asyncio
import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse, urlunparse

import httpx

from app.core.config import settings


class WebServiceError(Exception):
    pass


class InvalidURL(WebServiceError):
    pass


class SSRFBlocked(WebServiceError):
    pass


class ResponseTooLarge(WebServiceError):
    pass


class UnsupportedContentType(WebServiceError):
    pass


class WebFetchTimeout(WebServiceError):
    pass


class WebFetchConnectionError(WebServiceError):
    pass


@dataclass(frozen=True)
class WebContent:
    url: str
    final_url: str
    status_code: int
    content_type: str
    content: str
    source: str = "web"
    trusted: bool = False


class WebService:
    ALLOWED_SCHEMES = frozenset({"http", "https"})

    ALLOWED_CONTENT_TYPES = frozenset(
        {
            "text/html",
            "text/plain",
            "application/json",
        }
    )

    USER_AGENT = "PromptGuard-WebGateway/1.0"

    async def fetch(self, url: str) -> WebContent:
        current_url = self._validate_url(url)

        timeout = httpx.Timeout(
            connect=settings.WEB_CONNECT_TIMEOUT,
            read=settings.WEB_READ_TIMEOUT,
            write=settings.WEB_WRITE_TIMEOUT,
            pool=settings.WEB_POOL_TIMEOUT,
        )

        limits = httpx.Limits(
            max_connections=20,
            max_keepalive_connections=10,
        )

        async with httpx.AsyncClient(
            timeout=timeout,
            limits=limits,
            follow_redirects=False,
            headers={
                "User-Agent": self.USER_AGENT,
                "Accept": "text/html,text/plain,application/json",
            },
        ) as client:
            for _ in range(settings.WEB_MAX_REDIRECTS + 1):
                addresses = await self._validate_host(current_url)

                response = await self._request(
                    client,
                    current_url,
                    addresses,
                )

                if response.is_redirect:
                    location = response.headers.get("location")

                    if not location:
                        raise WebServiceError(
                            "Redirect response has no Location header."
                        )

                    current_url = self._validate_url(
                        urljoin(current_url, location)
                    )
                    continue

                content_type = self._get_content_type(response)

                if content_type not in self.ALLOWED_CONTENT_TYPES:
                    raise UnsupportedContentType(
                        f"Unsupported content type: {content_type}"
                    )

                content = await self._read_response(response)

                return WebContent(
                    url=url,
                    final_url=str(response.url),
                    status_code=response.status_code,
                    content_type=content_type,
                    content=content,
                )

        raise WebServiceError(
            "Maximum redirect limit exceeded."
        )

    async def _request(
        self,
        client: httpx.AsyncClient,
        url: str,
        validated_addresses: list[str],
    ) -> httpx.Response:
        parsed = urlparse(url)

        host = parsed.hostname

        if not host:
            raise InvalidURL("URL has no hostname.")

        if not validated_addresses:
            raise SSRFBlocked(
                f"Hostname did not resolve: {host}"
            )

        target_ip = self._sanitize_resolved_ip(
            validated_addresses[0]
        )

        if self._hostname_is_ip(host):
            return await self._safe_get(client, url)

        if ":" in target_ip and not target_ip.startswith("["):
            netloc_host = f"[{target_ip}]"
        else:
            netloc_host = target_ip

        if parsed.port:
            netloc = f"{netloc_host}:{parsed.port}"
            host_header = f"{host}:{parsed.port}"
        else:
            netloc = netloc_host
            host_header = host

        pinned_url = urlunparse(
            (
                parsed.scheme,
                netloc,
                parsed.path or "/",
                parsed.params,
                parsed.query,
                "",
            )
        )

        try:
            return await self._safe_get(
                client,
                pinned_url,
                headers={"Host": host_header},
                extensions={"sni_hostname": host},
            )
        except httpx.ConnectError as exc:
            raise WebFetchConnectionError(
                f"Unable to connect to external host: {host}"
            ) from exc

    async def _safe_get(
        self,
        client: httpx.AsyncClient,
        url: str,
        headers: dict[str, str] | None = None,
        extensions: dict | None = None,
    ) -> httpx.Response:
        try:
            return await client.get(
                url,
                headers=headers,
                extensions=extensions,
            )
        except httpx.TimeoutException as exc:
            raise WebFetchTimeout(
                "External web request timed out."
            ) from exc
        except httpx.ConnectError:
            raise
        except httpx.HTTPError as exc:
            raise WebServiceError(
                f"External web request failed: {exc}"
            ) from exc

    def _validate_url(self, url: str) -> str:
        if not isinstance(url, str):
            raise InvalidURL("URL is required.")

        url = url.strip()

        if not url:
            raise InvalidURL("URL is required.")

        if len(url) > settings.WEB_MAX_URL_LENGTH:
            raise InvalidURL(
                "URL exceeds the maximum allowed length."
            )

        parsed = urlparse(url)

        if parsed.scheme.lower() not in self.ALLOWED_SCHEMES:
            raise InvalidURL(
                "Only HTTP and HTTPS URLs are allowed."
            )

        if not parsed.hostname:
            raise InvalidURL(
                "URL must contain a valid hostname."
            )

        if parsed.username or parsed.password:
            raise InvalidURL(
                "URLs containing embedded credentials are not allowed."
            )

        if parsed.fragment:
            url = url.split("#", 1)[0]

        try:
            if parsed.port is not None:
                if not 1 <= parsed.port <= 65535:
                    raise InvalidURL(
                        "URL contains an invalid port."
                    )
        except ValueError as exc:
            raise InvalidURL(
                "URL contains an invalid port."
            ) from exc

        return url

    async def _validate_host(
        self,
        url: str,
    ) -> list[str]:
        parsed = urlparse(url)
        hostname = parsed.hostname

        if not hostname:
            raise InvalidURL("URL has no hostname.")

        literal_ip = self._parse_literal_ip(hostname)

        if literal_ip is not None:
            if self._is_blocked_ip(literal_ip):
                raise SSRFBlocked(
                    f"Access to internal address is blocked: {hostname}"
                )

            return [str(literal_ip)]

        try:
            addresses = await self._resolve_hostname(hostname)
        except socket.gaierror as exc:
            raise WebServiceError(
                f"Unable to resolve hostname: {hostname}"
            ) from exc

        if not addresses:
            raise WebServiceError(
                f"Hostname did not resolve: {hostname}"
            )

        for address in addresses:
            ip = self._parse_literal_ip(address)

            if ip is None:
                raise SSRFBlocked(
                    f"Hostname resolved to an invalid address: {address}"
                )

            if self._is_blocked_ip(ip):
                raise SSRFBlocked(
                    f"Hostname resolves to blocked address: {address}"
                )

        return addresses

    def _sanitize_resolved_ip(self, address: str) -> str:
        ip = self._parse_literal_ip(address)

        if ip is None:
            raise SSRFBlocked(
                f"Invalid resolved address: {address}"
            )

        if self._is_blocked_ip(ip):
            raise SSRFBlocked(
                f"Access to internal address is blocked: {address}"
            )

        return str(ip)

    @staticmethod
    def _parse_literal_ip(
        hostname: str,
    ) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
        try:
            return ipaddress.ip_address(hostname)
        except ValueError:
            pass

        if hostname.isdigit():
            value = int(hostname)
            if 0 <= value <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(value)

        return None

    async def _resolve_hostname(
        self,
        hostname: str,
    ) -> list[str]:
        loop = asyncio.get_running_loop()

        results = await loop.run_in_executor(
            None,
            lambda: socket.getaddrinfo(
                hostname,
                None,
                type=socket.SOCK_STREAM,
            ),
        )

        addresses: list[str] = []

        for result in results:
            address = result[4][0]

            if address not in addresses:
                addresses.append(address)

        return addresses

    @staticmethod
    def _hostname_is_ip(hostname: str) -> bool:
        try:
            ipaddress.ip_address(hostname)
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_blocked_ip(
        ip: ipaddress.IPv4Address | ipaddress.IPv6Address,
    ) -> bool:
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            ip = ip.ipv4_mapped

        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        )

    @staticmethod
    def _get_content_type(
        response: httpx.Response,
    ) -> str:
        value = response.headers.get(
            "content-type",
            "",
        )

        return value.split(
            ";",
            1,
        )[0].strip().lower()

    async def _read_response(
        self,
        response: httpx.Response,
    ) -> str:
        content_length = response.headers.get(
            "content-length"
        )

        if content_length:
            try:
                declared_size = int(content_length)
            except ValueError:
                declared_size = None

            if (
                declared_size is not None
                and declared_size > settings.WEB_MAX_RESPONSE_SIZE
            ):
                raise ResponseTooLarge(
                    "Remote response exceeds the maximum size."
                )

        body = response.content

        if len(body) > settings.WEB_MAX_RESPONSE_SIZE:
            raise ResponseTooLarge(
                "Remote response exceeds the maximum size."
            )

        encoding = response.encoding or "utf-8"

        return body.decode(
            encoding,
            errors="replace",
        )