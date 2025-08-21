import asyncio
from datetime import date
from typing import List

from constants import get_current_user, save_uploaded_file
from database import get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi_utils.cbv import cbv
from model import (
    Course,
    Department,
    LecturerDepartmentAndLevel,
    Level,
    StudentLevelProgress,
    User,
)
from notify import manager
from schema import CourseResponse, Role
from sqlalchemy.orm import Session, joinedload

router = APIRouter()


@cbv(router)
class CourseRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Admin access required.")

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(status_code=403, detail="Student access required.")

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(status_code=403, detail="Lecturer access required.")

    @router.post("/create/course", response_model=dict)
    async def create_course(
        self,
        title: str = Form(...),
        description: str = Form(...),
        grade_point: int = Form(...),
        department_id: int = Form(...),
        level_id: int = Form(...),
        syllabus: UploadFile = File(None),
    ):
        self._check_lecturer()
        current_user = self.current_user.id
        db = self.db

        assigned_departments = (
            db.query(LecturerDepartmentAndLevel)
            .filter_by(lecturer_id=current_user)
            .all()
        )
        if not assigned_departments:
            raise HTTPException(
                status_code=403,
                detail="You have not been assigned to any department. Please contact the admin.",
            )

        assigned_department_ids = [ad.department_id for ad in assigned_departments]
        if department_id not in assigned_department_ids:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to the selected department.",
            )

        department = db.query(Department).filter_by(id=department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found.")

        if not department.session:
            raise HTTPException(
                status_code=400, detail="Department has no session assigned."
            )

        today = date.today()
        if not (department.session.start_date <= today <= department.session.end_date):
            raise HTTPException(
                status_code=400,
                detail="The session for this department is not active. Cannot create course.",
            )
        level = (
            db.query(Level).filter_by(id=level_id, department_id=department_id).first()
        )
        if not level:
            raise HTTPException(
                status_code=404,
                detail="Level not found or doesn't belong to selected department.",
            )

        syllabus_path = await save_uploaded_file(syllabus) if syllabus else None

        course = Course(
            title=title,
            description=description,
            grade_point=grade_point,
            department_id=department_id,
            syllabus_path=syllabus_path,
            lecturer_id=current_user,
            level_id=level_id,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        asyncio.create_task(
            manager.broadcast_to_department(
                {
                    "event": "course_created",
                    "message": f"New course '{course.title}' created by {self.current_user.name}",
                    "course_id": course.id,
                    "department_id": department_id,
                },
                department_id,
            )
        )

        return {
            "status": "success",
            "message": "Course created successfully.",
            "data": CourseResponse.from_orm(course),
        }

    @router.put("/courses/{course_id}", response_model=CourseResponse)
    async def update_course(
        self,
        course_id: int,
        title: str = Form(...),
        description: str = Form(...),
        level_id: int = Form(...),
        syllabus: UploadFile = File(None),
    ):
        self._check_lecturer()
        current_user = self.current_user.id
        db = self.db

        course_update = (
            db.query(Course)
            .filter(Course.id == course_id, Course.lecturer_id == current_user)
            .first()
        )

        if not course_update:
            raise HTTPException(
                status_code=404, detail="Course not found or not owned by the lecturer"
            )

        course_update.title = title
        course_update.description = description

        if syllabus:
            course_update.syllabus_path = save_uploaded_file(syllabus)

        db.commit()
        db.refresh(course_update)

        asyncio.create_task(
            manager.broadcast_to_department(
                {
                    "event": "course_updated",
                    "message": f"Course '{course_update.title}' was updated by {self.current_user.name}",
                    "course_id": course_update.id,
                    "department_id": course_update.department_id,
                },
                course_update.department_id,
            )
        )

        return CourseResponse.from_orm(course_update)

    @router.get("/courses", response_model=List[CourseResponse])
    def browse_courses(self):
        self._check_student()

        student_levels = (
            self.db.query(StudentLevelProgress)
            .filter_by(student_id=self.current_user.id)
            .all()
        )
        level_ids = [sl.level_id for sl in student_levels]

        if not level_ids:
            raise HTTPException(
                status_code=403, detail="You have not been assigned to any level."
            )

        courses = (
            self.db.query(Course)
            .filter(Course.level_id.in_(level_ids))
            .options(
                joinedload(Course.lecturer),
                joinedload(Course.department),
                joinedload(Course.levels),
            )
            .all()
        )
        return [
            CourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                grade_point=course.grade_point,
                lecturer_name=course.lecturer.name if course.lecturer else "N/A",
                department_name=course.department.name if course.department else "N/A",
                level_name=course.levels.name if course.levels else "N/A",
            )
            for course in courses
        ]
