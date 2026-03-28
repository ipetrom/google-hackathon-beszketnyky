# Functional Specification: Move-Out Damage Report

- **Roadmap Item:** Phase 4 - Move-Out Damage Detection & Assessment
- **Status:** Draft
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

### Context

When a tenant moves out, the landlord needs to compare the current state of the apartment against the original inventory to identify missing items or damage. Currently, this is done manually — the landlord walks through the apartment, takes photos, and compares them against memory or a paper checklist. This is time-consuming, error-prone, and leads to disputes with tenants.

### Problem Statement

Landlords need a structured, guided process to:
1. Systematically photograph every room/group of furniture documented in the original inventory
2. Have AI validate that all required objects are visible in the uploaded photos
3. Get an automated damage assessment comparing move-out condition to move-in condition
4. Receive a cost estimate for repairs or replacements in Polish Zloty (PLN)
5. Generate a professional damage report that can be shared with the tenant

### Desired Outcome

A new **"Move-Out Report"** tab in the sidebar navigation that guides the landlord through a structured move-out inspection process, room by room, with AI-powered validation and damage assessment.

### Success Metrics

- Landlord can complete a full move-out inspection in under 10 minutes
- AI correctly validates presence of 90%+ of inventory items in photos
- Damage assessment provides reasonable cost estimates (within 30% of market rates)
- Generated report is professional enough to share with tenant for deposit discussions

---

## 2. Functional Requirements (The "What")

### 2.1 Move-Out Report Tab (New Sidebar Navigation Item)

**As a** landlord, **I want** a dedicated "Move-Out Report" section in the sidebar, **so that** I can start and manage move-out inspections separately from the apartment detail page.

**Acceptance Criteria:**

- [ ] A new "Move-Out Report" navigation item appears in the sidebar (between Conversations and Settings)
- [ ] The Move-Out Report page shows a list of apartments eligible for move-out inspection
- [ ] For MVP, all apartments are eligible (mock move-out date: 31 March 2026)
- [ ] Each apartment card shows: address, room count, number of inventory items, move-out date
- [ ] Clicking an apartment starts the move-out inspection flow

### 2.2 Room-by-Room Photo Upload (Guided Batch Process)

**As a** landlord, **I want** to be guided through uploading photos room by room, matching the original inventory, **so that** I don't miss any documented items.

**Acceptance Criteria:**

- [ ] The inspection flow groups inventory items by room (from the apartment's inventory)
- [ ] For each room, the system shows:
  - Room name (e.g., "Kitchen")
  - List of items that should be in this room (from inventory): e.g., "Refrigerator, Table, 2x Chair"
  - A prompt: "Upload a photo of the kitchen showing: Refrigerator, Table, 2x Chair"
  - The original move-in photo for this room (if available) as a reference
- [ ] The landlord uploads one or more photos for the current room
- [ ] After uploading, the system advances to the next room
- [ ] A progress indicator shows how many rooms have been photographed (e.g., "2 of 4 rooms completed")
- [ ] The landlord can go back to re-upload photos for a previous room

### 2.3 AI Validation — Object Presence Check

**As a** system, **I want** to verify that all expected inventory items are visible in the uploaded move-out photos, **so that** I can ensure a thorough inspection.

**Acceptance Criteria:**

- [ ] After the landlord uploads photos for a room, AI analyzes the photo(s) and checks for each expected item
- [ ] AI returns a checklist showing which items were detected and which are missing:
  - Detected items: green checkmark
  - Missing items: red X with message "Not detected in photo"
- [ ] If one or more items are missing, the system shows a warning:
  - "The following items were not detected: [list]. Please re-upload a photo showing these items, or mark them as missing."
  - Options: "Re-upload Photo" or "Mark as Missing"
- [ ] If the landlord marks an item as missing, it is flagged in the damage report
- [ ] If all items are detected, the system shows a green confirmation and advances to the next room
- [ ] The AI uses the same Gemini Vision model used for inventory generation

### 2.4 AI Damage Assessment

**As a** system, **I want** to compare the condition of each detected item against its original inventory condition, **so that** I can identify damage and estimate costs.

**Acceptance Criteria:**

- [ ] For each detected item, AI compares the move-out photo against the original inventory data (condition, color, material, notes)
- [ ] AI determines one of three statuses per item:
  - **OK** — item is in the same or acceptable condition
  - **Damaged** — item shows visible damage (scratches, stains, broken parts)
  - **Missing** — item was not found in the photo (marked by validation step)
- [ ] For **damaged** items, AI provides:
  - Description of the damage (e.g., "Large stain on the seat cushion")
  - Recommendation: "Repair" or "Replace"
  - Estimated cost in PLN (e.g., "Repair: ~150 PLN" or "Replace: ~800 PLN")
- [ ] For **missing** items, AI provides:
  - Replacement cost estimate in PLN based on the item type, material, and condition
- [ ] Cost estimates should be reasonable for the Polish market (AI should consider item type, material, and typical Polish retail/service prices)

### 2.5 Structured Damage Report

**As a** landlord, **I want** a complete structured report of the move-out inspection, **so that** I can discuss security deposit deductions with the tenant.

**Acceptance Criteria:**

- [ ] After all rooms are inspected, a full damage report is generated
- [ ] The report includes:
  - **Apartment details**: address, rooms, move-out date
  - **Summary**: total items inspected, items OK, items damaged, items missing, total estimated cost
  - **Per-room breakdown**:
    - Room name
    - Move-in photo (original) and move-out photo (new) side by side
    - Item-by-item assessment table:
      | Item | Original Condition | Current Status | Damage Description | Action | Est. Cost (PLN) |
      |------|-------------------|----------------|-------------------|--------|----------------|
      | Sofa | Good, beige leather | Damaged | Stain on cushion | Repair | 150 PLN |
      | Coffee Table | Good, wooden | OK | — | — | — |
      | TV | Good, 55" | Missing | — | Replace | 2,500 PLN |
  - **Total cost summary** at the bottom
  - **Landlord notes** — editable text area for the landlord to add comments
- [ ] The landlord can edit/override any AI assessment (change status, cost, description)
- [ ] A "Finalize Report" button saves the report to the database
- [ ] The report is viewable later from the apartment's Inspection tab

---

## 3. Scope and Boundaries

### In-Scope

- New "Move-Out Report" sidebar navigation item and page
- Apartment selection with mock move-out dates (31 March 2026)
- Room-by-room guided photo upload following inventory structure
- AI validation of object presence in uploaded photos (Gemini Vision)
- Re-upload flow when items are not detected
- AI damage assessment comparing move-out condition to inventory
- Cost estimation in PLN for damaged/missing items
- Structured damage report with per-room breakdown
- Landlord ability to edit/override AI assessments
- Save report to database (damage_reports table)
- View report from apartment Inspection tab

### Out-of-Scope

- **PDF export** — deferred to future iteration
- **Tenant notification** — landlord shares report manually
- **Automated deposit deduction** — no payment processing
- **Historical report comparison** — only one report per apartment for now
- **Video upload** — photos only
- **Real move-out date tracking** — all dates are mocked to 31 March 2026
- **Listing generation from move-out report** — separate from listing generation flow
