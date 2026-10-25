from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Attraction, Category, District
from app.schemas import AttractionDetail

router = APIRouter()


def parse_csv(value: Optional[str]) -> Optional[List[str]]:
    if not value:
        return None
    items = [item.strip() for item in value.split(",") if item.strip()]
    return items or None


def build_attraction_columns():
    return [
        Attraction.id,
        Attraction.name,
        Attraction.slug,
        Category.slug.label("category_slug"),
        Category.name.label("category_name"),
        District.slug.label("district_slug"),
        District.name.label("district_name"),
        District.type.label("district_type"),
        Attraction.latitude,
        Attraction.longitude,
        Attraction.short_description,
        Attraction.photo_url,
        Attraction.is_accessible,
    ]


def row_to_brief(row, distance_m: Optional[float] = None) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "slug": row.slug,
        "category": {
            "slug": row.category_slug,
            "name": row.category_name,
        },
        "district": {
            "slug": row.district_slug,
            "name": row.district_name,
            "type": row.district_type,
        },
        "latitude": float(row.latitude),
        "longitude": float(row.longitude),
        "short_description": row.short_description,
        "photo_url": row.photo_url,
        "is_accessible": row.is_accessible,
        "distance_m": distance_m,
    }


@router.get("")
def read_attractions(
    category: Optional[str] = Query(None, description="Слаг категорий через запятую"),
    district: Optional[str] = Query(None, description="Слаг районов через запятую"),
    q: Optional[str] = Query(None, description="Поиск по названию/описанию/району"),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: Optional[float] = Query(None, gt=0, le=300),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    if radius_km is not None and (lat is None or lng is None):
        raise HTTPException(
            status_code=400,
            detail="Для поиска по радиусу нужно передать lat и lng",
        )

    categories = parse_csv(category)
    districts = parse_csv(district)

    use_distance = lat is not None and lng is not None
    filter_by_radius = use_distance and radius_km is not None

    count_query = (
        db.query(func.count(Attraction.id))
        .join(Category, Attraction.category_id == Category.id)
        .join(District, Attraction.district_id == District.id)
        .filter(Attraction.is_published.is_(True))
    )

    data_query = (
        db.query(*build_attraction_columns())
        .join(Category, Attraction.category_id == Category.id)
        .join(District, Attraction.district_id == District.id)
        .filter(Attraction.is_published.is_(True))
    )

    def apply_filters(query):
        if categories:
            query = query.filter(Category.slug.in_(categories))
        if districts:
            query = query.filter(District.slug.in_(districts))
        if q:
            pattern = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    Attraction.name.ilike(pattern),
                    Attraction.short_description.ilike(pattern),
                    District.name.ilike(pattern),
                )
            )
        return query

    count_query = apply_filters(count_query)
    data_query = apply_filters(data_query)

    if use_distance:
        user_point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        attraction_point = func.ST_SetSRID(
            func.ST_MakePoint(Attraction.longitude, Attraction.latitude),
            4326,
        )
        distance_expr = func.ST_DistanceSphere(attraction_point, user_point)

        data_query = data_query.add_columns(distance_expr.label("distance_m"))

        if filter_by_radius:
            radius_m = radius_km * 1000
            data_query = data_query.filter(distance_expr <= radius_m)
            count_query = count_query.filter(distance_expr <= radius_m)

        data_query = data_query.order_by(distance_expr)
    else:
        data_query = data_query.order_by(Attraction.name)

    total = count_query.scalar() or 0
    rows = data_query.limit(limit).all()

    items = []
    for row in rows:
        distance_m = float(row.distance_m) if use_distance else None
        items.append(row_to_brief(row, distance_m=distance_m))

    return {
        "total": total,
        "items": items,
    }


@router.get("/{attraction_id}", response_model=AttractionDetail)
def read_attraction(attraction_id: int, db: Session = Depends(get_db)):
    attraction = (
        db.query(Attraction)
        .options(
            joinedload(Attraction.category),
            joinedload(Attraction.district),
        )
        .filter(Attraction.id == attraction_id)
        .first()
    )
    if not attraction:
        raise HTTPException(status_code=404, detail="Объект не найден")
    return attraction


@router.get("/{attraction_id}/similar")
def get_similar_attractions(
    attraction_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    current = db.get(Attraction, attraction_id)
    if not current:
        raise HTTPException(status_code=404, detail="Объект не найден")

    current_point = func.ST_SetSRID(
        func.ST_MakePoint(current.longitude, current.latitude),
        4326,
    )
    attraction_point = func.ST_SetSRID(
        func.ST_MakePoint(Attraction.longitude, Attraction.latitude),
        4326,
    )
    distance_expr = func.ST_DistanceSphere(attraction_point, current_point)

    rows = (
        db.query(*build_attraction_columns(), distance_expr.label("distance_m"))
        .join(Category, Attraction.category_id == Category.id)
        .join(District, Attraction.district_id == District.id)
        .filter(
            Attraction.is_published.is_(True),
            Attraction.category_id == current.category_id,
            Attraction.id != current.id,
        )
        .order_by(distance_expr)
        .limit(limit)
        .all()
    )

    items = [row_to_brief(row, distance_m=float(row.distance_m)) for row in rows]
    return {"items": items}


@router.get("/{attraction_id}/nearby")
def get_nearby_attractions(
    attraction_id: int,
    radius_km: float = Query(10, gt=0, le=200),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    current = db.get(Attraction, attraction_id)
    if not current:
        raise HTTPException(status_code=404, detail="Объект не найден")

    current_point = func.ST_SetSRID(
        func.ST_MakePoint(current.longitude, current.latitude),
        4326,
    )
    attraction_point = func.ST_SetSRID(
        func.ST_MakePoint(Attraction.longitude, Attraction.latitude),
        4326,
    )
    distance_expr = func.ST_DistanceSphere(attraction_point, current_point)

    radius_m = radius_km * 1000
    rows = (
        db.query(*build_attraction_columns(), distance_expr.label("distance_m"))
        .join(Category, Attraction.category_id == Category.id)
        .join(District, Attraction.district_id == District.id)
        .filter(
            Attraction.is_published.is_(True),
            Attraction.id != current.id,
            distance_expr <= radius_m,
        )
        .order_by(distance_expr)
        .limit(limit)
        .all()
    )

    items = [row_to_brief(row, distance_m=float(row.distance_m)) for row in rows]
    return {"items": items}
