import jwt
from fastapi import Request,  HTTPException
from sqlalchemy.future import select
from schema import UserRegisterInput, UserLoginInput
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import JSONResponse
from model import User, StudentDepartment, LecturerDepartmentAndLevel, Department
from env_const import SECRET_KEY, ALGORITHM, jwt_expiration
# from key_configs import PRIVATE_KEY, R_ALGORITHM

class Auth:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _user_exists(self, **kwargs):
        session_db = self.db
        key, value = list(kwargs.items())[0]
        result = await session_db.execute(select(User).where(getattr(User, key) == value))
        user = result.scalars().first()
        return user is not None

    async def _get_department_name(self, user: User):
        session = self.db
        if user.role.name == 'STUDENT':
            _result = await session.execute(select(Department).join(StudentDepartment, StudentDepartment.department_id == Department.id).where(StudentDepartment.student_id == user.id))

        elif user.role.name == 'LECTURER':
            _result = await session.execute(select(Department).join(LecturerDepartmentAndLevel,     LecturerDepartmentAndLevel.department_id == Department.id).where(LecturerDepartmentAndLevel.lecturer_id == user.id))

        else:
            return None
        department = _result.scalar()
        return department.name if department else None

    async def register(self, data: UserRegisterInput):
        session_db = self.db
        username = data.username
        email = data.email
        password = data.password
        name = data.name
        role = data.role
        if await self._user_exists(username=username):
            raise HTTPException(
                status_code=400, detail='Username already taken')
        if await self._user_exists(email=email):
            raise HTTPException(status_code=400, detail='Email already taken')
        if await self._user_exists(name=name):
            raise HTTPException(status_code=400, detail='Name already taken')

        user = User(username=username, email=email, name=name, role=role)
        user.set_password(password)
        session_db.add(user)
        await session_db.commit()

        return JSONResponse(content={
            "messsage": "Registered successfully"
        })

    async def login(self, data:UserLoginInput):
        session = self.db
        username = data.username
        password = data.password
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalars().first()
        if not user or not user.check_password(password):
            raise HTTPException(
                status_code=401, detail="Invalid     credentials")
        department_name = await self._get_department_name(user)

        token = jwt.encode({
            "sub": str(user.id),
            "exp": jwt_expiration
        }, SECRET_KEY, algorithm=ALGORITHM)
        response = JSONResponse({
            "username": user.username,
            "user_id": user.id,
            "role": user.role,
            "message": "Login successful",
            "token": token,
            'department': department_name
        })
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite="Lax",
            secure=True,
            max_age=60 * 60 * 24
        )
        # request.session["role"] = user.role
        # request.session["access_token"] = token
        # response.set_cookie("access_token", token, httponly=True, samesite="Lax", secure=False, max_age=60 * 60 * 24)
        # response.set_cookie("role", user.role, httponly=True, samesite="Lax", secure=False, max_age=60 * 60 * 24)
        return response


