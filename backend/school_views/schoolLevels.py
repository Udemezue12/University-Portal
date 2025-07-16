from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from fastapi_utils.cbv import cbv
from database import get_db
from constants import get_current_user
from typing import List
from model import Level, User
from schema import LevelCreate, LevelOut, Role

router = APIRouter()







@cbv(router)
class SchoolLevelsRouter:
    db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_admin(self):
        if self.current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=403, detail="Admin access required.")

    @router.get("/levels", response_model=List[LevelOut])
    def get_levels(self):
        # self._check_admin()
        return self.db.query(Level).options(joinedload(Level.department)).all()

    @router.post('/school/levels/create', response_model=LevelOut)
    def create_levels(self, data: LevelCreate):
        self._check_admin()

        db = self.db
        level_count = db.query(Level).filter(
            Level.department_id == data.department_id).count()
        existing_level = db.query(Level).filter(
            Level.name == data.name,
            Level.department_id == data.department_id
        ).first()
        if existing_level:
            raise HTTPException(
                status_code=400,
                detail="Level with this name already exists in the department."
            )
        if level_count >= 6:
            raise HTTPException(
                status_code=400,
                detail="Cannot create more than 6 levels for this department."
            )

        level = Level(**data.dict())
        db.add(level)
        db.commit()
        db.refresh(level)
        return level
