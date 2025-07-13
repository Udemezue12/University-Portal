from fastapi import APIRouter, Depends, HTTPException, File, Query
from sqlalchemy.orm import Session, joinedload
from fastapi_utils.cbv import cbv
from database import get_db
from constants import get_current_user
from typing import List, Optional
from model import Level, User, LecturerDepartmentAndLevel, Course, Enrollment
from schema import UserOut,  Role, CourseResponse, UserResponse, DepartmentResponse, LevelResponse, DepartmentRes

router = APIRouter()


@cbv(router)
class Lecturer:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(
                status_code=403, detail="Lecturer access required.")

    @router.get("/lecturers", response_model=List[UserOut])
    def get_lecturers(self):
        self._check_admin()
        return self.db.query(User).filter(User.role == Role.LECTURER).all()

    @router.get("/lecturers/departments")
    def get_lecturers_with_departments(self):
        self._check_admin()
        lecturers = self.db.query(User).filter(
            User.role == Role.LECTURER).all()
        data = []
        for lecturer in lecturers:
            departments = [
                d.department.name for d in lecturer.assigned_departments]
            data.append({
                "lecturer_name": lecturer.name,
                "email": lecturer.email,
                "departments": departments
            })
        return data

    @router.get("/lecturer/levels/{department_id}", response_model=List[LevelResponse])
    def get_levels_for_department(self, department_id: int):
        self._check_lecturer()

        levels = self.db.query(Level).filter(
            Level.department_id == department_id).all()

        return levels

    @router.get("/lecturer/departments", response_model=List[DepartmentRes])
    def get_lecturer_departments(self):
        self._check_lecturer()

        dept_links = self.db.query(LecturerDepartmentAndLevel).filter_by(
            lecturer_id=self.current_user.id
        ).options(joinedload(LecturerDepartmentAndLevel.   department)).all()

        departments = list({link.department for link in dept_links})

        return departments

    @router.get("/lecturers/courses", response_model=dict)
    def list_lecturers_with_courses(self, page: int = Query(1, ge=1),
                                    page_size: int = Query(10, ge=1, le=100),
                                    search: Optional[str] = Query(
        None, description="Search by name or email")
    ):
        self._check_admin()

        query = self.db.query(User).filter(User.role == Role.LECTURER)
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )

        total = query.count()
        lecturers = (
            query
            .options(joinedload(User.courses))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = []
        for lecturer in lecturers:
            lecturer_data = UserResponse.from_orm(lecturer).dict()
            lecturer_data["courses"] = [CourseResponse.from_orm(
                c).dict() for c in lecturer.courses]
            data.append(lecturer_data)

        return {
            "status": "success",
            "message": "Lecturers with courses retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data
        }

    @router.get("/my/courses", response_model=dict)
    def get_my_courses(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(
            None, description="Search by course title")
    ):
        self._check_lecturer()

        query = self.db.query(Course).filter(
            Course.lecturer_id == self.current_user.id)
        if search:
            query = query.filter(Course.title.ilike(f"%{search}%"))

        total = query.count()
        courses = (
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = [CourseResponse.from_orm(course).dict() for course in courses]

        return {
            "status": "success",
            "message": "Lecturer courses retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data
        }

    @router.get("/courses/{course_id}/students", response_model=dict)
    def get_students_in_course(self, course_id: int):
        self._check_lecturer()

        course = self.db.query(Course).options(joinedload(Course.enrollments).joinedload(Enrollment.student)).filter(
            Course.id == course_id,
            Course.lecturer_id == self.current_user.id
        ).first()

        if not course:
            raise HTTPException(
                status_code=404, detail="Course not found or not owned by lecturer.")

        students = [
            UserResponse.from_orm(enrollment.student).dict()
            for enrollment in course.enrollments
            if enrollment.status == "approved"
        ]

        return {
            "status": "success",
            "message": f"Students enrolled in '{course.title}' retrieved successfully.",
            "course": CourseResponse.from_orm(course).dict(),
            "total_students": len(students),
            "students": students
        }

    @router.get("/my-courses-with-students", response_model=dict)
    def get_my_courses_with_students(self):
        self._check_lecturer()
        courses = (
            self.db.query(Course)
            .options(joinedload(Course.enrollments).joinedload(Enrollment.student))
            .filter(Course.lecturer_id == self.current_user.id)
            .all()
        )
        data = []
        for course in courses:
            enrolled_students = [
                {
                    "id": enrollment.student.id,
                    "name": enrollment.student.name,
                    "email": enrollment.student.email,
                    "username": enrollment.student.username,
                    "status": enrollment.status
                }
                for enrollment in course.enrollments if enrollment.status == "approved"
            ]

            data.append({
                "course_id": course.id,
                "title": course.title,
                "description": course.description,
                "students_enrolled": enrolled_students
            })
        return {
            "status": "success",
            "message": "Courses with enrolled students retrieved successfully.",
            "data": data
        }
        #

    @router.get("/assigned/departments", response_model=List[DepartmentResponse])
    def get_assigned_departments(self):
        self._check_lecturer()

        lecturer_departments = self.db.query(LecturerDepartmentAndLevel).filter_by(
            lecturer_id=self.current_user.id
        ).all()

        departments = [ld.department for ld in lecturer_departments]

        return [
            DepartmentResponse(
                id=dept.id,
                name=dept.name,
                session_name=dept.session.name,
                faculty_name=dept.faculty.name
            )
            for dept in departments
        ]

    @router.get("/lecturers-departments-courses", response_model=dict)
    def get_lecturers_departments_courses(self,):
        self._check_admin()

        lecturers = self.db.query(User).filter(
            User.role == Role.LECTURER).all()

        data = []
        for lecturer in lecturers:
            lecturer_data = {
                "id": lecturer.id,
                "username": lecturer.username,
                "email": lecturer.email,
                "departments": [],
                "courses": []
            }

        departments = [
            {
                "id": ld.department.id,
                "name": ld.department.name
            } for ld in lecturer.assigned_departments
        ]

        courses = [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description
            } for c in lecturer.courses
        ]

        lecturer_data["departments"] = departments
        lecturer_data["courses"] = courses
        data.append(lecturer_data)

        return {
            "status": "success",
            "message": "Lecturers with departments and courses retrieved successfully.",
            "data": data
        }
