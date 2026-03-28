# Technical Specification: Move-Out Damage Report

- **Functional Specification:** `context/spec/004-moveout-damage-report/functional-spec.md`
- **Status:** Draft
- **Author(s):** Engineering Team

---

## 1. High-Level Technical Approach

Build a new move-out inspection flow with:

1. **New frontend page** `/moveout` — apartment selection + guided room-by-room inspection wizard
2. **New AI service** `backend/app/services/damage_ai_service.py` — two Gemini Vision calls per room: (a) validate object presence, (b) assess damage and estimate costs
3. **New backend endpoints** — orchestrate the inspection flow (validate photos, generate damage assessment, save report)
4. **Sidebar update** — add "Move-Out Report" navigation item
5. **Reuse existing** `damage_reports` table for storing the final report

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Damage AI Service

**File:** `backend/app/services/damage_ai_service.py`

Two main functions using the same Gemini Vision pattern as `inventory_ai_service.py`:

**Function 1: `validate_objects_in_photo(gcs_uri, expected_items) -> dict`**

- Sends the move-out photo to Gemini with a list of expected items
- Prompt asks AI to check which items are visible and which are missing
- Returns:
```json
{
  "detected_items": ["Refrigerator", "Table"],
  "missing_items": ["Chair"],
  "notes": "Room appears clean, good lighting"
}
```

**Function 2: `assess_damage(gcs_uri, inventory_items) -> dict`**

- Sends the move-out photo + original inventory data (name, condition, color, material) to Gemini
- Prompt asks AI to compare current state to original inventory and estimate repair/replace costs in PLN
- Returns:
```json
{
  "room": "kitchen",
  "assessments": [
    {
      "item_name": "Refrigerator",
      "original_condition": "good",
      "current_status": "ok",
      "damage_description": null,
      "action": null,
      "estimated_cost_pln": 0
    },
    {
      "item_name": "Table",
      "original_condition": "good",
      "current_status": "damaged",
      "damage_description": "Deep scratch on surface, approximately 30cm long",
      "action": "repair",
      "estimated_cost_pln": 200
    },
    {
      "item_name": "Chair",
      "original_condition": "good",
      "current_status": "missing",
      "damage_description": "Not found in photo",
      "action": "replace",
      "estimated_cost_pln": 350
    }
  ],
  "room_notes": "Kitchen is generally clean. Minor wear on countertop."
}
```

**Prompt for damage assessment** instructs the AI to estimate costs based on Polish market prices (IKEA Poland, Allegro, typical Polish furniture repair services).

---

### 2.2 Backend API Endpoints

**File:** `backend/app/api/moveout.py` (new router)

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/moveout/apartments` | List apartments eligible for move-out | — | `{apartments: [...]}` with inventory counts |
| GET | `/api/moveout/apartments/{id}/rooms` | Get rooms with expected items from inventory | — | `{rooms: [{room: "kitchen", items: [...]}]}` |
| POST | `/api/moveout/apartments/{id}/rooms/{room}/validate` | Validate uploaded photo for a room | `multipart (files)` | `{detected: [...], missing: [...]}` |
| POST | `/api/moveout/apartments/{id}/rooms/{room}/assess` | Run damage assessment for a room | `{photo_storage_url: str}` | `{assessments: [...]}` |
| POST | `/api/moveout/apartments/{id}/report` | Save finalized damage report | `{report_data: {...}, notes: str}` | `DamageReportResponse` |
| GET | `/api/moveout/apartments/{id}/report` | Get saved damage report | — | `DamageReportResponse` |

**Room grouping logic:** Query `inventory_items` for the apartment, group by `room_type`, return as rooms with their items.

**Validate endpoint flow:**
1. Upload photo to GCS as `move-out` type
2. Get expected items for this room from inventory
3. Call `damage_ai_service.validate_objects_in_photo(gcs_uri, expected_items)`
4. Return validation result

**Assess endpoint flow:**
1. Get inventory items for this room (with original condition/color/material)
2. Call `damage_ai_service.assess_damage(gcs_uri, inventory_items)`
3. Return assessment with costs

**Report save:** Store the full report in `damage_reports.report_data` JSONB column.

---

### 2.3 Frontend Architecture

**New page:** `frontend/src/app/moveout/page.tsx`

**Component structure:**
```
app/moveout/
├── page.tsx                    # Apartment selection list
└── [id]/
    └── page.tsx                # Room-by-room inspection wizard

components/moveout/
├── ApartmentSelector.tsx       # Card grid of eligible apartments
├── RoomInspection.tsx          # Single room inspection (upload + validate + assess)
├── ValidationResult.tsx        # Shows detected/missing items with re-upload option
├── DamageAssessment.tsx        # Shows per-item assessment with costs
└── DamageReport.tsx            # Final full report with editing
```

**Inspection wizard state machine per room:**
1. `UPLOAD` — show expected items, prompt photo upload
2. `VALIDATING` — AI checking if all items are present
3. `VALIDATION_RESULT` — show detected/missing, option to re-upload or continue
4. `ASSESSING` — AI evaluating damage and costs
5. `ASSESSED` — show results, advance to next room or generate report

**Overall wizard flow:**
- Progress bar: "Room 1 of 4" with room names
- Back/forward navigation between rooms
- After last room → show full DamageReport component

---

### 2.4 Sidebar Update

**File:** `frontend/src/components/layout/Sidebar.tsx`

Add new nav item between "Conversations" and "Settings":
```typescript
{
  label: "Move-Out Report",
  href: "/moveout",
  icon: /* clipboard/document icon SVG */,
}
```

---

### 2.5 Damage Report Data Structure

Stored in `damage_reports.report_data` (JSONB):

```json
{
  "apartment_id": "uuid",
  "apartment_address": "ul. Marszałkowska 15/4, Warsaw",
  "moveout_date": "2026-03-31",
  "inspection_date": "2026-03-28",
  "rooms": [
    {
      "room_name": "kitchen",
      "move_in_photo_url": "gs://...",
      "move_out_photo_url": "gs://...",
      "room_notes": "Kitchen is generally clean.",
      "items": [
        {
          "name": "Refrigerator",
          "original_condition": "good",
          "original_color": "white",
          "original_material": "metal",
          "current_status": "ok|damaged|missing",
          "damage_description": "...",
          "action": null|"repair"|"replace",
          "estimated_cost_pln": 0,
          "landlord_override_cost": null,
          "landlord_notes": null
        }
      ]
    }
  ],
  "summary": {
    "total_items": 15,
    "ok_items": 12,
    "damaged_items": 2,
    "missing_items": 1,
    "total_estimated_cost_pln": 1250
  },
  "landlord_notes": "..."
}
```

---

## 3. Impact and Risk Analysis

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI fails to detect items correctly | Medium | Medium | Validation step lets landlord re-upload or mark as missing |
| Cost estimates are unrealistic | Medium | Low | Landlord can override costs; estimates are guidance only |
| Multiple Gemini calls per room (validate + assess) | Medium | Medium (latency) | Show loading states; process is sequential per room, acceptable for MVP |
| Large apartments (10+ rooms) take long | Low | Low | Rare for Polish apartments; progress bar shows status |

---

## 4. Testing Strategy

- **AI validation testing:** Upload a photo with some items removed from frame, verify AI detects missing items
- **Damage assessment testing:** Upload a photo with visible damage, verify AI identifies it and provides PLN estimate
- **Full flow testing:** Complete inspection for 3-room apartment, verify report is saved and viewable
- **Edge cases:** Empty room (all items missing), perfect condition (all OK), apartment with no inventory
