"""Read-only rollups that power the dashboard (and later, agent summaries)."""
from __future__ import annotations

from datetime import date, timedelta

from . import db
from .models import DealStage

OPEN = "('qualification','needs_analysis','proposal','negotiation')"


def dashboard() -> dict:
    today = date.today()
    month_start = today.replace(day=1).isoformat()
    next_30 = (today + timedelta(days=30)).isoformat()

    open_pipeline = db.query_one(
        f"SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count "
        f"FROM deals WHERE stage IN {OPEN}")
    weighted = db.query_one(
        f"SELECT COALESCE(SUM(amount * probability / 100.0),0) AS total "
        f"FROM deals WHERE stage IN {OPEN}")
    won_mtd = db.query_one(
        "SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count "
        "FROM deals WHERE stage = 'closed_won' AND updated_at >= ?", (month_start,))
    closed = db.query_one(
        "SELECT SUM(stage='closed_won') AS won, SUM(stage='closed_lost') AS lost "
        "FROM deals WHERE stage IN ('closed_won','closed_lost')")
    won = closed["won"] or 0
    lost = closed["lost"] or 0

    return {
        "open_pipeline_value": open_pipeline["total"],
        "open_deal_count": open_pipeline["count"],
        "weighted_pipeline_value": round(weighted["total"], 2),
        "won_this_month_value": won_mtd["total"],
        "won_this_month_count": won_mtd["count"],
        "win_rate_pct": round(won * 100 / (won + lost), 1) if (won + lost) else 0.0,
        "avg_deal_size": round(open_pipeline["total"] / open_pipeline["count"], 2) if open_pipeline["count"] else 0,
        "open_tasks": db.query_one(
            "SELECT COUNT(*) AS c FROM tasks WHERE status != 'completed'")["c"],
        "overdue_tasks": db.query_one(
            "SELECT COUNT(*) AS c FROM tasks WHERE status != 'completed' AND due_date < ?",
            (today.isoformat(),))["c"],
        "new_leads": db.query_one(
            "SELECT COUNT(*) AS c FROM leads WHERE status = 'new'")["c"],
        "total_accounts": db.query_one("SELECT COUNT(*) AS c FROM accounts")["c"],
        "total_contacts": db.query_one("SELECT COUNT(*) AS c FROM contacts")["c"],
        "closing_next_30_days": db.query(
            f"SELECT d.id, d.name, d.amount, d.stage, d.close_date, a.name AS account_name "
            f"FROM deals d LEFT JOIN accounts a ON a.id = d.account_id "
            f"WHERE d.stage IN {OPEN} AND d.close_date BETWEEN ? AND ? "
            f"ORDER BY d.close_date LIMIT 10", (today.isoformat(), next_30)),
    }


def pipeline_by_stage() -> list[dict]:
    rows = {r["stage"]: r for r in db.query(
        "SELECT stage, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total "
        "FROM deals GROUP BY stage")}
    return [
        {
            "stage": s.value,
            "count": rows.get(s.value, {}).get("count", 0),
            "total": rows.get(s.value, {}).get("total", 0),
        }
        for s in DealStage
    ]


def leads_by_source() -> list[dict]:
    return db.query(
        "SELECT source, COUNT(*) AS count FROM leads GROUP BY source ORDER BY count DESC")


def revenue_by_owner() -> list[dict]:
    return db.query(
        f"SELECT u.id AS owner_id, u.name AS owner_name, "
        f"  COALESCE(SUM(CASE WHEN d.stage IN {OPEN} THEN d.amount END),0) AS open_value, "
        f"  COALESCE(SUM(CASE WHEN d.stage = 'closed_won' THEN d.amount END),0) AS won_value, "
        f"  COUNT(d.id) AS deal_count "
        f"FROM users u LEFT JOIN deals d ON d.owner_id = u.id "
        f"GROUP BY u.id ORDER BY won_value DESC")


def stale_accounts(days: int = 30, min_open_value: float = 0) -> list[dict]:
    """Accounts with open pipeline but no activity logged in N days.

    This is the query the 'prepare my follow-ups' agent workflow is built on.
    """
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    return db.query(
        f"""
        SELECT a.id, a.name, a.owner_id, u.name AS owner_name,
               COALESCE(SUM(d.amount),0) AS open_value,
               COUNT(d.id) AS open_deals,
               (SELECT MAX(occurred_at) FROM activities act
                 WHERE act.related_type='account' AND act.related_id = a.id) AS last_activity
        FROM accounts a
        LEFT JOIN users u ON u.id = a.owner_id
        JOIN deals d ON d.account_id = a.id AND d.stage IN {OPEN}
        GROUP BY a.id
        HAVING open_value >= ? AND (last_activity IS NULL OR last_activity < ?)
        ORDER BY open_value DESC
        """, (min_open_value, cutoff))
