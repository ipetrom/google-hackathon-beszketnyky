# Functional Specification: Creative Apartment Dashboard

- **Roadmap Item:** Landlord Dashboard — Dual View (Phase 1, Core)
- **Status:** Approved
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

Polish landlords managing 3–8+ properties need to instantly understand the state of their entire portfolio without hunting through multiple screens. Today, they have no single place to see which apartments are vacant, what's expiring soon, or how healthy their portfolio is — forcing them to keep mental maps or separate spreadsheets.

The Creative Apartment Dashboard solves this by giving landlords a **warm, visually rich command center**: a hero stats bar for instant portfolio health, a grid of property cards for at-a-glance status on each apartment, and a monthly calendar view for tracking occupancy events over time.

**Success looks like:** A landlord opens the dashboard and within 5 seconds knows their occupancy rate, which apartments need attention, and what's happening this month — with one click to act on any property.

---

## 2. Functional Requirements (The "What")

### 2.1 Hero Stats Bar

- **As a** landlord, **I want to** see my portfolio's key metrics at the top of the dashboard, **so that** I have an instant health check every time I log in.
  - **Acceptance Criteria:**
    - [ ] The stats bar displays 4 metric tiles: **Total Apartments**, **Occupancy Rate (%)**, **Vacant Count**, and **Active Listings Count**.
    - [ ] Each tile shows the metric name, current value, and a visual indicator (e.g., a small icon or color-coded status).
    - [ ] Values update in real time to reflect the current state of the portfolio (no manual refresh required).
    - [ ] The occupancy rate is calculated as: `(rented apartments ÷ total apartments) × 100`, rounded to the nearest whole number.

---

### 2.2 Property Cards Grid

- **As a** landlord, **I want to** see all my apartments as visual cards, **so that** I can quickly scan the status and key details of every property.
  - **Acceptance Criteria:**
    - [ ] Each apartment is displayed as a card in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).
    - [ ] Each card displays: apartment **thumbnail photo** (or a placeholder illustration if no photo exists), **address**, **status badge** (Vacant / Listed / Rented / Move-Out Pending), **number of rooms**, and **floor area (m²)**.
    - [ ] Status badges use distinct warm colors: Vacant = sand/yellow, Listed = teal/green, Rented = terracotta/amber, Move-Out Pending = muted red.
    - [ ] Each card has an **Actions menu** (dropdown or icon row) exposing 4 shortcuts: **View Inventory**, **Generate / View Listing**, **Edit Apartment**, **Open AI Chatbot**.
    - [ ] If no thumbnail photo exists for an apartment, a warm illustrated placeholder (e.g., building silhouette) is shown — not a broken image icon.
    - [ ] The grid can be **filtered** by status (All / Vacant / Listed / Rented / Move-Out Pending).
    - [ ] The grid can be **sorted** by: Address (A–Z), Status, Rooms (ascending/descending), or Last Updated.

---

### 2.3 Property Detail Drawer

- **As a** landlord, **I want to** click on a property card and see full details without leaving the dashboard, **so that** I can get more information quickly without losing my place.
  - **Acceptance Criteria:**
    - [ ] Clicking anywhere on a property card (outside the action buttons) opens a **slide-in drawer panel** from the right side of the screen.
    - [ ] The drawer displays: full address, city, status, number of rooms, floor area (m²), floor number, building, apartment number, all uploaded photo thumbnails (scrollable), specifications (e.g., parking, balcony), and the current lease period (if rented: tenant name, start date, end date).
    - [ ] The drawer includes the same 4 action buttons as the card (View Inventory, Generate / View Listing, Edit Apartment, Open AI Chatbot).
    - [ ] Clicking outside the drawer or pressing Escape closes it.
    - [ ] Only one drawer can be open at a time; opening a second card closes the first.

---

### 2.4 Monthly Calendar View

- **As a** landlord, **I want to** switch to a monthly calendar view, **so that** I can see upcoming move-ins, move-outs, and lease expirations for all apartments at a glance.
  - **Acceptance Criteria:**
    - [ ] A toggle control at the top of the dashboard switches between **Cards View** and **Calendar View**. The last selected view is remembered for the session.
    - [ ] The calendar displays a standard monthly grid (Monday–Sunday columns).
    - [ ] Move-in events are shown as a **▲ icon + apartment short name** on the relevant date cell.
    - [ ] Move-out events are shown as a **▼ icon + apartment short name** on the relevant date cell.
    - [ ] Lease expiration dates are shown with a **⚑ icon** on the relevant date cell.
    - [ ] Each event on the calendar is clickable and opens the Property Detail Drawer for that apartment.
    - [ ] The calendar shows the current month by default, with **← Prev** / **Next →** navigation buttons to move between months.
    - [ ] Days with no events are visually quiet (no icons). Today's date is highlighted with a warm accent circle.

---

### 2.5 Visual Theme

- The dashboard uses a **warm & property-inspired** design language:
  - **Acceptance Criteria:**
    - [ ] Background and card surfaces use warm neutral tones (sand, off-white, warm grey).
    - [ ] Accent colors use terracotta and amber for primary actions and active states.
    - [ ] Typography is bold and legible; property names/addresses are the most prominent text on each card.
    - [ ] Cards have a subtle drop shadow and rounded corners that give a tactile, modern feel.

---

## 3. Scope and Boundaries

### In-Scope

- KPI hero stats bar (4 metrics)
- Property cards grid with photo thumbnail, status badge, key stats, and action menu
- Filter and sort controls for the cards grid
- Slide-in property detail drawer
- Monthly calendar view with move-in/move-out/lease expiration events
- View toggle (Cards ↔ Calendar) with session memory
- Warm, property-inspired visual theme

### Out-of-Scope

The following are separate roadmap items and are **not** part of this specification:

- **Photo Upload & Management** — uploading and organizing apartment photos (Phase 1, separate item)
- **AI-Powered Inventory Generation** — computer vision object detection and inventory editing (Phase 1, separate item)
- **Platform-Specific Listing Generator** — generating listing content for otodom.pl, OLX, Airbnb, Booking.com (Phase 2)
- **Copy-to-Clipboard Publishing** — one-click copy and preview of listings (Phase 2)
- **AI Tenant Inquiry Chatbot** — the chatbot interface itself (Phase 3)
- **Human-in-the-Loop Escalation** — flagging and landlord override (Phase 3)
- **Move-Out Damage Detection** — photo comparison and damage reports (Phase 4)
- **Conversation & Action Management** — conversation history, action items feed (Phase 5)
- **Direct platform API integrations**, **payment processing**, **legal documents** (Future Scope)
