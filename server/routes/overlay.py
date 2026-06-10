from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from models.creator import Creator
from services.ws_manager import ws_manager

router = APIRouter(prefix="/api/overlay", tags=["overlay"])


@router.websocket("/ws/{obs_token}")
async def websocket_overlay(websocket: WebSocket, obs_token: str):
    # Authenticate token
    creator = await Creator.find_one(Creator.obs_token == obs_token)
    if not creator:
        await websocket.close(code=4001)  # Unauthorized
        return

    creator_id = str(creator.id)
    await ws_manager.connect(creator_id, websocket)

    try:
        while True:
            # Keep connection open and check health
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(creator_id, websocket)
    except Exception:
        ws_manager.disconnect(creator_id, websocket)
