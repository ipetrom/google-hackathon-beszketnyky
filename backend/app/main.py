import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import apartments, conversations, inventory, lease_periods, listings
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="RentOS API",
    description="Backend API for the RentOS apartment management platform. "
    "Provides endpoints for apartment management, AI-powered inventory generation, "
    "listing creation, tenant inquiry chatbot, and lease period tracking.",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(apartments.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(listings.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(lease_periods.router, prefix="/api")


@app.get("/")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "RentOS API"}


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("RentOS API started")
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("Debug mode: %s", settings.DEBUG)
