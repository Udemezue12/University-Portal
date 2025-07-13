from fastapi import WebSocket
from typing import  Dict, List



class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, WebSocket] = {}
        self.user_roles: Dict[int, str] = {}
        self.user_departments: Dict[int, List[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, role: str, departments: List[int]):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        self.user_roles[user_id] = role
        self.user_departments[user_id] = departments

    def disconnect(self, websocket: WebSocket, user_id: int):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        self.user_connections.pop(user_id, None)
        self.user_roles.pop(user_id, None)
        self.user_departments.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        websocket = self.user_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast_to_department(self, message: dict, department_id: int):
        for user_id, websocket in self.user_connections.items():
            user_depts = self.user_departments.get(user_id, [])
            if department_id in user_depts:
                try:
                    await websocket.send_json(message)
                except:
                    continue




manager = ConnectionManager()
