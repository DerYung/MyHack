"""
Firestore client for reading data from the shared database.

Uses Firebase Admin SDK for authentication.
Requires a service account key (download from Firebase Console).

Set GOOGLE_APPLICATION_CREDENTIALS=./service-account.json in .env
"""

import firebase_admin
from firebase_admin import credentials, firestore
from models.firestore_models import MentorDoc, CompanyDoc, FunderDoc, LinkageDoc
from config import get_settings
import logging
import os

logger = logging.getLogger(__name__)

# ── Firebase Admin Init (singleton) ─────────────────────────────────

_db = None


def get_firestore_client():
    """Get a cached Firestore client instance via Firebase Admin SDK."""
    global _db
    if _db is not None:
        return _db

    settings = get_settings()

    try:
        app = firebase_admin.get_app()
    except ValueError:
        sa_path = settings.google_application_credentials

        # Resolve relative paths from the backend directory
        if sa_path and not os.path.isabs(sa_path):
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            sa_path = os.path.join(backend_dir, sa_path)

        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            logger.info(f"Initializing Firebase with service account: {sa_path}")
        else:
            try:
                cred = credentials.ApplicationDefault()
                logger.info("Initializing Firebase with Application Default Credentials")
            except Exception:
                raise RuntimeError(
                    "\n"
                    "=" * 60 + "\n"
                    "  FIRESTORE AUTH FAILED\n"
                    "=" * 60 + "\n"
                    "  No credentials found. To fix:\n\n"
                    "  1. Go to Firebase Console > Project Settings > Service Accounts\n"
                    "  2. Click 'Generate new private key'\n"
                    "  3. Save the JSON file as backend/service-account.json\n"
                    "  4. Add to backend/.env:\n"
                    "     GOOGLE_APPLICATION_CREDENTIALS=./service-account.json\n"
                    "  5. Set USE_MOCK_DATA=false in backend/.env\n"
                    "=" * 60
                )

        firebase_admin.initialize_app(cred, {
            "projectId": settings.google_cloud_project,
        })

    _db = firestore.client(database_id=settings.firestore_database)
    logger.info(f"Firestore client connected to database: {settings.firestore_database}")
    return _db


def _camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case. E.g. 'activeCount' -> 'active_count'."""
    import re
    # Insert underscore before uppercase letters, then lowercase everything
    s1 = re.sub(r'([A-Z])', r'_\1', name)
    return s1.lower().lstrip('_')


# Explicit mapping for known camelCase fields from Person B's Firestore data
_FIELD_MAP = {
    "activeCount": "active_count",
    "maxCapacity": "max_capacity",
    "avgOutcomeRating": "avg_outcome_rating",
    "yearsExperience": "years_experience",
    "startupsHelped": "startups_helped",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "investmentFocus": "investment_focus",
    "stageInterest": "stage_interest",
    "minInvestment": "min_investment",
    "maxInvestment": "max_investment",
    "successfulInvestments": "successful_investments",
    "budgetNeeded": "budget_needed",
    "budgetBreakdown": "budget_breakdown",
    "marketGoals": "market_goals",
    "aiScore": "ai_score",
    "mentorUid": "mentor_uid",
    "companyUid": "company_uid",
    "programmeId": "programme_id",
    "outcomeRating": "outcome_rating",
}


def _normalize_keys(data: dict) -> dict:
    """Convert all camelCase keys to snake_case for Pydantic model compatibility."""
    normalized = {}
    for key, value in data.items():
        # Use explicit map first, fall back to auto-conversion
        snake_key = _FIELD_MAP.get(key, None)
        if snake_key is None:
            # Check if key has uppercase letters (camelCase)
            if any(c.isupper() for c in key):
                snake_key = _camel_to_snake(key)
            else:
                snake_key = key  # already snake_case
        normalized[snake_key] = value
    return normalized


def _doc_to_dict(doc_snapshot) -> dict:
    """Convert a Firestore document snapshot to a dict with uid/id.
    Handles both camelCase and snake_case field names from Firestore."""
    data = doc_snapshot.to_dict()
    if data is None:
        return {}

    # Normalize keys: camelCase -> snake_case
    data = _normalize_keys(data)

    if "uid" not in data:
        data["uid"] = doc_snapshot.id

    # Convert Firestore Timestamps to datetime for Pydantic
    for key in ("created_at", "updated_at"):
        if key in data and data[key] is not None:
            val = data[key]
            if hasattr(val, "isoformat"):
                pass  # Already datetime-compatible
            elif hasattr(val, "to_datetime"):
                try:
                    data[key] = val.to_datetime()
                except Exception:
                    data[key] = None
            else:
                data[key] = None
    return data


# ── Company Operations ──────────────────────────────────────────────

async def get_company(uid: str) -> CompanyDoc | None:
    """Fetch a single company by UID."""
    db = get_firestore_client()
    doc = db.collection("companies").document(uid).get()
    if not doc.exists:
        logger.warning(f"Company {uid} not found in Firestore")
        return None
    return CompanyDoc(**_doc_to_dict(doc))


async def get_all_companies() -> list[CompanyDoc]:
    """Fetch all companies."""
    db = get_firestore_client()
    docs = db.collection("companies").stream()
    return [CompanyDoc(**_doc_to_dict(doc)) for doc in docs]


# ── Mentor Operations ───────────────────────────────────────────────

async def get_mentor(uid: str) -> MentorDoc | None:
    """Fetch a single mentor by UID."""
    db = get_firestore_client()
    doc = db.collection("mentors").document(uid).get()
    if not doc.exists:
        return None
    return MentorDoc(**_doc_to_dict(doc))


async def get_all_mentors() -> list[MentorDoc]:
    """Fetch all mentors."""
    db = get_firestore_client()
    docs = db.collection("mentors").stream()
    return [MentorDoc(**_doc_to_dict(doc)) for doc in docs]


# ── Funder Operations ───────────────────────────────────────────────

async def get_funder(uid: str) -> FunderDoc | None:
    """Fetch a single funder by UID."""
    db = get_firestore_client()
    doc = db.collection("funders").document(uid).get()
    if not doc.exists:
        return None
    return FunderDoc(**_doc_to_dict(doc))


async def get_all_funders() -> list[FunderDoc]:
    """Fetch all funders."""
    db = get_firestore_client()
    docs = db.collection("funders").stream()
    return [FunderDoc(**_doc_to_dict(doc)) for doc in docs]


# ── Linkage Operations ──────────────────────────────────────────────

async def get_linkages_for_company(company_uid: str) -> list[LinkageDoc]:
    """Fetch all linkages for a given company."""
    db = get_firestore_client()
    docs = (
        db.collection("linkages")
        .where("company_uid", "==", company_uid)
        .stream()
    )
    results = []
    for doc in docs:
        data = _doc_to_dict(doc)
        data["id"] = doc.id
        results.append(LinkageDoc(**data))
    return results


async def get_linkages_for_mentor(mentor_uid: str) -> list[LinkageDoc]:
    """Fetch all linkages for a given mentor."""
    db = get_firestore_client()
    docs = (
        db.collection("linkages")
        .where("mentor_uid", "==", mentor_uid)
        .stream()
    )
    results = []
    for doc in docs:
        data = _doc_to_dict(doc)
        data["id"] = doc.id
        results.append(LinkageDoc(**data))
    return results
