"""AI-powered damage assessment using Gemini Vision."""
from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types

from app.services.vertex_ai_service import create_vertex_client, get_model_id

logger = logging.getLogger(__name__)

VALIDATION_PROMPT_TEMPLATE = """Analyze this apartment photo and determine which of the following items are visible in the image.

Expected items in this room:
{expected_items}

Return a JSON object:
{{
  "detected_items": ["item names that ARE visible in the photo"],
  "missing_items": ["item names that are NOT visible in the photo"],
  "notes": "Brief observation about the room's general state"
}}

Be thorough but reasonable — an item may be partially visible or at an angle. If you can reasonably identify it, mark it as detected. Return ONLY the JSON."""

DAMAGE_PROMPT_TEMPLATE = """You are an apartment inspector in Poland. Compare the condition of items in this move-out photo against their original inventory state.

Original inventory for this room:
{inventory_json}

For each item, assess:
1. Is it present and in acceptable condition (ok), visibly damaged (damaged), or not found (missing)?
2. If damaged, describe the damage and recommend "repair" or "replace"
3. Estimate repair or replacement cost in Polish Zloty (PLN) based on typical Polish market prices (IKEA Poland, Allegro, local repair services)

Return a JSON object:
{{
  "room": "{room_name}",
  "assessments": [
    {{
      "item_name": "name of the item",
      "original_condition": "condition from inventory",
      "current_status": "ok|damaged|missing",
      "damage_description": "description of damage or null if ok",
      "action": "repair|replace|null",
      "estimated_cost_pln": 0
    }}
  ],
  "room_notes": "Overall observations about this room"
}}

Cost guidelines for Poland:
- Simple furniture repair (scratch, stain): 100-300 PLN
- Chair replacement: 200-500 PLN
- Table replacement: 400-1500 PLN
- Sofa replacement: 1500-4000 PLN
- Appliance replacement: varies by type (fridge: 1500-3000, washer: 1200-2500, microwave: 200-600)
- Small items (lamp, mirror, rug): 50-400 PLN

Return ONLY the JSON."""


def validate_objects_in_photo(gcs_uri: str, expected_items: list[dict[str, Any]]) -> dict[str, Any]:
    """Check which expected items are visible in a move-out photo."""
    client = create_vertex_client()

    item_list = "\n".join(
        f"- {item.get('item_type', 'Unknown')} ({item.get('color', 'unknown color')}, {item.get('material', 'unknown material')})"
        for item in expected_items
    )
    prompt = VALIDATION_PROMPT_TEMPLATE.format(expected_items=item_list)

    mime_type = "image/png" if gcs_uri.lower().endswith(".png") else "image/jpeg"

    try:
        response = client.models.generate_content(
            model=get_model_id(),
            contents=[
                types.Part.from_uri(file_uri=gcs_uri, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        result = json.loads(response.text or "{}")
        logger.info("Validation for %s: detected=%d, missing=%d",
                     gcs_uri, len(result.get("detected_items", [])), len(result.get("missing_items", [])))
        return result
    except Exception as e:
        logger.error("Validation failed for %s: %s", gcs_uri, e)
        return {
            "detected_items": [],
            "missing_items": [item.get("item_type", "Unknown") for item in expected_items],
            "notes": f"Validation failed: {str(e)}",
        }


def assess_damage(gcs_uri: str, inventory_items: list[dict[str, Any]], room_name: str) -> dict[str, Any]:
    """Assess damage and estimate costs for items in a move-out photo."""
    client = create_vertex_client()

    inventory_json = json.dumps([
        {
            "name": item.get("item_type", "Unknown"),
            "condition": item.get("condition", "unknown"),
            "color": item.get("color", "unknown"),
            "material": item.get("material", "unknown"),
            "type": item.get("object_type", "unknown"),
            "notes": item.get("condition_notes", ""),
        }
        for item in inventory_items
    ], indent=2)

    prompt = DAMAGE_PROMPT_TEMPLATE.format(inventory_json=inventory_json, room_name=room_name)

    mime_type = "image/png" if gcs_uri.lower().endswith(".png") else "image/jpeg"

    try:
        response = client.models.generate_content(
            model=get_model_id(),
            contents=[
                types.Part.from_uri(file_uri=gcs_uri, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        result = json.loads(response.text or "{}")
        logger.info("Damage assessment for %s: %d items assessed", gcs_uri, len(result.get("assessments", [])))
        return result
    except Exception as e:
        logger.error("Damage assessment failed for %s: %s", gcs_uri, e)
        return {
            "room": room_name,
            "assessments": [
                {
                    "item_name": item.get("item_type", "Unknown"),
                    "original_condition": item.get("condition", "unknown"),
                    "current_status": "ok",
                    "damage_description": None,
                    "action": None,
                    "estimated_cost_pln": 0,
                }
                for item in inventory_items
            ],
            "room_notes": f"Assessment failed: {str(e)}",
        }


MARKDOWN_REPORT_PROMPT = """You are a professional property inspector in Poland generating a formal move-out inspection report.

Based on the following inspection data, generate a detailed, professionally formatted Markdown report.

Inspection Data:
{report_json}

Generate a Markdown report with the following sections:

# Move-Out Inspection Report

## Property Information
(address, move-out date, inspection date)

## Executive Summary
(brief overview: total items inspected, how many OK/damaged/missing, total estimated cost)

## Detailed Room-by-Room Assessment

For each room:
### [Room Name]
- Overall room condition notes
- Table of items with their status

IMPORTANT: Do NOT include any URLs, file paths, photo references, or links in the report. Photos are displayed separately in the UI.

## Damage & Cost Summary
| Item | Room | Status | Issue | Action | Cost (PLN) |
(only damaged and missing items)

## Total Estimated Cost
(bold total)

## Inspector Notes
(any general observations)

## Recommendations
(suggestions for the landlord regarding deposit deductions)

Use proper Markdown formatting with headers, bold text, tables, and bullet points.
All costs should be in Polish Zloty (PLN).
Be professional and objective in tone.
Return ONLY the Markdown text."""


def generate_markdown_report(report_data: dict) -> str:
    """Generate a professionally formatted Markdown report from inspection data."""
    client = create_vertex_client()

    report_json = json.dumps(report_data, indent=2, default=str)
    prompt = MARKDOWN_REPORT_PROMPT.format(report_json=report_json)

    try:
        response = client.models.generate_content(
            model=get_model_id(),
            contents=prompt,
        )
        markdown_text = response.text or "# Report Generation Failed\n\nUnable to generate report."
        logger.info("Generated markdown report (%d characters)", len(markdown_text))
        return markdown_text
    except Exception as e:
        logger.error("Failed to generate markdown report: %s", e)
        return f"# Report Generation Failed\n\nError: {str(e)}"
