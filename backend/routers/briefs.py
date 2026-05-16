"""
Brief generation API endpoint.

POST /api/briefs/generate → generate an investor brief for a company using Gemini
"""

from fastapi import APIRouter, HTTPException
from models.schemas import BriefGenerateRequest, BriefResponse, GeneratedBrief
from services import firestore_client
from config import get_settings
import google.generativeai as genai
import json
import asyncio
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/briefs", tags=["briefs"])

BRIEF_PROMPT = """You are an AI analyst generating an investor intelligence brief for a startup.

Based on the company profile below, generate a comprehensive investor brief.

COMPANY PROFILE:
- Name: {name}
- Sector: {sector}
- Stage: {stage}
- Description: {description}
- Market Goals: {goals}
- Budget Needed: ${budget:,.0f}
- Budget Breakdown: {breakdown}
- Region: {region}
- Current AI Score: {ai_score}

Respond ONLY with valid JSON (no markdown, no code fences):
{{
  "summary": "<3-4 sentence executive summary>",
  "market_analysis": "<2-3 sentences on market size, trends, competitive landscape>",
  "funding_needs": "<2-3 sentences on how the funding will be used and expected ROI>",
  "compatibility_insights": ["<insight 1>", "<insight 2>", "<insight 3>", "<insight 4>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"]
}}"""


@router.post("/generate", response_model=BriefResponse)
async def generate_brief(request: BriefGenerateRequest):
    """Generate an AI investor brief for a company."""
    try:
        settings = get_settings()
        start_time = time.time()

        # Fetch company
        company = await firestore_client.get_company(request.company_uid)
        if not company:
            raise HTTPException(status_code=404, detail=f"Company {request.company_uid} not found")

        # Try Gemini generation
        if settings.google_api_key:
            try:
                genai.configure(api_key=settings.google_api_key)
                model = genai.GenerativeModel(settings.gemini_model)

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

                # Parse response
                cleaned = response.text.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    cleaned = "\n".join(lines)

                data = json.loads(cleaned)

                brief = GeneratedBrief(
                    company_uid=company.uid,
                    company_name=company.name,
                    summary=data.get("summary", ""),
                    market_analysis=data.get("market_analysis", ""),
                    funding_needs=data.get("funding_needs", ""),
                    compatibility_insights=data.get("compatibility_insights", []),
                    risks=data.get("risks", []),
                    generated_at=datetime.now().isoformat(),
                )

                elapsed = (time.time() - start_time) * 1000
                logger.info(f"Generated brief for '{company.name}' in {elapsed:.0f}ms")

                return BriefResponse(brief=brief, generation_time_ms=round(elapsed, 1))

            except Exception as e:
                logger.error(f"Gemini brief generation failed: {e}")
                # Fall through to fallback

        # Fallback: generate a template-based brief
        brief = GeneratedBrief(
            company_uid=company.uid,
            company_name=company.name,
            summary=f"{company.name} is a {company.stage}-stage {company.sector} startup. "
                    f"{company.description} "
                    f"The company is seeking ${company.budget_needed:,.0f} in funding to achieve its market goals.",
            market_analysis=f"Operating in the {company.sector} sector, {company.name} targets "
                            f"a growing market with significant opportunity. "
                            f"The {company.stage} stage positioning provides both risk and upside potential.",
            funding_needs=f"Seeking ${company.budget_needed:,.0f} with the following allocation: "
                          f"{company.budget_breakdown}. "
                          f"Funds will be deployed to accelerate growth and capture market share.",
            compatibility_insights=[
                f"Operates in {company.sector} — a sector with active investor interest",
                f"Currently at {company.stage} stage with defined growth trajectory",
                f"Clear budget allocation strategy demonstrates financial discipline",
                "AI-generated score indicates investment readiness",
            ],
            risks=[
                "Brief generated via template — AI analysis unavailable",
                "Market validation depth could not be assessed",
                "Competitive positioning requires manual review",
            ],
            generated_at=datetime.now().isoformat(),
        )

        elapsed = (time.time() - start_time) * 1000
        return BriefResponse(brief=brief, generation_time_ms=round(elapsed, 1))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
