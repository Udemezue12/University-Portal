from typing import List, Optional

from constants import get_current_user
from database import get_db, get_db_async
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi_utils.cbv import cbv
from model import (
    AssignmentSubmission,
    AssignmentTemplate,
    Course,
    Department,
    Enrollment,
    Faculty,
    Level,
    SessionModel,
    StudentDepartment,
    StudentLevelProgress,
    StudentResult,
    User,
)
from schema import (
    AssignmentOut,
    CourseResponse,
    Role,
    SessionOut,
    UserOut,
    UserResponse,
)
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session, joinedload

router = APIRouter()


@cbv(router)
class Student:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)
    session: AsyncSession = Depends(get_db_async)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Admin access required.")

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(
                status_code=403, detail="Only students can access this."
            )

    @router.get("/students", response_model=List[UserOut])
    def get_students(self):
        self._check_admin()

        return self.db.query(User).filter(User.role == Role.STUDENT).all()

    @router.get("/students/departments")
    def view_student_departments(self):
        self._check_admin()
        students = self.db.query(User).filter(User.role == Role.STUDENT).all()
        result = []
        for student in students:
            departments = [
                assign.departments.name
                for assign in student.assigned_department_student
            ]
            result.append(
                {
                    "student": student.name,
                    "email": student.email,
                    "departments": departments,
                }
            )
        return result

    @router.get("/my-courses", response_model=dict)
    def get_my_enrolled_courses(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(status_code=403, detail="Student access required.")

        enrollments = (
            self.db.query(Enrollment)
            .options(joinedload(Enrollment.course).joinedload(Course.lecturer))
            .filter(
                Enrollment.student_id == self.current_user.id,
                Enrollment.status == "approved",
            )
            .all()
        )

        data = []
        for enrollment in enrollments:
            course = enrollment.course
            lecturer = course.lecturer

            data.append(
                {
                    "course_id": course.id,
                    "title": course.title,
                    "description": course.description,
                    "lecturer": {
                        "id": lecturer.id,
                        "name": lecturer.name,
                        "email": lecturer.email,
                        "username": lecturer.username,
                    }
                    if lecturer
                    else None,
                    "status": enrollment.status,
                }
            )

        return {
            "status": "success",
            "message": "Enrolled courses retrieved  successfully.",
            "data": data,
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
                    {"id": sd.department.id, "name": sd.department.name}
                    for sd in student.assigned_departments_student
                ],
                "courses_enrolled": [
                    {
                        "id": e.course.id,
                        "title": e.course.title,
                        "description": e.course.description,
                        "status": e.status,
                    }
                    for e in student.enrollments
                ],
            }

            data.append(student_data)

        return {
            "status": "success",
            "message": "Students with departments and enrolled courses retrieved successfully.",
            "data": data,
        }

    @router.get("/student/assignments", response_model=List[AssignmentOut])
    def get_student_assignments(self):
        self._check_student()
        current_user = self.current_user.id
        db = self.db

        enrolled_course_ids = (
            db.query(Enrollment.course_id)
            .filter_by(student_id=current_user, status="approved")
            .all()
        )
        enrolled_course_ids = [cid[0] for cid in enrolled_course_ids]
        if not enrolled_course_ids:
            return []

        assignments = (
            db.query(AssignmentTemplate)
            .filter(AssignmentTemplate.course_id.in_(enrolled_course_ids))
            .all()
        )
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
                submitted=db.query(AssignmentSubmission)
                .filter_by(assignment_id=a.id, student_id=current_user)
                .first()
                is not None,
            )
            for a in assignments
        ]

    @router.get("/students/", response_model=dict)
    def list_students_with_courses_and_assignments(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None, description="Search by name or email"),
    ):
        self._check_admin()

        query = self.db.query(User).filter(User.role == Role.STUDENT)
        if search:
            query = query.filter(
                or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
            )

        total = query.count()
        students = (
            query.options(
                joinedload(User.enrollments).joinedload(Enrollment.course),
                joinedload(User.assignments).joinedload(AssignmentTemplate.course),
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
                    "course": CourseResponse.from_orm(e.course).dict(),
                }
                for e in student.enrollments
            ]
            student_data["assignments"] = [
                {
                    "id": a.id,
                    "title": a.title,
                    "grade": a.grade,
                    "course": CourseResponse.from_orm(a.course).dict(),
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
            "data": data,
        }

    @router.get("/lecturers/my/courses", response_model=dict)
    def view_all_courses_with_lecturers(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None, description="Search by course title"),
    ):
        self._check_student()

        query = self.db.query(Course).options(joinedload(Course.lecturer))
        if search:
            query = query.filter(Course.title.ilike(f"%{search}%"))

        total = query.count()
        courses = query.offset((page - 1) * page_size).limit(page_size).all()

        data = [
            {
                **CourseResponse.from_orm(course).dict(),
                "lecturer": UserResponse.from_orm(course.lecturer).dict()
                if course.lecturer
                else None,
            }
            for course in courses
        ]

        return {
            "status": "success",
            "message": "All courses with respective lecturers retrieved successfully.",
            "total": total,
            "page": page,
            "page_size": page_size,
            "data": data,
        }

    @router.get("/student/my-results")
    def get_my_results(self):
        self._check_student()
        db = self.db
        student = self.current_user
        student_dept_rel = (
            db.query(StudentDepartment).filter_by(student_id=student.id).first()
        )
        department = (
            db.query(Department).filter_by(id=student_dept_rel.department_id).first()
            if student_dept_rel
            else None
        )
        faculty = (
            db.query(Faculty).filter_by(id=department.faculty_id).first()
            if department
            else None
        )

        student_progress = (
            db.query(StudentLevelProgress)
            .filter_by(student_id=student.id)
            .order_by(StudentLevelProgress.id.desc())
            .first()
        )
        level = (
            db.query(Level).filter_by(id=student_progress.level_id).first()
            if student_progress
            else None
        )

        enrollments = (
            db.query(Enrollment)
            .join(Course)
            .filter(Enrollment.student_id == student.id)
            .all()
        )

        results = []
        total_weighted_points = 0
        total_units = 0

        grade_scale = {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}

        for enrollment in enrollments:
            course = enrollment.course

            student_result = (
                db.query(StudentResult)
                .filter_by(student_id=student.id, course_id=course.id)
                .first()
            )

            if student_result:
                assignment_score = student_result.assignment_score
                exam_score = student_result.exam_score
                total = student_result.total_score
                letter_grade = student_result.paper_grade
            else:
                assignment_score = 0.0
                exam_score = 0.0
                total = 0.0
                letter_grade = "-"

            grade_value = grade_scale.get(letter_grade, 0)
            weighted_points = grade_value * course.grade_point

            total_weighted_points += weighted_points
            total_units += course.grade_point

            results.append(
                {
                    "course_name": course.title,
                    "assignment_score": assignment_score,
                    "exam_score": exam_score,
                    "total": total,
                    "letter_grade": letter_grade,
                }
            )

        cgpa = round(total_weighted_points / total_units, 2) if total_units > 0 else 0.0

        if cgpa >= 4.5:
            class_of_degree = "First Class"
        elif cgpa >= 3.5:
            class_of_degree = "Second Class Upper"
        elif cgpa >= 2.4:
            class_of_degree = "Second Class Lower"
        elif cgpa >= 1.5:
            class_of_degree = "Third Class"
        elif cgpa >= 1.0:
            class_of_degree = "Pass"
        else:
            class_of_degree = "Fail"

        return {
            "student_name": student.name,
            "department": department.name if department else None,
            "faculty": faculty.name if faculty else None,
            "level": level.name if level else None,
            "results": results,
            "cgpa": cgpa,
            "class_of_degree": class_of_degree,
        }

    @router.get("/my/department/courses")
    async def get_department_courses(self, request: Request):
        self._check_student()
        current_user = self.current_user
        session = self.session

        # Get the student's department
        dept_result = await session.execute(
            select(Department)
            .join(StudentDepartment, StudentDepartment.department_id == Department.id)
            .where(StudentDepartment.student_id == current_user.id)
        )
        department = dept_result.scalar_one_or_none()

        if not department:
            raise HTTPException(
                status_code=404, detail="Student is not assigned to any department"
            )

        result = await session.execute(
            select(Course)
            .where(Course.department_id == department.id)
            .options(
                joinedload(Course.lecturer),
                joinedload(Course.department),
            )
        )

        courses = result.scalars().all()

        course_list = []
        for course in courses:
            course_list.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "description": course.description,
                    "grade_point": course.grade_point,
                    "syllabus_path": course.syllabus_path,
                    "lecturer_name": course.lecturer.name
                    if course.lecturer
                    else "Unassigned",
                    "department_name": course.department.name
                    if course.department
                    else "Unknown",
                }
            )

        return JSONResponse(course_list)

    @router.get("/school/", response_model=List[SessionOut])
    def get_sessions(self):
        self._check_admin()

        sessions = self.db.query(SessionModel).all()
        return sessions
