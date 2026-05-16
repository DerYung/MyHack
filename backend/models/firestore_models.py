"""
Pydantic models that mirror the Firestore document schemas.
These MUST match the shared contract in the team spec.

All models use extra="ignore" so unknown fields from Firestore
don't cause validation errors.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, Union


class MentorDoc(BaseModel):
    """Mirrors Firestore `mentors` collection document."""
    model_config = ConfigDict(extra="ignore")

    uid: str
    name: str
    email: str = ""
    industries: list[str] = Field(default_factory=list)
    expertise: list[str] = Field(default_factory=list)
    region: str = ""
    max_capacity: int = 3
    active_count: int = 0
    bio: str = ""
    years_experience: int = 0
    startups_helped: int = 0
    avg_outcome_rating: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CompanyDoc(BaseModel):
    """Mirrors Firestore `companies` collection document."""
    model_config = ConfigDict(extra="ignore")

    uid: str
    name: str
    description: str = ""
    sector: str = ""
    stage: str = "Idea"  # "Idea" | "Pre-seed" | "Seed" | "Series A" | "Series B+"
    region: str = ""
    budget_needed: float = 0.0
    budget_breakdown: str = ""
    market_goals: str = ""
    status: str = "submitted"  # "submitted" | "mentoring" | "ready" | "matched" | "funded"
    ai_score: Optional[float] = None
    mentor_uid: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FunderDoc(BaseModel):
    """Mirrors Firestore `funders` collection document."""
    model_config = ConfigDict(extra="ignore")

    uid: str
    name: str
    email: str = ""
    investment_focus: list[str] = Field(default_factory=list)
    stage_interest: str = "All Stages"
    min_investment: float = 0.0
    max_investment: float = 0.0
    region: str = ""
    bio: str = ""
    portfolio: list[str] = Field(default_factory=list)
    successful_investments: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("stage_interest", mode="before")
    @classmethod
    def normalize_stage_interest(cls, v):
        """Person B may store stage_interest as a list. Convert to string."""
        if isinstance(v, list):
            if len(v) > 2:
                return "All Stages"  # Multiple stages = treat as All Stages
            return ", ".join(v)
        return v


class LinkageDoc(BaseModel):
    """Mirrors Firestore `linkages` collection document."""
    model_config = ConfigDict(extra="ignore")

    id: str = ""
    mentor_uid: str = ""
    company_uid: str = ""
    programme_id: str = ""
    status: str = "active"  # "active" | "completed" | "terminated"
    outcome_rating: Optional[float] = None
    notes: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
