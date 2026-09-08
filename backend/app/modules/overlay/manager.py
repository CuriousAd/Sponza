import logging
from collections import defaultdict
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("sponsa.overlay.manager")


class ConnectionManager:
    """Manages active WebSocket connections for OBS overlays & live dashboards."""

    def __init__(self):
        # Map obs_token -> set of active WebSockets
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, obs_token: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[obs_token].add(websocket)
        logger.info(f"OBS Overlay WebSocket connected for token: {obs_token[:8]}...")

    def disconnect(self, obs_token: str, websocket: WebSocket):
        self._connections[obs_token].discard(websocket)
        if not self._connections[obs_token]:
            del self._connections[obs_token]
        logger.info(f"OBS Overlay WebSocket disconnected for token: {obs_token[:8]}...")

    async def broadcast_tip(self, creator_id: str, obs_token: str, tip_data: dict):
        """Fan-out real-time tip alert to all active overlay clients for a token."""
        connections = list(self._connections.get(obs_token, set()))
        if not connections:
            return

        dead_sockets = []
        for ws in connections:
            try:
                await ws.send_json(tip_data)
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(obs_token, ws)


connection_manager = ConnectionManager()
