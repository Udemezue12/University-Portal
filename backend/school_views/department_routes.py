from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from fastapi_utils.cbv import cbv
from database import get_db
from constants import get_current_user
from typing import List
from model import Faculty, Department, Level, User, SessionModel
from schema import DepartmentOut, LevelOut, Role


router = APIRouter()



@cbv(router)
class DepartmentRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    @router.post("/departments/create", response_model=dict)
    def create_department(self, department_data: dict = Body(...)):
        self._check_admin()

        name = department_data.get("name")
        session_id = department_data.get("session_id")
        faculty_id = department_data.get("faculty_id")

        if not name or not session_id or not faculty_id:
            raise HTTPException(
                status_code=400, detail="All fields are required.")

        existing = self.db.query(Department).filter_by(name=name).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Department with this name already exists.")

        session = self.db.query(SessionModel).filter_by(id=session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        faculty = self.db.query(Faculty).filter_by(id=faculty_id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found.")

        department = Department(
            name=name, session_id=session_id, faculty_id=faculty_id)
        self.db.add(department)
        self.db.commit()
        self.db.refresh(department)

        return {
            "status": "success",
            "message": "Department created successfully.",
            "data": {
                "id": department.id,
                "name": department.name,
                "session": {
                    "id": session.id,
                    "name": session.name,
                    "start_date": session.start_date,
                    "end_date": session.end_date,
                },
                "faculty": {
                    "id": faculty.id,
                    "name": faculty.name,
                },
            },
        }

    @router.get("/levels/by-department/{department_id}", response_model=List[LevelOut])
    def get_levels_by_department(self, department_id: int):
        levels = self.db.query(Level).filter(
            Level.department_id == department_id).all()
        if not levels:
            raise HTTPException(
                status_code=404, detail="No levels found for the specified department.")
        return levels

    @router.get("/departments", response_model=List[DepartmentOut])
    def get_departments(self):

        # self._check_admin()

        departments = self.db.query(Department).options(
            joinedload(Department.session)).all()
        if departments is None:
            return []
        return departments