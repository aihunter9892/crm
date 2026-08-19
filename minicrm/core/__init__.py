"""MiniCRM shared core.

All business logic lives here. Every interface — REST API, web UI, CLI,
local MCP server, remote MCP server — is a thin adapter over these functions.
"""
from . import (accounts, activities, analytics, contacts, deals, db, leads,
               models, tasks, users)  # noqa: F401

__all__ = ["accounts", "activities", "analytics", "contacts", "deals", "db",
           "leads", "models", "tasks", "users"]
