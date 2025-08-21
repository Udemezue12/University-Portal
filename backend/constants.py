import os

import aiofiles
from database import get_db_async
from fastapi import Depends, HTTPException, UploadFile
from file_configs import UPLOAD_DIR
from model import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from validators import jwt_protect, passkey_jwt_protect


async def save_uploaded_file(file: UploadFile) -> str:
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=400, detail="Only PDF or DOCX Files are allowed"
        )
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        while True:
            content = await file.read(1024)
            if not content:
                break
            await out_file.write(content)

    return file_path


async def get_current_user(
    user_id: str = Depends(jwt_protect), db: AsyncSession = Depends(get_db_async)
):
    user = await db.execute(select(User).where(User.id == user_id))
    user_result = user.scalars().first()
    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")
    return user_result


async def passkey_get_current_user(
    user_id: str = Depends(passkey_jwt_protect),
    db: AsyncSession = Depends(get_db_async),
) -> User:
    user = await db.execute(select(User).where(User.id == user_id))
    user_result = user.scalars().first()
    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")
    return user_result
