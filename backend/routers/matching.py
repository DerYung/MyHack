"""
Matching API endpoints — the core of the two-stage pipeline.

POST /api/match/mentors  → match a company with mentors
POST /api/match/funders  → match a company with funders
"""

from fastapi import APIRouter, HTTPException
from models.schemas import MatchRequest, MatchResponse, PipelineMetadata
from models.firestore_models import MentorDoc, FunderDoc
from services import firestore_client, hard_filter, embeddings, gemini_scorer
from config import get_settings
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/match", tags=["matching"])


@router.post("/mentors", response_model=MatchResponse)
async def match_mentors(request: MatchRequest):
    """
    Two-stage mentor matching pipeline:
    1. Fetch company + all mentors + existing linkages from Firestore
    2. Stage 1: Hard filter → ~20 candidates
    3. Stage 2a: Embed + cosine similarity → top 10
    4. Stage 2b: Gemini scoring + justification
    5. Return ranked results
    """
    settings = get_settings()
    total_start = time.time()

    # ── Fetch data from Firestore ─────────────────────────────────
    company = await firestore_client.get_company(request.company_uid)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {request.company_uid} not found")

    all_mentors = await firestore_client.get_all_mentors()
    if not all_mentors:
        return MatchResponse(
            company_uid=company.uid,
            company_name=company.name,
            match_type="mentor",
            matches=[],
            pipeline=PipelineMetadata(
                total_candidates=0, after_hard_filter=0,
                after_embedding=0, gemini_scored=0,
            ),
        )

    existing_linkages = await firestore_client.get_linkages_for_company(request.company_uid)

    # ── Stage 1: Hard Filter ──────────────────────────────────────
    t1 = time.time()
    filtered_mentors = hard_filter.filter_mentors(company, all_mentors, existing_linkages)
    hard_filter_ms = (time.time() - t1) * 1000

    if not filtered_mentors:
        return MatchResponse(
            company_uid=company.uid,
            company_name=company.name,
            match_type="mentor",
            matches=[],
            pipeline=PipelineMetadata(
                total_candidates=len(all_mentors),
                after_hard_filter=0,
                after_embedding=0,
                gemini_scored=0,
                hard_filter_ms=hard_filter_ms,
            ),
        )

    # ── Stage 2a: Embedding + Cosine Similarity ───────────────────
    t2 = time.time()
    company_text = embeddings.build_company_text(company)
    candidate_texts = [
        (m.uid, embeddings.build_mentor_text(m)) for m in filtered_mentors
    ]

    top_k = min(settings.embedding_top_k, len(filtered_mentors))
    similarity_ranking = embeddings.rank_by_similarity(company_text, candidate_texts, top_k)
    embedding_ms = (time.time() - t2) * 1000

    # Map UID → similarity score
    sim_scores = {uid: score for uid, score in similarity_ranking}
    top_uids = {uid for uid, _ in similarity_ranking}

    # Get the actual mentor objects for top-k
    top_mentors = [m for m in filtered_mentors if m.uid in top_uids]

    # ── Stage 2b: Gemini Scoring ──────────────────────────────────
    t3 = time.time()
    scored_matches = await gemini_scorer.score_mentors_batch(
        company, top_mentors, existing_linkages, sim_scores
    )
    gemini_ms = (time.time() - t3) * 1000

    # Limit to requested top_k
    scored_matches = scored_matches[: request.top_k]

    total_ms = (time.time() - total_start) * 1000

    logger.info(
        f"Mentor matching pipeline for '{company.name}': "
        f"{len(all_mentors)} total → {len(filtered_mentors)} filtered → "
        f"{len(top_mentors)} embedded → {len(scored_matches)} scored "
        f"({total_ms:.0f}ms)"
    )

    return MatchResponse(
        company_uid=company.uid,
        company_name=company.name,
        match_type="mentor",
        matches=scored_matches,
        pipeline=PipelineMetadata(
            total_candidates=len(all_mentors),
            after_hard_filter=len(filtered_mentors),
            after_embedding=len(top_mentors),
            gemini_scored=len(scored_matches),
            hard_filter_ms=round(hard_filter_ms, 1),
            embedding_ms=round(embedding_ms, 1),
            gemini_ms=round(gemini_ms, 1),
            total_ms=round(total_ms, 1),
        ),
    )


@router.post("/funders", response_model=MatchResponse)
async def match_funders(request: MatchRequest):
    """
    Two-stage funder matching pipeline.
    Same structure as mentor matching but for investors.
    """
    settings = get_settings()
    total_start = time.time()

    # ── Fetch data from Firestore ─────────────────────────────────
    company = await firestore_client.get_company(request.company_uid)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {request.company_uid} not found")

    all_funders = await firestore_client.get_all_funders()
    if not all_funders:
        return MatchResponse(
            company_uid=company.uid,
            company_name=company.name,
            match_type="funder",
            matches=[],
            pipeline=PipelineMetadata(
                total_candidates=0, after_hard_filter=0,
                after_embedding=0, gemini_scored=0,
            ),
        )

    # ── Stage 1: Hard Filter ──────────────────────────────────────
    t1 = time.time()
    filtered_funders = hard_filter.filter_funders(company, all_funders)
    hard_filter_ms = (time.time() - t1) * 1000

    if not filtered_funders:
        return MatchResponse(
            company_uid=company.uid,
            company_name=company.name,
            match_type="funder",
            matches=[],
            pipeline=PipelineMetadata(
                total_candidates=len(all_funders),
                after_hard_filter=0,
                after_embedding=0,
                gemini_scored=0,
                hard_filter_ms=hard_filter_ms,
            ),
        )

    # ── Stage 2a: Embedding + Cosine Similarity ───────────────────
    t2 = time.time()
    company_text = embeddings.build_company_text(company)
    candidate_texts = [
        (f.uid, embeddings.build_funder_text(f)) for f in filtered_funders
    ]

    top_k = min(settings.embedding_top_k, len(filtered_funders))
    similarity_ranking = embeddings.rank_by_similarity(company_text, candidate_texts, top_k)
    embedding_ms = (time.time() - t2) * 1000

    sim_scores = {uid: score for uid, score in similarity_ranking}
    top_uids = {uid for uid, _ in similarity_ranking}
    top_funders = [f for f in filtered_funders if f.uid in top_uids]

    # ── Stage 2b: Gemini Scoring ──────────────────────────────────
    t3 = time.time()
    scored_matches = await gemini_scorer.score_funders_batch(
        company, top_funders, sim_scores
    )
    gemini_ms = (time.time() - t3) * 1000

    scored_matches = scored_matches[: request.top_k]

    total_ms = (time.time() - total_start) * 1000

    logger.info(
        f"Funder matching pipeline for '{company.name}': "
        f"{len(all_funders)} total → {len(filtered_funders)} filtered → "
        f"{len(top_funders)} embedded → {len(scored_matches)} scored "
        f"({total_ms:.0f}ms)"
    )

    return MatchResponse(
        company_uid=company.uid,
        company_name=company.name,
        match_type="funder",
        matches=scored_matches,
        pipeline=PipelineMetadata(
            total_candidates=len(all_funders),
            after_hard_filter=len(filtered_funders),
            after_embedding=len(top_funders),
            gemini_scored=len(scored_matches),
            hard_filter_ms=round(hard_filter_ms, 1),
            embedding_ms=round(embedding_ms, 1),
            gemini_ms=round(gemini_ms, 1),
            total_ms=round(total_ms, 1),
        ),
    )
