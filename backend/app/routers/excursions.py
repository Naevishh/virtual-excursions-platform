from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Attraction, ExcursionProgress
from app.schemas import ExcursionOut, ProgressOut
from app.visitor import optional_visitor, required_visitor

router = APIRouter()


def _get_attraction(db: Session, attraction_id: int) -> Attraction:
    attraction = (
        db.query(Attraction)
        .options(joinedload(Attraction.category), joinedload(Attraction.stops))
        .filter(Attraction.id == attraction_id, Attraction.is_published.is_(True))
        .first()
    )
    if not attraction:
        raise HTTPException(status_code=404, detail="Объект не найден")
    return attraction


def _get_progress(
    db: Session, visitor_id: str, attraction_id: int
) -> Optional[ExcursionProgress]:
    return (
        db.query(ExcursionProgress)
        .filter(
            ExcursionProgress.visitor_id == visitor_id,
            ExcursionProgress.attraction_id == attraction_id,
        )
        .first()
    )


@router.get("/attractions/{attraction_id}/excursion", response_model=ExcursionOut)
def read_excursion(
    attraction_id: int,
    db: Session = Depends(get_db),
    visitor_id: Optional[str] = Depends(optional_visitor),
):
    """Точки экскурсии + статус прохождения текущим посетителем."""
    attraction = _get_attraction(db, attraction_id)
    progress = _get_progress(db, visitor_id, attraction_id) if visitor_id else None
    return {
        "attraction_id": attraction.id,
        "attraction_name": attraction.name,
        "category": attraction.category,
        "stops": attraction.stops,
        "status": progress.status if progress else None,
    }


@router.post(
    "/attractions/{attraction_id}/excursion/start", response_model=ProgressOut
)
def start_excursion(
    attraction_id: int,
    db: Session = Depends(get_db),
    visitor_id: str = Depends(required_visitor),
):
    """Нажатие кнопки «Пройти экскурсию». Пройденную не понижает до started."""
    _get_attraction(db, attraction_id)
    progress = _get_progress(db, visitor_id, attraction_id)
    if not progress:
        progress = ExcursionProgress(
            visitor_id=visitor_id, attraction_id=attraction_id, status="started"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


@router.post(
    "/attractions/{attraction_id}/excursion/complete", response_model=ProgressOut
)
def complete_excursion(
    attraction_id: int,
    db: Session = Depends(get_db),
    visitor_id: str = Depends(required_visitor),
):
    """Посетитель дошёл до последней точки экскурсии."""
    _get_attraction(db, attraction_id)
    progress = _get_progress(db, visitor_id, attraction_id)
    if not progress:
        progress = ExcursionProgress(visitor_id=visitor_id, attraction_id=attraction_id)
        db.add(progress)
    progress.status = "completed"
    progress.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(progress)
    return progress


@router.get("/excursions/history", response_model=List[ProgressOut])
def read_history(
    db: Session = Depends(get_db),
    visitor_id: str = Depends(required_visitor),
):
    """История посетителя: какие экскурсии начаты и пройдены."""
    return (
        db.query(ExcursionProgress)
        .filter(ExcursionProgress.visitor_id == visitor_id)
        .order_by(ExcursionProgress.started_at.desc())
        .all()
    )
