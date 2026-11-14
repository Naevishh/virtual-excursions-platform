from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Attraction
from app.schemas import RecommendationsOut
from app.services.recommender import recommend
from app.visitor import optional_visitor

router = APIRouter()


def attraction_to_brief(a: Attraction) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "slug": a.slug,
        "category": {"slug": a.category.slug, "name": a.category.name},
        "district": {
            "slug": a.district.slug,
            "name": a.district.name,
            "type": a.district.type,
        },
        "latitude": float(a.latitude),
        "longitude": float(a.longitude),
        "short_description": a.short_description,
        "photo_url": a.photo_url,
        "is_accessible": a.is_accessible,
        "distance_m": None,
    }


@router.get("", response_model=RecommendationsOut)
def read_recommendations(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    visitor_id: Optional[str] = Depends(optional_visitor),
):
    """
    Персональные рекомендации по пройденным экскурсиям (заголовок X-Visitor-Id).
    Без истории — популярные экскурсии.
    """
    strategy, based_on, items = recommend(db, visitor_id, limit)
    return {
        "strategy": strategy,
        "based_on": based_on,
        "items": [
            {
                "attraction": attraction_to_brief(r.attraction),
                "score": r.score,
                "reasons": r.reasons,
            }
            for r in items
        ],
    }
