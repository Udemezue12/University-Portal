
from jose import jwt
from fastapi import Request,  HTTPException, Response
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from model import User
from env_const import SECRET_KEY, ALGORITHM, jwt_expiration
from extension import db
from validators import validate_csrf

auth_router = APIRouter()


@auth_router.post('/register')
def register(request: Request, data: dict):
    validate_csrf(request)
    username = data['username']
    email = data['email']
    password = data['password']
    name = data['name']
    role = data['role']
    if db.query(User).filter_by(username=username).first():
        raise HTTPException(status_code=400, detail='Username already taken')
    if db.query(User).filter_by(email=email).first():
        raise HTTPException(
            status_code=400, detail="Email has already been used")
    if db.query(User).filter_by(name=name).first():
        raise HTTPException(
            status_code=400, detail="Name has already been used")

    user = User(username=username, email=email, name=name, role=role)
    user.set_password(password)
    db.add(user)
    db.commit()
    db.close()
    return JSONResponse(content={
        "messsage": "Registered successfully"
    })


@auth_router.post('/login')
def login(request: Request, data: dict):
    username = data['username']
    password = data['password']

    user = db.query(User).filter_by(username=username).first()
    if not user or not user.check_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({
        "sub": str(user.id),
        "exp": jwt_expiration
    }, SECRET_KEY, algorithm=ALGORITHM)

    response = JSONResponse({
        "username": user.username,
        "email": user.email,
        "user_id": user.id,
        'role': user.role,
        "message": "Login successful",
        "token": token
    })
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="Lax",
        secure=False,
        max_age = 60 * 60 * 24

    )
    return response


@auth_router.post('/logout')
def logout(request: Request, response: Response):
    request.session.clear()
    res = JSONResponse({"message": "Logged out"})

    res.delete_cookie(key="sessionid", path="/")
    res.delete_cookie(key="session", path="/")
    res.delete_cookie(key="csrftoken", path="/")
    res.delete_cookie(key="access_token", path="/")

    return res

