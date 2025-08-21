from datetime import date

from database import get_db
from fastapi import Depends
from model import Level, SessionModel, StudentDepartment, StudentPromotionLog
from sqlalchemy.orm import Session


def auto_promote_students(db: Session = Depends(get_db)):
    students = (
        db.query(StudentDepartment)
        .join(Level, StudentDepartment.department_id == Level.department_id)
        .all()
    )

    completed_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.end_date < date.today())
        .order_by(SessionModel.end_date)
        .all()
    )

    for student in students:
        last_log = (
            db.query(StudentPromotionLog)
            .filter_by(student_id=student.student_id)
            .order_by(StudentPromotionLog.promoted_at.desc())
            .first()
        )

        last_session_id = last_log.session_id if last_log else None

        if last_session_id:
            last_session = db.query(SessionModel).filter_by(id=last_session_id).first()
            sessions_after = [
                s for s in completed_sessions if s.end_date > last_session.end_date
            ]
        else:
            sessions_after = completed_sessions

        if len(sessions_after) >= 2:
            current_level = db.query(Level).filter_by(id=student.level_id).first()
            next_level = (
                db.query(Level)
                .filter(Level.department_id == current_level.department_id)
                .filter(Level.name > current_level.name)
                .order_by(Level.name)
                .first()
            )

            if next_level:
                student.level_id = next_level.id
                db.add(student)

                db.add(
                    StudentPromotionLog(
                        student_id=student.student_id,
                        promoted_from_level_id=current_level.id,
                        promoted_to_level_id=next_level.id,
                        session_id=sessions_after[-1].id,
                    )
                )
            else:
                db.add(
                    StudentPromotionLog(
                        student_id=student.student_id,
                        promoted_from_level_id=current_level.id,
                        promoted_to_level_id=None,
                        session_id=sessions_after[-1].id,
                    )
                )

    db.commit()
