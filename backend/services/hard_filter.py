"""
Stage 1: Hard Filter — Deterministic filtering to reduce candidate pool.

Fast, no API calls. Eliminates obviously bad matches before spending
credits on embeddings and Gemini.
"""

from models.firestore_models import MentorDoc, CompanyDoc, FunderDoc, LinkageDoc
from config import get_settings
import logging

logger = logging.getLogger(__name__)


def filter_mentors(
    company: CompanyDoc,
    all_mentors: list[MentorDoc],
    existing_linkages: list[LinkageDoc],
) -> list[MentorDoc]:
    """
    Hard filter rules for mentor matching:
    1. Industry overlap: mentor.industries must contain company.sector
    2. Capacity: mentor.active_count < mentor.max_capacity
    3. Not already actively linked to this company
    4. Region preference (soft — boosts score, doesn't eliminate)

    Returns up to hard_filter_max_candidates mentors sorted by basic heuristic.
    """
    settings = get_settings()

    # Build set of mentor UIDs with active linkages to this company
    actively_linked_mentor_uids = {
        link.mentor_uid
        for link in existing_linkages
        if link.status == "active"
    }

    candidates = []

    for mentor in all_mentors:
        # ── Hard filters (eliminate) ──────────────────────────────

        # 1. Must have industry overlap
        company_sector_lower = company.sector.lower().strip()
        mentor_industries_lower = [i.lower().strip() for i in mentor.industries]
        if company_sector_lower not in mentor_industries_lower:
            continue

        # 2. Must have capacity
        if mentor.active_count >= mentor.max_capacity:
            logger.debug(f"Skipping mentor {mentor.uid}: at capacity ({mentor.active_count}/{mentor.max_capacity})")
            continue

        # 3. Must not be already actively linked to this company
        if mentor.uid in actively_linked_mentor_uids:
            logger.debug(f"Skipping mentor {mentor.uid}: already actively linked to {company.uid}")
            continue

        # ── Heuristic score (for sorting) ─────────────────────────
        heuristic = 0.0

        # Experience bonus (0-30)
        if mentor.years_experience >= 10:
            heuristic += 30
        elif mentor.years_experience >= 5:
            heuristic += 20
        else:
            heuristic += 10

        # Track record bonus (0-30)
        if mentor.startups_helped > 20:
            heuristic += 30
        elif mentor.startups_helped > 10:
            heuristic += 20
        else:
            heuristic += 10

        # Outcome rating bonus (0-20)
        heuristic += mentor.avg_outcome_rating * 4  # 0-5 → 0-20

        # Region match bonus (0-20) — soft filter
        if company.region and mentor.region:
            if company.region.lower().strip() == mentor.region.lower().strip():
                heuristic += 20

        # Capacity headroom bonus (0-10) — prefer mentors with more room
        headroom = mentor.max_capacity - mentor.active_count
        heuristic += min(headroom * 3, 10)

        candidates.append((mentor, heuristic))

    # Sort by heuristic descending, take top N
    candidates.sort(key=lambda x: x[1], reverse=True)
    max_candidates = settings.hard_filter_max_candidates
    result = [mentor for mentor, _ in candidates[:max_candidates]]

    logger.info(
        f"Hard filter: {len(all_mentors)} mentors → {len(result)} candidates "
        f"for company '{company.name}' (sector={company.sector})"
    )
    return result


def filter_funders(
    company: CompanyDoc,
    all_funders: list[FunderDoc],
) -> list[FunderDoc]:
    """
    Hard filter rules for funder matching:
    1. Investment focus overlap: funder.investment_focus must intersect with company.sector
    2. Stage match: funder.stage_interest matches company.stage OR is "All Stages"
    3. Budget range: funder.min_investment <= company.budget_needed <= funder.max_investment
       (soft: partial funding OK if min_investment <= budget_needed)

    Returns up to hard_filter_max_candidates funders sorted by basic heuristic.
    """
    settings = get_settings()
    candidates = []

    for funder in all_funders:
        # ── Hard filters (eliminate) ──────────────────────────────

        # 1. Must have investment focus overlap
        company_sector_lower = company.sector.lower().strip()
        funder_focus_lower = [f.lower().strip() for f in funder.investment_focus]
        if company_sector_lower not in funder_focus_lower:
            continue

        # 2. Must match stage
        stage_match = (
            funder.stage_interest == "All Stages"
            or funder.stage_interest.lower().strip() == company.stage.lower().strip()
        )
        if not stage_match:
            continue

        # 3. Budget must be at least partially in range
        if company.budget_needed < funder.min_investment:
            continue  # Company needs less than funder's minimum — bad fit

        # ── Heuristic score (for sorting) ─────────────────────────
        heuristic = 0.0

        # Perfect budget fit bonus (0-30)
        if funder.min_investment <= company.budget_needed <= funder.max_investment:
            heuristic += 30
        elif company.budget_needed >= funder.min_investment:
            heuristic += 15  # Can partially fund

        # Track record bonus (0-20)
        if funder.successful_investments > 40:
            heuristic += 20
        elif funder.successful_investments > 20:
            heuristic += 15
        else:
            heuristic += 5

        # Region match bonus (0-20)
        if company.region and funder.region:
            if company.region.lower().strip() == funder.region.lower().strip():
                heuristic += 20

        # Portfolio size bonus (0-10)
        heuristic += min(len(funder.portfolio) * 2, 10)

        candidates.append((funder, heuristic))

    # Sort by heuristic descending, take top N
    candidates.sort(key=lambda x: x[1], reverse=True)
    max_candidates = settings.hard_filter_max_candidates
    result = [funder for funder, _ in candidates[:max_candidates]]

    logger.info(
        f"Hard filter: {len(all_funders)} funders → {len(result)} candidates "
        f"for company '{company.name}' (sector={company.sector}, budget=${company.budget_needed:,.0f})"
    )
    return result
