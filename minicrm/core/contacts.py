"""Contacts = people, usually attached to an account."""
from __future__ import annotations

from . import db
from .common import insert, like, must_get, patch, payload
from .models import ContactIn, new_id, now_iso

BASE = """
SELECT c.*,
       c.first_name || ' ' || c.last_name AS full_name,
       a.name AS account_name,
       u.name AS owner_name
FROM contacts c
LEFT JOIN accounts a ON a.id = c.account_id
LEFT JOIN users    u ON u.id = c.owner_id
"""


def search_contacts(
    q: str | None = None,
    account_id: str | None = None,
    owner_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    where, params = [], []
    if q:
        where.append("(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR a.name LIKE ?)")
        params += [like(q)] * 4
    if account_id:
        where.append("c.account_id = ?")
        params.append(account_id)
    if owner_id:
        where.append("c.owner_id = ?")
        params.append(owner_id)
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY c.first_name LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def get_contact(contact_id: str) -> dict:
    must_get("contacts", contact_id, "Contact")
    return db.query_one(BASE + " WHERE c.id = ?", (contact_id,))


def create_contact(data: ContactIn) -> dict:
    if data.account_id:
        must_get("accounts", data.account_id, "Account")
    row = payload(data)
    row["id"] = new_id("con")
    row["created_at"] = row["updated_at"] = now_iso()
    insert("contacts", row)
    return get_contact(row["id"])


def update_contact(contact_id: str, changes: dict) -> dict:
    must_get("contacts", contact_id, "Contact")
    allowed = set(ContactIn.model_fields)
    clean_changes = {k: v for k, v in changes.items() if k in allowed}
    clean_changes["updated_at"] = now_iso()
    patch("contacts", contact_id, clean_changes)
    return get_contact(contact_id)


def delete_contact(contact_id: str) -> dict:
    must_get("contacts", contact_id, "Contact")
    db.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
    return {"deleted": contact_id}
