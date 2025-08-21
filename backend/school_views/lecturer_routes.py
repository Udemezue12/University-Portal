from typing import List, Optional

from constants import get_current_user
from database import get_db, get_db_async
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_utils.cbv import cbv
from file_configs import convert_to_url
from model import (
    Course,
    Department,
    Enrollment,
    Faculty,
    LecturerDepartmentAndLevel,
    Level,
    StudentDepartment,
    StudentLevelProgress,
    User,
)
from schema import (
    CourseOut,
    CourseResponse,
    DepartmentRes,
    DepartmentResponse,
    LecturerCourseResponse,
    LevelResponse,
    Role,
    StudentResponse,
    UserOut,
    UserResponse,
)
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session, joinedload, selectinload

router = APIRouter()


@cbv(router)
class Lecturer:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Admin access required.")

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(status_code=403, detail="Lecturer access required.")

    @router.get("/lecturers", response_model=List[UserOut])
    def get_lecturers(self):
        self._check_admin()
        return self.db.query(User).filter(User.role == Role.LECTURER).all()

    @router.get("/lecturers/departments")
    def get_lecturers_with_departments(self):
        self._check_admin()
        lecturers = self.db.query(User).filter(User.role == Role.LECTURER).all()
        data = []
        for lecturer in lecturers:
            departments = [d.department.name for d in lecturer.assigned_departments]
            data.append(
                {
                    "lecturer_name": lecturer.name,
                    "email": lecturer.email,
                    "departments": departments,
                }
            )
        return data

    # @router.get("/lecturer/levels/{department_id}", response_model=List[LevelResponse])
    # def get_levels_for_department(self, department_id: int):
    #     self._check_lecturer()

    #     levels = self.db.query(Level).filter(
    #         Level.department_id == department_id).all()

    #     return levels

    @router.get("/lecturer/departments", response_model=List[DepartmentRes])
    def get_lecturer_departments(self):
        self._check_lecturer()

        dept_links = (
            self.db.query(LecturerDepartmentAndLevel)
            .filter_by(lecturer_id=self.current_user.id)
            .options(joinedload(LecturerDepartmentAndLevel.department))
            .all()
        )

        departments = list({link.department for link in dept_links})

        return departments

    @router.get("/lecturers/courses", response_model=dict)
    def list_lecturers_with_courses(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None, description="Search by name or email"),
    ):
        self._check_admin()

        query = self.db.query(User).filter(User.role == Role.LECTURER)
        if search:
            query = query.filter(
                or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
            )

        total = query.count()
        lecturers = (
            query.options(joinedload(User.courses))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = []
        for lecturer in lecturers:
            lecturer_data = UserResponse.from_orm(lecturer).dict()
            lecturer_data["courses"] = [
                CourseResponse.from_orm(c).dict() for c in lecturer.courses
            ]
            data.append(lecturer_data)

        return {
            "status": "success",
            "message": "Lecturers with courses retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data,
        }

    @router.get("/my/courses", response_model=dict)
    def get_my_courses(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None, description="Search by course title"),
    ):
        self._check_lecturer()

        query = self.db.query(Course).filter(Course.lecturer_id == self.current_user.id)
        if search:
            query = query.filter(Course.title.ilike(f"%{search}%"))

        total = query.count()
        courses = query.offset((page - 1) * page_size).limit(page_size).all()
        data = []
        for course in courses:
            course_data = CourseResponse.from_orm(course).dict()
            course_data["syllabus_path"] = convert_to_url(course.syllabus_path)
            data.append(course_data)

        return {
            "status": "success",
            "message": "Lecturer courses retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data,
        }

    @router.get("/courses/{course_id}/students", response_model=dict)
    def get_students_in_course(self, course_id: int):
        self._check_lecturer()

        course = (
            self.db.query(Course)
            .options(joinedload(Course.enrollments).joinedload(Enrollment.student))
            .filter(Course.id == course_id, Course.lecturer_id == self.current_user.id)
            .first()
        )

        if not course:
            raise HTTPException(
                status_code=404, detail="Course not found or not owned by lecturer."
            )

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
            "students": students,
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
                    "status": enrollment.status,
                }
                for enrollment in course.enrollments
                if enrollment.status == "approved"
            ]

            data.append(
                {
                    "course_id": course.id,
                    "title": course.title,
                    "description": course.description,
                    "students_enrolled": enrolled_students,
                }
            )
        return {
            "status": "success",
            "message": "Courses with enrolled students retrieved successfully.",
            "data": data,
        }
        #

    @router.get("/assigned/departments", response_model=List[DepartmentResponse])
    def get_assigned_departments(self):
        self._check_lecturer()

        lecturer_id = self.current_user.id
        departments = (
            self.db.query(Department)
            .join(
                LecturerDepartmentAndLevel,
                LecturerDepartmentAndLevel.department_id == Department.id,
            )
            .filter(LecturerDepartmentAndLevel.lecturer_id == lecturer_id)
            .all()
        )

        return [
            DepartmentResponse(
                id=dept.id,
                name=dept.name,
                session_name=dept.session.name,
                faculty_name=dept.faculty.name,
            )
            for dept in departments
        ]

    @router.get("/assigned/levels/{department_id}", response_model=List[LevelResponse])
    def get_levels_for_department(self, department_id: int):
        self._check_lecturer()
        lecturer_id = self.current_user.id

        levels = (
            self.db.query(Level)
            .join(
                LecturerDepartmentAndLevel,
                LecturerDepartmentAndLevel.level_id == Level.id,
            )
            .filter(
                LecturerDepartmentAndLevel.lecturer_id == lecturer_id,
                LecturerDepartmentAndLevel.department_id == department_id,
            )
            .all()
        )

        return [LevelResponse.from_orm(level) for level in levels]

    @router.get(
        "/assigned/courses/{department_id}/{level_id}",
        response_model=List[LecturerCourseResponse],
    )
    def get_courses_for_department_and_level(self, department_id: int, level_id: int):
        self._check_lecturer()
        lecturer_id = self.current_user.id

        courses = (
            self.db.query(Course)
            .filter(
                Course.lecturer_id == lecturer_id,
                Course.department_id == department_id,
                Course.level_id == level_id,
            )
            .all()
        )

        return [CourseResponse.from_orm(course) for course in courses]

    @router.get("/lecturers-departments-courses", response_model=dict)
    def get_lecturers_departments_courses(
        self,
    ):
        self._check_admin()

        lecturers = self.db.query(User).filter(User.role == Role.LECTURER).all()

        data = []
        for lecturer in lecturers:
            lecturer_data = {
                "id": lecturer.id,
                "username": lecturer.username,
                "email": lecturer.email,
                "departments": [],
                "courses": [],
            }

        departments = [
            {"id": ld.department.id, "name": ld.department.name}
            for ld in lecturer.assigned_departments
        ]

        courses = [
            {"id": c.id, "title": c.title, "description": c.description}
            for c in lecturer.courses
        ]

        lecturer_data["departments"] = departments
        lecturer_data["courses"] = courses
        data.append(lecturer_data)

        return {
            "status": "success",
            "message": "Lecturers with departments and courses retrieved successfully.",
            "data": data,
        }

    @router.get("/lecturer/students-by-faculty-dept-level")
    def get_students_under_lecturer_courses(self):
        self._check_lecturer()
        current_user = self.current_user
        db = self.db

        faculties = (
            db.query(Faculty)
            .options(joinedload(Faculty.departments).joinedload(Department.levels))
            .all()
        )
        result = []

        for faculty in faculties:
            faculty_obj = {"faculty_name": faculty.name, "departments": []}
            for dept in faculty.departments:
                dept_obj = {"department_name": dept.name, "levels": []}
                for level in dept.levels:
                    courses = (
                        db.query(Course)
                        .filter(
                            Course.lecturer_id == current_user.id,
                            Course.department_id == dept.id,
                            Course.level_id == level.id,
                        )
                        .all()
                    )
                    student_list = []
                    for course in courses:
                        enrollments = (
                            db.query(Enrollment)
                            .filter(Enrollment.course_id == course.id)
                            .all()
                        )
                        for enrollment in enrollments:
                            student = (
                                db.query(User)
                                .filter(User.id == enrollment.student_id)
                                .first()
                            )
                            if student:
                                student_list.append(
                                    {
                                        "id": student.id,
                                        "name": student.name,
                                        "email": student.email,
                                        "course_title": course.title,
                                        "level": level.name,
                                        "department": dept.name,
                                        "faculty": faculty.name,
                                    }
                                )
                    if student_list:
                        dept_obj["levels"].append(
                            {"level_name": level.name, "students": student_list}
                        )
                if dept_obj["levels"]:
                    faculty_obj["departments"].append(dept_obj)
            if faculty_obj["departments"]:
                result.append(faculty_obj)
        return result

    @router.get(
        "/assigned/students/{department_id}/{level_id}",
        response_model=List[StudentResponse],
    )
    def get_students_for_department_and_level(self, department_id: int, level_id: int):
        self._check_lecturer()

        students = (
            self.db.query(User)
            .join(StudentDepartment, StudentDepartment.student_id == User.id)
            .join(StudentLevelProgress, StudentLevelProgress.student_id == User.id)
            .filter(
                StudentDepartment.department_id == department_id,
                StudentLevelProgress.level_id == level_id,
            )
            .all()
        )

        return [StudentResponse.from_orm(student) for student in students]


@router.get("/courses/", response_model=list[CourseOut])
async def get_all_courses(session: AsyncSession = Depends(get_db_async)):
    result = await session.execute(
        select(Course).options(
            selectinload(Course.lecturer),
            selectinload(Course.department),
            selectinload(Course.levels),
        )
    )
    courses = result.scalars().all()

    course_list = []
    for course in courses:
        course_list.append(
            CourseOut(
                id=course.id,
                title=course.title,
                description=course.description,
                lecturer_name=course.lecturer.username if course.lecturer else None,
                department_name=course.department.name if course.department else None,
                level_name=course.levels.name if course.levels else None,
            )
        )

    return course_list


@router.get("/lecturer/levels/{department_id}", response_model=List[LevelResponse])
async def get_levels_for_department(
    department_id: int,
    db: AsyncSession = Depends(get_db_async),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Level).where(Level.department_id == department_id))
    levels = result.scalars().all()
    return levels
