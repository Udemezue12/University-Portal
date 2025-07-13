import os
from webauthn.helpers.structs import (
    UserVerificationRequirement
)
from webauthn import (
    generate_authentication_options,
)
from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException,Depends
from model import PasskeyCredential, User
from schema import CredentialAttestation, VerifyLoginRequest
from validators import passkey_jwt_protect, validate_csrf_dependency
import traceback
from constants import get_db
from fastapi_utils.cbv import cbv
from sqlalchemy.orm import Session
from base_code import base64url_encode
from jose import jwt
from env_const import RP_ID,ORIGIN, jwt_expiration, SECRET_KEY, ALGORITHM



passkey_router = APIRouter()


@cbv(passkey_router)
class PasskeyRegisterRouter:
    user_id: int = Depends(passkey_jwt_protect)
    db: Session = Depends(get_db)
    validate_csrf: None = Depends(validate_csrf_dependency)

    @passkey_router.get('/passkey/devices')
    def get_registered_passkey(self):
        user_id = self.user_id
        db = self.db
        credentials = db.query(PasskeyCredential).filter_by(
            user_id=user_id).all()
        return [
            {
                'device_fingerprint': cred.device_fingerprint
            }
            for cred in credentials
        ]

    @passkey_router.post("/register/passkey")
    def register_passkey(self, data: CredentialAttestation):
        credential_id = data.credential_id
        public_key = data.public_key
        device_fingerprint = data.device_fingerprint

        existing_cred = self.db.query(PasskeyCredential).filter_by(
            user_id=self.user_id,
            credential_id=credential_id,
            public_key=public_key,
            device_fingerprint=device_fingerprint
        ).first()

        if existing_cred:
            raise HTTPException(
                status_code=400,
                detail="These details have already been registered."
            )

        new_cred = PasskeyCredential(
            credential_id=credential_id,
            public_key=public_key,
            user_id=self.user_id,
            device_fingerprint=device_fingerprint
        )

        self.db.add(new_cred)

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

        return {"message": "Passkey registered successfully"}


@cbv(passkey_router)
class PasskeyLoginRouter:
    db: Session = Depends(get_db)

    @passkey_router.get('/verify/login')
    def passkey_verify_login(self):
        db = self.db
        
        credentials = db.query(PasskeyCredential).filter_by().all()
        if not credentials:
            raise HTTPException(
                status_code=404, detail="No passkeys registered")
        allow_credentials = [
            {
                'id': credential.credential_id,
                'type': 'public-key'
            }
            for credential in credentials
        ]
        options = generate_authentication_options(
            rp_id=RP_ID,
            allow_credentials=allow_credentials,
            timeout=60000,
            user_verification=UserVerificationRequirement.REQUIRED
        )
        
        public_key_options = {
            'challenge': base64url_encode(options.challenge),
            'rpId': options.rp_id,
            'timeout': options.timeout,
            'userVerification': options.user_verification,
            'allowCredentials': allow_credentials,
        }

        return JSONResponse({'publicKey': public_key_options})

   
    @passkey_router.post("/passkey/authenticate")
    def passkey_authenticate(self, data: VerifyLoginRequest):
        db= self.db
        try:

            if not data.credential_id:
                raise HTTPException(status_code=400, detail="Credential ID is required")

            stored_cred = db.query(PasskeyCredential).filter_by(credential_id=data.credential_id).first()
            if not stored_cred:
                raise HTTPException(status_code=404, detail="Invalid credential ID")

            user = db.query(User).filter_by(id=stored_cred.user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            token = jwt.encode(
                {"sub": str(user.id), "exp": jwt_expiration},
                SECRET_KEY, algorithm=ALGORITHM
            )

            response = JSONResponse(content={
                "token": token,
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
                'username': user.username
           
            })

            response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=60 * 60 * 24
        )

            return response

        except Exception as e:
            print("🔥 ERROR:", str(e))
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")