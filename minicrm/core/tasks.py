"""Tasks = follow-ups. Can hang off a lead, account, contact or deal."""
from __future__ import annotations

from datetime import date

from . import db
from .common import insert, like, must_get, patch, payload
from .models import TaskIn, TaskStatus, new_id, now_iso

BASE = """
SELECT t.*, u.name AS assignee_name
FROM tasks t
LEFT JOIN users u ON u.id = t.assignee_id
"""

TABLE_FOR = {"lead": "leads", "account": "accounts", "contact": "contacts", "deal": "deals"}


def search_tasks(
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    assignee_id: str | None = None,
    related_type: str | None = None,
    related_id: str | None = None,
    due_before: str | None = None,
    overdue_only: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    where, params = [], []
    if q:
        where.append("(t.subject LIKE ? OR t.description LIKE ?)")
        params += [like(q)] * 2
    for col, val in (("status", status), ("priority", priority),
                     ("assignee_id", assignee_id), ("related_type", related_type),
                     ("related_id", related_id)):
        if val:
            where.append(f"t.{col} = ?")
            params.append(val)
    if due_before:
        where.append("t.due_date <= ?")
        params.append(due_before)
    if overdue_only:
        where.append("t.due_date < ? AND t.status NOT IN ('completed')")
        params.append(date.today().isoformat())
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY (t.due_date IS NULL), t.due_date, t.priority DESC LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def get_task(task_id: str) -> dict:
    must_get("tasks", task_id, "Task")
    return db.query_one(BASE + " WHERE t.id = ?", (task_id,))


def create_task(data: TaskIn) -> dict:
    if data.related_type and data.related_id:
        must_get(TABLE_FOR[data.related_type.value], data.related_id, data.related_type.value.title())
    row = payload(data)
    row["id"] = new_id("tsk")
    row["created_at"] = row["updated_at"] = now_iso()
    insert("tasks", row)
    return get_task(row["id"])


def update_task(task_id: str, changes: dict) -> dict:
    must_get("tasks", task_id, "Task")
    allowed = set(TaskIn.model_fields)
    clean_changes = {}
    for k, v in changes.items():
        if k not in allowed:
            continue
        clean_changes[k] = v.isoformat() if isinstance(v, date) else v
    if clean_changes.get("status") == TaskStatus.completed.value:
        clean_changes["completed_at"] = now_iso()
    clean_changes["updated_at"] = now_iso()
    patch("tasks", task_id, clean_changes)
    return get_task(task_id)


def assign_task(task_id: str, assignee_id: str) -> dict:
    must_get("users", assignee_id, "User")
    return update_task(task_id, {"assignee_id": assignee_id})


def complete_task(task_id: str) -> dict:
    return update_task(task_id, {"status": TaskStatus.completed.value})


def delete_task(task_id: str) -> dict:
    must_get("tasks", task_id, "Task")
    db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return {"deleted": task_id}
