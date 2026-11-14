"""
Рекомендательная система по пройденным экскурсиям.

Сигнал — только явные действия посетителя:
    * нажал «Пройти экскурсию"  -> status = started   (вес 0.5)
    * дошёл до последней точки    -> status = completed (вес 1.0)
Клики по карте и открытие карточек не учитываются.

Итоговый балл кандидата — взвешенная сумма четырёх компонент (каждая в [0, 1]):

    score = 0.45 * collaborative   «кто прошёл X, тот прошёл и Y»
          + 0.30 * category        доля категории в истории посетителя
          + 0.10 * district        доля района в истории посетителя
          + 0.15 * geo             близость к уже пройденным объектам

1. Collaborative (item-item). Каждый объект — вектор весов по посетителям.
   Сходство двух объектов — косинус между векторами. Текущий посетитель
   из расчёта исключается, чтобы не рекомендовать «сам себе».
   collaborative(j) = Σ w_i · sim(i, j) / Σ w_i  по пройденным i.

2. Category / district — контентный профиль: какую долю истории
   составляют экскурсии этой категории / этого района.

3. Geo — exp(-d / 25 км), где d — расстояние до ближайшего пройденного
   объекта: удобно доехать «по пути».

Если взаимодействий мало, collaborative ≈ 0 и работают контентные сигналы.
Если истории нет совсем (холодный старт) — отдаём популярные экскурсии.

Начатые, но не завершённые экскурсии тоже попадают в выдачу с бонусом —
посетителю предлагают их закончить.
"""

from __future__ import annotations

import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models import Attraction, ExcursionProgress

STATUS_WEIGHT = {"started": 0.5, "completed": 1.0}

W_COLLAB = 0.45
W_CATEGORY = 0.30
W_DISTRICT = 0.10
W_GEO = 0.15
GEO_SCALE_KM = 25.0
UNFINISHED_BONUS = 0.25


@dataclass
class Recommendation:
    attraction: Attraction
    score: float
    reasons: List[str] = field(default_factory=list)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def plural_excursions(n: int) -> str:
    if n % 10 == 1 and n % 100 != 11:
        word = "экскурсию"
    elif n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        word = "экскурсии"
    else:
        word = "экскурсий"
    return f"{n} {word}"


def plural_people(n: int) -> str:
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        return f"{n} человека"
    return f"{n} человек"


def quoted(name: str) -> str:
    """«Мирский замок», но не «Мемориальный комплекс «Хатынь»»."""
    return name if "«" in name else f"«{name}»"


def format_km(km: float) -> str:
    return f"{km:.1f} км" if km < 10 else f"{round(km)} км"


def _load_attractions(db: Session) -> Dict[int, Attraction]:
    rows = (
        db.query(Attraction)
        .options(joinedload(Attraction.category), joinedload(Attraction.district))
        .filter(Attraction.is_published.is_(True))
        .all()
    )
    return {a.id: a for a in rows}


def _popular(
    attractions: Dict[int, Attraction],
    item_users: Dict[int, Dict[str, float]],
    exclude: set[int],
    limit: int,
) -> List[Recommendation]:
    """Холодный старт: сортировка по числу посетителей, прошедших экскурсию."""
    result = []
    for aid, attraction in attractions.items():
        if aid in exclude:
            continue
        users = item_users.get(aid, {})
        completed = sum(1 for w in users.values() if w >= STATUS_WEIGHT["completed"])
        popularity = sum(users.values())
        reasons = (
            [f"Популярная экскурсия: её прошли {plural_people(completed)}"]
            if completed
            else ["Начните знакомство с этой экскурсии"]
        )
        result.append(Recommendation(attraction, popularity, reasons))

    result.sort(key=lambda r: (-r.score, r.attraction.name))
    top = result[:limit]
    max_score = max((r.score for r in top), default=0) or 1
    for r in top:
        r.score = round(r.score / max_score, 3)
    return top


