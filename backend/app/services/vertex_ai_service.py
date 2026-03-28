"""Vertex AI (Gemini) service for AI-powered features."""
from __future__ import annotations

from google import genai

from app.core.config import settings


def create_vertex_client() -> genai.Client:
    """Create Vertex AI client using ADC/service account JSON from env.
    Pattern from notebooks/google_cloud_examples.py:39-45
    """
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.VERTEX_AI_LOCATION,
    )


def get_model_id() -> str:
    """Return the configured Vertex AI model ID."""
    return settings.VERTEX_AI_MODEL
