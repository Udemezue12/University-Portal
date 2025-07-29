# from jose import jwt, JWTError, ExpiredSignatureError
import jwt
from fastapi import HTTPException,  Request
from env_const import SECRET_KEY, ALGORITHM
from key_configs import PUBLIC_KEY, R_ALGORITHM


async def validate_csrf(request: Request):
    session_token = request.session.get("csrf_token")
    header_token = request.headers.get("X-CSRF-TOKEN")
    if not session_token or not header_token:
        raise HTTPException(status_code=403, detail="Missing CSRF token")
    if session_token != header_token:
        raise HTTPException(status_code=403, detail="CSRF token mismatch")



async def jwt_protect(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        
        payload = jwt.decode(token, PUBLIC_KEY,  algorithms=[R_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def passkey_jwt_protect(request: Request) -> int:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="Token missing user ID")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def validate_csrf_dependency(request: Request):
    await validate_csrf(request)
