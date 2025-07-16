from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import  HTTPException,  Request
from env_const import SECRET_KEY, ALGORITHM


async def validate_csrf(request: Request):
    session_token = request.session.get("csrf_token")
    header_token = request.headers.get("X-CSRF-TOKEN")
    if session_token != header_token:
        raise HTTPException(status_code=403, detail="CSRF token mismatch")
async def jwt_protect(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="Token missing user ID")
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
async def passkey_jwt_protect(request: Request) -> int:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")
        return int(user_id)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def validate_csrf_dependency(request:Request):
    await validate_csrf(request)
