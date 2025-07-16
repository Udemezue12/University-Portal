from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from datetime import datetime, timedelta

class SessionTimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout_minutes: int = 5):
        super().__init__(app)
        self.timeout = timedelta(minutes=timeout_minutes)

    async def dispatch(self, request: Request, call_next):
        session = request.session
        now = datetime.utcnow()

       
        last_active_str = session.get("last_active")
        if last_active_str:
            try:
                last_active = datetime.fromisoformat(last_active_str)
                if now - last_active > self.timeout:
                    session.clear()  
            except ValueError:
                session.clear()  

       
        session["last_active"] = now.isoformat()

        response = await call_next(request)
        return response
