"""Accounts = companies you sell to."""
from __future__ import annotations

from . import db
from .common import insert, like, must_get, patch, payload
from .errors import Conflict
from .models import AccountIn, new_id, now_iso

BASE = """
SELECT a.*,
       u.name AS owner_name,
       (SELECT COUNT(*) FROM contacts c WHERE c.account_id = a.id) AS contact_count,
       (SELECT COUNT(*) FROM deals d WHERE d.account_id = a.id)    AS deal_count,
       (SELECT COALESCE(SUM(d.amount), 0) FROM deals d
         WHERE d.account_id = a.id AND d.stage NOT IN ('closed_won','closed_lost')) AS open_pipeline
FROM accounts a
LEFT JOIN users u ON u.id = a.owner_id
"""


def search_accounts(
    q: str | None = None,
    industry: str | None = None,
    owner_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """Find accounts by free text (name/website/city), industry or owner."""
    where, params = [], []
    if q:
        where.append("(a.name LIKE ? OR a.website LIKE ? OR a.city LIKE ?)")
        params += [like(q)] * 3
    if industry:
        where.append("a.industry = ?")
        params.append(industry)
    if owner_id:
        where.append("a.owner_id = ?")
        params.append(owner_id)
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY a.name LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def get_account(account_id: str) -> dict:
    must_get("accounts", account_id, "Account")
    return db.query_one(BASE + " WHERE a.id = ?", (account_id,))


def create_account(data: AccountIn) -> dict:
    dup = db.query_one("SELECT id FROM accounts WHERE lower(name) = lower(?)", (data.name,))
    if dup:
        raise Conflict(
            f"An account named '{data.name}' already exists.",
            existing_id=dup["id"],
            hint="Use update_account on the existing id instead of creating a duplicate.",
        )
    row = payload(data)
    row["id"] = new_id("acc")
    row["created_at"] = row["updated_at"] = now_iso()
    insert("accounts", row)
    return get_account(row["id"])


def update_account(account_id: str, changes: dict) -> dict:
    must_get("accounts", account_id, "Account")
    allowed = set(AccountIn.model_fields)
    clean_changes = {k: v for k, v in changes.items() if k in allowed}
    clean_changes["updated_at"] = now_iso()
    patch("accounts", account_id, clean_changes)
    return get_account(account_id)


def delete_account(account_id: str) -> dict:
    must_get("accounts", account_id, "Account")
    db.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    return {"deleted": account_id}
