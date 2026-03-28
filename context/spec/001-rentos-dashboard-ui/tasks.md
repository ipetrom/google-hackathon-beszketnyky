# Task List: RentOS Dashboard & Complete UI

**Specification:** `context/spec/001-rentos-dashboard-ui/`
**Status:** Implementation Complete
**Strategy:** Vertical Slicing - Each slice delivers a small, testable piece of end-to-end functionality

---

## Implementation Order

This task list follows vertical slicing principles. Each slice:
- Implements database + backend + frontend changes together
- Results in a working, runnable application
- Delivers visible functionality
- Can be tested immediately

---

## Phase 1: Foundation & Basic Infrastructure

### Slice 1: Database Schema & Backend Skeleton

**Goal:** Set up database schema and basic FastAPI structure so the app can start without errors

- [x] **Database: Create initial schema with Alembic migration**
  - [x] Create `apartments` table with all columns (id, address, city, rooms, sqm, status, etc.)
  - [x] Create `photos` table with FK to apartments
  - [x] Create `inventory_items` table with FK to apartments
  - [x] Create `listings` table with FK to apartments
  - [x] Create `conversations` table with FK to apartments
  - [x] Create `messages` table with FK to conversations
  - [x] Create `lease_periods` table with FK to apartments
  - [x] Add all indexes specified in technical spec
  - [x] Run migration: `alembic upgrade head`
  - [x] Verify tables created: `psql -c "\dt"` in Docker container

- [x] **Backend: Set up FastAPI app skeleton**
  - [x] Create `app/main.py` with FastAPI app, CORS middleware
  - [x] Create `app/database.py` with SQLAlchemy engine and session
  - [x] Create `app/core/config.py` with Pydantic settings from .env
  - [x] Create all SQLAlchemy models in `app/models/` matching schema
  - [x] Create basic router files in `app/api/` (empty endpoint placeholders)
  - [x] Start backend: `uvicorn app.main:app --reload`
  - [x] Verify backend runs: `curl http://localhost:8000/docs` shows Swagger UI

- [x] **Frontend: Set up Next.js app skeleton**
  - [x] Create `app/layout.tsx` with basic HTML structure
  - [x] Create `app/page.tsx` with "Welcome to RentOS" placeholder
  - [x] Install Tailwind CSS and configure `tailwind.config.ts`
  - [x] Create basic folder structure (`components/`, `lib/`, `types/`)
  - [x] Start frontend: `npm run dev`
  - [x] Verify frontend runs: Open `http://localhost:3000` in browser

**Verification:** All three services (DB, backend, frontend) start without errors. Frontend shows placeholder page. Swagger docs visible at `/docs`.

---

### Slice 2: Application Shell with Sidebar Navigation

**Goal:** Build the main layout with sidebar navigation and theme toggle (no data yet)

- [x] **Frontend: Create application shell components**
  - [x] Create `components/layout/Sidebar.tsx` with navigation items (Dashboard, Apartments, Conversations, Settings)
  - [x] Create `components/layout/ThemeToggle.tsx` with dark/light mode toggle button
  - [x] Create `lib/theme.ts` with React Context for theme management (localStorage persistence)
  - [x] Update `app/layout.tsx` to include Sidebar and ThemeToggle
  - [x] Create `app/apartments/page.tsx` with placeholder "Apartments" text
  - [x] Create `app/conversations/page.tsx` with placeholder "Conversations" text
  - [x] Style with Tailwind CSS (Linear/Notion aesthetic: clean, minimal, generous white space)
  - [x] Implement dark mode styles using Tailwind `dark:` variants

**Verification:** Navigate between pages via sidebar. Toggle dark/light mode and verify theme persists after page reload. All navigation links work.

---

## Phase 2: Apartments List & Basic CRUD

### Slice 3: Display Empty Apartments List

**Goal:** Show apartments list page with empty state and "+ Add Apartment" button

