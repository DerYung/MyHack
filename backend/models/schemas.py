"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request Models ──────────────────────────────────────────────────

class MatchRequest(BaseModel):
    """Request body for matching endpoints."""
    company_uid: str
    programme_id: Optional[str] = None  # for linkage reuse context
    top_k: int = Field(default=5, ge=1, le=20)  # how many results to return


class BriefGenerateRequest(BaseModel):
    """Request body for brief generation."""
    company_uid: str


# ── Response Models ─────────────────────────────────────────────────

class ScoredMatch(BaseModel):
    """A single scored match result from the pipeline."""
    uid: str
    name: str
    score: int = Field(ge=0, le=100)  # 0-100 from Gemini
    justification: str  # 2-sentence explanation from Gemini
    risks: str  # 1-sentence risk from Gemini
    embedding_similarity: float  # raw cosine sim from Stage 2a
    metadata: dict = Field(default_factory=dict)  # extra info (industries, expertise, etc.)


class PipelineMetadata(BaseModel):
    """Metadata about the matching pipeline execution."""
    total_candidates: int  # total in Firestore
    after_hard_filter: int  # after Stage 1
    after_embedding: int  # after Stage 2a (top-k)
    gemini_scored: int  # after Stage 2b
    hard_filter_ms: float = 0.0
    embedding_ms: float = 0.0
    gemini_ms: float = 0.0
    total_ms: float = 0.0


class MatchResponse(BaseModel):
    """Response from matching endpoints."""
    company_uid: str
    company_name: str
    match_type: str  # "mentor" or "funder"
    matches: list[ScoredMatch]
    pipeline: PipelineMetadata


class BriefSource(BaseModel):
    """A web source cited by the AI during brief generation."""
    title: str
    url: str


class GeneratedBrief(BaseModel):
    """An AI-generated investor brief."""
    company_uid: str
    company_name: str
    summary: str
    market_analysis: str
    funding_needs: str
    compatibility_insights: list[str]
    risks: list[str]
    generated_at: str
    web_grounded: bool = False
    sources: list[BriefSource] = Field(default_factory=list)


class BriefResponse(BaseModel):
    """Response from brief generation endpoint."""
    brief: GeneratedBrief
    generation_time_ms: float


# ── Health Check ────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str = "1.0.0"
    services: dict = Field(default_factory=dict)
