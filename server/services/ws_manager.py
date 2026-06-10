from collections import defaultdict

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        # Maps creator_id string to active WebSocket instances
        self.active_connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, creator_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[creator_id].add(websocket)

    def disconnect(self, creator_id: str, websocket: WebSocket):
        self.active_connections[creator_id].discard(websocket)

    async def broadcast_tip(self, creator_id: str, message: dict):
        """Sends data immediately to all connected screens for a creator."""
        if creator_id not in self.active_connections:
            return

        dead_connections = []
        for ws in self.active_connections[creator_id]:
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                dead_connections.append(ws)
            except Exception:
                dead_connections.append(ws)

        # Cleanup disconnected views
        for ws in dead_connections:
            self.disconnect(creator_id, ws)


ws_manager = ConnectionManager()
