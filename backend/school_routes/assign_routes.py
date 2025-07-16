from fastapi import APIRouter, Depends
from database import get_db_async
from constants import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from model import User
from school_views.assign_views import AssignService
from schema import AssignLecturerInput, AssignStudentInput, PromoteInput

router = APIRouter(prefix="/assign", tags=["Assign"])

@router.post('/lecturer')
async def assign_lecturer_to_departments(
    payload: AssignLecturerInput,
    db: AsyncSession = Depends(get_db_async),
    current_user: User = Depends(get_current_user)
):
    service = AssignService(db=db, current_user=current_user)
    return await service.assign_lecturer(payload)

@router.post('/student')
async def assign_student(
    payload: AssignStudentInput,
    db: AsyncSession = Depends(get_db_async),
    current_user: User = Depends(get_current_user)
):
    service = AssignService(db=db, current_user=current_user)
    return await service.assign_student(payload)

@router.post('/promote')
async def promote_student(
    data: PromoteInput,
    db: AsyncSession = Depends(get_db_async),
    current_user: User = Depends(get_current_user)
):
    service = AssignService(db=db, current_user=current_user)
    return await service.promote_student(data)
