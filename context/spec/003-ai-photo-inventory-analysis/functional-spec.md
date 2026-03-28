# Functional Specification: AI Photo Inventory Analysis

- **Roadmap Item:** Phase 1 - AI-Powered Inventory Generation (replace mock with real Gemini Vision)
- **Status:** Draft
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

### Context

RentOS currently uses mock/hardcoded inventory data when a landlord clicks "Generate Inventory" in the apartment wizard. The endpoint returns the same 5 items (Sofa, Coffee Table, TV, Washing Machine, Refrigerator) regardless of what photos were uploaded. This needs to be replaced with real AI-powered photo analysis using Google Gemini (Vertex AI) to detect objects in apartment photos and return structured inventory data.

### Problem Statement

Landlords upload 5-15 real apartment photos and expect the AI to accurately identify every piece of furniture, appliance, and amenity visible in those photos. The current mock implementation provides no real value — it doesn't look at the photos at all.

### Desired Outcome

When photos are uploaded and the landlord clicks "Generate Inventory":
1. Each photo is sent to Gemini Vision with a structured prompt
2. Gemini returns a JSON with all detected objects and rich metadata (name, type, position, room, color, material, condition, notes)
3. Gemini also returns general notes about the photo (lighting, room size, cleanliness, overall condition)
4. All objects across all photos are aggregated, deduplicated, and displayed in the wizard Step 3
5. The landlord can review, edit, add, and remove objects before confirming

### Success Metrics

- AI correctly identifies 85%+ of visible furniture and appliances in photos
- Each object has meaningful metadata (not just a name)
- The structured JSON output is consistent and parseable
- Landlords can supplement AI results by manually adding objects

---

## 2. Functional Requirements (The "What")

### 2.1 AI Photo Analysis with Structured JSON Output

**As a** system, **I want** to send each apartment photo to Gemini Vision and receive a structured JSON response, **so that** I can build a detailed inventory from the AI's analysis.

**Acceptance Criteria:**

- [ ] Each uploaded photo is sent to Vertex AI Gemini as an image attachment
- [ ] The AI prompt requests structured JSON output with the following schema per detected object:
  ```json
  {
    "name": "Leather Sofa",
    "type": "furniture",
    "position": "center of the room, against the wall",
    "room": "living_room",
    "color": "dark brown",
    "material": "leather",
    "condition": "good",
    "notes": "3-seater, no visible damage"
  }
  ```
- [ ] Valid `type` values include: `furniture`, `appliance`, `fixture`, `decor`, `storage`, `lighting`, `other`
- [ ] Valid `condition` values include: `excellent`, `good`, `fair`, `poor`, `damaged`
- [ ] The AI also returns general photo-level notes:
  ```json
  {
    "photo_notes": "Bright, well-lit living room. Approximately 25 sqm. Hardwood flooring in good condition. Walls are white, recently painted.",
    "detected_room": "living_room",
    "objects": [...]
  }
  ```
- [ ] Photos are sent to Gemini via their GCS URI (`gs://bucket/path`) since they're already stored in GCS
- [ ] The model used is configured via `VERTEX_AI_MODEL` env var (default: `gemini-2.5-flash-lite`)
- [ ] If a photo fails to process (API error, timeout), the error is logged and processing continues with remaining photos
- [ ] Processing all photos for an apartment should complete within 60 seconds

### 2.2 Inventory Aggregation & Deduplication

**As a** system, **I want** to aggregate objects detected across multiple photos into a single inventory, **so that** the same item isn't listed multiple times.

**Acceptance Criteria:**

- [ ] Objects detected in multiple photos of the same room are deduplicated (e.g., if a sofa appears in 3 living room photos, it's listed once)
- [ ] Deduplication is based on object name + room combination
- [ ] When duplicates are found, the entry with the most detail (longest notes/description) is kept
- [ ] Photo-level notes are preserved and associated with the inventory

### 2.3 Updated Inventory Display in Wizard Step 3

**As a** landlord, **I want** to see the AI-detected objects with rich metadata, **so that** I can review a detailed inventory before confirming.

**Acceptance Criteria:**

- [ ] Each inventory item in Step 3 shows:
  - Name (e.g., "Leather Sofa")
  - Type badge (e.g., "furniture", "appliance")
  - Room assignment
  - Color and material (if detected)
  - Condition badge (color-coded: excellent=green, good=blue, fair=yellow, poor=orange, damaged=red)
  - Notes from AI
- [ ] Photo-level general notes are shown at the top of the inventory (collapsible section "AI Photo Notes")
- [ ] The landlord can edit any field of any item inline
- [ ] The landlord can add new objects manually with all metadata fields:
  - Name (required)
  - Type (dropdown)
  - Room (dropdown)
  - Color (text, optional)
  - Material (text, optional)
  - Condition (dropdown)
  - Notes (text, optional)
- [ ] The landlord can remove any item
- [ ] "Confirm and Save" saves all items with their full metadata to the database

### 2.4 Database Schema Update

**As a** system, **I want** the inventory items table to store rich metadata, **so that** all AI-detected information is preserved.

**Acceptance Criteria:**

- [ ] The `inventory_items` table is extended with new columns: `color`, `material`, `condition`, `object_type`, `position`
- [ ] A new table or JSONB column stores photo-level notes (associated with apartment)
- [ ] Existing inventory CRUD endpoints work with the extended schema
- [ ] The `InventoryItem` TypeScript type is updated to include the new fields

---

## 3. Scope and Boundaries

### In-Scope

- Replace the mock inventory generation endpoint with real Gemini Vision API calls
- Send photos as GCS URIs to Gemini for analysis
- Parse structured JSON from Gemini responses
- Aggregate and deduplicate objects across photos
- Extend the database schema for rich inventory metadata
- Update wizard Step 3 UI to display and edit all metadata fields
- Update the add-item form with all metadata fields
- Show photo-level AI notes in the inventory review

### Out-of-Scope

- **Listing generation AI:** Separate spec for using Gemini to generate listing text
- **Chatbot AI:** Separate spec for AI tenant inquiry agent
- **Damage detection AI:** Separate spec for move-out photo comparison
- **Photo quality validation:** No pre-processing or quality checks on uploaded photos
- **Batch processing / queues:** Processing is synchronous for MVP (within 60s timeout)
- **AI confidence scores per object:** Not displayed to user in MVP
- **Multi-language AI responses:** AI responds in English only
