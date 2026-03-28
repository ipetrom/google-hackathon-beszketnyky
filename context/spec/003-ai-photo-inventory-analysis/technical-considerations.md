# Technical Specification: AI Photo Inventory Analysis

- **Functional Specification:** `context/spec/003-ai-photo-inventory-analysis/functional-spec.md`
- **Status:** Draft
- **Author(s):** Engineering Team

---

## 1. High-Level Technical Approach

Replace the mock inventory generation with real Gemini Vision API calls. The implementation involves:

1. **New service** `backend/app/services/inventory_ai_service.py` — sends photos to Gemini with a structured prompt, parses JSON response
2. **DB migration** — add columns to `inventory_items` table: `color`, `material`, `condition`, `object_type`, `position`; add `photo_notes` JSONB column to `apartments` table
3. **Update endpoint** `POST /api/apartments/{id}/inventory/generate` — call the AI service instead of returning mock data
4. **Update schemas** — extend Pydantic models and TypeScript types with new fields
5. **Update frontend Step 3** — display rich metadata, type/condition badges, photo notes section, extended add-item form

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Inventory AI Service

**File:** `backend/app/services/inventory_ai_service.py`

Uses the existing `vertex_ai_service.py` client factory and the `google.genai` SDK pattern from `notebooks/google_cloud_examples.py`.

**Key function:** `analyze_photo(gcs_uri: str) -> dict`

- Creates a Vertex AI client via `create_vertex_client()`
- Sends the photo as a GCS URI part + text prompt to `client.models.generate_content()`
- The prompt instructs Gemini to return JSON with the exact schema
- Parses the JSON from the response text

**Gemini API call pattern** (using `google.genai` SDK as in the reference):

```python
from google import genai
from google.genai import types

client = create_vertex_client()
response = client.models.generate_content(
    model=get_model_id(),
    contents=[
        types.Part.from_uri(file_uri=gcs_uri, mime_type="image/jpeg"),
        types.Part.from_text(INVENTORY_PROMPT),
    ],
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
    ),
)
```

**The `response_mime_type="application/json"` config** forces Gemini to return valid JSON, making parsing reliable.

**Prompt design:**

```
Analyze this apartment photo. Identify ALL furniture, appliances, fixtures, decor, storage,
and lighting items visible in the image.

Return a JSON object with this exact structure:
{
  "detected_room": "living_room|bedroom|kitchen|bathroom|hallway|other",
  "photo_notes": "General observations about the room: size estimate, flooring type, wall color,
                  lighting quality, cleanliness, overall condition.",
  "objects": [
    {
      "name": "descriptive name of the item",
      "type": "furniture|appliance|fixture|decor|storage|lighting|other",
      "position": "where in the room the item is located",
      "room": "living_room|bedroom|kitchen|bathroom|hallway|other",
      "color": "primary color(s)",
      "material": "primary material (wood, metal, fabric, leather, plastic, glass, etc.)",
      "condition": "excellent|good|fair|poor|damaged",
      "notes": "any additional observations about this item"
    }
  ]
}

Be thorough — include even small items like lamps, rugs, curtains, shelves.
Do not include structural elements (walls, doors, windows) unless they have notable features.
```

**Aggregation function:** `aggregate_inventory(photo_results: list[dict]) -> tuple[list[dict], list[dict]]`

- Takes results from all photos
- Deduplicates objects by `(name.lower(), room)` — keeps the entry with the longest notes
- Returns `(deduplicated_objects, photo_notes_list)`

---

### 2.2 Database Schema Changes

**Migration:** Add columns to `inventory_items` table:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `object_type` | VARCHAR(50) | YES | NULL | furniture, appliance, fixture, etc. |
| `color` | VARCHAR(100) | YES | NULL | Primary color(s) |
| `material` | VARCHAR(100) | YES | NULL | Primary material |
| `condition` | VARCHAR(50) | YES | NULL | excellent, good, fair, poor, damaged |
| `position` | VARCHAR(255) | YES | NULL | Location within the room |

