"""Users = deal/task owners. Kept intentionally simple (no auth in v1)."""
from __future__ import annotations

from . import db
from .common import insert, must_get
from .models import new_id, now_iso


def list_users() -> list[dict]:
    return db.query("SELECT * FROM users ORDER BY name")


def get_user(user_id: str) -> dict:
    return must_get("users", user_id, "User")


def create_user(name: str, email: str, role: str = "sales_rep") -> dict:
    row = {
        "id": new_id("usr"),
        "name": name,
        "email": email,
        "role": role,
        "created_at": now_iso(),
    }
    insert("users", row)
    return row
