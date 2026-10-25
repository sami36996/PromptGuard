from app.engine.analyzer import analyze_prompt
from app.services.external.web_service import WebContent


def analyze_web_content(
    web_content: WebContent,
    review_threshold: float = 30,
    block_threshold: float = 70,
) -> dict:
    analysis = analyze_prompt(
        prompt=web_content.content,
        review_threshold=review_threshold,
        block_threshold=block_threshold,
    )

    return {
        "source": web_content.source,
        "trusted": False,
        "url": web_content.url,
        "final_url": web_content.final_url,
        "status_code": web_content.status_code,
        "content_type": web_content.content_type,
        "analysis": analysis,
    }