"""
Stage 2a: Embedding Generation + Cosine Similarity Ranking.

Uses Google Vertex AI text-embedding-005 to embed company and candidate
profiles, then ranks by cosine similarity.

Falls back to TF-IDF-like keyword overlap if Vertex AI is unavailable
(e.g., no credentials configured).
"""

from models.firestore_models import MentorDoc, CompanyDoc, FunderDoc
from config import get_settings
import numpy as np
import logging

logger = logging.getLogger(__name__)

# ── Vertex AI embedding client (lazy init) ──────────────────────────

_embed_model = None


def _get_embed_model():
    """Lazy-load the Vertex AI embedding model."""
    global _embed_model
    if _embed_model is None:
        try:
            from vertexai.language_models import TextEmbeddingModel
            import vertexai

            import os
            settings = get_settings()
            
            if settings.google_application_credentials:
                sa_path = settings.google_application_credentials
                if not os.path.isabs(sa_path):
                    sa_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), sa_path)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = sa_path

            vertexai.init(
                project=settings.google_cloud_project,
                location=settings.vertex_ai_location,
            )
            _embed_model = TextEmbeddingModel.from_pretrained(settings.embedding_model)
            logger.info(f"Vertex AI embedding model loaded: {settings.embedding_model}")
        except Exception as e:
            logger.warning(f"Failed to load Vertex AI embedding model: {e}")
            logger.warning("Falling back to keyword-based similarity")
            _embed_model = "FALLBACK"
    return _embed_model


# ── Text builders ───────────────────────────────────────────────────

def build_company_text(company: CompanyDoc) -> str:
    """Build a rich text representation of a company for embedding."""
    parts = [
        f"Company: {company.name}",
        f"Sector: {company.sector}",
        f"Stage: {company.stage}",
        f"Description: {company.description}",
    ]
    if company.market_goals:
        parts.append(f"Market Goals: {company.market_goals}")
    if company.budget_breakdown:
        parts.append(f"Budget Plan: {company.budget_breakdown}")
    if company.region:
        parts.append(f"Region: {company.region}")
    return ". ".join(parts)


def build_mentor_text(mentor: MentorDoc) -> str:
    """Build a rich text representation of a mentor for embedding."""
    parts = [
        f"Mentor: {mentor.name}",
        f"Industries: {', '.join(mentor.industries)}",
        f"Expertise: {', '.join(mentor.expertise)}",
        f"Bio: {mentor.bio}",
        f"Experience: {mentor.years_experience} years",
        f"Startups helped: {mentor.startups_helped}",
    ]
    if mentor.region:
        parts.append(f"Region: {mentor.region}")
    return ". ".join(parts)


def build_funder_text(funder: FunderDoc) -> str:
    """Build a rich text representation of a funder for embedding."""
    parts = [
        f"Investor: {funder.name}",
        f"Investment Focus: {', '.join(funder.investment_focus)}",
        f"Stage Interest: {funder.stage_interest}",
        f"Bio: {funder.bio}",
        f"Investment Range: ${funder.min_investment:,.0f} - ${funder.max_investment:,.0f}",
    ]
    if funder.portfolio:
        parts.append(f"Portfolio: {', '.join(funder.portfolio)}")
    if funder.region:
        parts.append(f"Region: {funder.region}")
    return ". ".join(parts)


# ── Embedding + Similarity ──────────────────────────────────────────

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Get embeddings for a list of texts using Vertex AI.
    Falls back to simple keyword vectors if Vertex AI is unavailable.
    """
    model = _get_embed_model()

    if model == "FALLBACK":
        return _fallback_embeddings(texts)

    try:
        embeddings = model.get_embeddings(texts)
        return [e.values for e in embeddings]
    except Exception as e:
        logger.error(f"Vertex AI embedding call failed: {e}")
        return _fallback_embeddings(texts)


def _fallback_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Simple keyword-frequency-based vectors as a fallback when Vertex AI
    is not available. Not as good, but works without credentials.
    """
    # Build vocabulary from all texts
    all_words: set[str] = set()
    tokenized = []
    for text in texts:
        words = set(text.lower().split())
        tokenized.append(words)
        all_words.update(words)

    vocab = sorted(all_words)
    vocab_idx = {w: i for i, w in enumerate(vocab)}

    # Build frequency vectors
    vectors = []
    for words in tokenized:
        vec = [0.0] * len(vocab)
        for w in words:
            if w in vocab_idx:
                vec[vocab_idx[w]] = 1.0
        # Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = (np.array(vec) / norm).tolist()
        vectors.append(vec)

    return vectors


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def rank_by_similarity(
    company_text: str,
    candidates: list[tuple[str, str]],  # [(uid, text), ...]
    top_k: int = 10,
) -> list[tuple[str, float]]:
    """
    Embed company + all candidates, compute cosine similarity, return top-k.

    Args:
        company_text: Text representation of the company
        candidates: List of (uid, text) tuples for each candidate
        top_k: Number of top results to return

    Returns:
        List of (uid, similarity_score) sorted by score descending
    """
    if not candidates:
        return []

    # Embed all texts in one batch (company first, then candidates)
    all_texts = [company_text] + [text for _, text in candidates]
    all_embeddings = get_embeddings(all_texts)

    company_embedding = all_embeddings[0]
    candidate_embeddings = all_embeddings[1:]

    # Compute similarity for each candidate
    scored = []
    for i, (uid, _) in enumerate(candidates):
        sim = cosine_similarity(company_embedding, candidate_embeddings[i])
        scored.append((uid, sim))

    # Sort by similarity descending, take top-k
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]
