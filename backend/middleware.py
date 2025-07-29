from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
# from starlette.responses import Response
from fastapi import Request, Response, HTTPException
# from datetime import datetime, timedelta


# class SessionTimeoutMiddleware(BaseHTTPMiddleware):
#     def __init__(self, app, timeout_minutes: int = 5):
#         super().__init__(app)
#         self.timeout = timedelta(minutes=timeout_minutes)

#     async def dispatch(self, request: Request, call_next):
#         now = datetime.utcnow()

#         last_active_str = None
#         if hasattr(request, "session"):
#             last_active_str = request.session.get("last_active")
#         if not last_active_str:
#             last_active_str = request.cookies.get("last_active")

#         should_clear = False

#         if last_active_str:
#             try:
#                 last_active = datetime.fromisoformat(last_active_str)
#                 if now - last_active > self.timeout:
#                     should_clear = True
#             except ValueError:
#                 should_clear = True

#         response: Response = await call_next(request)

#         if should_clear:
#             if hasattr(request, "session"):
#                 request.session.clear()
#             response.delete_cookie("last_active")

#         if hasattr(request, "session"):
#             request.session["last_active"] = now.isoformat()
#         response.set_cookie(
#             "last_active",
#             now.isoformat(),
#             httponly=True,
#             samesite="Lax"
#         )

#         return response
class SecureHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # response.headers["Content-Security-Policy"] = (
        #     "default-src 'self'; "
        #     "img-src 'self' https://picsum.photos https://i.picsum.photos; "
        #     "script-src 'self'; "
        #     "object-src 'none';"
        # )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response
