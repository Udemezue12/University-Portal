from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from fastapi_utils.cbv import cbv
from database import get_db
import asyncio
from notify import manager
from datetime import datetime, date, timedelta
from constants import get_current_user
from typing import List, Optional
from model import  User, AssignmentSubmission, AssignmentTemplate, Enrollment, Course
from schema import Role, CourseResponse,UserResponse,AssignmentOut, UserOut

router = APIRouter()




@cbv(router)
class Student:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(
                status_code=403, detail="Only students can access this.")

    @router.get("/students", response_model=List[UserOut])
    def get_students(self):
        self._check_admin()

        return self.db.query(User).filter(User.role == Role.STUDENT).all()

    @router.get('/students/departments')
    def view_student_departments(self):
        self._check_admin()
        students = self.db.query(User).filter(User.role == Role.STUDENT).all()
        result = []
        for student in students:
            departments = [
                assign.departments.name for assign in student.assigned_department_student]
            result.append({
                'student': student.name,
                'student': student.email,
                'departments': departments
            })
        return result

    @router.get("/my-courses", response_model=dict)
    def get_my_enrolled_courses(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(
                status_code=403, detail="Student access required.")

        enrollments = (
            self.db.query(Enrollment)
            .options(joinedload(Enrollment.course).joinedload(Course.lecturer))
            .filter(
                Enrollment.student_id == self.current_user.id,
                Enrollment.status == "approved"
            )
            .all()
        )

        data = []
        for enrollment in enrollments:

            course = enrollment.course
            lecturer = course.lecturer

            data.append({
                "course_id": course.id,
                "title": course.title,
                "description": course.description,
                "lecturer": {
                    "id": lecturer.id,
                    "name": lecturer.name,
                    "email": lecturer.email,
                    "username": lecturer.username
                } if lecturer else None,
                "status": enrollment.status
            })

        return {
            "status": "success",
            "message": "Enrolled courses retrieved  successfully.",
            "data": data
        }

    @router.get("/students-departments-courses", response_model=dict)
    def get_students_departments_courses(self):
        self._check_admin()

        students = self.db.query(User).filter(User.role == Role.STUDENT).all()

        data = []

        for student in students:
            student_data = {
                "id": student.id,
                "username": student.username,
                "email": student.email,
                "departments": [
                    {
                        "id": sd.department.id,
                        "name": sd.department.name
                    } for sd in student.assigned_departments_student
                ],
                "courses_enrolled": [
                    {
                        "id": e.course.id,
                        "title": e.course.title,
                        "description": e.course.description,
                        "status": e.status
                    } for e in student.enrollments
                ]
            }

            data.append(student_data)

        return {
            "status": "success",
            "message": "Students with departments and enrolled courses retrieved successfully.",
            "data": data
        }

    @router.get('/student/assignments', response_model=List[AssignmentOut])
    def get_student_assignments(self):
        self._check_student()
        current_user = self.current_user.id
        db = self.db

        enrolled_course_ids = db.query(Enrollment.course_id).filter_by(
            student_id=current_user, status='approved').all()
        enrolled_course_ids = [cid[0] for cid in enrolled_course_ids]
        if not enrolled_course_ids:
            return []

        assignments = db.query(AssignmentTemplate).filter(
            AssignmentTemplate.course_id.in_(enrolled_course_ids)).all()
        return [
            AssignmentOut(
                id=a.id,
                title=a.title,
                description=a.description,
                weight=a.weight,
                course_id=a.course_id,
                course_title=a.course.title,
                lecturer_id=a.lecturer_id,
                created_at=a.created_at.isoformat(),
                submitted=db.query(AssignmentSubmission).filter_by(
                    assignment_id=a.id, student_id=current_user).first() is not None


            )
            for a in assignments
        ]

    @router.get("/students/", response_model=dict)
    def list_students_with_courses_and_assignments(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(
            None, description="Search by name or email")
    ):
        self._check_admin()

        query = self.db.query(User).filter(User.role == Role.STUDENT)
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )

        total = query.count()
        students = (
            query
            .options(
                joinedload(User.enrollments).joinedload(Enrollment.course),
                joinedload(User.assignments).joinedload(
                    AssignmentTemplate.course)
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = []
        for student in students:
            student_data = UserResponse.from_orm(student).dict()
            student_data["enrollments"] = [
                {
                    "id": e.id,
                    "status": e.status,
                    "course": CourseResponse.from_orm(e.course).dict()
                }
                for e in student.enrollments
            ]
            student_data["assignments"] = [
                {
                    "id": a.id,
                    "title": a.title,
                    "grade": a.grade,
                    "course": CourseResponse.from_orm(a.course).dict()
                }
                for a in student.assignments
            ]
            data.append(student_data)

        return {
            "status": "success",
            "message": "Students with courses and assignments retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data
        }

    @router.get("/lecturers/my/courses", response_model=dict)
    def view_all_courses_with_lecturers(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(
            None, description="Search by course title")
    ):
        self._check_student()

        query = self.db.query(Course).options(joinedload(Course.lecturer))
        if search:
            query = query.filter(Course.title.ilike(f"%{search}%"))

        total = query.count()
        courses = (
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = [
            {
                **CourseResponse.from_orm(course).dict(),
                "lecturer": UserResponse.from_orm(course.lecturer).dict() if course.lecturer else None
            }
            for course in courses
        ]

        return {
            "status": "success",
            "message": "All courses with respective lecturers retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data
        }



