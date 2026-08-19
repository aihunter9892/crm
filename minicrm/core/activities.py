"""Activities = the timeline. Calls, emails, meetings, notes."""
from __future__ import annotations

from . import db
from .common import insert, must_get, payload
from .models import ActivityIn, new_id, now_iso

BASE = """
SELECT act.*, u.name AS owner_name
FROM activities act
LEFT JOIN users u ON u.id = act.owner_id
"""

TABLE_FOR = {"lead": "leads", "account": "accounts", "contact": "contacts", "deal": "deals"}


def list_activities(
    related_type: str | None = None,
    related_id: str | None = None,
    type: str | None = None,
    owner_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    where, params = [], []
    for col, val in (("related_type", related_type), ("related_id", related_id),
                     ("type", type), ("owner_id", owner_id)):
        if val:
            where.append(f"act.{col} = ?")
            params.append(val)
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY act.occurred_at DESC LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def log_activity(data: ActivityIn) -> dict:
    if data.related_type and data.related_id:
        must_get(TABLE_FOR[data.related_type.value], data.related_id, data.related_type.value.title())
    row = payload(data)
    row["id"] = new_id("act")
    row["occurred_at"] = row.get("occurred_at") or now_iso()
    row["created_at"] = now_iso()
    insert("activities", row)
    return db.query_one(BASE + " WHERE act.id = ?", (row["id"],))


def delete_activity(activity_id: str) -> dict:
    must_get("activities", activity_id, "Activity")
    db.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
    return {"deleted": activity_id}
