# Task List: AI Photo Inventory Analysis

**Specification:** `context/spec/003-ai-photo-inventory-analysis/`
**Status:** Implementation Complete
**Strategy:** Vertical Slicing — each slice is runnable and testable

---

## Slice 1: Database Migration + Schema Updates

**Goal:** Extend inventory_items table and schemas with rich metadata fields

- [x] **Database: Add new columns to inventory_items table**
  - [x] Create Alembic migration adding: `object_type` (VARCHAR 50), `color` (VARCHAR 100), `material` (VARCHAR 100), `condition` (VARCHAR 50), `position` (VARCHAR 255) — all nullable
  - [x] Add `photo_notes` JSONB column to `apartments` table (nullable)
  - [x] Update SQLAlchemy model `inventory_item.py` with new columns
  - [x] Update SQLAlchemy model `apartment.py` with `photo_notes` column
  - [x] Run migration

- [x] **Backend: Update Pydantic schemas**
  - [x] Update `InventoryItemCreate` with: `object_type`, `color`, `material`, `condition`, `position` (all optional)
  - [x] Update `InventoryItemResponse` with same fields
  - [x] Add `PhotoNotes` schema

- [x] **Frontend: Update TypeScript types**
  - [x] Update `InventoryItem` interface with: `object_type`, `color`, `material`, `condition`, `position` (all `string | null`)

**Verification:** Existing inventory endpoints still work. New fields are null for existing items. Can create an item with the new fields via PATCH endpoint.

---

## Slice 2: Inventory AI Service (Gemini Vision Integration)

**Goal:** Create the AI service that sends photos to Gemini and gets structured JSON back

- [x] **Backend: Create `backend/app/services/inventory_ai_service.py`**
  - [x] Import `create_vertex_client` and `get_model_id` from `vertex_ai_service`
  - [x] Implement `analyze_photo(gcs_uri: str) -> dict` function:
    - Create Vertex AI client
    - Build content with `types.Part.from_uri(file_uri=gcs_uri, mime_type="image/jpeg")` + prompt text
    - Use `config=types.GenerateContentConfig(response_mime_type="application/json")` for structured output
    - Parse JSON from `response.text`
    - Return dict with `detected_room`, `photo_notes`, `objects` list
  - [x] Implement `aggregate_inventory(photo_results: list[dict]) -> tuple[list[dict], list[dict]]`
    - Deduplicate objects by `(name.lower(), room)`
    - Keep entry with longest notes when duplicates found
    - Return `(objects, photo_notes_list)`
  - [x] Add the structured prompt requesting JSON with: name, type, position, room, color, material, condition, notes
  - [x] Add error handling: try/except per photo, log failures, continue processing
  - [x] Add timeout handling (30s per photo)

**Verification:** Call `analyze_photo()` with a real GCS URI of an uploaded apartment photo. Verify returned dict has correct structure with detected objects.

---

## Slice 3: Replace Mock Inventory Endpoint with Real AI

**Goal:** The generate endpoint calls Gemini instead of returning hardcoded items

- [x] **Backend: Update `POST /api/apartments/{id}/inventory/generate`**
  - [x] Fetch all move-in photos for apartment from DB
  - [x] Build GCS URIs: `gs://{settings.GCS_BUCKET_NAME}/{photo.storage_url}`
  - [x] Call `inventory_ai_service.analyze_photo()` for each photo
  - [x] Call `inventory_ai_service.aggregate_inventory()` on results
  - [x] Delete existing inventory items for apartment
  - [x] Create new `InventoryItem` records with all metadata fields (object_type, color, material, condition, position)
  - [x] Save photo notes to `apartment.photo_notes` JSONB column
  - [x] Return full inventory with metadata
  - [x] If no photos exist, return error: "No photos uploaded. Upload photos first."
  - [x] If all AI calls fail, fall back to empty inventory with error message

**Verification:** Upload real apartment photos. Call generate endpoint. Verify inventory items in DB have real AI-detected data with color, material, condition fields populated. Verify photo_notes saved on apartment record.

---

## Slice 4: Rich Inventory Display in Step 3 + Add Item Form

**Goal:** Frontend shows type badges, condition badges, color/material, and extended add-item form

- [x] **Frontend: Update Step3Inventory component**
  - [x] Show type badge next to item name (colored pill per type: furniture=blue, appliance=purple, fixture=gray, decor=pink, storage=amber, lighting=yellow)
  - [x] Show condition badge (excellent=green, good=blue, fair=yellow, poor=orange, damaged=red)
  - [x] Show color + material as subtitle text below item name (e.g., "Dark brown · Leather")
  - [x] Show position text in gray
  - [x] Show AI notes in expandable row (click to expand/collapse)
  - [x] Add collapsible "AI Photo Notes" section at top of inventory showing photo-level observations
  - [x] Inline editing: clicking any field opens edit mode for that field

- [x] **Frontend: Update add-item form**
  - [x] Name (required text input)
  - [x] Type (dropdown: furniture, appliance, fixture, decor, storage, lighting, other)
  - [x] Room (dropdown: existing room types)
  - [x] Color (optional text input)
  - [x] Material (optional text input)
  - [x] Condition (dropdown: excellent, good, fair, poor, damaged)
  - [x] Notes (optional textarea)

- [x] **Frontend: Update OverviewTab inventory display**
  - [x] Show same rich metadata (type/condition badges, color, material) in read-only view
  - [x] Show photo notes section if available

**Verification:** Upload photos, generate inventory. See items with type badges, condition badges, color/material info. Add a new item with all fields. Confirm and save. Apartment detail page shows same rich metadata.

---

## Recommendations

| Slice | Agent | Complexity |
|-------|-------|-----------|
| 1 (DB + schemas) | python-backend | Low |
| 2 (AI service) | python-backend | Medium — Gemini API integration |
| 3 (Replace mock endpoint) | python-backend | Low — wiring |
| 4 (Frontend UI) | nextjs-frontend | Medium — UI with badges and forms |

Slices 1-3 are sequential (each depends on the previous). Slice 4 can run in parallel with Slice 3 since it only depends on the updated TypeScript types from Slice 1.
