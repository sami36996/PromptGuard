"""WebSocket routes."""
from fastapi import APIRouter, WebSocket

router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to PromptGuard")
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")