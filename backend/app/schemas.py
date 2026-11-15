from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CategoryBrief(BaseModel):
    slug: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class DistrictBrief(BaseModel):
    slug: str
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class CategoryOut(BaseModel):
    id: int
    slug: str
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DistrictOut(BaseModel):
    id: int
    slug: str
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class AttractionBrief(BaseModel):
    id: int
    name: str
    slug: Optional[str] = None
    category: CategoryBrief
    district: DistrictBrief
    latitude: float
    longitude: float
    short_description: str
    photo_url: Optional[str] = None
    is_accessible: bool
    distance_m: Optional[float] = None


class AttractionDetail(BaseModel):
    id: int
    name: str
    slug: Optional[str] = None
    category: CategoryBrief
    district: DistrictBrief
    latitude: float
    longitude: float
    short_description: str
    full_description: Optional[str] = None
    photo_url: Optional[str] = None
    source_url: Optional[str] = None
    is_accessible: bool

    model_config = ConfigDict(from_attributes=True)


class RoutePoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class RouteRequest(BaseModel):
    origin: RoutePoint
    destination: RoutePoint


class RouteResponse(BaseModel):
    distance_m: float
    duration_s: float
    geometry: Dict[str, Any]
    external_yandex_url: str


# ---------- Экскурсии ----------


class ExcursionStopOut(BaseModel):
    id: int
    position: int
    title: str
    subtitle: Optional[str] = None
    description: str
    fact: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExcursionOut(BaseModel):
    attraction_id: int
    attraction_name: str
    category: CategoryBrief
    stops: List[ExcursionStopOut]
    status: Optional[str] = None  # None / started / completed


class ProgressOut(BaseModel):
    attraction_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------- Рекомендации ----------


class RecommendationItem(BaseModel):
    attraction: AttractionBrief
    score: float
    reasons: List[str]


class RecommendationsOut(BaseModel):
    strategy: str  # personal / popular
    based_on: int  # сколько экскурсий учтено в профиле
    items: List[RecommendationItem]
