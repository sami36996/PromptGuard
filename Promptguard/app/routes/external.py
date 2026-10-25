from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user

from app.schemas.external import (
    WebScanRequest,
    WebScanResponse,
)
from app.services.external.web_service import (
    WebService,
    WebServiceError,
)
from app.services.external.web_security_service import (
    analyze_web_content,
)


router = APIRouter(
    prefix="/external",
    tags=["External Services"],
)

web_service = WebService()


@router.post(
    "/web",
    response_model=WebScanResponse,
)
async def scan_web(
    request: WebScanRequest,
    current_user=Depends(get_current_user),
):
    """
    Fetch external web content and analyze it
    using the PromptGuard security engine.
    """

    try:
        web_content = await web_service.fetch(
            str(request.url)
        )

        result = analyze_web_content(
            web_content
        )

        return result

    except WebServiceError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc