from typing import List, Union

from constants import get_current_user
from database import get_db, get_db_async
from fastapi import APIRouter, Depends, HTTPException
from fastapi_utils.cbv import cbv
from model import (
    AssignmentGrade,
    AssignmentSubmission,
    Course,
    Enrollment,
    StudentResult,
    User,
)
from schema import (
    Role,
    StudentAddResultOut,
    StudentOut,
    StudentResultOut,
    StudentResultSubmissionSchema,
)
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from utils import calculate_paper_grade

result_router = APIRouter(tags=["Results"])


@cbv(result_router)
class StudentResultRoute:
    db: Session = Depends(get_db)
    async_db: Session = Depends(get_db_async)
    current_user: User = Depends(get_current_user)

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(status_code=403, detail="Lecturer access required.")

    @result_router.post("/results/submit", response_model=List[StudentAddResultOut])
    async def add_or_update_result(
        self,
        results: Union[
            List[StudentResultSubmissionSchema], StudentResultSubmissionSchema
        ],
    ):
        self._check_lecturer()
        db = self.async_db

        if isinstance(results, StudentResultSubmissionSchema):
            results = [results]

        output_results = []

        for result in results:
            stmt = (
                select(AssignmentGrade)
                .join(AssignmentSubmission)
                .join(AssignmentSubmission.assignment)
                .where(
                    AssignmentSubmission.student_id == result.student_id,
                    AssignmentSubmission.assignment.has(course_id=result.course_id),
                )
                .order_by(AssignmentGrade.created_at.desc())
            )
            assignment_grade_result = await db.execute(stmt)
            assignment_grade = assignment_grade_result.scalar_one_or_none()
            assignment_score = assignment_grade.score if assignment_grade else 0

            total_score = result.exam_score + assignment_score
            letter_grade = calculate_paper_grade(total_score)

            stmt = (
                select(StudentResult)
                .options(selectinload(StudentResult.student))
                .where(
                    StudentResult.student_id == result.student_id,
                    StudentResult.course_id == result.course_id,
                )
            )
            existing_result_result = await db.execute(stmt)
            existing_result = existing_result_result.scalar_one_or_none()

            if existing_result:
                student_result = existing_result
                student_result.exam_score = result.exam_score
                student_result.assignment_score = assignment_score
                student_result.total_score = total_score
                student_result.paper_grade = letter_grade
            else:
                student_result = StudentResult(
                    student_id=result.student_id,
                    course_id=result.course_id,
                    exam_score=result.exam_score,
                    assignment_score=assignment_score,
                    total_score=total_score,
                    paper_grade=letter_grade,
                )
            db.add(student_result)

            await db.flush()

            await db.refresh(student_result)

            student_stmt = select(User).where(
                User.id == student_result.student_id, User.role == Role.STUDENT
            )
            student_result_obj = await db.execute(student_stmt)
            student = student_result_obj.scalar_one_or_none()
            if not student:
                raise HTTPException(
                    status_code=404, detail="Student user not found or invalid role"
                )

            student_out = StudentOut(id=student.id, name=student.name)
            output_results.append(
                StudentAddResultOut(
                    id=student_result.id,
                    student_id=student_result.student_id,
                    student=student_out,
                    course_id=student_result.course_id,
                    exam_score=student_result.exam_score,
                    assignment_score=student_result.assignment_score,
                    total_score=student_result.total_score,
                    paper_grade=student_result.paper_grade,
                    has_result=True,
                )
            )

        await db.commit()

        return output_results

    @result_router.get(
        "/results/course/{course_id}/level/{level_id}/department/{department_id}",
        response_model=list[StudentResultOut],
    )
    async def get_results_for_course_level_department(
        self, course_id: int, level_id: int, department_id: int
    ):
        self._check_lecturer()
        db = self.async_db

        try:
            stmt = (
                select(Enrollment)
                .options(selectinload(Enrollment.student))
                .join(Course)
                .where(
                    Enrollment.course_id == course_id,
                    Course.level_id == level_id,
                    Course.department_id == department_id,
                )
            )

            enrollments_result = await db.execute(stmt)
            enrollments = enrollments_result.scalars().all()

            student_ids = [enrollment.student_id for enrollment in enrollments]

            if not student_ids:
                return []
            assignment_stmt = (
                select(AssignmentGrade, AssignmentSubmission.student_id)
                .join(AssignmentGrade.submission)
                .where(AssignmentSubmission.assignment.has(course_id=course_id))
            )
            assignment_result = await db.execute(assignment_stmt)
            assignment_map = {s_id: ag.score for ag, s_id in assignment_result.all()}

            result_stmt = select(StudentResult).where(
                StudentResult.course_id == course_id,
                StudentResult.student_id.in_(student_ids),
            )
            existing_result_result = await db.execute(result_stmt)
            existing_results = {
                r.student_id: r for r in existing_result_result.scalars()
            }

            response = []
            for enrollment in enrollments:
                s_id = enrollment.student_id
                assignment_score = assignment_map.get(s_id, 0)

                if s_id in existing_results:
                    result = existing_results[s_id]
                    response.append(
                        StudentResultOut(
                            id=result.id,
                            student_id=result.student_id,
                            student_name=enrollment.student.name,
                            course_id=result.course_id,
                            exam_score=result.exam_score,
                            assignment_score=result.assignment_score,
                            total_score=result.total_score,
                            paper_grade=result.paper_grade,
                            has_result=True,
                        )
                    )
                else:
                    response.append(
                        StudentResultOut(
                            id=0,
                            student_id=s_id,
                            student_name=enrollment.student.name,
                            course_id=course_id,
                            exam_score=None,
                            assignment_score=assignment_score,
                            total_score=None,
                            paper_grade=None,
                            has_result=False,
                        )
                    )

            return response

        except Exception as e:
            import traceback

            print("ERROR:", str(e))
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
