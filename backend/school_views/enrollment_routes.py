from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from fastapi_utils.cbv import cbv
import asyncio
from notify import manager
from constants import get_current_user
from typing import List
from model import User,  LecturerDepartmentAndLevel, Course, StudentDepartment,  Enrollment
from schema import Role,EnrollCourseBaseResponse, EnrollmentCreate, EnrollmentResponse, CourseInEnrollmentResponse, ApproveEnrollmentResponse,ApproveCourseInEnrollmentResponse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db, get_db_async
from fastapi.responses import JSONResponse
router = APIRouter()


@cbv(router)
class EnrollmentRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)
    session: AsyncSession = Depends(get_db_async)

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(
                status_code=403, detail='Student access required')

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail='Admin access required')

    def _check_admin_and_student(self):
        if self.current_user.role not in [Role.STUDENT, Role.ADMIN]:
            raise HTTPException(status_code=403, detail="Not authorized")

    @router.post("/enrol", response_model=dict)
    def enroll_course(self, enrollment: EnrollmentCreate):
        self._check_student()

        if self.current_user.id != enrollment.student_id:
            raise HTTPException(
                status_code=403, detail="Cannot enroll on behalf of another student.")

        course = self.db.query(Course).filter(
            Course.id == enrollment.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")

        lecturer_department_ids = [ld.department_id for ld in self.db.query(
            LecturerDepartmentAndLevel).filter_by(lecturer_id=course.lecturer_id).all()]
        student_department_ids = [sd.department_id for sd in self.db.query(
            StudentDepartment).filter_by(student_id=enrollment.student_id).all()]

        if not set(lecturer_department_ids).intersection(set(student_department_ids)):
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this course's department, and cannot enroll."
            )

        existing = self.db.query(Enrollment).filter(
            Enrollment.student_id == enrollment.student_id,
            Enrollment.course_id == enrollment.course_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400, detail="Already enrolled or enrollment pending.")

        db_enrollment = Enrollment(
            student_id=enrollment.student_id,
            course_id=enrollment.course_id,
            status="pending"
        )

        self.db.add(db_enrollment)
        self.db.commit()
        self.db.refresh(db_enrollment)

        enriched_enrollment = (
            self.db.query(Enrollment)
            .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
            .filter(Enrollment.id == db_enrollment.id)
            .first()
        )

        return {
            "status": "success",
            "message": "Enrollment request submitted successfully.",
            "data": EnrollmentResponse.from_orm(enriched_enrollment)
        }

    @router.delete("/{enrollment_id}/drop", response_model=dict)
    def drop_course(self, enrollment_id: int):
        self._check_student()
        enrollment = (
            self.db.query(Enrollment)
            .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
            .filter(

                Enrollment.id == enrollment_id,
                Enrollment.student_id == self.current_user.id
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(
                status_code=404, detail="Enrollment record not found.")
        course = self.db.query(Course).filter(
            Course.id == enrollment.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")

        lecturer_department_ids = [ld.department_id for ld in self.db.query(
            LecturerDepartmentAndLevel).filter_by(lecturer_id=course.lecturer_id).all()]
        student_department_ids = [sd.department_id for sd in self.db.query(
            StudentDepartment).filter_by(student_id=enrollment.student_id).all()]

        if not set(lecturer_department_ids).intersection(set(student_department_ids)):
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this course's department, and cannot enroll."
            )

        db_enrollment = (
            self.db.query(Enrollment)
            .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
            .filter(
                Enrollment.id == enrollment_id,
                Enrollment.student_id == self.current_user.id
            )
            .first()
        )

        if not db_enrollment:
            raise HTTPException(
                status_code=404, detail="Enrollment record not found.")

        if db_enrollment.status == "pending":
            raise HTTPException(
                status_code=400, detail="Cannot drop enrollment that has been approved.")

        self.db.delete(db_enrollment)
        self.db.commit()

        return {
            "status": "success",
            "message": "Enrollment dropped successfully."
        }

    @router.get("/enrollments", response_model=List[EnrollmentResponse])
    async def list_my_enrollments(self):
        self._check_student()
        db = self.session
        current_user = self.current_user

        _result = await db.execute(select(Enrollment).options(
            joinedload(Enrollment.course).joinedload(Course.lecturer), joinedload(
                Enrollment.course).joinedload(Course.department)
        ).where(Enrollment.student_id == current_user.id))
        enrollments = _result.scalars().all()
        enriched_response = []

        for enrollment in enrollments:
            course = enrollment.course

            response = EnrollmentResponse(
                id=enrollment.id,
                status=enrollment.status,
                course=EnrollCourseBaseResponse(
                    id=course.id,
                    title=course.title,
                    description=course.description,
                    grade_point=course.grade_point,
                    lecturer_name=course.lecturer.name if course.lecturer else "N/A",
                    department_name=course.department.name if course.department else "N/A"
                )
            )
            enriched_response.append(response)

        return enriched_response

    @router.put('/enrollments/{enrollment_id}/approve', response_model=dict)
    async def approve_enrollment(self, enrollment_id: int):
        self._check_admin()
        enrollment = self.db.query(Enrollment).options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course).joinedload(Course.lecturer),
            joinedload(Enrollment.course).joinedload(Course.department)
        ).filter(Enrollment.id == enrollment_id).first()

        if not enrollment:
            raise HTTPException(
                status_code=404, detail="Enrollment not found.")

        enrollment.status = 'approved'
        student_id = enrollment.student_id
        self.db.commit()
        self.db.refresh(enrollment)
        course = enrollment.course
        course_data =ApproveCourseInEnrollmentResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            grade_point=course.grade_point,
            lecturer_name=course.lecturer.name if course.lecturer else "N/A",
            department_name=course.department.name if course.department else "N/A"
        )

        response_data = ApproveEnrollmentResponse(
            id=enrollment.id,
            status=enrollment.status,
            course=course_data
        )

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "enrollment_approved",
                "message": f"Your enrollment in '{enrollment.course.title}' has been approved.",
                "course_id": enrollment.course_id
            },
            user_id=student_id
        ))

        return {
            "status": "success",
            "message": "Enrollment approved successfully.",
            "data": response_data
        }

    @router.put("/enrollments/{enrollment_id}/decline", response_model=dict)
    async def decline_enrollment(self, enrollment_id: int):
        self._check_admin()
        enrollment = self.db.query(Enrollment).options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course).joinedload(Course.lecturer),
            joinedload(Enrollment.course).joinedload(Course.department)
        ).filter(Enrollment.id == enrollment_id).first()

        if not enrollment:
            raise HTTPException(
                status_code=404, detail="Enrollment not found.")

        enrollment.status = "rejected"
        student_id = enrollment.student_id
        self.db.commit()
        self.db.refresh(enrollment)

        course = enrollment.course
        course_data = CourseInEnrollmentResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            grade_point=course.grade_point,
            lecturer_name=course.lecturer.name if course.lecturer else "N/A",
            department_name=course.department.name if course.department else "N/A"
        )

        response_data = ApproveEnrollmentResponse(
            id=enrollment.id,
            status=enrollment.status,
            course=course_data
        )

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "enrollment_declined",
                "message": f"Your enrollment in '{enrollment.course.title}' has been declined.",
                "course_id": enrollment.course_id
            },
            user_id=student_id
        ))

        return {
            "status": "success",
            "message": "Enrollment declined successfully.",
            "data": response_data
        }

    @router.get('/admin/enrollments')
    def view_all_enrollments(self):
        self._check_admin()
        enrollments = self.db.query(Enrollment).all()
        results = []
        for enroll in enrollments:
            course = enroll.course
            student = enroll.student
            department = course.department
            lecturer = course.lecturer

            results.append({
                'id': enroll.id,
                'status': enroll.status,
                'course_title': enroll.course.title,
                'department_name': department.name,
                'student_name': student.name,
                'lecturer_name': lecturer.name if lecturer else 'N/A'

            })

            return results

    # @admin_router.get("/admin/student/assignments")
    # def get_all_submitted_assignments(self):
    #     self._check_admin()
    #     assignments = self.db.query(User).filter(
    #         User.role == Role.STUDENT).all()
    #     result = []
    #     for student in assignments:
    #         for assignment in student.assignments:
    #             result.append({
    #                 "student": student.name,
    #                 "course": assignment.course.title,
    #                 "title": assignment.title,
    #                 "grade": assignment.grade,
    #                 "weight": assignment.weight,
    #                 "text_submission": assignment.text_submission,
    #                 "submission_path": assignment.submission_path,
    #             })
    #     return result
