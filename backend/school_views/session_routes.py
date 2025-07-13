from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from fastapi_utils.cbv import cbv
from typing import List
from model import User, SessionModel
from schema import Role, SessionCreate, SessionOut
from promote_student import auto_promote_students
from constants import get_current_user
from database import get_db

router = APIRouter()


@cbv(router)
class SessionRoutes:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    @router.post("/sessions/create", response_model=dict)
    def create_session(self, session_data: SessionCreate):
        self._check_admin()

        db = self.db
        if session_data.start_date >= session_data.end_date:
            raise HTTPException(
                status_code=400, detail="End date must be after start date.")

        existing = db.query(SessionModel).filter_by(
            name=session_data.name).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Session with this name already exists.")
        four_months_ago = session_data.start_date - timedelta(days=120)
        expired_sessions = db.query(SessionModel).filter(
            SessionModel.end_date <= four_months_ago,
            SessionModel.is_active == True
        ).all()

        for old_session in expired_sessions:
            old_session.is_active = False

        auto_promote_students(db)
        one_year_ago = session_data.start_date.replace(
            year=session_data.start_date.year - 1)
        one_year_ahead = session_data.start_date.replace(
            year=session_data.start_date.year + 1)
        overlapping_sessions = db.query(SessionModel).filter(
            SessionModel.start_date >= one_year_ago,
            SessionModel.start_date <= one_year_ahead
        ).count()
        if overlapping_sessions >= 2:
            raise HTTPException(
                status_code=400,
                detail="Cannot create more than 2 sessions within a 1-year span."
            )
        session = SessionModel(
            name=session_data.name,
            start_date=session_data.start_date,
            end_date=session_data.end_date
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "status": "success",
            "message": "Session created successfully.",
            "data": {
                "id": session.id,
                "name": session.name,
                "start_date": session.start_date,
                "end_date": session.end_date,
                "is_active": session.check_active()
            }
        }

    @router.get("/sessions", response_model=List[SessionOut])
    def get_sessions(self):

        self._check_admin()

        return self.db.query(SessionModel).all()
