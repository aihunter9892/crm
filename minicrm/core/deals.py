"""Deals = the sales pipeline. The heart of the CRM."""
from __future__ import annotations

from datetime import date

from . import db
from .common import insert, like, must_get, patch, payload
from .errors import ValidationFailed
from .models import (STAGE_PROBABILITY, DealIn, DealStage, new_id, now_iso)

BASE = """
SELECT d.*,
       a.name AS account_name,
       c.first_name || ' ' || c.last_name AS contact_name,
       u.name AS owner_name
FROM deals d
LEFT JOIN accounts a ON a.id = d.account_id
LEFT JOIN contacts c ON c.id = d.contact_id
LEFT JOIN users    u ON u.id = d.owner_id
"""

OPEN = "('qualification','needs_analysis','proposal','negotiation')"


def search_deals(
    q: str | None = None,
    stage: str | None = None,
    owner_id: str | None = None,
    account_id: str | None = None,
    min_amount: float | None = None,
    open_only: bool = False,
    closing_before: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    """Search the pipeline. `open_only` excludes closed_won / closed_lost."""
    where, params = [], []
    if q:
        where.append("(d.name LIKE ? OR a.name LIKE ?)")
        params += [like(q)] * 2
    if stage:
        where.append("d.stage = ?")
        params.append(stage)
    if owner_id:
        where.append("d.owner_id = ?")
        params.append(owner_id)
    if account_id:
        where.append("d.account_id = ?")
        params.append(account_id)
    if min_amount is not None:
        where.append("d.amount >= ?")
        params.append(min_amount)
    if open_only:
        where.append(f"d.stage IN {OPEN}")
    if closing_before:
        where.append("d.close_date <= ?")
        params.append(closing_before)
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY d.amount DESC LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def get_deal(deal_id: str) -> dict:
    must_get("deals", deal_id, "Deal")
    return db.query_one(BASE + " WHERE d.id = ?", (deal_id,))


def create_deal(data: DealIn) -> dict:
    must_get("accounts", data.account_id, "Account")
    if data.contact_id:
        must_get("contacts", data.contact_id, "Contact")
    row = payload(data)
    row.setdefault("probability", STAGE_PROBABILITY[data.stage])
    row["id"] = new_id("dea")
    row["created_at"] = row["updated_at"] = now_iso()
    insert("deals", row)
    return get_deal(row["id"])


def update_deal(deal_id: str, changes: dict) -> dict:
    must_get("deals", deal_id, "Deal")
    allowed = set(DealIn.model_fields) | {"lost_reason"}
    clean_changes = {}
    for k, v in changes.items():
        if k not in allowed:
            continue
        clean_changes[k] = v.isoformat() if isinstance(v, date) else v
    clean_changes["updated_at"] = now_iso()
    patch("deals", deal_id, clean_changes)
    return get_deal(deal_id)


def move_stage(deal_id: str, stage: str, lost_reason: str | None = None) -> dict:
    """Move a deal to a new pipeline stage; probability follows automatically."""
    must_get("deals", deal_id, "Deal")
    try:
        target = DealStage(stage)
    except ValueError:
        raise ValidationFailed(
            f"'{stage}' is not a valid deal stage.",
            field="stage",
            allowed=[s.value for s in DealStage],
        )
    if target is DealStage.closed_lost and not lost_reason:
        raise ValidationFailed(
            "lost_reason is required when moving a deal to closed_lost.",
            field="lost_reason",
        )
    patch("deals", deal_id, {
        "stage": target.value,
        "probability": STAGE_PROBABILITY[target],
        "lost_reason": lost_reason,
        "updated_at": now_iso(),
    })
    return get_deal(deal_id)


def pipeline_board() -> dict:
    """Deals grouped by stage — exactly what the kanban view renders."""
    board = {}
    for stage in DealStage:
        rows = db.query(BASE + " WHERE d.stage = ? ORDER BY d.amount DESC", (stage.value,))
        board[stage.value] = {
            "deals": rows,
            "count": len(rows),
            "total": sum(r["amount"] or 0 for r in rows),
        }
    return board


def delete_deal(deal_id: str) -> dict:
    must_get("deals", deal_id, "Deal")
    db.execute("DELETE FROM deals WHERE id = ?", (deal_id,))
    return {"deleted": deal_id}
