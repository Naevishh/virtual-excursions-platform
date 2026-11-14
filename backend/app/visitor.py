"""
Анонимная идентификация посетителя.

Регистрации в проекте нет, поэтому фронтенд один раз генерирует UUID,
хранит его в localStorage и передаёт в каждом запросе заголовком
`X-Visitor-Id`. По этому ID backend ведёт историю пройденных экскурсий.
"""

import re
from typing import Optional

from fastapi import Header, HTTPException

VISITOR_HEADER = "X-Visitor-Id"
_VISITOR_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def _validate(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    if not _VISITOR_RE.match(value):
        raise HTTPException(status_code=400, detail="Некорректный X-Visitor-Id")
    return value


def optional_visitor(
    x_visitor_id: Optional[str] = Header(None, alias=VISITOR_HEADER),
) -> Optional[str]:
    return _validate(x_visitor_id)


def required_visitor(
    x_visitor_id: Optional[str] = Header(None, alias=VISITOR_HEADER),
) -> str:
    visitor_id = _validate(x_visitor_id)
    if not visitor_id:
        raise HTTPException(
            status_code=400,
            detail=f"Нужен заголовок {VISITOR_HEADER}",
        )
    return visitor_id
