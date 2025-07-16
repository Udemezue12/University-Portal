from fastapi import APIRouter, Depends,HTTPException
from fastapi_utils.cbv import cbv
from sqlalchemy.orm import Session, joinedload
from database import get_db
from constants import get_current_user
from model import User, Role, Department, StudentLevelProgress,LecturerDepartmentAndLevel
from schema import AdminLecturerOut

admin_router = APIRouter(prefix="/admin", tags=["Admin"])
@cbv(admin_router)
class AdminRouter:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")
    @admin_router.get("/lecturers", response_model=list    [AdminLecturerOut])
    def get_all_lecturers(self):
        self._check_admin()
        db = self.db
        lecturers = db.query(User).filter(User.role == Role.LECTURER).all()
        return lecturers

    @admin_router.get("/students-by-department-level")
    def get_students_by_department_level(self):
        self._check_admin()
        db = self.db
        departments = db.query(Department).all()
        result = []

        for dept in departments:
            dept_obj = {
                "department_name": dept.name,
                "levels": []
            }
            for level in dept.levels:
                students_progress = db.query    (StudentLevelProgress).filter    (StudentLevelProgress.level_id == level.id).all    ()
                students_list = []
                for progress in students_progress:
                    student = db.query(User).filter(User.id ==     progress.student_id).first()
                    students_list.append({
                        "id": student.id,
                        "name": student.name,
                        "email": student.email,
                        "level": level.name,
                        "department": dept.name,
                    })
                dept_obj["levels"].append({
                    "level_name": level.name,
                    "students": students_list
                })
            result.append(dept_obj)
        return result
   

    @admin_router.get("/lecturers-by-departments-levels")
    def get_lecturers_by_departments_levels(self):
        self._check_admin()
        db = self.db
        departments = db.query(Department).all()
        result = []

        for dept in departments:
            dept_obj = {
                "department_name": dept.name,
            "levels": []
            }
            for level in dept.levels:
                lecturers_in_level = db.query(User).join(User.    assigned_departments).filter(
                    LecturerDepartmentAndLevel.department_id     == dept.id,
                    LecturerDepartmentAndLevel.level_id ==     level.id
                ).all()
                lecturers_list = [{
                    "id": lecturer.id,
                    "name": lecturer.name,
                    "email": lecturer.email,
                } for lecturer in lecturers_in_level]

                if lecturers_list:
                    dept_obj["levels"].append({
                        "level_name": level.name,
                        "lecturers": lecturers_list
                    })
            if dept_obj["levels"]:
                result.append(dept_obj)
        return result
    
