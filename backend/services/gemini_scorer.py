"""
Stage 2b: Gemini Scoring + Justification.

Takes the top candidates from embedding similarity and asks Google Gemini
to score each match (0-100) with a human-readable justification and risks.

Falls back to heuristic scoring if Gemini API is unavailable.
"""

import google.generativeai as genai
from models.firestore_models import MentorDoc, CompanyDoc, FunderDoc, LinkageDoc
from models.schemas import ScoredMatch
from config import get_settings
import json
import asyncio
import logging
import time

logger = logging.getLogger(__name__)

# ── Gemini client (lazy init) ───────────────────────────────────────

_gemini_model = None


def _get_gemini_model():
    """Lazy-load the Gemini model."""
    global _gemini_model
    if _gemini_model is None:
        settings = get_settings()
        if not settings.google_api_key:
            logger.warning("No GOOGLE_API_KEY set — Gemini scoring will use fallback")
            _gemini_model = "FALLBACK"
            return _gemini_model
        try:
            genai.configure(api_key=settings.google_api_key)
            _gemini_model = genai.GenerativeModel(settings.gemini_model)
            logger.info(f"Gemini model loaded: {settings.gemini_model}")
        except Exception as e:
            logger.warning(f"Failed to init Gemini: {e}")
            _gemini_model = "FALLBACK"
    return _gemini_model


# ── Prompt Templates ────────────────────────────────────────────────

MENTOR_SCORING_PROMPT = """You are an AI matching engine for a startup ecosystem platform.

Given a startup company profile and a mentor candidate, evaluate how well this mentor can help this startup succeed.

Score the match from 0-100 and provide:
- A 2-sentence justification explaining WHY this is a good/bad match
- A 1-sentence risk or concern

COMPANY PROFILE:
- Name: {company_name}
- Sector: {company_sector}
- Stage: {company_stage}
- Description: {company_description}
- Market Goals: {company_goals}
- Budget Needed: ${company_budget:,.0f}
- Region: {company_region}

MENTOR CANDIDATE:
- Name: {mentor_name}
- Industries: {mentor_industries}
- Expertise: {mentor_expertise}
- Years of Experience: {mentor_experience}
- Bio: {mentor_bio}
- Startups Helped: {mentor_startups_helped}
- Average Outcome Rating: {mentor_rating}/5
- Region: {mentor_region}

PREVIOUS LINKAGE HISTORY (if any):
{linkage_history}

Respond ONLY with valid JSON (no markdown, no code fences):
{{"score": <integer 0-100>, "justification": "<2 sentences>", "risks": "<1 sentence>"}}"""

FUNDER_SCORING_PROMPT = """You are an AI matching engine for a startup ecosystem platform.

Given a startup company profile and an investor/funder candidate, evaluate how well this investor fits for funding this startup.

Score the match from 0-100 and provide:
- A 2-sentence justification explaining WHY this is a good/bad match
- A 1-sentence risk or concern

COMPANY PROFILE:
- Name: {company_name}
- Sector: {company_sector}
- Stage: {company_stage}
- Description: {company_description}
- Market Goals: {company_goals}
- Budget Needed: ${company_budget:,.0f}
- Region: {company_region}

INVESTOR CANDIDATE:
- Name: {funder_name}
- Investment Focus: {funder_focus}
- Stage Interest: {funder_stage}
- Investment Range: ${funder_min:,.0f} - ${funder_max:,.0f}
- Bio: {funder_bio}
- Portfolio: {funder_portfolio}
- Successful Investments: {funder_investments}
- Region: {funder_region}

Respond ONLY with valid JSON (no markdown, no code fences):
{{"score": <integer 0-100>, "justification": "<2 sentences>", "risks": "<1 sentence>"}}"""


# ── Scoring Functions ───────────────────────────────────────────────

