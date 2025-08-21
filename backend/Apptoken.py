import secrets

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

csrf_router = APIRouter()


@csrf_router.get("/csrf_token")
def get_csrf_token(request: Request):
    csrf_token = secrets.token_hex(32)
    request.session["csrf_token"] = csrf_token

    response = JSONResponse(
        content={"csrf_token": csrf_token},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:7000",
            "Access-Control-Allow-Credentials": "true",
        },
    )
    return response
