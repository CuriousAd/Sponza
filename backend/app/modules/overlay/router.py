from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.modules.creators.models import Creator
from app.modules.overlay.manager import connection_manager

router = APIRouter(prefix="/api/overlay", tags=["OBS Overlay WebSocket"])


@router.websocket("/ws/{obs_token}")
async def websocket_overlay(websocket: WebSocket, obs_token: str):
    """WebSocket endpoint for OBS Browser Source streaming overlays."""
    creator = await Creator.find_one(Creator.obs_token == obs_token)
    if not creator:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await connection_manager.connect(obs_token, websocket)
    try:
        while True:
            # Keep connection alive with ping/pong or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connection_manager.disconnect(obs_token, websocket)