- [x] **Backend: Create apartments GET endpoint**
  - [x] Create Pydantic schema `schemas/apartment.py` with `ApartmentResponse`
  - [x] Implement `GET /api/apartments` endpoint in `api/apartments.py`
  - [x] Return empty list `[]` from database query
  - [x] Test endpoint: `curl http://localhost:8000/api/apartments`

- [x] **Frontend: Create apartments list page**
  - [x] Create `lib/api.ts` with Axios instance configured for `http://localhost:8000`
  - [x] Create `types/apartment.ts` with TypeScript types matching backend schemas
  - [x] Update `app/apartments/page.tsx` to fetch apartments from API
  - [x] Show empty state message: "No apartments yet. Add your first property to get started."
  - [x] Add "+ Add Apartment" button (non-functional, just styled)
  - [x] Style with Tailwind CSS grid layout

**Verification:** Open `/apartments` page. See empty state and styled "+ Add Apartment" button. Network tab shows successful API call returning `[]`.

---

### Slice 4: Add Apartment - Step 1 (Basic Details Form)

**Goal:** Create apartment wizard Step 1 - fill in basic details (no photo upload yet)

- [x] **Backend: Create apartment POST endpoint**
  - [x] Create Pydantic schema `ApartmentCreate` with required fields (address, city, rooms, sqm)
  - [x] Implement `POST /api/apartments` endpoint
  - [x] Save apartment to database, return created apartment
  - [x] Test with curl: `curl -X POST http://localhost:8000/api/apartments -H "Content-Type: application/json" -d '{"address":"Test St","city":"Warsaw","rooms":3,"sqm":65}'`

- [x] **Frontend: Create Add Apartment wizard (Step 1 only)**
  - [x] Create `app/apartments/new/page.tsx` with wizard layout
  - [x] Create `components/apartments/AddApartmentWizard/Step1Details.tsx`
  - [x] Implement form with react-hook-form + zod validation
  - [x] Add fields: address, city, rooms, sqm, floor (optional), specifications (checkboxes)
  - [x] Implement "Next" button that validates and stores form data in component state
  - [x] Show Step 2 placeholder: "Photo upload coming soon"
  - [x] Add "Save as Draft" button that calls `POST /api/apartments` and redirects to apartments list

**Verification:** Click "+ Add Apartment" button (wire it up to navigate to `/apartments/new`). Fill form with valid data. Click "Save as Draft". Verify apartment appears in database: `psql -c "SELECT * FROM apartments;"`. Redirect to apartments list.

---

### Slice 5: Display Apartment Cards on List Page

**Goal:** Show created apartments as cards in a grid layout

- [x] **Frontend: Create apartment card component**
  - [x] Create `components/apartments/ApartmentCard.tsx`
  - [x] Display thumbnail (placeholder image for now), address, status badge, rooms, sqm
  - [x] Implement status badge color coding (vacant=gray, listed=blue, rented=green, move-out=orange)
  - [x] Add hover effect (shadow elevation)
  - [x] Make card clickable (navigate to `/apartments/[id]` on click)
  - [x] Update `app/apartments/page.tsx` to render cards in responsive grid (3-4 per row)

- [x] **Backend: Update GET apartments to include all fields**
  - [x] Ensure `ApartmentResponse` includes status, thumbnail_url (nullable)

