"""SQLite layer: connection handling + schema.

Deliberately dependency-free so the shared core can run anywhere
(CLI, REST API, MCP server) with no setup.
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.environ.get("MINICRM_DB", Path(__file__).resolve().parent.parent / "minicrm.db"))

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'sales_rep',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    industry        TEXT,
    website         TEXT,
    phone           TEXT,
    city            TEXT,
    country         TEXT,
    employees       INTEGER,
    annual_revenue  REAL,
    owner_id        TEXT REFERENCES users(id),
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
    id          TEXT PRIMARY KEY,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    title       TEXT,
    account_id  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    owner_id    TEXT REFERENCES users(id),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
    id              TEXT PRIMARY KEY,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    company         TEXT,
    email           TEXT,
    phone           TEXT,
    title           TEXT,
    source          TEXT NOT NULL DEFAULT 'other',
    status          TEXT NOT NULL DEFAULT 'new',
    rating          TEXT NOT NULL DEFAULT 'warm',
    owner_id        TEXT REFERENCES users(id),
    converted_at    TEXT,
    converted_account_id TEXT REFERENCES accounts(id),
    converted_contact_id TEXT REFERENCES contacts(id),
    converted_deal_id    TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    account_id   TEXT REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id   TEXT REFERENCES contacts(id) ON DELETE SET NULL,
    amount       REAL NOT NULL DEFAULT 0,
    currency     TEXT NOT NULL DEFAULT 'INR',
    stage        TEXT NOT NULL DEFAULT 'qualification',
    probability  INTEGER NOT NULL DEFAULT 10,
    close_date   TEXT,
    source       TEXT,
    owner_id     TEXT REFERENCES users(id),
    lost_reason  TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    subject       TEXT NOT NULL,
    description   TEXT,
    related_type  TEXT,
    related_id    TEXT,
    assignee_id   TEXT REFERENCES users(id),
    priority      TEXT NOT NULL DEFAULT 'medium',
    status        TEXT NOT NULL DEFAULT 'open',
    due_date      TEXT,
    completed_at  TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL,
    subject       TEXT NOT NULL,
    notes         TEXT,
    related_type  TEXT,
    related_id    TEXT,
    owner_id      TEXT REFERENCES users(id),
    occurred_at   TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_account   ON deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage     ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_related   ON tasks(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_act_related     ON activities(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads(status);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def cursor(commit: bool = False):
    conn = connect()
    try:
        yield conn
        if commit:
            conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with cursor(commit=True) as conn:
        conn.executescript(SCHEMA)


def query(sql: str, params: tuple | list = ()) -> list[dict]:
    with cursor() as conn:
        return [dict(r) for r in conn.execute(sql, params).fetchall()]


def query_one(sql: str, params: tuple | list = ()) -> dict | None:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple | list = ()) -> int:
    with cursor(commit=True) as conn:
        cur = conn.execute(sql, params)
        return cur.rowcount
