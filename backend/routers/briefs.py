"""
Brief generation API endpoint.

POST /api/briefs/generate → generate an investor brief for a company using Gemini
with Google Search grounding to verify submitted claims against real web sources.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import BriefGenerateRequest, BriefResponse, GeneratedBrief, BriefSource
from services import firestore_client
from config import get_settings
import google.generativeai as genai
import json
import re
import asyncio
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/briefs", tags=["briefs"])

BRIEF_PROMPT = """You are a financial analyst generating a verified investor intelligence brief.

You have access to Google Search. Search for "{name}" and "{name} {sector}" to find real,
publicly available information about this company — news articles, LinkedIn, Crunchbase,
official website, press releases, etc.

Then cross-reference what you find online against the SUBMITTED PROFILE below.

SUBMITTED PROFILE (self-reported by founder — treat as unverified until confirmed):
- Name: {name}
- Sector: {sector}
- Stage: {stage}
- Description: {description}
- Market Goals: {goals}
- Budget Needed: ${budget:,.0f}
- Budget Breakdown: {breakdown}
- Region: {region}
- Current AI Score: {ai_score}

INSTRUCTIONS:
1. Base your summary and market analysis primarily on verified web sources.
2. If web sources confirm the profile, state that explicitly.
3. If web sources contradict the profile (e.g. different stage, sector, or description), flag it in risks.
4. If NO public information is found for this company, state "No public web presence found — profile unverified" in the summary.
5. Keep tone objective and professional.

Respond ONLY with valid JSON (no markdown, no code fences):
{{
  "summary": "<3-4 sentences: what the company actually does based on web sources, or note if unverified>",
  "market_analysis": "<2-3 sentences on market size, trends, and competitive landscape from real sources>",
  "funding_needs": "<2-3 sentences on funding allocation and expected ROI>",
  "compatibility_insights": ["<verified insight 1>", "<verified insight 2>", "<verified insight 3>", "<verified insight 4>"],
  "risks": ["<risk 1 — include any profile discrepancies here>", "<risk 2>", "<risk 3>"]
}}"""


def _extract_sources(response) -> list[BriefSource]:
    """Pull grounding citations from Gemini's search grounding metadata."""
    sources = []
    try:
        candidates = response.candidates
        if not candidates:
            return sources
        metadata = candidates[0].grounding_metadata
        if not metadata:
            return sources
        seen = set()
        for chunk in metadata.grounding_chunks:
            web = getattr(chunk, 'web', None)
            if web and web.uri and web.uri not in seen:
                seen.add(web.uri)
                sources.append(BriefSource(
                    title=web.title or web.uri,
                    url=web.uri,
                ))
    except Exception as e:
        logger.warning(f"Could not extract grounding sources: {e}")
    return sources


def _parse_json(text: str) -> dict:
    """Strip markdown fences and citation markers, then parse JSON."""
    cleaned = text.strip()
    # Remove markdown fences
    if cleaned.startswith("```"):
        cleaned = re.sub(r"```[\w]*\n?", "", cleaned).strip()
    # Remove inline citation markers like [1], [2]
    cleaned = re.sub(r'\[\d+\]', '', cleaned)
    return json.loads(cleaned)


@router.post("/generate", response_model=BriefResponse)
async def generate_brief(request: BriefGenerateRequest):
    """Generate a web-grounded AI investor brief for a company."""
    try:
        settings = get_settings()
        start_time = time.time()

        company = await firestore_client.get_company(request.company_uid)
        if not company:
            raise HTTPException(status_code=404, detail=f"Company {request.company_uid} not found")

        if settings.google_api_key:
            try:
                genai.configure(api_key=settings.google_api_key)

                # Enable Google Search grounding
                search_tool = {"google_search_retrieval": {}}
                model = genai.GenerativeModel(
                    model_name=settings.gemini_model,
                    tools=[search_tool],
                )

                prompt = BRIEF_PROMPT.format(
                    name=company.name,
                    sector=company.sector,
                    stage=company.stage,
                    description=company.description,
                    goals=company.market_goals,
                    budget=company.budget_needed,
                    breakdown=company.budget_breakdown,
                    region=company.region,
                    ai_score=company.ai_score or "Not scored",
                )

                response = await asyncio.to_thread(model.generate_content, prompt)
                sources = _extract_sources(response)
                data = _parse_json(response.text)

                brief = GeneratedBrief(
                    company_uid=company.uid,
                    company_name=company.name,
                    summary=data.get("summary", ""),
                    market_analysis=data.get("market_analysis", ""),
                    funding_needs=data.get("funding_needs", ""),
                    compatibility_insights=data.get("compatibility_insights", []),
                    risks=data.get("risks", []),
                    generated_at=datetime.now().isoformat(),
                    web_grounded=True,
                    sources=sources,
                )

                elapsed = (time.time() - start_time) * 1000
                logger.info(
                    f"Generated web-grounded brief for '{company.name}' "
                    f"in {elapsed:.0f}ms with {len(sources)} sources"
                )
                return BriefResponse(brief=brief, generation_time_ms=round(elapsed, 1))

            except Exception as e:
                logger.error(f"Gemini brief generation failed: {e}")
                # Fall through to template fallback

        # Fallback: template-based brief (no web grounding)
        brief = GeneratedBrief(
            company_uid=company.uid,
            company_name=company.name,
            summary=(
                f"{company.name} is a {company.stage}-stage {company.sector} startup. "
                f"{company.description} "
                f"Seeking ${company.budget_needed:,.0f} in funding."
            ),
            market_analysis=(
                f"Operating in the {company.sector} sector, {company.name} targets "
                f"a growing market. The {company.stage} stage positioning provides "
                f"both risk and upside potential."
            ),
            funding_needs=(
                f"Seeking ${company.budget_needed:,.0f} — allocation: "
                f"{company.budget_breakdown}."
            ),
            compatibility_insights=[
                f"Operates in {company.sector} — a sector with active investor interest",
                f"Currently at {company.stage} stage with defined growth trajectory",
                "Clear budget allocation strategy demonstrates financial discipline",
                "AI-generated score indicates investment readiness",
            ],
            risks=[
                "AI analysis unavailable — brief generated from submitted profile only",
                "Claims have NOT been verified against external sources",
                "Market validation depth could not be assessed",
            ],
            generated_at=datetime.now().isoformat(),
            web_grounded=False,
            sources=[],
        )

        elapsed = (time.time() - start_time) * 1000
        return BriefResponse(brief=brief, generation_time_ms=round(elapsed, 1))

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
