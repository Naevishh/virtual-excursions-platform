from fastapi import APIRouter, HTTPException

from app.schemas import RouteRequest, RouteResponse
from app.services.osrm import build_route

router = APIRouter()


@router.post("/route", response_model=RouteResponse)
async def create_route(payload: RouteRequest):
    try:
        return await build_route(payload.origin, payload.destination)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Не удалось построить маршрут: {exc}",
        )