async def score_mentor_with_gemini(
    company: CompanyDoc,
    mentor: MentorDoc,
    linkage_history: list[LinkageDoc],
    embedding_similarity: float,
) -> ScoredMatch:
    """Score a single mentor match using Gemini."""
    model = _get_gemini_model()

    # Build linkage history text
    history_text = "No previous linkages."
    if linkage_history:
        history_parts = []
        for link in linkage_history:
            rating = f"Rating: {link.outcome_rating}/5" if link.outcome_rating else "Not rated"
            history_parts.append(f"- Programme {link.programme_id}: Status={link.status}, {rating}")
        history_text = "\n".join(history_parts)

    if model == "FALLBACK":
        return _fallback_mentor_score(company, mentor, embedding_similarity)

    prompt = MENTOR_SCORING_PROMPT.format(
        company_name=company.name,
        company_sector=company.sector,
        company_stage=company.stage,
        company_description=company.description,
        company_goals=company.market_goals,
        company_budget=company.budget_needed,
        company_region=company.region,
        mentor_name=mentor.name,
        mentor_industries=", ".join(mentor.industries),
        mentor_expertise=", ".join(mentor.expertise),
        mentor_experience=mentor.years_experience,
        mentor_bio=mentor.bio,
        mentor_startups_helped=mentor.startups_helped,
        mentor_rating=mentor.avg_outcome_rating,
        mentor_region=mentor.region,
        linkage_history=history_text,
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content, prompt
        )
        result = _parse_gemini_response(response.text)
        return ScoredMatch(
            uid=mentor.uid,
            name=mentor.name,
            score=result["score"],
            justification=result["justification"],
            risks=result["risks"],
            embedding_similarity=embedding_similarity,
            metadata={
                "industries": mentor.industries,
                "expertise": mentor.expertise,
                "years_experience": mentor.years_experience,
                "region": mentor.region,
            },
        )
    except Exception as e:
        logger.error(f"Gemini scoring failed for mentor {mentor.uid}: {e}")
        return _fallback_mentor_score(company, mentor, embedding_similarity)


async def score_funder_with_gemini(
    company: CompanyDoc,
    funder: FunderDoc,
    embedding_similarity: float,
) -> ScoredMatch:
    """Score a single funder match using Gemini."""
    model = _get_gemini_model()

    if model == "FALLBACK":
        return _fallback_funder_score(company, funder, embedding_similarity)

    prompt = FUNDER_SCORING_PROMPT.format(
        company_name=company.name,
        company_sector=company.sector,
        company_stage=company.stage,
        company_description=company.description,
        company_goals=company.market_goals,
        company_budget=company.budget_needed,
        company_region=company.region,
        funder_name=funder.name,
        funder_focus=", ".join(funder.investment_focus),
        funder_stage=funder.stage_interest,
        funder_min=funder.min_investment,
        funder_max=funder.max_investment,
        funder_bio=funder.bio,
        funder_portfolio=", ".join(funder.portfolio) if funder.portfolio else "None listed",
        funder_investments=funder.successful_investments,
        funder_region=funder.region,
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content, prompt
        )
        result = _parse_gemini_response(response.text)
        return ScoredMatch(
            uid=funder.uid,
            name=funder.name,
            score=result["score"],
            justification=result["justification"],
            risks=result["risks"],
            embedding_similarity=embedding_similarity,
            metadata={
                "investment_focus": funder.investment_focus,
                "stage_interest": funder.stage_interest,
                "investment_range": f"${funder.min_investment:,.0f} - ${funder.max_investment:,.0f}",
                "region": funder.region,
            },
        )
    except Exception as e:
        logger.error(f"Gemini scoring failed for funder {funder.uid}: {e}")
        return _fallback_funder_score(company, funder, embedding_similarity)


async def score_mentors_batch(
    company: CompanyDoc,
    mentors: list[MentorDoc],
    linkages: list[LinkageDoc],
    similarity_scores: dict[str, float],
) -> list[ScoredMatch]:
    """Score multiple mentors concurrently using Gemini."""
    tasks = []
    for mentor in mentors:
        # Find linkages between this mentor and the company
        mentor_linkages = [l for l in linkages if l.mentor_uid == mentor.uid]
        sim = similarity_scores.get(mentor.uid, 0.0)
        tasks.append(score_mentor_with_gemini(company, mentor, mentor_linkages, sim))

    results = await asyncio.gather(*tasks)
    # Sort by score descending
    results.sort(key=lambda x: x.score, reverse=True)
    return results


