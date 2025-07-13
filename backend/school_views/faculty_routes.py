from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_utils.cbv import cbv
from database import get_db
from constants import get_current_user
from typing import List
from model import Faculty, User
from schema import FacultyCreate, FacultyOut, Role


router = APIRouter()


@cbv(router)
class FacultyRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    @router.get('/faculties', response_model=List[FacultyOut])
    def get_faculties(self):
        return self.db.query(Faculty).all()

    @router.post('/create/faculty', response_model=dict)
    def create_faculty(self, data: FacultyCreate):
        self._check_admin()
        name = data.name
        db = self.db
        existing = db.query(Faculty).filter_by(
            name=name).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="This Faculty has Already been created")
        faculty = Faculty(
            name=name

        )
        db.add(faculty)
        db.commit()
        db.refresh(faculty)
        return {
            "status": "success",
            "message": "Session created successfully.",
            "data": {
                "id": faculty.id,
                "name": name,

            }
        }