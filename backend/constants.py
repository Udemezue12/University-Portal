
import os
import shutil
from configs import UPLOAD_DIR
from fastapi import UploadFile, HTTPException, Depends, Request
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from validators import jwt_protect, passkey_jwt_protect
from database import get_db
from model import User


def save_uploaded_file(file: UploadFile) -> str:
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=400, detail="Only PDF or DOCX Files are allowed")
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    return file_path


def get_current_user(
    user_id: str = Depends(jwt_protect),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def passkey_get_current_user(
    user_id: int = Depends(passkey_jwt_protect),
    db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
