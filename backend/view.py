# import base64
# import secrets
# from datetime import datetime, timedelta
# from fastapi import APIRouter, Depends, HTTPException, Request, Header
# from fastapi.responses import JSONResponse
# from sqlalchemy.orm import Session
# from jose import jwt
# from webauthn import (
#     generate_authentication_options,
#     generate_registration_options,
#     verify_registration_response,
#     verify_authentication_response,
# )
# from webauthn.helpers.structs import (
#     PublicKeyCredentialCreationOptions,
#     PublicKeyCredentialRequestOptions,
#     AttestationConveyancePreference,
#     AuthenticatorSelectionCriteria,
#     RegistrationCredential,
#     AuthenticationCredential,
#     UserVerificationRequirement,
# )
# from model import User, PasskeyCredential
# from schema import CredentialAttestation, StartLoginRequest, VerifyLoginRequest
# from database import SessionLocal

# router = APIRouter(prefix="/api", tags=["Passkey"])

# SECRET_KEY = "your-secret"
# ALGORITHM = "HS256"
# JWT_EXPIRE_MINUTES = 60 * 24
# RP_ID = "ontech-systems.onrender.com"
# ORIGIN = "https://ontech-systems.onrender.com"

# login_challenges = {}


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.get("/csrf/")
# def get_csrf_token(request: Request):
#     token = secrets.token_urlsafe(16)
#     request.session["csrf_token"] = token
#     return {"csrfToken": token}

# @router.get("/create/fingerprint/")
# def get_registered_fingerprints(request: Request, db: Session = Depends(get_db)):
#     token = request.cookies.get("access_token")
#     if not token:
#         raise HTTPException(status_code=401, detail="Unauthorized")

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id = int(payload.get("sub"))
#     except Exception:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     creds = db.query(PasskeyCredential).filter_by(user_id=user_id).all()
#     return [{"device_fingerprint": c.device_fingerprint} for c in creds]

# @router.post("/create/fingerprint/")
# def register_passkey(
#     payload: CredentialAttestation,
#     request: Request,
#     x_csrf_token: str = Header(...),
#     db: Session = Depends(get_db)
# ):
#     session_token = request.session.get("csrf_token")
#     if session_token != x_csrf_token:
#         raise HTTPException(status_code=403, detail="Invalid CSRF token")

#     token = request.cookies.get("access_token")
#     if not token:
#         raise HTTPException(status_code=401, detail="Unauthorized")

#     try:
#         payload_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id = int(payload_data.get("sub"))
#     except Exception:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     credential_id = payload.id
#     attestation_object = base64.b64decode(payload.response["attestationObject"])
#     public_key = base64.b64encode(attestation_object).decode()

#     new_cred = PasskeyCredential(
#         credential_id=credential_id,
#         public_key=public_key,
#         device_fingerprint=payload.device_fingerprint,
#         user_id=user_id,
#     )

#     db.add(new_cred)
#     try:
#         db.commit()
#     except Exception:
#         db.rollback()
#         raise HTTPException(status_code=400, detail="Credential already exists")

#     return {"message": "Passkey registered"}

# @router.post("/start-login/")
# def start_login(data: StartLoginRequest, db: Session = Depends(get_db)):
#     user = db.query(User).filter_by(username=data.username).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     creds = db.query(PasskeyCredential).filter_by(user_id=user.id).all()
#     if not creds:
#         raise HTTPException(status_code=404, detail="No passkeys registered")

#     allow_credentials = [
#         {"id": cred.credential_id, "type": "public-key"} for cred in creds
#     ]

#     options = generate_authentication_options(
#         rp_id=RP_ID,
#         allow_credentials=allow_credentials,
#         user_verification=UserVerificationRequirement.REQUIRED
#     )

#     login_challenges[user.username] = options.challenge
#     return options

# @router.post("/verify-login/")
# def verify_login(data: VerifyLoginRequest, db: Session = Depends(get_db)):
#     auth_cred = AuthenticationCredential.parse_obj(data.credential)
#     username = data.username

#     user = db.query(User).filter_by(username=username).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     stored = db.query(PasskeyCredential).filter_by(credential_id=data.credential["id"]).first()
#     if not stored:
#         raise HTTPException(status_code=404, detail="Credential not found")

#     challenge = login_challenges.get(username)
#     if not challenge:
#         raise HTTPException(status_code=400, detail="No challenge stored")

#     try:
#         verify_authentication_response(
#             credential=auth_cred,
#             expected_challenge=challenge,
#             expected_rp_id=RP_ID,
#             expected_origin=ORIGIN,
#             credential_public_key=base64.b64decode(stored.public_key),
#             credential_current_sign_count=0,
#             require_user_verification=True,
#         )

#         jwt_payload = {
#             "sub": str(user.id),
#             "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES),
#         }
#         token = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)

#         response = JSONResponse(content={
#             "message": "Login successful",
#             "user_id": user.id,
#             "username": user.username,
#             "role": user.role,
#             "email": user.email,
#         })
#         response.set_cookie(
#             key="access_token",
#             value=token,
#             httponly=True,
#             secure=True,
#             samesite="Lax",
#             max_age=60 * 60 * 24,
#         )
#         return response

#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")
