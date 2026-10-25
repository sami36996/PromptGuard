from pydantic import BaseModel, Field, HttpUrl


class WebScanRequest(BaseModel):
    url: HttpUrl = Field(
        ...,
        description="HTTP or HTTPS URL to retrieve and analyze."
    )


class WebScanResponse(BaseModel):
    source: str
    trusted: bool
    url: str
    final_url: str
    status_code: int
    content_type: str
    analysis: dict