from __future__ import annotations

import httpx

from app.core.config import settings


class LLMServiceError(Exception):
    pass


class LLMNotConfigured(LLMServiceError):
    pass


class LLMRequestError(LLMServiceError):
    pass


class LLMResponseTooLarge(LLMServiceError):
    pass


class LLMService:
    def _validate_configuration(self) -> None:
        if not settings.LLM_BASE_URL:
            raise LLMNotConfigured(
                "LLM service is not configured."
            )

        if not settings.LLM_API_KEY:
            raise LLMNotConfigured(
                "LLM API key is not configured."
            )

        if not settings.LLM_MODEL:
            raise LLMNotConfigured(
                "LLM model is not configured."
            )

    async def send(self, prompt: str) -> str:
        self._validate_configuration()

        if not isinstance(prompt, str):
            raise LLMRequestError(
                "Prompt must be a string."
            )

        if not prompt.strip():
            raise LLMRequestError(
                "Prompt cannot be empty."
            )

        timeout = httpx.Timeout(
            settings.LLM_TIMEOUT
        )

        headers = {
            "Authorization": (
                f"Bearer {settings.LLM_API_KEY}"
            ),
            "Content-Type": "application/json",
        }

        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }

        try:
            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=False,
            ) as client:
                response = await client.post(
                    settings.LLM_BASE_URL,
                    headers=headers,
                    json=payload,
                )

        except httpx.TimeoutException as exc:
            raise LLMRequestError(
                "LLM request timed out."
            ) from exc

        except httpx.HTTPError as exc:
            raise LLMRequestError(
                f"LLM request failed: {exc}"
            ) from exc

        if response.status_code >= 400:
            raise LLMRequestError(
                f"LLM service returned HTTP "
                f"{response.status_code}."
            )

        if len(response.content) > (
            settings.LLM_MAX_RESPONSE_SIZE
        ):
            raise LLMResponseTooLarge(
                "LLM response exceeds the maximum size."
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise LLMRequestError(
                "LLM service returned invalid JSON."
            ) from exc

        try:
            content = data["choices"][0]["message"]["content"]
        except (
            KeyError,
            IndexError,
            TypeError,
        ) as exc:
            raise LLMRequestError(
                "LLM service returned an invalid response."
            ) from exc

        if not isinstance(content, str):
            raise LLMRequestError(
                "LLM response content is not text."
            )

        return content


llm_service = LLMService()


async def send_to_llm(prompt: str) -> str:
    return await llm_service.send(prompt)