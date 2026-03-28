"""AI-powered inventory analysis using Gemini Vision."""
from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types

from app.services.vertex_ai_service import create_vertex_client, get_model_id

logger = logging.getLogger(__name__)

INVENTORY_PROMPT = """Analyze this apartment photo. Identify ALL furniture, appliances, fixtures, decor, storage, and lighting items visible in the image.

Return a JSON object with this exact structure:
{
  "detected_room": "living_room|bedroom|kitchen|bathroom|hallway|other",
  "photo_notes": "General observations about the room: size estimate, flooring type, wall color, lighting quality, cleanliness, overall condition.",
  "objects": [
    {
      "name": "descriptive name of the item",
      "type": "furniture|appliance|fixture|decor|storage|lighting|other",
      "position": "where in the room the item is located",
      "room": "living_room|bedroom|kitchen|bathroom|hallway|other",
      "color": "primary color(s)",
      "material": "primary material (wood, metal, fabric, leather, plastic, glass, ceramic, etc.)",
      "condition": "excellent|good|fair|poor|damaged",
      "notes": "any additional observations about this item"
    }
  ]
}

Be concise - include  items like lamps, rugs, curtains, shelves, mirrors. Describe them briefly but informatively.
Do not include structural elements (walls, doors, windows) unless they have notable features.
Return ONLY the JSON object, no other text."""


def analyze_photo(gcs_uri: str) -> dict[str, Any]:
    """Send a single photo to Gemini Vision and get structured inventory JSON.

    Args:
        gcs_uri: Full GCS URI (e.g., gs://bucket/path/to/photo.jpg)

    Returns:
        Dict with detected_room, photo_notes, and objects list
    """
    client = create_vertex_client()

    # Determine mime type from URI
    mime_type = "image/jpeg"
    if gcs_uri.lower().endswith(".png"):
        mime_type = "image/png"

    try:
        response = client.models.generate_content(
            model=get_model_id(),
            contents=[
                types.Part.from_uri(file_uri=gcs_uri, mime_type=mime_type),
                INVENTORY_PROMPT,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        result_text = response.text or "{}"
        result = json.loads(result_text)

        logger.info("Analyzed photo %s: found %d objects",
                    gcs_uri, len(result.get("objects", [])))
        return result

    except json.JSONDecodeError as e:
        logger.error(
            "Failed to parse Gemini JSON response for %s: %s", gcs_uri, e)
        return {"detected_room": "unknown", "photo_notes": "Failed to parse AI response", "objects": []}
    except Exception as e:
        logger.error("Failed to analyze photo %s: %s", gcs_uri, e)
        return {"detected_room": "unknown", "photo_notes": f"Analysis failed: {str(e)}", "objects": []}


def aggregate_inventory(
    photo_results: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Aggregate and deduplicate objects from multiple photo analyses.

    Args:
        photo_results: List of results from analyze_photo()

    Returns:
        Tuple of (deduplicated_objects, photo_notes_list)
    """
    # Collect all objects
    all_objects: dict[tuple[str, str], dict] = {}
    photo_notes_list: list[dict[str, Any]] = []

    for result in photo_results:
        # Collect photo-level notes
        if result.get("photo_notes"):
            photo_notes_list.append({
                "detected_room": result.get("detected_room", "unknown"),
                "notes": result.get("photo_notes", ""),
            })

        # Deduplicate objects by (name, room)
        for obj in result.get("objects", []):
            key = (obj.get("name", "").lower().strip(),
                   obj.get("room", "unknown"))
            existing = all_objects.get(key)
            if existing is None:
                all_objects[key] = obj
            else:
                # Keep the one with longer notes (more detail)
                existing_notes = len(existing.get("notes", "") or "")
                new_notes = len(obj.get("notes", "") or "")
                if new_notes > existing_notes:
                    all_objects[key] = obj

    deduplicated = list(all_objects.values())
    logger.info("Aggregated %d unique objects from %d photos",
                len(deduplicated), len(photo_results))
    return deduplicated, photo_notes_list
