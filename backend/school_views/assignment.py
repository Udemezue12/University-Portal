from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Query, Request
from sqlalchemy.orm import Session
from fastapi_utils.cbv import cbv
from database import get_db
import asyncio
from notify import manager
from datetime import datetime
from constants import get_current_user, save_uploaded_file
from model import Level, User, SessionModel,  Course, StudentLevelProgress,  AssignmentGrade, AssignmentSubmission, AssignmentTemplate, Enrollment
from schema import Role, AssignmentTemplateCreate, SubmittedAssignmentOut, GPAResponse, AssignmentDetailOut, GradeAssignmentDetailOut, StudentResultResponse, StudentResultSchema
from model import AssignmentTemplate, Course, Enrollment, AssignmentSubmission, User, StudentLevelProgress, AssignmentGrade, SessionModel, Level


router = APIRouter()


@cbv(router)
class AssignmentRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(
                status_code=403, detail="Lecturer access required.")

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(
                status_code=403, detail="Student access required.")

    @router.post('/assignment/create', response_model=dict)
    def create_assignment(self, data: AssignmentTemplateCreate):
        self._check_lecturer()
        course_id = data.course_id
        description = data.description
        title = data.title
        weight = data.weight
        current_user = self.current_user.id
        db = self.db

        course = db.query(Course).filter_by(
            id=course_id, lecturer_id=current_user).first()

        if not course:
            raise HTTPException(
                status_code=403, detail='Unauthorized or Course not found')
        assignment = AssignmentTemplate(
            title=title,
            description=description,
            weight=weight,
            course_id=course_id,
            lecturer_id=current_user
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return {"message": "Assignment created successfully."}

    @router.post('/assignment/submit', response_model=dict)
    async def submit_assignment(self,  assignment_id: int = Form(...), course_id: int = Form(...), text_submission: str = Form(...), file: UploadFile = File(None)):
        self._check_student()
        current_user = self.current_user.id
        db = self.db

        assignment = db.query(AssignmentTemplate).filter_by(
            id=assignment_id).first()
        if not assignment:
            raise HTTPException(
                status_code=404, detail="Assignment not found.")
        enrollment = db.query(Enrollment).filter_by(
            student_id=current_user,
            course_id=course_id,
            status='approved'
        )
        if not enrollment:
            raise HTTPException(
                status_code=403, detail="You're not enrolled in this course or not approved to take this course.")
        existing = db.query(AssignmentSubmission).filter_by(
            assignment_id=assignment_id,
            student_id=current_user
        ).first()
        course = self.db.query(Course).filter(
            Course.id == assignment.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")

        lecturer_id = course.lecturer_id
        if not lecturer_id:
            raise HTTPException(
                status_code=400, detail="This course has no assigned lecturer.")

        if existing:
            raise HTTPException(
                status_code=400, detail="Assignment already submitted.")
        submission_path = None
        if file:
            submission_path = save_uploaded_file(file)
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=current_user,
            text_submission=text_submission,
            submission_path=submission_path
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        try:
            asyncio.create_task(
                manager.send_personal_message(
                    {
                        "event": "assignment_submitted",
                        "message": f"{self.current_user.name}submitted assignment '{assignment.    title}'",
                        "course_id": assignment.course_id,
                        "student_id": self.current_user
                    },
                    user_id=lecturer_id
                )
            )
        except RuntimeError:
            pass
        return {
            'message': 'You have sucessfully submitted your assignment'
        }

    def get_letter_grade(self, score):
        if score >= 25:
            return "A"
        elif score >= 20:
            return "B"
        elif score >= 15:
            return "C"
        else:
            return "F"

    @router.post('/assignments/grade', response_model=dict)
    async def grade_assignment(self, request: Request):
        self._check_lecturer()
        current_user = self.current_user.id
        db = self.db

        try:
            payload = await request.json()
            submission_id = int(payload.get("submission_id"))
            score = float(payload.get("score"))
            feedback = payload.get("feedback", None)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=422, detail="Invalid input. Ensure submission_id and score are numbers.")

        if not (0 <= score <= 30):
            raise HTTPException(
                status_code=400, detail="Score must be between 0 and 30.")

        submission = db.query(AssignmentSubmission).filter_by(
            id=submission_id).first()
        if not submission:
            raise HTTPException(status_code=404,
                                detail="Assignment submission not found.")
        assignment = submission.assignment
        course = db.query(Course).filter_by(id=assignment.course_id).first()
        if course.lecturer_id != current_user:
            raise HTTPException(
                status_code=403, detail="You do not teach this course.")
        existing_grade = db.query(AssignmentGrade).filter_by(
            submission_id=submission_id).first()
        if existing_grade:
            raise HTTPException(
                status_code=400, detail="Submission already graded.")

        new_grade = AssignmentGrade(
            submission_id=submission_id,
            score=score,
            feedback=feedback,
            graded_by_id=current_user,
            created_at=datetime.utcnow()
        )
        db.add(new_grade)
        db.commit()
        db.refresh(new_grade)

        return {
            "status": "success",
            "message": f"Assignment graded with score {score}/30",
            "data": {
                "submission_id": submission_id,
                "score": score,
                "feedback": feedback,

            },

        }

    @router.get("/student/grades", response_model=GPAResponse)
    def get_grades(self):
        self._check_student()
        current_user = self.current_user.id
        db = self.db

        grades = db.query(AssignmentGrade).join(AssignmentSubmission).join(AssignmentTemplate).join(Course).filter(
            AssignmentSubmission.student_id == current_user
        ).all()

        if not grades:
            raise HTTPException(
                status_code=404, detail="No grades available yet.")

        course_grade_map = {}
        for grade in grades:
            course_id = grade.submission.assignment.course_id
            if course_id not in course_grade_map or grade.    score > course_grade_map[course_id].score:
                course_grade_map[course_id] = grade

        course_results = []
        total_credit_units = 0
        total_weighted_points = 0.0

        letter_to_point = {
            "A": 5.00,
            "B": 4.00,
            "C": 3.00,
            "D": 2.00,
            "E": 1.00,
            "F": 0.00
        }

        for course_id, grade in course_grade_map.items():
            course = grade.submission.assignment.course
            credit_unit = course.grade_point
            percentage = grade.score
            # letter = grade.letter_grade.upper()
            point = letter_to_point.get( 0.0)

            weighted = point * credit_unit
            total_weighted_points += weighted
            total_credit_units += credit_unit

        course_results.append({
            "course": course.title,
            "credit_unit": credit_unit,
            # "grade_letter": letter,
            "grade_point": point,
            "percentage": percentage
        })

        gpa = round(total_weighted_points / total_credit_units,
                    2) if total_credit_units else 0.0
        cgpa = gpa

        return {
            "student": current_user.name,
            "gpa": gpa,
            "cgpa": cgpa,
            "total_credit_units": total_credit_units,
            "course_results": course_results
        }

    @router.get("/assignments/{assignment_id}",     response_model=AssignmentDetailOut)
    def get_student_assignment(self, assignment_id: int):
        db = self.db
        current_user = self.current_user
        assignment = db.query(AssignmentTemplate).filter(
            AssignmentTemplate.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404,
                                detail="Assignment not found.")

        enrollment = db.query(Enrollment).filter_by(
            student_id=current_user.id,
            course_id=assignment.course_id,
            status="approved"
        ).first()

        if not enrollment:
            raise HTTPException(
                status_code=403, detail="You are not enrolled     in this course.")

        course = db.query(Course).filter(
            Course.id == assignment.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")

        return AssignmentDetailOut(
            id=assignment.id,
            title=assignment.title,
            description=assignment.description,
            weight=assignment.weight,
            course_id=assignment.course_id,
            course_title=course.title,
            lecturer_id=course.lecturer_id,
            created_at=assignment.created_at,

        )

    @router.get('/lecturer/grade-assignment/{submission_id}', response_model=GradeAssignmentDetailOut)
    def get_assignment_submission_for_grading(self, submission_id: int):
        db = self.db
        current_user = self.current_user
        submission = db.query(AssignmentSubmission).filter_by(
            id=submission_id).first()
        if not submission:
            raise HTTPException(status_code=404,
                                detail="Submission not found.")

        assignment = submission.assignment
        course = db.query(Course).filter_by(
            id=assignment.course_id).first()
        if not course or course.lecturer_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="You do not have permission to grade this submission.")

        return GradeAssignmentDetailOut(
            submission_id=submission.id,
            student_name=submission.student.name,
            assignment_title=assignment.title,
            course_title=course.title,
            text_submission=submission.text_submission,
            submission_path=submission.submission_path,
            submitted_at=submission.created_at.isoformat()
        )

    @router.get("/lecturer/submitted-assignments",response_model=list[SubmittedAssignmentOut])
    def get_submitted_assignments(self):
        db = self.db
        lecturer = self.current_user
        courses = db.query(Course).filter_by(lecturer_id=lecturer.id).all()
        course_ids = [c.id for c in courses]

        submissions = (
            db.query(AssignmentSubmission)
            .join(AssignmentTemplate)
            .filter(AssignmentTemplate.course_id.in_(course_ids))
            .all()
        )

        response = []
        for sub in submissions:

            response.append(
               
                    SubmittedAssignmentOut(
                        submission_id=sub.id,
                        assignment_id=sub.assignment_id,
                        course_id=sub.assignment.course_id,
                        student_id=sub.student_id,
                        assignment_title=sub.assignment.title,
                        course_title=sub.assignment.course.title,
                        student_name=sub.student.username,
                        submitted_at=sub.created_at,
                        text_submission=sub.text_submission,
                        submission_path=sub.submission_path,
                    )

                )
            
        return response

    @router.get("/lecturer/graded-assignments")
    def get_graded_assignments(self, request: Request):
        self._check_lecturer()
        db = self.db
        current_user = self.current_user

        graded = (
            db.query(AssignmentGrade)
            .join(AssignmentSubmission)
            .join(AssignmentTemplate)
            .join(Course)
            .join(User, AssignmentSubmission.student)
            .filter(AssignmentTemplate.lecturer_id == current_user.id)
            .all()
        )

        results = []
        for grade in graded:
            submission = grade.submission
            assignment = submission.assignment
            course = assignment.course
            student = submission.student

            progress = db.query(StudentLevelProgress).filter_by(
                student_id=student.id
            ).order_by(StudentLevelProgress.assigned_at.desc()).first()

            level_name = progress.level.name if progress else "N/A"
            department_name = course.department.name if course.    department else "N/A"

            results.append({
                "id": grade.id,
                "assignment_title": assignment.title,
                "course_title": course.title,
                "student_name": student.name,
                "score": grade.score,
               
                "feedback": grade.feedback,
                "graded_at": grade.created_at.isoformat(),
                "level": level_name,
                "department": department_name,
            })

        return {"results": results}

    @router.get("/student/results",     response_model=StudentResultResponse)
    def get_student_results(self, level: str = Query(None), session: str = Query(None)):
        self._check_student()
        student_id = self.current_user.id
        db = self.db

        level_ids = []
        session_ids = []

        if level:
            level_ids = [
                p.level_id for p in db.query(StudentLevelProgress).filter_by(
                    student_id=student_id
                ).join(SessionModel).filter(Level.name == level).all()
            ]

        if session:
            session_ids = [
                p.session_id for p in db.query(StudentLevelProgress).filter_by(
                    student_id=student_id
                ).join(SessionModel).filter(SessionModel.name == session).all()
            ]

        grades_query = db.query(AssignmentGrade).join(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student_id
        )

        if session_ids:
            grades_query = grades_query.join(AssignmentSubmission.assignment).join(Course).join(SessionModel).filter(
                Course.department.has(session_id=session_ids[0])
            )

        if level_ids:
            grades_query = grades_query.join(AssignmentSubmission.assignment).join(Course).    filter(
                Course.level_id.in_(level_ids)
            )

        results = []
        for grade in grades_query:
            assignment = grade.submission.assignment
            course = assignment.course
            results.append(StudentResultSchema(
                assignment_id=assignment.id,
                course=course.title,
                score=grade.score,
                grade=grade.letter_grade,
                grade_point=course.grade_point,
            ))

        return {"results": results}