async def score_funders_batch(
    company: CompanyDoc,
    funders: list[FunderDoc],
    similarity_scores: dict[str, float],
) -> list[ScoredMatch]:
    """Score multiple funders concurrently using Gemini."""
    tasks = []
    for funder in funders:
        sim = similarity_scores.get(funder.uid, 0.0)
        tasks.append(score_funder_with_gemini(company, funder, sim))

    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x.score, reverse=True)
    return results


# ── Helpers ─────────────────────────────────────────────────────────

def _parse_gemini_response(text: str) -> dict:
    """Parse Gemini's JSON response, handling common formatting issues."""
    # Strip markdown code fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last lines (code fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
        return {
            "score": max(0, min(100, int(data.get("score", 50)))),
            "justification": str(data.get("justification", "No justification provided.")),
            "risks": str(data.get("risks", "No risks identified.")),
        }
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Failed to parse Gemini response: {e}\nRaw: {text[:200]}")
        return {
            "score": 50,
            "justification": "AI scoring encountered a parsing issue. Score is estimated.",
            "risks": "Manual review recommended.",
        }


def _fallback_mentor_score(
    company: CompanyDoc, mentor: MentorDoc, embedding_similarity: float
) -> ScoredMatch:
    """Heuristic-based scoring when Gemini is unavailable."""
    score = 0

    # Industry match (35 pts)
    if company.sector.lower() in [i.lower() for i in mentor.industries]:
        score += 35

    # Experience (25 pts)
    if mentor.years_experience >= 10:
        score += 25
    elif mentor.years_experience >= 5:
        score += 15
    else:
        score += 8

    # Track record (20 pts)
    if mentor.startups_helped > 20:
        score += 20
    elif mentor.startups_helped > 10:
        score += 15
    else:
        score += 5

    # Embedding similarity bonus (20 pts)
    score += int(embedding_similarity * 20)

    return ScoredMatch(
        uid=mentor.uid,
        name=mentor.name,
        score=min(score, 100),
        justification=f"{mentor.name} has {mentor.years_experience} years of experience in {', '.join(mentor.industries)}. "
                       f"They have helped {mentor.startups_helped} startups with expertise in {', '.join(mentor.expertise[:2])}.",
        risks="Score generated via heuristic fallback -- AI scoring unavailable.",
        embedding_similarity=embedding_similarity,
        metadata={"industries": mentor.industries, "expertise": mentor.expertise},
    )


def _fallback_funder_score(
    company: CompanyDoc, funder: FunderDoc, embedding_similarity: float
) -> ScoredMatch:
    """Heuristic-based scoring when Gemini is unavailable."""
    score = 0

    # Investment focus match (30 pts)
    if company.sector.lower() in [f.lower() for f in funder.investment_focus]:
        score += 30

    # Stage match (25 pts)
    if funder.stage_interest == "All Stages" or funder.stage_interest.lower() == company.stage.lower():
        score += 25

    # Budget fit (25 pts)
    if funder.min_investment <= company.budget_needed <= funder.max_investment:
        score += 25
    elif company.budget_needed >= funder.min_investment:
        score += 12

    # Embedding similarity bonus (20 pts)
    score += int(embedding_similarity * 20)

    return ScoredMatch(
        uid=funder.uid,
        name=funder.name,
        score=min(score, 100),
        justification=f"{funder.name} focuses on {', '.join(funder.investment_focus)} at the {funder.stage_interest} stage. "
                       f"Investment range: ${funder.min_investment:,.0f}-${funder.max_investment:,.0f} with {funder.successful_investments} past investments.",
        risks="Score generated via heuristic fallback -- AI scoring unavailable.",
        embedding_similarity=embedding_similarity,
        metadata={"investment_focus": funder.investment_focus, "stage_interest": funder.stage_interest},
    )
