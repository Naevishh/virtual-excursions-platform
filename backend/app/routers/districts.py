from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import District
from app.schemas import DistrictOut

router = APIRouter()


@router.get("", response_model=List[DistrictOut])
def get_districts(db: Session = Depends(get_db)):
    return db.query(District).order_by(District.name).all()
