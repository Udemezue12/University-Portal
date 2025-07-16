from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import JSONResponse
from validators import validate_csrf_dependency
from database import get_db_async
from auth.auth import Auth as AuthService
from schema import UserLoginInput, UserRegisterInput
from auth.auth import Auth

auth_router = APIRouter()


@auth_router.post('/register')
async def register(data: UserRegisterInput, db: AsyncSession = Depends(get_db_async), _: None = Depends(validate_csrf_dependency)):
    service = AuthService(db)
    return await service.register(data)


@auth_router.post('/login')
async def login(data: UserLoginInput, db: AsyncSession = Depends(get_db_async)):
    service = AuthService(db)
    return await service.login(data)


@auth_router.post('/logout')
async def logout(request: Request,):
    request.session.clear()
    res = JSONResponse({"message": "Logged out"})

    for cookie in ["sessionid", "session", "csrf_token", "access_token"]:
        res.delete_cookie(key=cookie, path="/")

    return res
