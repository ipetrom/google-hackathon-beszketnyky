# Task List: Move-Out Damage Report

**Specification:** `context/spec/004-moveout-damage-report/`
**Status:** Implementation Complete
**Strategy:** Vertical Slicing — each slice is runnable and testable

---

## Slice 1: Backend — Damage AI Service + Move-Out API Endpoints

**Goal:** Create the AI service for object validation and damage assessment, plus all backend endpoints

- [x] **Create `backend/app/services/damage_ai_service.py`**
  - [x] `validate_objects_in_photo(gcs_uri, expected_items: list[dict]) -> dict` — sends move-out photo + list of expected item names to Gemini Vision. Returns `{detected_items: [...], missing_items: [...], notes: str}`
  - [x] `assess_damage(gcs_uri, inventory_items: list[dict]) -> dict` — sends move-out photo + original inventory data (name, condition, color, material) to Gemini. Returns per-item assessment with `current_status` (ok/damaged/missing), `damage_description`, `action` (repair/replace/null), `estimated_cost_pln`
  - [x] Use `response_mime_type="application/json"` for structured output
  - [x] Prompt for cost estimation should reference Polish market prices (IKEA Poland, Allegro, local repair services)
  - [x] Error handling: return sensible defaults on API failure

- [x] **Create `backend/app/api/moveout.py`** (new router)
  - [x] `GET /api/moveout/apartments` — list all apartments with inventory item counts and mock move-out date (2026-03-31). Return `{apartments: [{id, address, city, rooms, sqm, status, inventory_count, moveout_date}]}`
  - [x] `GET /api/moveout/apartments/{id}/rooms` — group inventory items by room_type, return `{rooms: [{room_name, items: [{id, item_type, object_type, color, material, condition, condition_notes}]}]}`
  - [x] `POST /api/moveout/apartments/{id}/rooms/{room}/validate` — accept photo upload (multipart), upload to GCS as move-out, get expected items from inventory for this room, call `damage_ai_service.validate_objects_in_photo()`, return validation result
  - [x] `POST /api/moveout/apartments/{id}/rooms/{room}/assess` — accept `{photo_storage_url: str}`, get inventory items for this room, call `damage_ai_service.assess_damage()`, return assessment
  - [x] `POST /api/moveout/apartments/{id}/report` — accept `{report_data: dict, notes: str}`, save to `damage_reports` table, return saved report
  - [x] `GET /api/moveout/apartments/{id}/report` — get existing damage report for apartment

- [x] **Register router in `backend/app/main.py`**
  - [x] Import moveout router
  - [x] Add `app.include_router(moveout.router, prefix="/api")`

- [x] **Create `backend/app/schemas/moveout.py`**
  - [x] `MoveoutApartmentResponse` — id, address, city, rooms, sqm, status, inventory_count, moveout_date
  - [x] `RoomItemsResponse` — room_name, items list
  - [x] `ValidationResponse` — detected_items, missing_items, notes, photo_url
  - [x] `AssessmentItemResponse` — item_name, original_condition, current_status, damage_description, action, estimated_cost_pln
  - [x] `DamageReportCreate` — report_data (dict), notes (str)
  - [x] `DamageReportResponse` — id, apartment_id, report_data, notes, created_at, updated_at

**Verification:** Call each endpoint with curl. `GET /api/moveout/apartments` returns apartment list. `GET .../rooms` returns grouped items. Upload a photo to validate endpoint, verify AI response.

---

## Slice 2: Frontend — Apartment Selection + Sidebar Update

**Goal:** New Move-Out Report page with apartment selection and sidebar nav item

- [x] **Update `frontend/src/components/layout/Sidebar.tsx`**
  - [x] Add "Move-Out Report" nav item between Conversations and Settings
  - [x] Use clipboard/document icon SVG
  - [x] Link to `/moveout`

- [x] **Create `frontend/src/app/moveout/page.tsx`**
  - [x] Fetch apartments from `GET /api/moveout/apartments`
  - [x] Display as card grid (reuse similar layout to apartments page)
  - [x] Each card shows: address, city, room count, inventory item count, move-out date badge ("31 Mar 2026")
  - [x] "Start Inspection" button on each card links to `/moveout/{id}`
  - [x] Empty state if no apartments exist

- [x] **Add types to `frontend/src/types/apartment.ts`**
  - [x] `MoveoutApartment` interface
  - [x] `RoomItems` interface
  - [x] `ValidationResult` interface
  - [x] `DamageAssessmentItem` interface
  - [x] `DamageReportData` interface

**Verification:** Navigate to `/moveout` via sidebar. See list of apartments with inventory counts and move-out dates. Click "Start Inspection" navigates to `/moveout/{id}`.

---

## Slice 3: Frontend — Room-by-Room Inspection Wizard

**Goal:** Guided inspection flow: upload photo per room → AI validates → AI assesses damage

