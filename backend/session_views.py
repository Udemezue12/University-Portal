# dependencies.py
from fastapi import Request, HTTPException, status, APIRouter, Depends
from fastapi.responses import JSONResponse
import logging
from datetime import datetime


session_router = APIRouter()
logger = logging.getLogger("uvicorn.error")


# def require_user_session(request: Request):
#     session = request.session
#     username = session.get("username")
#     role = session.get("role")

#     if not username or not role:
#         logger.warning(f"Suspicious ping attempt - session data missing: "
#                        f"username={username}, role={role}")
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Session expired or user not authenticated"
#         )

#     server_token = session.get("access_token")
#     if server_token:
#         logger.warning(f"Access Token  token mismatch for user_id={server_token}")
#         # return ("Success")
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail='Access Token not found'

#         )

#     return {

#         "username": username,
#         "role": role
#     }


# @session_router.get("/ping")
# def keep_alive(
#     request: Request,
#     user_info: dict = Depends(require_user_session)
# ):
#     request.session["last_active"] = datetime.utcnow().isoformat()

#     # print(f"[PING] User: {user_info['username']} (ID: {user_info['user_id']}) is active")

#     return {"status": "ok", "user": user_info["username"]}
