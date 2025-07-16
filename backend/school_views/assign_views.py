import asyncio
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from notify import manager
from model import Level, User, SessionModel, LecturerDepartmentAndLevel, StudentLevelProgress, StudentDepartment
from schema import Role, AssignLecturerInput, AssignStudentInput, PromoteInput





class AssignService:
    def __init__(self, db: AsyncSession, current_user: User):
        self.db = db
        self.current_user = current_user

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Admin access required.")

    async def assign_lecturer(self, payload: AssignLecturerInput):
        self._check_admin()
        lecturer = await self.db.get(User, payload.lecturer_id)
        session = await self.db.get(SessionModel, payload.session_id)

        if not lecturer or not session:
            raise HTTPException(status_code=404, detail="Lecturer or Session not found.")

        assigned_levels = []

        for level_id in payload.level_id:
            level = await self.db.get(Level, level_id)
            if not level:
                raise HTTPException(status_code=404, detail=f"Level ID {level_id} not found.")
            if level.department_id is None:
                raise HTTPException(status_code=400, detail="Level has no department.")

            exists = await self.db.execute(
                select(LecturerDepartmentAndLevel).where(
                    LecturerDepartmentAndLevel.lecturer_id == lecturer.id,
                    LecturerDepartmentAndLevel.department_id == level.department_id,
                    LecturerDepartmentAndLevel.session_id == session.id,
                    LecturerDepartmentAndLevel.level_id == level.id
                )
            )
            if exists.scalar():
                continue

            self.db.add(LecturerDepartmentAndLevel(
                lecturer_id=lecturer.id,
                department_id=level.department_id,
                session_id=session.id,
                level_id=level.id
            ))
            assigned_levels.append(level.name)

        if not assigned_levels:
            raise HTTPException(status_code=400, detail="Already assigned to all levels.")

        await self.db.commit()

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "lecturer_assigned_to_levels",
                "message": f"You have been assigned to {len(assigned_levels)} level(s) for session '{session.name}'",
                "level_ids": payload.level_id,
                "session_id": session.id
            },
            user_id=lecturer.id
        ))

        return {
            "status": "success",
            "message": f"Assigned to levels: {', '.join(assigned_levels)} for session '{session.name}'"
        }

    async def assign_student(self, payload: AssignStudentInput):
        self._check_admin()
        student = await self.db.get(User, payload.student_id)
        if not student or student.role != Role.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")

        exists = await self.db.execute(
            select(StudentDepartment).where(StudentDepartment.student_id == student.id)
        )
        if exists.scalar():
            raise HTTPException(status_code=400, detail="Student already assigned")

        level = await self.db.get(Level, payload.level_id)
        if not level or level.department_id != payload.department_id:
            raise HTTPException(status_code=400, detail="Invalid level for department")

        student_dept = StudentDepartment(
            student_id=student.id,
            department_id=payload.department_id
        )
        self.db.add(student_dept)

        current_session = await self.db.execute(
            select(SessionModel).where(SessionModel.is_active == True)
        )
        current_session = current_session.scalar()
        if not current_session:
            raise HTTPException(status_code=404, detail="No active session")

        self.db.add(StudentLevelProgress(
            student_id=student.id,
            level_id=level.id,
            session_id=current_session.id
        ))

        await self.db.commit()

        asyncio.create_task(manager.send_personal_message(
            {
                "event": "student_assigned_department",
                "message": f"Assigned to department '{level.department.name}'",
                "department_id": student_dept.id,
                "level": level.id
            },
            user_id=student.id
        ))

        return {"status": "success", "message": "Student assigned successfully."}

    async def promote_student(self, data: PromoteInput):
        self._check_admin()
        student = await self.db.get(User, data.student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        dept_link = await self.db.execute(
            select(StudentDepartment).where(StudentDepartment.student_id == student.id)
        )
        dept_link = dept_link.scalar()
        if not dept_link:
            raise HTTPException(status_code=400, detail="Student not assigned to department")

        levels = await self.db.execute(
            select(Level).where(Level.department_id == dept_link.department_id).order_by(Level.id)
        )
        levels = levels.scalars().all()

        progress = await self.db.execute(
            select(StudentLevelProgress).where(
                StudentLevelProgress.student_id == student.id
            ).order_by(StudentLevelProgress.session_id)
        )
        progress = progress.scalars().all()

        if not progress:
            raise HTTPException(status_code=400, detail="No level progress found")

        current_level_id = progress[-1].level_id
        current_index = next((i for i, lvl in enumerate(levels) if lvl.id == current_level_id), -1)

        if current_index == -1 or current_index == len(levels) - 1:
            return {"status": "done", "message": "Student already at final level"}

        if len(progress) % 2 != 0:
            return {"status": "waiting", "message": "Not completed two sessions"}

        next_level = levels[current_index + 1]

        session_q = await self.db.execute(
            select(SessionModel).where(SessionModel.is_active == True)
        )
        session = session_q.scalar()
        if not session:
            raise HTTPException(status_code=404, detail="No active session")

        already = await self.db.execute(
            select(StudentLevelProgress).where(
                StudentLevelProgress.student_id == student.id,
                StudentLevelProgress.session_id == session.id
            )
        )
        if already.scalar():
            return {"status": "skipped", "message": "Already promoted this session"}

        self.db.add(StudentLevelProgress(
            student_id=student.id,
            level_id=next_level.id,
            session_id=session.id
        ))
        await self.db.commit()
        return {
            "status": "success",
            "message": f"Promoted to level {next_level.name}"
        }