"""
MyHack Matching API -- FastAPI Application

Two-stage AI matching pipeline for the startup ecosystem platform.
Reads from Firestore, scores with Gemini, returns ranked matches.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import matching, briefs
from models.schemas import HealthResponse
from config import get_settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("MyHack Matching API starting up")
    logger.info(f"  Project: {settings.google_cloud_project}")
    logger.info(f"  Firestore DB: {settings.firestore_database}")
    logger.info(f"  Gemini Model: {settings.gemini_model}")
    logger.info(f"  Gemini API Key: {'SET' if settings.google_api_key else 'NOT SET (using fallback)'}")
    logger.info(f"  Embedding Model: {settings.embedding_model}")
    logger.info(f"  Hard Filter Max: {settings.hard_filter_max_candidates}")
    logger.info(f"  Embedding Top-K: {settings.embedding_top_k}")
    logger.info("=" * 60)
    yield


# Create app
app = FastAPI(
    title="MyHack Matching API",
    description="Two-stage AI matching pipeline: Hard Filter -> Embeddings -> Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS -- allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite default
        "http://localhost:3000",    # Alternative
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(matching.router)
app.include_router(briefs.router)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    settings = get_settings()
    services = {
        "firestore": "configured" if settings.google_cloud_project else "not configured",
        "gemini": "configured" if settings.google_api_key else "not configured (will use fallback)",
        "vertex_ai": f"project={settings.google_cloud_project}, location={settings.vertex_ai_location}",
    }
    return HealthResponse(status="ok", version="1.0.0", services=services)