def recommend(
    db: Session,
    visitor_id: Optional[str],
    limit: int = 5,
) -> tuple[str, int, List[Recommendation]]:
    """Возвращает (strategy, based_on, items)."""
    attractions = _load_attractions(db)

    # ---- матрица «посетитель × объект» ----
    item_users: Dict[int, Dict[str, float]] = defaultdict(dict)
    my_items: Dict[int, float] = {}
    for p in db.query(ExcursionProgress).all():
        if p.attraction_id not in attractions:
            continue
        weight = STATUS_WEIGHT.get(p.status, 0.0)
        if p.visitor_id == visitor_id:
            my_items[p.attraction_id] = weight
        else:
            item_users[p.attraction_id][p.visitor_id] = weight

    completed_ids = {aid for aid, w in my_items.items() if w >= STATUS_WEIGHT["completed"]}
    unfinished_ids = set(my_items) - completed_ids

    if not my_items:
        return "popular", 0, _popular(attractions, item_users, set(), limit)

    # ---- контентный профиль ----
    total_w = sum(my_items.values())
    cat_pref: Dict[int, float] = defaultdict(float)
    cat_count: Dict[int, int] = defaultdict(int)
    dist_pref: Dict[int, float] = defaultdict(float)
    for aid, w in my_items.items():
        a = attractions[aid]
        cat_pref[a.category_id] += w / total_w
        dist_pref[a.district_id] += w / total_w
        cat_count[a.category_id] += 1

    # нормы векторов объектов для косинуса
    norms = {
        aid: math.sqrt(sum(w * w for w in users.values()))
        for aid, users in item_users.items()
    }

    def similarity(i: int, j: int) -> float:
        ui, uj = item_users.get(i), item_users.get(j)
        if not ui or not uj:
            return 0.0
        dot = sum(w * uj[u] for u, w in ui.items() if u in uj)
        return dot / (norms[i] * norms[j]) if dot else 0.0

    recs: List[Recommendation] = []
    for cid, cand in attractions.items():
        if cid in completed_ids:
            continue

        # 1. collaborative
        collab = 0.0
        best_src, best_contrib = None, 0.0
        for aid, w in my_items.items():
            if aid == cid:
                continue
            s = similarity(aid, cid)
            collab += w * s
            if w * s > best_contrib:
                best_src, best_contrib = aid, w * s
        collab /= total_w

        # 2. content
        cat = cat_pref.get(cand.category_id, 0.0)
        dist = dist_pref.get(cand.district_id, 0.0)

        # 3. geo
        nearest_id, nearest_km = None, float("inf")
        for aid in my_items:
            if aid == cid:
                continue
            a = attractions[aid]
            d = haversine_km(
                float(a.latitude), float(a.longitude),
                float(cand.latitude), float(cand.longitude),
            )
            if d < nearest_km:
                nearest_id, nearest_km = aid, d
        geo = math.exp(-nearest_km / GEO_SCALE_KM) if nearest_id else 0.0

        score = W_COLLAB * collab + W_CATEGORY * cat + W_DISTRICT * dist + W_GEO * geo

        # ---- объяснения ----
        reasons: List[str] = []
        if cid in unfinished_ids:
            score += UNFINISHED_BONUS
            reasons.append("Вы начали эту экскурсию, но не завершили")
        if best_src is not None and collab >= 0.1:
            co_visitors = len(
                set(item_users.get(best_src, {})) & set(item_users.get(cid, {}))
            )
            src_name = quoted(attractions[best_src].name)
            reasons.append(
                f"Её часто проходят те, кто прошёл {src_name}"
                if co_visitors >= 2
                else f"Её проходили и те, кто прошёл {src_name}"
            )
        if cat > 0 and cat_count[cand.category_id] - (1 if cid in my_items else 0) > 0:
            n = cat_count[cand.category_id] - (1 if cid in my_items else 0)
            reasons.append(
                f"Вы прошли {plural_excursions(n)} в категории {quoted(cand.category.name)}"
            )
        if nearest_id is not None and nearest_km <= 15:
            reasons.append(
                f"Рядом с уже пройденным — {quoted(attractions[nearest_id].name)} "
                f"({format_km(nearest_km)})"
            )
        if not reasons:
            reasons.append("Новое направление для вас")

        recs.append(Recommendation(cand, round(score, 3), reasons[:2]))

    recs.sort(key=lambda r: (-r.score, r.attraction.name))
    return "personal", len(my_items), recs[:limit]