**Add to `apartments` table:**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `photo_notes` | JSONB | YES | NULL | Array of photo-level AI notes |

All new columns are nullable so existing data is unaffected.

---

### 2.3 API Changes

**Endpoint:** `POST /api/apartments/{apartment_id}/inventory/generate`

Current behavior: returns 5 hardcoded mock items.

New behavior:
1. Fetch all move-in photos for the apartment from DB
2. For each photo, build GCS URI: `gs://{bucket}/{storage_url}`
3. Call `inventory_ai_service.analyze_photo(gcs_uri)` for each photo
4. Aggregate and deduplicate results
5. Delete existing inventory items for the apartment
6. Save new items with all metadata fields to `inventory_items` table
7. Save photo notes to `apartments.photo_notes` JSONB column
8. Return the full inventory with metadata

**Response shape remains the same** but `InventoryItemResponse` includes new fields.

---

### 2.4 Schema Updates

**File:** `backend/app/schemas/inventory.py`

Update `InventoryItemCreate`:
- Add: `object_type: str | None`, `color: str | None`, `material: str | None`, `condition: str | None`, `position: str | None`

Update `InventoryItemResponse`:
- Add same fields

Update `InventoryUpdate`:
- Items list uses updated `InventoryItemCreate`

**Add new schema:**
```python
class PhotoNotes(BaseModel):
    detected_room: str | None = None
    notes: str | None = None
```

---

### 2.5 Frontend Changes

**File:** `frontend/src/types/apartment.ts`

Update `InventoryItem` interface:
- Add: `object_type`, `color`, `material`, `condition`, `position` (all `string | null`)

**File:** `frontend/src/components/apartments/AddApartmentWizard/Step3Inventory.tsx`

Updates:
- Show type badge next to item name (colored pill: furniture=blue, appliance=purple, fixture=gray, etc.)
- Show condition badge (excellent=green, good=blue, fair=yellow, poor=orange, damaged=red)
- Show color + material as subtitle text below name
- Show AI notes in an expandable detail row
- Add collapsible "AI Photo Notes" section at top showing photo-level observations
- Update add-item form to include: name, type dropdown, room dropdown, color input, material input, condition dropdown, notes textarea

**File:** `frontend/src/components/apartments/ApartmentDetail/OverviewTab.tsx`

- Update inventory display to show the same rich metadata (type/condition badges, color, material)

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Impact | Mitigation |
|---|---|---|
| Vertex AI / Gemini API | Core feature — inventory fails if API is down | Retry once, then fall back to mock data with user notification |
| GCS photo access | Gemini needs GCS URI access | Photos already in GCS; service account has read access |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini returns invalid JSON | Low | Medium | Use `response_mime_type="application/json"` to force valid JSON; add try/except with fallback |
| Gemini misidentifies objects | Medium | Low | Landlord reviews and edits in Step 3; this is expected behavior |
| API latency >60s for many photos | Medium | Medium | Process photos concurrently (asyncio.gather); set per-photo timeout of 30s |
| Rate limiting on Gemini API | Low | Medium | Process sequentially with small delay if rate limited |
| New DB columns break existing data | Low | Low | All new columns are nullable with no defaults |

---

## 4. Testing Strategy

- **AI service testing:** Call `analyze_photo()` with a real apartment photo GCS URI, verify JSON structure has required fields
- **Endpoint testing:** Upload photos for an apartment, call generate endpoint, verify inventory items in DB have all metadata fields populated
- **Frontend testing:** Verify Step 3 shows type badges, condition badges, color/material, notes; verify add-item form includes all fields
- **Fallback testing:** Simulate Gemini API failure (invalid credentials), verify graceful error message instead of 500
- **Migration testing:** Run migration on existing DB, verify existing inventory items still work (new columns are null)