- [x] **Create `frontend/src/app/moveout/[id]/page.tsx`** — inspection wizard page
  - [x] Fetch rooms from `GET /api/moveout/apartments/{id}/rooms`
  - [x] Track current room index in state
  - [x] Progress bar: "Room 1 of N — Kitchen"
  - [x] For each room, render RoomInspection component
  - [x] Back/Next navigation between rooms
  - [x] After last room → show DamageReport component

- [x] **Create `frontend/src/components/moveout/RoomInspection.tsx`**
  - [x] State machine: UPLOAD → VALIDATING → VALIDATION_RESULT → ASSESSING → ASSESSED
  - [x] **UPLOAD state:**
    - Show room name and list of expected items (from inventory)
    - Show original move-in photo for this room (if available) as reference
    - Drag-and-drop photo upload area (reuse PhotoUpload component pattern)
    - "Upload & Validate" button
  - [x] **VALIDATING state:**
    - Upload photo to `POST /api/moveout/apartments/{id}/rooms/{room}/validate`
    - Show spinner: "AI is checking for all items..."
  - [x] **VALIDATION_RESULT state:**
    - Show checklist: detected items (green checkmark), missing items (red X)
    - If missing items: warning banner + "Re-upload Photo" and "Mark as Missing" buttons
    - If all detected: green success + auto-advance to ASSESSING
  - [x] **ASSESSING state:**
    - Call `POST /api/moveout/apartments/{id}/rooms/{room}/assess`
    - Show spinner: "AI is assessing condition and estimating costs..."
  - [x] **ASSESSED state:**
    - Show DamageAssessment component with per-item results
    - "Continue to Next Room" button

- [x] **Create `frontend/src/components/moveout/ValidationResult.tsx`**
  - [x] Props: detected_items, missing_items, onReupload, onMarkMissing
  - [x] Green checkmark for detected, red X for missing
  - [x] Buttons for re-upload or mark as missing

- [x] **Create `frontend/src/components/moveout/DamageAssessment.tsx`**
  - [x] Props: assessments (list of items with status/cost)
  - [x] Per-item row: item name, original condition → current status badge (OK=green, Damaged=orange, Missing=red)
  - [x] For damaged: damage description, action badge (Repair/Replace), cost in PLN
  - [x] For missing: replacement cost in PLN
  - [x] Subtotal for the room at bottom

**Verification:** Start inspection for an apartment. See room 1 with expected items listed. Upload photo. See validation result (detected/missing). If all detected, see damage assessment with costs. Navigate to next room. Complete all rooms.

---

## Slice 4: Frontend — Final Damage Report + Save

**Goal:** Full structured report after all rooms inspected, with editing and save

- [x] **Create `frontend/src/components/moveout/DamageReport.tsx`**
  - [x] Props: apartment data, all room assessments collected from wizard
  - [x] **Header:** apartment address, move-out date, inspection date (today)
  - [x] **Summary cards:** total items, OK count, damaged count, missing count, total estimated cost PLN
  - [x] **Per-room breakdown:**
    - Room name heading
    - Side-by-side photos (move-in original + move-out uploaded) if available
    - Assessment table:
      | Item | Original | Status | Damage | Action | Cost (PLN) |
    - Status badges: OK=green, Damaged=orange, Missing=red
    - Action badges: Repair=blue, Replace=red
  - [x] **Cost editing:** landlord can click any cost to override it with custom amount
  - [x] **Status editing:** landlord can change any item's status via dropdown
  - [x] **Landlord notes:** text area at bottom for free-form notes
  - [x] **Total cost** auto-recalculates when costs are edited
  - [x] **"Finalize Report" button:**
    - Sends `POST /api/moveout/apartments/{id}/report` with full report data
    - Shows success message
    - Navigates back to `/moveout`

- [x] **Link from apartment Inspection tab**
  - [x] Update `InspectionTab.tsx` to check for existing damage report via `GET /api/moveout/apartments/{id}/report`
  - [x] If report exists, show a read-only version of the damage report (same layout as DamageReport but without edit controls)
  - [x] Add link: "View full report" → `/moveout/{id}`

**Verification:** Complete full inspection. See structured report with all rooms, costs, badges. Edit a cost, change a status, add notes. Click "Finalize Report". Navigate to apartment's Inspection tab, see the saved report.

---

## Recommendations

| Slice | Agent | Complexity |
|-------|-------|-----------|
| 1 (Backend: AI + endpoints) | python-backend | High — two AI prompts, 6 endpoints |
| 2 (Frontend: selection + sidebar) | nextjs-frontend | Low |
| 3 (Frontend: inspection wizard) | nextjs-frontend | High — state machine, multi-step flow |
| 4 (Frontend: report + save) | nextjs-frontend | Medium — table, editing, save |

**Slice 1 must complete first** (backend endpoints). Then **Slices 2, 3, 4 can be sequential** (each builds on the previous frontend page).

Alternatively: Slice 1 + Slice 2 in parallel, then Slice 3, then Slice 4.
