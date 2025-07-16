import aiofiles
import os
import shutil
from configs import UPLOAD_DIR
from fastapi import UploadFile, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from validators import jwt_protect, passkey_jwt_protect
from database import get_db_async
from model import User


# def save_uploaded_file(file: UploadFile) -> str:
#     if not file.filename.lower().endswith(('.pdf', '.docx')):
#         raise HTTPException(
#             status_code=400, detail="Only PDF or DOCX Files are allowed")
#     file_path = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_path, 'wb') as f:
#         shutil.copyfileobj(file.file, f)
#     return file_path
async def save_uploaded_file(file: UploadFile) -> str:
    """
    Asynchronously saves a PDF or DOCX upload.
    """
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=400, detail="Only PDF or DOCX Files are allowed"
        )
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    async with aiofiles.open(file_path, 'wb') as out_file:
        while True:
            content = await file.read(1024)  # Read chunks
            if not content:
                break
            await out_file.write(content)

    return file_path

# def get_current_user(
#     user_id: str = Depends(jwt_protect),
#     db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(User.id == user_id).first()
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user


async def get_current_user(user_id: str = Depends(jwt_protect), db: AsyncSession = Depends(get_db_async)):
    user = await db.execute(select(User).where(User.id == user_id))
    user_result = user.scalars().first()
    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")
    return user_result


async def passkey_get_current_user(user_id: str = Depends(jwt_protect), db: AsyncSession = Depends(get_db_async)) -> User:
    user = await db.execute(select(User).where(User.id == user_id))
    user_result = user.scalars().first()
    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")
    return user_result


# def passkey_get_current_user(
#     user_id: int = Depends(passkey_jwt_protect),
#     db: Session = Depends(get_db)
# ) -> User:
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return user
