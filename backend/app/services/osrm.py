import httpx
from fastapi import HTTPException

from app.config import settings
from app.schemas import RoutePoint, RouteResponse


async def build_route(origin: RoutePoint, destination: RoutePoint) -> RouteResponse:
    """
    Запрашивает маршрут у OSRM demo server.
    OSRM принимает координаты в порядке: longitude,latitude.
    """
    url = (
        f"{settings.osrm_base_url.rstrip('/')}/route/v1/driving/"
        f"{origin.lng},{origin.lat};{destination.lng},{destination.lat}"
    )
    params = {
        "overview": "full",
        "geometries": "geojson",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Сервис маршрутизации не ответил вовремя",
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка запроса к сервису маршрутизации: {exc}",
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="OSRM вернул ошибку")

    data = response.json()
    if data.get("code") != "Ok":
        raise HTTPException(status_code=404, detail="Маршрут не найден")

    route = data["routes"][0]

    external_yandex_url = (
        "https://yandex.ru/maps/?rtext="
        f"{origin.lat},{origin.lng}~{destination.lat},{destination.lng}"
        "&rtt=auto"
    )

    return RouteResponse(
        distance_m=float(route["distance"]),
        duration_s=float(route["duration"]),
        geometry=route["geometry"],
        external_yandex_url=external_yandex_url,
    )