**Verification:** Create 2-3 apartments via wizard. See them displayed as cards on `/apartments` page. Hover over cards to see shadow effect. Click card (will show 404 for now, that's expected).

---

### Slice 6: Apartment Detail Page - Overview Tab (Basic Info, No Photos Yet)

**Goal:** View apartment details on a dedicated page with basic information

- [x] **Backend: Create GET apartment by ID endpoint**
  - [x] Implement `GET /api/apartments/{id}` endpoint
  - [x] Return apartment data or 404 if not found
  - [x] Test: `curl http://localhost:8000/api/apartments/{uuid}`

- [x] **Frontend: Create apartment detail page**
  - [x] Create `app/apartments/[id]/page.tsx` with tabbed layout structure
  - [x] Create tab navigation UI (Overview, Listings, Conversations, Inspection)
  - [x] Create `components/apartments/ApartmentDetail/OverviewTab.tsx`
  - [x] Display apartment specifications (address, rooms, sqm, floor, specifications)
  - [x] Show placeholder for photo gallery: "Photos will appear here after upload"
  - [x] Show placeholder for inventory: "Inventory will be generated after photo upload"
  - [x] Add "Edit Details" button (non-functional for now)

**Verification:** Click on an apartment card. See detail page with Overview tab showing correct data. Other tabs show placeholders. Can navigate back to list.

---

## Phase 3: Photo Upload & GCS Integration

### Slice 7: Photo Upload - Backend GCS Integration

**Goal:** Upload photos to Google Cloud Storage and save metadata to database

- [x] **Backend: Implement GCS photo upload service**
  - [x] Create `services/photo_service.py` with GCS upload function
  - [x] Configure GCS client with service account credentials from env
  - [x] Implement function to upload file to bucket path: `/apartments/{apartment_id}/move-in/{photo_id}.jpg`
  - [x] Generate signed URL (1-hour expiration)
  - [x] Return signed URL

- [x] **Backend: Create photo upload endpoint**
  - [x] Implement `POST /api/apartments/{id}/photos` endpoint (multipart/form-data)
  - [x] Accept multiple files, optional room_type tags
  - [x] Upload each file to GCS via photo_service
  - [x] Save photo metadata to `photos` table (apartment_id, storage_url, room_type, photo_type='move-in')
  - [x] Return list of photo IDs and signed URLs
  - [x] Test with curl multipart upload

**Verification:** Use curl to upload a test image. Verify photo appears in GCS bucket. Check `photos` table has new row. Signed URL is accessible in browser.

---

### Slice 8: Photo Upload - Frontend Drag-and-Drop UI

**Goal:** Add photo upload to apartment wizard Step 2

- [x] **Frontend: Create photo upload component**
  - [x] Create `components/common/PhotoUpload.tsx` using react-dropzone
  - [x] Implement drag-and-drop area with file picker fallback
  - [x] Show accepted formats hint (JPG, PNG)
  - [x] Display uploaded file thumbnails in grid with Remove button
  - [x] Show upload progress bar
  - [x] Implement room type tagging dropdown for each photo
  - [x] Validate file size (max 10MB), show error if exceeded

- [x] **Frontend: Integrate photo upload into wizard Step 2**
  - [x] Create `components/apartments/AddApartmentWizard/Step2Photos.tsx`
  - [x] Wire up "Next" button from Step 1 to navigate to Step 2
  - [x] On "Next" from Step 2, call `POST /api/apartments/{id}/photos` with files
  - [x] Show loading indicator during upload
  - [x] Store photo IDs in wizard state, proceed to Step 3

**Verification:** Complete Step 1, proceed to Step 2. Drag-and-drop 3-5 photos. Tag each by room type. Click "Next". See upload progress. Verify photos in GCS bucket and database.

---

## Phase 4: AI Inventory Generation

### Slice 9: AI Inventory Agent - LangChain + Gemini Vision

**Goal:** Generate apartment inventory from uploaded photos using AI

- [x] **Backend: Create LangChain inventory agent**
  - [x] Create `agents/inventory_agent.py` with LangChain + Gemini Vision
  - [x] Implement prompt: "Analyze apartment photos. List all furniture, appliances, amenities. For each: room type, item type, condition."
  - [x] Parse Gemini response into structured list of inventory items
  - [x] Test agent with sample photos, verify output structure

- [x] **Backend: Create inventory generation endpoint**
  - [x] Implement `POST /api/apartments/{id}/inventory/generate` endpoint
  - [x] Fetch all photos for apartment from database
  - [x] Call inventory_agent with photo URLs
  - [x] Save generated inventory items to `inventory_items` table
  - [x] Return inventory items as JSON
  - [x] Add async processing (run in background if >30s, for now synchronous is OK)

**Verification:** Upload photos for an apartment. Call `/api/apartments/{id}/inventory/generate` endpoint. Wait for response (10-30s). Verify `inventory_items` table populated. Check items make sense for uploaded photos.

---

### Slice 10: Inventory Review & Editing UI (Wizard Step 3)

**Goal:** Show AI-generated inventory for landlord review and editing

- [x] **Backend: Create inventory GET and PATCH endpoints**
  - [x] Implement `GET /api/apartments/{id}/inventory` - return all inventory items
  - [x] Implement `PATCH /api/apartments/{id}/inventory` - update/add/remove items
  - [x] Create Pydantic schemas for `InventoryItemUpdate`

- [x] **Frontend: Create inventory review component**
  - [x] Create `components/apartments/AddApartmentWizard/Step3Inventory.tsx`
  - [x] Fetch and display generated inventory grouped by room
  - [x] Show each item: type, room, condition, reference photo thumbnail
  - [x] Implement inline editing (click item to edit name/room/condition)
  - [x] Add "Remove Item" button for false positives
  - [x] Add "Add Item Manually" button with form
  - [x] Add "Re-generate Inventory" button (calls generate endpoint again)
  - [x] Add "Confirm and Save" button that finalizes wizard, navigates to apartment detail

**Verification:** Complete Step 1 and 2 with photos. See Step 3 with AI-generated inventory. Edit an item. Remove a false positive. Add manual item. Click "Confirm and Save". Apartment detail page shows inventory in Overview tab.

---

### Slice 11: Photo Gallery in Overview Tab

**Goal:** Display uploaded photos in apartment detail page

- [x] **Frontend: Create photo gallery component**
  - [x] Create `components/common/PhotoGallery.tsx` with thumbnail grid
  - [x] Use `yet-another-react-lightbox` for full-screen image viewer
  - [x] Implement room type filter tags (show all, living room, bedroom, etc.)
  - [x] Update `OverviewTab.tsx` to fetch photos via `GET /api/apartments/{id}/photos` (need to create this endpoint)

- [x] **Backend: Create photos GET endpoint**
  - [x] Implement `GET /api/apartments/{id}/photos` - return photos with signed URLs

**Verification:** Open apartment detail page. See photo gallery with thumbnails. Click thumbnail to open lightbox. Navigate through photos. Filter by room type.

---

## Phase 5: Listing Generation

### Slice 12: Listing Generation Agent - Platform-Specific Prompts

**Goal:** Generate listings for otodom, olx, Airbnb, Booking using AI

- [x] **Backend: Create LangChain listing agent**
  - [x] Create `agents/listing_agent.py` with Gemini Text API
  - [x] Implement platform-specific prompts (otodom, olx, Airbnb, Booking)
  - [x] Generate title + description for each platform
  - [x] Test with sample apartment data, verify outputs

- [x] **Backend: Create listing generation endpoint**
  - [x] Implement `POST /api/apartments/{id}/listings/generate`
  - [x] Accept platforms (array), rental_type, price in request body
  - [x] Fetch apartment details and inventory from database
  - [x] Call listing_agent for each selected platform (async/await all)
  - [x] Save generated listings to `listings` table
  - [x] Return all listings as JSON

**Verification:** Call endpoint with `{"platforms": ["otodom", "olx"], "rental_type": "monthly", "price": 3000}`. Verify 2 listings generated and saved. Check listing text quality.

---

### Slice 13: Listing Generation UI & Copy to Clipboard

**Goal:** UI to generate and copy listings for platforms

- [x] **Frontend: Create listing generator form**
  - [x] Create `components/listings/ListingGeneratorForm.tsx`
  - [x] Add platform checkboxes (otodom, olx, Airbnb, Booking)
  - [x] Add rental type radio buttons (monthly/daily)
  - [x] Add price input field (PLN)
  - [x] Add "Generate Listings" button
  - [x] Show loading indicator during generation (10-20s)

- [x] **Frontend: Create listing display component**
  - [x] Create `components/listings/ListingCard.tsx`
  - [x] Display platform name, title, description preview
  - [x] Add "Expand" button to show full listing
  - [x] Add "Copy to Clipboard" button (use navigator.clipboard API)
  - [x] Show success toast: "Listing copied! Paste into [Platform Name]"
  - [x] Add "Edit" button to open inline text editor

- [x] **Frontend: Integrate into Listings tab**
  - [x] Create `components/apartments/ApartmentDetail/ListingsTab.tsx`
  - [x] Fetch existing listings via `GET /api/apartments/{id}/listings`
  - [x] If no listings, show generator form
  - [x] If listings exist, show cards with copy buttons
  - [x] Add "Generate New Listings" button to re-open form

**Verification:** Navigate to Listings tab. Generate listings for 2 platforms. See cards with titles and descriptions. Click "Copy to Clipboard". Paste into text editor to verify correct text copied.

---

## Phase 6: Calendar View for Lease Periods

### Slice 14: Lease Periods CRUD Backend

**Goal:** API endpoints to manage lease periods for calendar

- [x] **Backend: Create lease periods endpoints**
  - [x] Implement `GET /api/apartments/{id}/lease-periods`
  - [x] Implement `POST /api/apartments/{id}/lease-periods` (create lease)
  - [x] Implement `PATCH /api/lease-periods/{id}` (update dates, tenant)
  - [x] Implement `DELETE /api/lease-periods/{id}`
  - [x] Create Pydantic schemas (`LeasePeriodCreate`, `LeasePeriodResponse`, etc.)
  - [x] Test CRUD operations with curl

**Verification:** Create, read, update, delete lease periods via API. Verify data in `lease_periods` table.

---

### Slice 15: Calendar View with React-Big-Calendar

**Goal:** Interactive calendar showing all apartments and occupancy periods

- [x] **Frontend: Create calendar component**
  - [x] Install `react-big-calendar` and `date-fns`
  - [x] Create `components/apartments/ApartmentCalendar.tsx`
  - [x] Configure resource view (apartments as rows, time as columns)
  - [x] Fetch all apartments and lease periods from API
  - [x] Render occupancy blocks color-coded by status (rented=green, vacant=gray gap)
  - [x] Implement tooltip on hover (tenant name, start/end dates, rental type)

- [x] **Frontend: Add calendar toggle to apartments page**
  - [x] Add view toggle button at top of `/apartments` page (Grid / Calendar)
  - [x] Store view preference in localStorage
  - [x] Show either card grid or calendar based on toggle

**Verification:** Navigate to apartments page. Toggle to calendar view. See apartments as rows with lease periods as colored blocks. Hover over block to see tooltip.

---

### Slice 16: Interactive Calendar - Drag to Create/Edit Leases

**Goal:** Drag-and-drop to create and edit lease periods

- [x] **Frontend: Implement calendar interactivity**
  - [x] Enable drag-and-drop in react-big-calendar config
  - [x] On click-and-drag on vacant period, open modal to create new lease
  - [x] Modal form: tenant name, start/end dates (pre-filled), rental type
  - [x] On submit, call `POST /api/apartments/{id}/lease-periods`
  - [x] Implement drag to resize (extend/shorten lease period edges)
  - [x] On resize, call `PATCH /api/lease-periods/{id}` with new dates
  - [x] Implement click on lease block to edit or delete
  - [x] Add date range selector to view different time periods (prev/next 3 months)

**Verification:** Drag on calendar to create lease. Fill form, save. See new block appear. Drag edge to resize. Click block to edit tenant name. Delete a lease. All changes persist after page reload.

---

## Phase 7: Conversations & Chat Interface

### Slice 17: Conversations CRUD Backend

**Goal:** API endpoints for tenant conversations and messages

- [x] **Backend: Create conversations endpoints**
  - [x] Implement `GET /api/conversations` (query param: `?status=escalated`)
  - [x] Implement `GET /api/apartments/{id}/conversations`
  - [x] Implement `POST /api/conversations` (create new conversation)
  - [x] Implement `POST /api/conversations/{id}/messages` (send message)
  - [x] Implement `PATCH /api/conversations/{id}/status` (update escalation status)
  - [x] Create Pydantic schemas

**Verification:** Create conversation with messages via API. Query conversations by status. Update status. Verify in database.

---

### Slice 18: AI Chatbot Agent with Escalation Logic

**Goal:** AI agent answers tenant questions, escalates if uncertain

- [x] **Backend: Create LangChain chatbot agent**
  - [x] Create `agents/chatbot_agent.py` with Gemini Text API
  - [x] Implement prompt with apartment inventory as context
  - [x] Add confidence threshold logic: if uncertain, return escalation flag
  - [x] Test agent with sample questions ("Does it have parking?" "Can I bring my dog?")

- [x] **Backend: Integrate chatbot into message endpoint**
  - [x] In `POST /api/conversations/{id}/messages`, detect if sender is 'tenant'
  - [x] If tenant message, fetch apartment inventory, call chatbot_agent
  - [x] If AI confident, save AI response as new message (sender='ai'), update status to 'ai_handled'
  - [x] If AI uncertain, update conversation status to 'escalated', do NOT auto-respond
  - [x] Return conversation with new messages

**Verification:** Send tenant message via API. If question is simple ("Does it have a dishwasher?"), AI responds. If complex ("Can I paint the walls?"), conversation status becomes 'escalated'.

---

### Slice 19: Chat Interface - Split View UI

**Goal:** Landlord can view and respond to tenant conversations

- [x] **Frontend: Create conversation list component**
  - [x] Create `components/chat/ConversationList.tsx`
  - [x] Fetch conversations via `GET /api/conversations`
  - [x] Display tenant name, platform icon, last message preview, timestamp
  - [x] Show urgency indicator (red dot for escalated, green checkmark for ai_handled)
  - [x] Implement filter tabs (All, Needs Attention, AI Handled)
  - [x] Make conversation clickable to load chat thread

- [x] **Frontend: Create chat thread component**
  - [x] Create `components/chat/ChatThread.tsx`
  - [x] Fetch messages for selected conversation
  - [x] Display messages in chronological order
  - [x] Visually distinguish AI (bot badge, light blue bg), landlord (right-aligned), tenant (left-aligned) messages
  - [x] Highlight escalated messages with yellow/orange background and label

- [x] **Frontend: Create chat interface page**
  - [x] Create `app/conversations/page.tsx` with split-view layout
  - [x] Left panel: ConversationList
  - [x] Right panel: ChatThread (or "Select a conversation" placeholder)
  - [x] Wire up conversation selection to load chat thread

**Verification:** Navigate to `/conversations`. See list of conversations with status indicators. Click conversation to load chat thread. See messages with correct styling (AI, landlord, tenant differentiated). Escalated message is highlighted.

---

### Slice 20: Send Landlord Response & Resolve Escalation

**Goal:** Landlord can respond to escalated conversations

- [x] **Frontend: Add message input to chat thread**
  - [x] Add text input box at bottom of ChatThread component
  - [x] Add "Send" button (or Enter key handler)
  - [x] On send, call `POST /api/conversations/{id}/messages` with sender='landlord' and message text
  - [x] After send, update conversation status to 'resolved' via `PATCH /api/conversations/{id}/status`
  - [x] Clear escalation indicator (remove red dot from conversation list)
  - [x] Display new landlord message in chat thread

**Verification:** Open escalated conversation. Type landlord response. Click Send. See message appear in thread. Red dot removed from conversation list. Conversation status updated to 'resolved' in database.

---

## Phase 8: Move-Out Inspection & Damage Detection

### Slice 21: Move-Out Photo Upload

**Goal:** Upload move-out photos to GCS

- [x] **Backend: Create move-out photo upload endpoint**
  - [x] Implement `POST /api/apartments/{id}/move-out-photos` (multipart/form-data)
  - [x] Upload photos to GCS path: `/apartments/{apartment_id}/move-out/{photo_id}.jpg`
  - [x] Save photo metadata with `photo_type='move-out'`
  - [x] Return photo IDs and signed URLs

- [x] **Frontend: Add move-out photo upload to Inspection tab**
  - [x] Create `components/apartments/ApartmentDetail/InspectionTab.tsx`
  - [x] Show "No move-out inspection yet" message with "Upload Move-Out Photos" button
  - [x] Reuse PhotoUpload component for drag-and-drop
  - [x] On upload, call move-out photos endpoint
  - [x] Show loading indicator

**Verification:** Navigate to Inspection tab. Upload 3-5 move-out photos. Verify photos in GCS bucket with `move-out/` path. Check database has photos with `photo_type='move-out'`.

---

### Slice 22: AI Damage Detection Agent

**Goal:** Compare move-in and move-out photos to detect damage

- [x] **Backend: Create LangChain damage detection agent**
  - [x] Create `agents/damage_detection_agent.py` with Gemini Vision API
  - [x] Implement prompt: "Compare move-in and move-out photos. Identify missing items and visible damage."
  - [x] Parse response into structured list of issues (description, confidence, photo references)
  - [x] Test with sample photo pairs

- [x] **Backend: Create damage report generation endpoint**
  - [x] Implement `POST /api/apartments/{id}/damage-report/generate`
  - [x] Fetch move-in and move-out photos from database
  - [x] Call damage_detection_agent with photo pairs
  - [x] Save damage report to database (new table or JSONB in apartments)
  - [x] Return damage report as JSON

**Verification:** Upload move-out photos. Call damage report endpoint. Verify AI detects missing items or damage (test with intentionally different photos). Check report structure.

---

### Slice 23: Damage Report Review UI

**Goal:** Landlord can review, confirm, or dismiss AI-detected issues

- [x] **Frontend: Create damage report component**
  - [x] Update InspectionTab to show side-by-side photo comparison (move-in left, move-out right)
  - [x] Pair photos by room type
  - [x] Display AI-generated damage report below photos
  - [x] For each issue: description, confidence score, reference photo thumbnails
  - [x] Add "Confirm" (checkmark) and "Dismiss" (X) buttons for each issue
  - [x] Add text area for landlord to add manual notes
  - [x] Add "Download Report" button (generate PDF - use jsPDF or similar)

- [x] **Backend: Create damage report update endpoint**
  - [x] Implement `PATCH /api/apartments/{id}/damage-report`
  - [x] Accept confirmed/dismissed issue IDs and manual notes
  - [x] Update damage report in database

**Verification:** Generate damage report. See side-by-side photos. Review flagged issues. Confirm 2 issues, dismiss 1 false positive. Add manual note. Save changes. Download PDF report (contains photos and confirmed issues).

---

## Phase 9: Polish & Finishing Touches

### Slice 24: Apartment Editing & Deletion

**Goal:** Edit apartment details and delete apartments

- [x] **Backend: Implement apartment update and delete**
  - [x] `PATCH /api/apartments/{id}` - update apartment fields
  - [x] `DELETE /api/apartments/{id}` - soft delete or hard delete (cascade photos, inventory, listings)

- [x] **Frontend: Add edit and delete functionality**
  - [x] Add "Edit Details" button in apartment detail Overview tab
  - [x] Show inline form or modal to edit address, rooms, sqm, etc.
  - [x] Save changes via PATCH endpoint
  - [x] Add "Delete Apartment" button with confirmation modal
  - [x] On delete, call DELETE endpoint, redirect to apartments list

**Verification:** Edit apartment details. Save. Verify changes persist. Delete apartment. Verify removed from list and database (or soft-deleted).

---

### Slice 25: Status Badge Updates & Manual Status Changes

**Goal:** Allow landlord to manually update apartment status

- [x] **Frontend: Add status change dropdown**
  - [x] In apartment detail header, add status badge with dropdown menu
  - [x] Options: Vacant, Listed, Rented, Move-out Pending
  - [x] On change, call `PATCH /api/apartments/{id}` with new status
  - [x] Update badge color immediately

**Verification:** Change apartment status from Vacant to Listed. Badge color changes. Refresh page, status persists. Check apartments list shows updated status.

---

### Slice 26: Responsive Design & Dark Mode Refinement

**Goal:** Ensure app works well on tablet and polish dark mode

- [x] **Frontend: Responsive design pass**
  - [x] Test on tablet (1024x768) - sidebar should work, grid should adjust to 2 columns
  - [x] Test apartment detail tabs on smaller screens
  - [x] Test calendar view responsiveness (may need to collapse or scroll horizontally)
  - [x] Add mobile breakpoint handling (hide sidebar, add hamburger menu on <768px)

- [x] **Frontend: Dark mode polish**
  - [x] Review all components for proper dark: variants
  - [x] Ensure form inputs, buttons, cards look good in both modes
  - [x] Fix any contrast/readability issues
  - [x] Test theme toggle across all pages

**Verification:** Test app on tablet screen size. All layouts work without breaking. Switch to dark mode. Navigate through all pages. Everything is readable and visually consistent.

---

### Slice 27: Error Handling & Loading States

**Goal:** Add error boundaries and loading indicators throughout app

- [x] **Frontend: Global error handling**
  - [x] Add Next.js error boundary (`app/error.tsx`)
  - [x] Add 404 page (`app/not-found.tsx`)
  - [x] Add loading component (`app/loading.tsx`)

- [x] **Frontend: Component-level loading states**
  - [x] Add skeletons for apartment cards while loading
  - [x] Add spinners for API calls (inventory generation, listing generation, chat messages)
  - [x] Add error messages for failed API calls (toast notifications or inline errors)

- [x] **Backend: Proper error responses**
  - [x] Return 400 for validation errors with clear messages
  - [x] Return 404 for not found resources
  - [x] Return 500 for server errors (log details, return generic message to client)

**Verification:** Simulate network errors (disconnect internet). See appropriate error messages. Simulate slow API (add delay in backend). See loading indicators. Fix errors and verify app recovers gracefully.

---

### Slice 28: Seed Data & Demo Mode

**Goal:** Create seed data for demo purposes

- [x] **Backend: Create seed data script**
  - [x] Create `scripts/seed_database.py`
  - [x] Insert 5-10 sample apartments with varied data
  - [x] Insert sample photos (use placeholder images)
  - [x] Insert sample inventory items
  - [x] Insert sample listings
  - [x] Insert sample conversations with messages (AI and landlord responses)
  - [x] Insert sample lease periods for calendar view
  - [x] Run script: `python scripts/seed_database.py`

**Verification:** Run seed script. Open app. See populated apartments list, calendar view with lease periods, conversations with chat history. All features have demo data.

---

## Recommendations & Notes

### Subagent Assignment Notes

Since the custom agents in `.claude/agents/*.md` are not currently available as `subagent_type` values, all tasks above should be executed using the **general-purpose** agent or by directly reading the agent context files.

**Alternative Approach:**
For implementation, you can:
1. Read the relevant agent file (e.g., `.claude/agents/nextjs-frontend.md`) to understand the specialist guidance
2. Apply that expertise when implementing the task
3. Use general-purpose agent for execution

### Testing Strategy

- **Manual Testing:** For MVP, manual testing in browser is acceptable for each slice
- **Automated Testing (Future):** Add unit tests (Jest for frontend, pytest for backend) after MVP is working

### Missing Tools for Verification

Some verification steps assume tools that may or may not be available:
- Browser access for visual verification (can use manual testing)
- Database query tools (use Docker exec into PostgreSQL container)
- API testing (use curl or Postman)

---

**Next Steps:** Review this task list. Once approved, begin implementation with `/awos:implement` - start with Slice 1 and work through incrementally!
