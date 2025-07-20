# from fastapi.responses import JSONResponse
# from fastapi import Request, HTTPException, status, APIRouter, Depends
# import logging
# from datetime import datetime


# session_router = APIRouter()
# logger = logging.getLogger("uvicorn.error")


# def require_user_session(request: Request):
   

#     role = request.session.get('role') or request.cookies.get("role")
#     token = request.session.get(
#         'access_token') or request.cookies.get("access_token")

#     if not role:
#         logger.warning(f"Suspicious ping attempt - session data missing: "
#                        f" role={role}")
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Session expired or user not authenticated"
#         )

#     if token:
#         logger.info(f"Access token detected for user {role}")

#     return {
       
#         "role": role,
#         "access_token": token
#     }


# @session_router.get("/ping")
# def keep_alive(request: Request, user_info: dict = Depends(require_user_session)):
#     now = datetime.utcnow().isoformat()

#     if hasattr(request, "session"):
#         request.session["last_active"] = now

#     response = JSONResponse(
#         content={"status": "ok", "user": user_info["role"]})
#     response.set_cookie("last_active", now, httponly=True, samesite="Lax", secure=False)
#     return response
