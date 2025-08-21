import traceback
from base64 import b64decode
from typing import List

import jwt
from base_code import base64url_encode
from constants import passkey_get_current_user
from database import get_db_async
from env_const import ALGORITHM, RP_ID, SECRET_KEY, jwt_expiration
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi_utils.cbv import cbv
from model import (
    Department,
    LecturerDepartmentAndLevel,
    PasskeyCredential,
    StudentDepartment,
    User,
)
from schema import CredentialAttestation, VerifyLoginRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from validators import passkey_jwt_protect, validate_csrf_dependency
from webauthn import (
    generate_authentication_options,
)
from webauthn.helpers.structs import UserVerificationRequirement

# from key_configs import PRIVATE_KEY, R_ALGORITHM
passkey_router = APIRouter()


@cbv(passkey_router)
class PasskeyRegisterRouter:
    user_id: int = Depends(passkey_jwt_protect)
    db: AsyncSession = Depends(get_db_async)
    validate_csrf: None = Depends(validate_csrf_dependency)

    @passkey_router.get("/passkey/devices")
    async def get_registered_passkey(self):
        result = await self.db.execute(
            select(PasskeyCredential).where(PasskeyCredential.user_id == self.user_id)
        )
        credentials = result.scalars().all()

        return [{"device_fingerprint": cred.device_fingerprint} for cred in credentials]

    @passkey_router.post("/register/passkey")
    async def register_passkey(
        self,
        data: CredentialAttestation,
        current_user=Depends(passkey_get_current_user),
    ):
        db = self.db

        try:
            public_key_bytes = b64decode(data.public_key)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid public key format")

        result = await db.execute(
            select(PasskeyCredential).where(
                (PasskeyCredential.user_id == current_user.id)
                & (PasskeyCredential.credential_id == data.credential_id)
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="This credential ID is already registered for this user.",
            )
        result = await db.execute(
            select(PasskeyCredential).where(
                (PasskeyCredential.user_id == current_user.id)
                & (PasskeyCredential.public_key == public_key_bytes)
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="This public key is already registered for this user.",
            )
        result = await db.execute(
            select(PasskeyCredential).where(
                (PasskeyCredential.device_fingerprint == data.device_fingerprint)
                & (PasskeyCredential.user_id != current_user.id)
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="This fingerprint is already registered with another account.",
            )

        new_cred = PasskeyCredential(
            credential_id=data.credential_id,
            public_key=data.public_key,
            user_id=self.user_id,
            device_fingerprint=data.device_fingerprint,
        )

        db.add(new_cred)

        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        return {"message": "Passkey registered successfully"}


@cbv(passkey_router)
class PasskeyLoginRouter:
    db: AsyncSession = Depends(get_db_async)

    @passkey_router.get("/verify/login")
    async def passkey_verify_login(self):
        db = self.db

        result = await db.execute(select(PasskeyCredential))
        credentials: List[PasskeyCredential] = result.scalars().all()

        if not credentials:
            raise HTTPException(status_code=404, detail="No passkeys registered")

        allow_credentials = [
            {"id": credential.credential_id, "type": "public-key"}
            for credential in credentials
        ]

        options = generate_authentication_options(
            rp_id=RP_ID,
            allow_credentials=allow_credentials,
            timeout=60000,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        public_key_options = {
            "challenge": base64url_encode(options.challenge),
            "rpId": options.rp_id,
            "timeout": options.timeout,
            "userVerification": options.user_verification,
            "allowCredentials": allow_credentials,
        }

        return JSONResponse({"publicKey": public_key_options})

    @passkey_router.post("/passkey/authenticate")
    async def passkey_authenticate(self, data: VerifyLoginRequest):
        db = self.db
        try:
            if not data.credential_id:
                raise HTTPException(status_code=400, detail="Credential ID is required")

            cred_result = await db.execute(
                select(PasskeyCredential).where(
                    PasskeyCredential.credential_id == data.credential_id
                )
            )
            stored_cred = cred_result.scalars().first()

            if not stored_cred:
                raise HTTPException(status_code=404, detail="Invalid credential ID")

            user_result = await db.execute(
                select(User).where(User.id == stored_cred.user_id)
            )
            user = user_result.scalars().first()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            department_name = None
            if user.role.name == "STUDENT":
                _result = await db.execute(
                    select(Department)
                    .join(
                        StudentDepartment,
                        StudentDepartment.department_id == Department.id,
                    )
                    .where(StudentDepartment.student_id == user.id)
                )
                department_name = _result.scalar()
            elif user.role.name == "LECTURER":
                __result = await db.execute(
                    select(Department)
                    .join(
                        LecturerDepartmentAndLevel,
                        LecturerDepartmentAndLevel.department_id == Department.id,
                    )
                    .where(LecturerDepartmentAndLevel.lecturer_id == user.id)
                )
                department_name = __result.scalar()

            token = jwt.encode(
                {"sub": str(user.id), "exp": jwt_expiration},
                SECRET_KEY,
                algorithm=ALGORITHM,
            )

            response = JSONResponse(
                content={
                    "token": token,
                    "user_id": user.id,
                    "role": user.role,
                    "username": user.username,
                    "department": department_name.name if department_name else None,
                }
            )

            response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                samesite="Lax",
                secure=True,
                max_age=60 * 60 * 24,
            )

            return response

        except Exception as e:
            print(" ERROR:", str(e))
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
