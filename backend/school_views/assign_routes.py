import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_utils.cbv import cbv
from database import get_db
from notify import manager
from constants import get_current_user
from model import Level, User, SessionModel, LecturerDepartmentAndLevel, StudentLevelProgress, StudentDepartment
from schema import Role, AssignLecturerInput, AssignStudentInput, PromoteInput

router = APIRouter()


@cbv(router)
class AssignRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    @router.post('/assign/lecturer', response_model=dict)
    async def assign_lecturer_to_departments(self, payload: AssignLecturerInput):
        self._check_admin()
        lecturer_id = payload.lecturer_id
        session_id = payload.session_id
        level_ids = payload.level_id

        db = self.db

        lecturer = db.query(User).filter(
            User.id == lecturer_id,
            User.role == Role.LECTURER
        ).first()

        session = db.query(SessionModel).filter_by(id=session_id).first()

        if not lecturer or not session:
            raise HTTPException(
                status_code=404, detail="Lecturer or Session not found."
            )

        assigned_levels = []

        for level_id in level_ids:
            level = db.query(Level).filter_by(id=level_id).first()
            if not level:
                raise HTTPException(
                    status_code=404, detail=f"Level ID {level_id} not found.")
            department_id = level.department_id
            if department_id is None:
                raise HTTPException(
                    status_code=400, detail=f"Level ID {level_id} has no department assigned.")

            existing_assignment = db.query(LecturerDepartmentAndLevel).filter_by(
                lecturer_id=lecturer.id,
                department_id=department_id,
                session_id=session.id,
                level_id=level.id
            ).first()

            if existing_assignment:
                pass
            new_assignment = LecturerDepartmentAndLevel(
                lecturer_id=lecturer.id,
                department_id=level.department_id,
                session_id=session.id,
                level_id=level.id
            )
            db.add(new_assignment)

            assigned_levels.append(level.name)
            if not assigned_levels:
                raise HTTPException(
                    status_code=400, detail="Lecturer is already assigned to all selected levels for this session.")

        db.commit()

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "lecturer_assigned_to_levels",
                "message": f"You have been assigned to {len(assigned_levels)} level(s) for the session '    {session.name}'",
                "level_ids": level_ids,
                "session_id": session.id,
            },
            user_id=lecturer_id
        ))

        return {
            "status": "success",
            "message": f"Lecturer '{lecturer.name}' assigned     to levels: {', '.join(assigned_levels)} for     session '{session.name}'."
        }

    @router.post('/assign-student', response_model=dict)
    async def assign_student(self, payload: AssignStudentInput):
        self._check_admin()
        student_id = payload.student_id
        level_id = payload.level_id
        department_id = payload.department_id

        db = self.db
        student = db.query(User).filter(
            User.id == student_id,
            User.role == Role.STUDENT
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        existing = db.query(StudentDepartment).filter_by(
            student_id=student.id).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Student already assigned to a department")
        level = self.db.query(Level).filter_by(id=level_id).first()
        if not level or level.department_id != payload.department_id:
            raise HTTPException(
                status_code=400, detail="Invalid level for department")
        student_department = StudentDepartment(
            student_id=student.id,
            department_id=department_id
        )
        db.add(student_department)
        current_session = self.db.query(SessionModel).filter(
            SessionModel.is_active == True).first()
        if not current_session:
            raise HTTPException(status_code=404, detail="No active session")
        db.add(
            StudentLevelProgress(
                student_id=student.id,
                level_id=level.id,
                session_id=current_session.id
            )
        )
        db.commit()

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "student_assigned_department",
                "message": f"You have been assigned to the department '{student_department.name}'.",
                "department_id": student_department.id,
                'level': level.id
            },
            user_id=student_id
        ))
        return {"status": "success", "message": "Student assigned successfully."}

    @router.post('/promote-student', response_model=dict)
    def promote_student(self, data: PromoteInput):
        self._check_admin()

        student_id = data.student_id
        db = self.db

        student = db.query(User).filter(
            User.id == student_id,
            User.role == Role.STUDENT
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        department_link = db.query(StudentDepartment).filter_by(
            student_id=student.id).first()
        if not department_link:
            raise HTTPException(
                status_code=400, detail="Student not assigned to a department")
        all_levels = db.query(Level).filter_by(
            department_id=department_link.department_id).order_by(Level.id).all()
        progress_records = db.query(StudentLevelProgress).filter_by(
            student_id=student.id).order_by(StudentLevelProgress.session_id).all()
        if not progress_records:
            raise HTTPException(
                status_code=400, detail="No level progress found for student")
        current_level_id = progress_records[-1].level_id
        current_index = next((i for i, lvl in enumerate(
            all_levels) if lvl.id == current_level_id), -1)
        current_level_id = progress_records[-1].level_id
        current_index = next((i for i, lvl in enumerate(
            all_levels) if lvl.id == current_level_id), -1)
        if current_index == -1 or current_index == len(all_levels) - 1:

            return {"status": "done", "message": "Student has reached the maximum level."}
        if len(progress_records) % 2 != 0:
            return {"status": "waiting", "message": "Student has not completed 2 sessions yet."}
        next_level = all_levels[current_index + 1]
        latest_session = db.query(SessionModel).filter(
            SessionModel.is_active == True).first()
        if not latest_session:
            raise HTTPException(status_code=404, detail="No active session")

        already_promoted = self.db.query(StudentLevelProgress).filter_by(
            student_id=student.id,
            session_id=latest_session.id
        ).first()
        if already_promoted:
            return {"status": "skipped", "message": "Already promoted this session."}
        db.add(StudentLevelProgress(
            student_id=student.id,
            level_id=next_level.id,
            session_id=latest_session.id
        ))
        db.commit()
        return {
            "status": "success",
            "message": f"Student promoted to level {next_level.name}"
        }
