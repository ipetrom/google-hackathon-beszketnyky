# Product Roadmap: RentOS

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

---

### Phase 1: Core — Apartment Onboarding, Inventory & Dashboard

_Foundation: The ability to digitize an apartment, generate inventory through AI-powered photo analysis, and visualize all properties in a centralized dashboard._

- [ ] **Photo Upload & Management**
  - [ ] **Multi-Photo Upload Interface:** Allow landlords to upload 10-15 photos of an apartment (furnished or empty) via web interface or mobile browser.
  - [ ] **Photo Organization by Room:** Enable landlords to tag or organize uploaded photos by room type (living room, bedroom, kitchen, bathroom) for better inventory structure.

- [ ] **AI-Powered Inventory Generation**
  - [ ] **Computer Vision Object Detection:** AI automatically identifies furniture, appliances, and amenities visible in uploaded photos (e.g., sofa, coffee table, washing machine, TV, dishwasher).
  - [ ] **Structured Inventory Report:** Generate a detailed, editable inventory list organized by room, including item type, condition notes, and photo references.
  - [ ] **Manual Inventory Editing:** Allow landlords to review and correct AI-generated inventory (add missing items, remove false positives, edit descriptions).

- [ ] **Landlord Dashboard — Dual View**
  - [ ] **Data Frame View (Table):** Display all apartments in a sortable, filterable table showing key information: address, status (vacant, listed, rented, move-out pending), number of rooms, rent price, and last updated date.
  - [ ] **Calendar View:** Visualize all properties on a timeline/calendar showing occupancy periods, move-in dates, move-out dates, and vacant periods to help landlords plan and track lease cycles.
  - [ ] **Quick Actions from Dashboard:** Allow landlords to click any property to view its inventory, edit details, or navigate to listing generation.

---

### Phase 2: Listings — Multi-Platform Content Generation

_Once the apartment inventory is complete, enable landlords to generate optimized listings for all major rental platforms._

- [ ] **Platform-Specific Listing Generator**
  - [ ] **Otodom.pl Listing:** Generate listing title, description, and amenity checklist optimized for otodom.pl's format and monthly rental audience.
  - [ ] **OLX.pl Listing:** Generate listing content tailored to OLX.pl's casual, classified-ad style for monthly rentals.
  - [ ] **Airbnb Listing:** Create listing description, house rules, and amenities list formatted for Airbnb's short-term rental audience.
  - [ ] **Booking.com Listing:** Generate property description and facility list following Booking.com's structured format.

- [ ] **Copy-to-Clipboard Publishing**
  - [ ] **One-Click Copy for Each Platform:** Provide easy copy buttons for each platform's listing text so landlords can paste directly into the platform's listing form.
  - [ ] **Listing Preview & Editing:** Allow landlords to preview and manually edit generated listings before copying.

---

### Phase 3: Communication — AI Tenant Inquiry Agent

_Enable landlords to automate responses to prospective tenant questions while maintaining quality and control._

- [ ] **AI Chatbot with Apartment Knowledge**
  - [ ] **Knowledge Base from Inventory:** AI agent answers tenant questions (e.g., "Does it have parking?" "Is there a washing machine?") by referencing the apartment's inventory and listing details.
  - [ ] **Conversational Q&A Interface:** Provide a chat interface where prospective tenants can ask questions and receive instant AI-generated responses.

- [ ] **Human-in-the-Loop Escalation**
  - [ ] **Uncertainty Detection & Flagging:** When AI is unsure about an answer or question requires landlord judgment (e.g., "Can I bring my dog?"), flag the question for manual response.
  - [ ] **Landlord Notification System:** Notify landlord via email or dashboard when a tenant inquiry requires their attention.
  - [ ] **Landlord Override & Response:** Allow landlords to review AI responses, edit them before sending, or manually respond to flagged inquiries.

---

### Phase 4: Inspection — Move-Out Damage Detection

_Automate the tedious process of comparing apartment condition before and after tenancy._

- [ ] **Move-Out Photo Upload**
  - [ ] **Post-Tenancy Photo Collection:** Allow landlords to upload new photos of the apartment after tenant moves out.
  - [ ] **Side-by-Side Photo Comparison View:** Display original (move-in) and new (move-out) photos side-by-side for visual comparison.

- [ ] **AI Damage & Missing Item Detection**
  - [ ] **Visual Comparison Against Original Inventory:** AI compares move-out photos to original inventory photos to detect missing items or visible damage.
  - [ ] **Damage Report Generation:** Generate a report listing flagged issues (e.g., "Coffee table missing," "Stain detected on sofa") with photo evidence.
  - [ ] **Landlord Review & Approval:** Allow landlords to review AI-detected issues, confirm or dismiss flags, and add manual notes before finalizing the damage report.

---

### Phase 5: Enhanced Dashboard — Conversations & Action Management

_Extend the dashboard with communication tracking and task management capabilities._

- [ ] **Conversation & Action Management**
  - [ ] **Active Tenant Conversations:** Show all ongoing AI chatbot conversations with prospective tenants, organized by property in the dashboard.
  - [ ] **Action Items & Notifications:** Display pending tasks (e.g., "3 tenant inquiries need your response," "Review damage report for Apt 2B") with priority indicators.
  - [ ] **Conversation History:** Allow landlords to view full chat transcripts for each property and search past tenant interactions.

---

### Future Scope (Post-Hackathon / Not in MVP)

_Features that would enhance RentOS but are intentionally out of scope for the initial version._

- [ ] **Platform API Integrations:** Direct publishing to otodom.pl, olx.pl, Airbnb, and Booking.com via their APIs (no manual copy/paste).
- [ ] **Meeting Scheduling:** Integrated calendar for landlords to schedule property viewings with prospective tenants.
- [ ] **Contract Lifecycle Management:** Generate, sign, and manage lease agreements and legal documents within the platform.
- [ ] **Tenant Self-Service Portal:** Dedicated mobile app or portal for tenants to pay rent, submit maintenance requests, and communicate with landlords.
- [ ] **Multi-Language Support:** Support for languages beyond Polish (English, Ukrainian, etc.) for international landlords and tenants.
- [ ] **Payment Processing:** Rent collection, security deposit management, and financial transaction handling.
