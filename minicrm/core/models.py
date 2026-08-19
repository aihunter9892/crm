"""Pydantic models = the contract.

Same schemas serve three audiences:
  1. humans typing CLI args
  2. the REST API / web UI
  3. AI agents calling MCP tools

Enums here are what stop an agent from inventing a stage called "almost_won".
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------
class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    unqualified = "unqualified"
    converted = "converted"


class LeadSource(str, Enum):
    website = "website"
    referral = "referral"
    cold_call = "cold_call"
    event = "event"
    partner = "partner"
    ads = "ads"
    other = "other"


class Rating(str, Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class DealStage(str, Enum):
    qualification = "qualification"
    needs_analysis = "needs_analysis"
    proposal = "proposal"
    negotiation = "negotiation"
    closed_won = "closed_won"
    closed_lost = "closed_lost"


STAGE_PROBABILITY = {
    DealStage.qualification: 10,
    DealStage.needs_analysis: 25,
    DealStage.proposal: 50,
    DealStage.negotiation: 75,
    DealStage.closed_won: 100,
    DealStage.closed_lost: 0,
}

OPEN_STAGES = [
    DealStage.qualification,
    DealStage.needs_analysis,
    DealStage.proposal,
    DealStage.negotiation,
]


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TaskStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    deferred = "deferred"


class ActivityType(str, Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    demo = "demo"


class RelatedType(str, Enum):
    lead = "lead"
    account = "account"
    contact = "contact"
    deal = "deal"


# --------------------------------------------------------------------------
# Write models (what a caller may send)
# --------------------------------------------------------------------------
class AccountIn(BaseModel):
    name: str = Field(min_length=1, description="Company name")
    industry: str | None = None
    website: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = "India"
    employees: int | None = Field(default=None, ge=0)
    annual_revenue: float | None = Field(default=None, ge=0)
    owner_id: str | None = None


class ContactIn(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: EmailStr | None = None
    phone: str | None = None
    title: str | None = None
    account_id: str | None = None
    owner_id: str | None = None


class LeadIn(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    company: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    title: str | None = None
    source: LeadSource = LeadSource.other
    status: LeadStatus = LeadStatus.new
    rating: Rating = Rating.warm
    owner_id: str | None = None


class DealIn(BaseModel):
    name: str = Field(min_length=1, description="Short deal title, e.g. 'Acme - 50 seat renewal'")
    account_id: str = Field(description="Account this deal belongs to")
    contact_id: str | None = None
    amount: float = Field(default=0, ge=0)
    currency: str = "INR"
    stage: DealStage = DealStage.qualification
    probability: int | None = Field(default=None, ge=0, le=100)
    close_date: date | None = None
    source: LeadSource | None = None
    owner_id: str | None = None


class TaskIn(BaseModel):
    subject: str = Field(min_length=1)
    description: str | None = None
    related_type: RelatedType | None = None
    related_id: str | None = None
    assignee_id: str | None = None
    priority: Priority = Priority.medium
    status: TaskStatus = TaskStatus.open
    due_date: date | None = None

    @field_validator("related_id")
    @classmethod
    def _pair(cls, v, info):
        if v and not info.data.get("related_type"):
            raise ValueError("related_type is required when related_id is given")
        return v


class ActivityIn(BaseModel):
    type: ActivityType
    subject: str = Field(min_length=1)
    notes: str | None = None
    related_type: RelatedType | None = None
    related_id: str | None = None
    owner_id: str | None = None
    occurred_at: datetime | None = None
