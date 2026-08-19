"""Small helpers shared by every service module."""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from . import db
from .errors import NotFound


def clean(value):
    """Turn enums/dates into plain values SQLite can store."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def payload(model, exclude_none: bool = True) -> dict:
    data = model.model_dump(exclude_none=exclude_none)
    return {k: clean(v) for k, v in data.items()}


def insert(table: str, row: dict) -> None:
    cols = ", ".join(row)
    marks = ", ".join("?" for _ in row)
    db.execute(f"INSERT INTO {table} ({cols}) VALUES ({marks})", list(row.values()))


def patch(table: str, row_id: str, changes: dict) -> None:
    if not changes:
        return
    sets = ", ".join(f"{k} = ?" for k in changes)
    db.execute(f"UPDATE {table} SET {sets} WHERE id = ?", [*changes.values(), row_id])


def must_get(table: str, row_id: str, label: str) -> dict:
    row = db.query_one(f"SELECT * FROM {table} WHERE id = ?", (row_id,))
    if not row:
        raise NotFound(
            f"{label} '{row_id}' was not found.",
            hint=f"Call the list/search operation for {table} to get valid ids.",
        )
    return row


def like(term: str) -> str:
    return f"%{term.strip()}%"
