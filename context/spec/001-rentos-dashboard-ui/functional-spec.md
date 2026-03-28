# Functional Specification: RentOS Dashboard & Complete UI

- **Roadmap Item:** Phase 1 - Landlord Dashboard (Dual View) + Full Application UI/UX
- **Status:** Draft
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

### Context

Polish landlords managing multiple rental properties face severe time constraints when managing their portfolio. They need a centralized, intuitive interface to view all properties at a glance, quickly onboard new apartments with AI assistance, generate listings, monitor tenant communications, and conduct move-out inspections. The current manual workflow—scattered across spreadsheets, photo folders, and messaging apps—creates cognitive overload and slows down operations.

### Problem Statement

Landlords waste valuable time switching between tools and manual processes:
- No unified view of all properties and their current status
- Cumbersome apartment onboarding requires manual photo organization and inventory documentation
- Listing creation is repetitive and time-consuming across multiple platforms
- Tenant inquiries arrive via different channels with no centralized tracking
- Move-out inspections require tedious manual photo comparison

### Desired Outcome

Provide landlords with a **modern, clean, minimal dashboard** (Linear/Notion aesthetic) that serves as their single source of truth for all property management activities. The UI should support both dark and light modes, feature sidebar navigation, and enable landlords to:
- Visualize all apartments in both table (data frame) and interactive calendar views
- Onboard new apartments through a guided wizard with AI-powered inventory generation
- Generate platform-specific listings with preview and editing capabilities
- Monitor and manage tenant conversations with AI assistance and human-in-the-loop escalation
- Conduct side-by-side move-out inspections comparing original vs. current state

### Success Metrics

- **Time to onboard apartment:** From apartment details entry to confirmed inventory in under 2 minutes
- **Dashboard clarity:** Landlords can identify which properties need attention within 5 seconds of loading the app
- **Listing generation speed:** Generate listings for all 4 platforms in under 30 seconds
- **Conversation management efficiency:** Landlords can triage 10+ tenant conversations in under 1 minute
- **User satisfaction:** 90%+ of landlords rate the UI as "clean," "intuitive," and "easy to navigate"

---

## 2. Functional Requirements (The "What")

### 2.1 Application Shell & Navigation

**As a** landlord, **I want** a modern, consistent application shell with sidebar navigation, **so that** I can easily navigate between different sections of RentOS and access any feature quickly.

**Acceptance Criteria:**

- [ ] The application uses a sidebar navigation layout with the following sections:
  - Dashboard (home icon)
  - Apartments (building icon)
  - Conversations (chat icon)
  - Settings (gear icon, future use)
- [ ] The sidebar shows the currently active section with visual highlighting (e.g., background color, icon color change)
- [ ] The application supports both **dark mode** and **light mode** with a toggle button in the sidebar or header
- [ ] The user's theme preference (dark/light) is persisted across sessions (localStorage or user preference in database)
- [ ] The visual design follows a clean, minimal aesthetic inspired by Linear or Notion:
  - Generous white space (or dark background in dark mode)
  - Sans-serif modern typography (e.g., Inter, System UI)
  - Subtle shadows and borders
  - Consistent color palette (primary accent color, neutral grays, status colors for vacant/listed/rented/move-out)
- [ ] The layout is responsive and works on desktop (1920x1080), laptop (1440x900), and tablet (iPad landscape) screen sizes

---

### 2.2 Apartments List View (Dashboard)

**As a** landlord, **I want** to see all my apartments in a card grid layout with key information and status indicators, **so that** I can quickly assess my portfolio and identify which properties need attention.

**Acceptance Criteria:**

- [ ] The default view is a **card grid** displaying all apartments
- [ ] Each apartment card shows:
  - Thumbnail image (first photo uploaded, or placeholder if no photos)
  - Full address (street, building number, apartment number, city)
  - Status badge with color coding:
    - **Vacant** (gray badge)
    - **Listed** (blue badge)
    - **Rented** (green badge)
    - **Move-out pending** (orange/yellow badge)
  - Room count (e.g., "3 rooms")
  - Square meters (e.g., "65 sqm")
- [ ] Cards are laid out in a responsive grid (3-4 cards per row on desktop, 2 on tablet, 1 on mobile)
- [ ] Hovering over a card shows a subtle elevation effect (shadow increase)
- [ ] Clicking on a card navigates to the **Apartment Detail Page**
- [ ] A prominent **"+ Add Apartment"** button is visible at the top-right of the view
- [ ] Clicking the "+ Add Apartment" button starts the **Add Apartment Flow** (wizard)

---

### 2.3 Apartments Calendar View

**As a** landlord, **I want** to visualize all my apartments on a timeline/calendar showing occupancy periods, **so that** I can plan lease cycles, identify vacant periods, and optimize property utilization.

**Acceptance Criteria:**

- [ ] A **view toggle** (icon or tab) at the top of the Apartments page allows switching between "Card Grid" and "Calendar" views
- [ ] The calendar view displays apartments as rows on the Y-axis and time (months) on the X-axis
- [ ] Each apartment row shows:
  - Apartment name/address (left column, fixed)
  - Occupancy blocks displayed as horizontal bars on the timeline
- [ ] Occupancy blocks are color-coded by status:
  - **Rented** periods: green bar
  - **Vacant** periods: gray gap (no bar)
  - **Move-out pending**: orange bar at the end of a lease
- [ ] Hovering over an occupancy block shows a tooltip with:
  - Tenant name (if available)
  - Lease start date
  - Lease end date
  - Rental type (monthly/daily)
- [ ] Landlords can **click and drag** on the calendar to create a new lease period for a vacant apartment
- [ ] When creating a new lease period, a modal/form appears to capture:
  - Tenant name
  - Start date
  - End date
  - Rental type (monthly/daily)
  - Status (defaults to "Rented")
- [ ] Landlords can **drag the edges** of an occupancy block to extend or shorten lease periods
- [ ] Landlords can **click on an occupancy block** to edit its details or delete it
- [ ] The calendar displays at least 6 months forward and 3 months backward by default
- [ ] A date range selector or navigation buttons allow viewing different time periods

---

### 2.4 Apartment Detail Page (Tabbed View)

**As a** landlord, **I want** to see comprehensive information about a single apartment organized in tabs, **so that** I can quickly access inventory, listings, conversations, and inspection reports for that property.

**Acceptance Criteria:**

- [ ] The apartment detail page has a header showing:
  - Apartment address
  - Status badge (vacant/listed/rented/move-out)
  - Quick action buttons (e.g., "Edit Details," "Generate Listings," "View Conversations")
- [ ] The page content is organized into **4 tabs**:
  - **Overview**
  - **Listings**
  - **Conversations**
  - **Inspection**
- [ ] Only one tab is active at a time; clicking a tab switches the content view
- [ ] The active tab is visually highlighted (underline, color change, or bold text)

---

#### 2.4.1 Overview Tab

**As a** landlord, **I want** to view photos, inventory, and specifications for an apartment, **so that** I can review all property details in one place.

**Acceptance Criteria:**

- [ ] The Overview tab displays three sections:

  **1. Photo Gallery**
  - [ ] All uploaded photos are displayed as thumbnails in a grid
  - [ ] Clicking a thumbnail opens a full-screen lightbox/modal to view the image at full size
  - [ ] Navigation arrows in the lightbox allow browsing through all photos
  - [ ] Photos can be organized by room type (living room, bedroom, kitchen, bathroom) with filter tags

  **2. Inventory Report**
  - [ ] The AI-generated inventory is displayed as a structured list organized by room
  - [ ] Each inventory item shows:
    - Item type (e.g., "Sofa")
    - Condition notes (e.g., "Good condition, beige fabric")
    - Reference to the photo where it was detected (thumbnail or link)
  - [ ] An "Edit Inventory" button allows the landlord to add, remove, or modify inventory items
  - [ ] Changes to inventory are saved immediately (auto-save or "Save" button)

  **3. Apartment Specifications**
  - [ ] Apartment details are displayed in a clean, labeled format:
    - Address (street, building, apartment number, city)
    - Number of rooms
    - Square meters (sqm)
    - Floor number
    - Additional specifications (e.g., parking, balcony, elevator)
  - [ ] An "Edit Specifications" button allows the landlord to update these details

---

#### 2.4.2 Listings Tab

**As a** landlord, **I want** to view, preview, and edit AI-generated listings for each platform, **so that** I can copy optimized listings to otodom.pl, olx.pl, Airbnb, and Booking.com.

**Acceptance Criteria:**

- [ ] If no listings have been generated yet, the Listings tab shows a message: "No listings generated yet" and a button labeled "Generate Listings"
- [ ] Clicking "Generate Listings" opens the **Listing Generation View** (see section 2.6)
- [ ] If listings exist, the Listings tab displays all generated listings as **cards or tabs**, one per platform:
  - **Otodom.pl**
  - **OLX.pl**
  - **Airbnb**
  - **Booking.com**
- [ ] Each listing card shows:
  - Platform name and logo
  - Listing title (as generated by AI)
  - Preview of the first 100-150 characters of the description
  - Status indicator (e.g., "Draft," "Copied," "Published" - for future use)
- [ ] Clicking a listing card expands it to show:
  - Full listing title
  - Full description
  - Amenities/features list
  - "Copy to Clipboard" button for the full listing text
  - "Edit" button to modify the listing text
- [ ] When the landlord clicks "Copy to Clipboard," a success message appears: "Listing copied! Paste it into [Platform Name]"
- [ ] The "Edit" button opens an editable text area where the landlord can modify the listing
- [ ] An "AI Re-generate" button allows the landlord to regenerate the listing with AI if they are not satisfied
- [ ] Changes to listings are saved automatically or via a "Save Changes" button

---

#### 2.4.3 Conversations Tab

**As a** landlord, **I want** to see all tenant conversations related to this apartment, **so that** I can monitor AI-handled chats and respond to inquiries that need my attention.

**Acceptance Criteria:**

- [ ] The Conversations tab shows a list of all tenant conversations associated with the apartment
- [ ] Each conversation in the list displays:
  - Tenant name (or "Anonymous Inquiry" if no name provided)
  - Platform source (icon or label: otodom, olx, Airbnb, Booking, or "Direct")
  - Last message preview (first 50 characters)
  - Timestamp of last message
  - **Status indicator**:
    - **Green checkmark icon**: AI handled successfully
    - **Red dot or exclamation mark**: Needs human attention (escalated)
- [ ] Clicking on a conversation entry navigates to the **Chat Interface** (see section 2.7) for that conversation
- [ ] Conversations are sorted by most recent activity at the top
- [ ] A filter/tab allows the landlord to view:
  - "All Conversations"
  - "Needs Attention" (only escalated conversations)
  - "AI Handled" (only successfully auto-responded conversations)

---

#### 2.4.4 Inspection Tab

**As a** landlord, **I want** to compare original (move-in) photos with move-out photos side by side, **so that** I can identify damage or missing items for security deposit discussions.

**Acceptance Criteria:**

- [ ] If no move-out photos have been uploaded, the Inspection tab shows a message: "No move-out inspection yet" and a button labeled "Upload Move-Out Photos"
- [ ] Clicking "Upload Move-Out Photos" opens a file upload interface (drag-and-drop or file picker)
- [ ] Once move-out photos are uploaded, the AI processes them and generates a **damage report**
- [ ] The Inspection tab displays a **side-by-side comparison** with two columns:
  - **Left column:** Original (move-in) inventory photos
  - **Right column:** Move-out photos
- [ ] Photos are paired by room type (e.g., living room move-in photo next to living room move-out photo)
- [ ] Below the photo comparison, an **AI-generated damage report** is displayed, listing:
  - Missing items (e.g., "Coffee table not detected in move-out photos")
  - Detected damage (e.g., "Stain detected on sofa in living room photo")
- [ ] Each flagged issue includes:
  - Description of the issue
  - Reference photos (thumbnail links to move-in and move-out images)
  - Confidence score or severity indicator (e.g., "High confidence," "Low confidence")
- [ ] The landlord can **confirm or dismiss** each flagged issue:
  - Checkmark button: Confirm issue (mark as valid)
  - X button: Dismiss issue (mark as false positive)
- [ ] The landlord can add **manual notes** to the damage report (e.g., "Agreed with tenant to deduct $50 for stain")
- [ ] A "Download Report" button generates a PDF of the damage report with photos and notes

---

### 2.5 Add Apartment Flow (Wizard)

**As a** landlord, **I want** to onboard a new apartment through a step-by-step wizard, **so that** I can quickly add property details, upload photos, and generate an AI inventory without confusion.

**Acceptance Criteria:**

- [ ] The wizard has **3 steps**, displayed with a progress indicator at the top:
  - **Step 1:** Fill in details
  - **Step 2:** Upload photos
  - **Step 3:** Review and confirm inventory
- [ ] The landlord can navigate between steps using "Back" and "Next" buttons
- [ ] The landlord cannot proceed to the next step until all required fields in the current step are completed

---

#### 2.5.1 Step 1: Fill in Apartment Details

**Acceptance Criteria:**

- [ ] The form includes the following fields:
  - **Address (required):** Text input for street address
  - **Building number (optional):** Text input
  - **Apartment number (optional):** Text input
  - **City (required):** Text input or dropdown
  - **Number of rooms (required):** Number input (1-10)
  - **Square meters (required):** Number input (10-300)
  - **Floor (optional):** Number input (0-50)
  - **Additional specifications (optional):** Multi-select checkboxes for:
    - Parking
    - Balcony
    - Elevator
    - Furnished
    - Pet-friendly
- [ ] All required fields are marked with an asterisk (*)
- [ ] If the landlord tries to click "Next" without filling required fields, an error message appears: "Please fill in all required fields"
- [ ] Field validation provides real-time feedback (e.g., "Rooms must be between 1 and 10")
- [ ] Clicking "Next" saves the apartment details and proceeds to Step 2

---

#### 2.5.2 Step 2: Upload Photos

**Acceptance Criteria:**

- [ ] The upload interface supports **drag-and-drop** file upload
- [ ] The landlord can also click "Browse Files" to open a file picker
- [ ] Accepted file types: JPG, JPEG, PNG (displayed as a hint below the upload area)
- [ ] Maximum file size per photo: 10 MB (enforced, with error message if exceeded)
- [ ] The landlord can upload 1-30 photos in a single session
- [ ] As files are uploaded, thumbnails appear in a grid below the upload area
- [ ] Each thumbnail shows:
  - Image preview
  - File name
  - File size
  - A "Remove" (X) button to delete the photo before submission
- [ ] A **progress bar** appears during upload, showing the upload status for each file
- [ ] If an upload fails (network error, file too large, unsupported format), an error message is displayed: "Failed to upload [filename]. [Reason]"
- [ ] The landlord can optionally **tag each photo by room type** using a dropdown or label selector:
  - Living room
  - Bedroom
  - Kitchen
  - Bathroom
  - Other
- [ ] If the landlord tags photos by room, those tags are passed to the AI for better inventory organization
- [ ] Clicking "Next" uploads all photos to the backend and triggers AI inventory generation
- [ ] While the AI processes the photos, a loading screen is displayed: "AI is analyzing your photos and generating an inventory report... This may take 10-30 seconds."

---

#### 2.5.3 Step 3: Review and Confirm Inventory

**Acceptance Criteria:**

- [ ] Once the AI completes processing, the generated inventory is displayed as a structured list organized by room
- [ ] Each inventory item shows:
  - Item type (e.g., "Sofa," "Coffee table," "Washing machine")
  - Detected room (e.g., "Living room")
  - Condition notes (if generated by AI)
  - Reference photo thumbnail (the photo where the item was detected)
- [ ] The landlord can **edit the inventory** inline:
  - Click on an item to edit its name, room, or condition notes
  - Click a "Remove" button to delete false positives
  - Click "Add Item" to manually add items the AI missed
- [ ] A summary count is displayed at the top: "X items detected in Y rooms"
- [ ] A "Re-generate Inventory" button allows the landlord to re-run the AI analysis if they uploaded new photos or corrected tags
- [ ] Clicking "Confirm and Save" finalizes the apartment onboarding and navigates the landlord to the **Apartment Detail Page** (Overview tab)
- [ ] A success message is displayed: "Apartment successfully added! You can now generate listings."

---

### 2.6 Listing Generation View

**As a** landlord, **I want** to select which platforms to generate listings for, specify rental type and price, and preview AI-generated listings, **so that** I can quickly create optimized content for multiple rental platforms.

**Acceptance Criteria:**

- [ ] The Listing Generation View is accessible from:
  - The "Generate Listings" button in the Apartment Detail Page (Listings tab)
  - A quick action button in the apartment card on the dashboard
- [ ] The view displays a form with the following inputs:

  **1. Platform Selection (checkboxes):**
  - [ ] Otodom.pl
  - [ ] OLX.pl
  - [ ] Airbnb
  - [ ] Booking.com
  - [ ] The landlord must select at least one platform to proceed

  **2. Rental Type (radio buttons):**
  - [ ] Monthly rental
  - [ ] Daily/short-term rental

  **3. Price Input:**
  - [ ] Numeric input field for rent amount
  - [ ] Currency symbol (PLN złoty) displayed
  - [ ] Placeholder text: "e.g., 3000"

- [ ] Clicking "Generate Listings" triggers AI to generate listing text for each selected platform simultaneously
- [ ] A loading indicator is displayed: "AI is generating your listings... This may take 10-20 seconds."
- [ ] Once generation is complete, the listings are displayed as **tabs or cards**, one per platform
- [ ] Each listing preview shows:
  - Platform name (e.g., "Otodom.pl Listing")
  - Listing title (generated by AI)
  - Full description (formatted with line breaks)
  - Amenities/features list (bullet points)
- [ ] The landlord can **edit** any listing by clicking an "Edit" button, which opens an inline text editor
- [ ] Each listing has a **"Copy to Clipboard"** button
- [ ] Clicking "Copy to Clipboard" copies the entire listing text and shows a success message: "Listing copied! Paste it into [Platform Name]"
- [ ] A "Save and Close" button saves all listings and returns the landlord to the Apartment Detail Page (Listings tab)
- [ ] The landlord can click "Re-generate" for an individual platform if they want AI to create a new version

---

### 2.7 Chat Interface (Split View)

**As a** landlord, **I want** to view and respond to tenant conversations in a split-view interface, **so that** I can efficiently manage multiple inquiries and provide timely responses.

**Acceptance Criteria:**

- [ ] The Chat Interface is accessible from:
  - The main sidebar navigation ("Conversations" section)
  - Clicking on a conversation in the Apartment Detail Page (Conversations tab)
- [ ] The interface is a **split-view layout** with two panels:

  **Left Panel: Conversation List**
  - [ ] Displays all tenant conversations across all apartments
  - [ ] Each conversation entry shows:
    - Tenant name (or "Anonymous")
    - Platform source icon (otodom, olx, Airbnb, Booking, or "Direct")
    - Last message preview (first 50-60 characters)
    - Timestamp of last message (e.g., "2 hours ago," "Yesterday," "Jan 15")
    - **Urgency indicator**:
      - **Red dot**: Needs human attention (AI escalated)
      - **Green checkmark**: AI handled successfully
      - **No indicator**: Conversation in progress, no action needed
  - [ ] Conversations are sorted by most recent activity at the top
  - [ ] Clicking on a conversation entry loads that chat thread in the right panel
  - [ ] The active conversation is highlighted with a background color or border
  - [ ] A filter/tab at the top allows viewing:
    - "All Conversations"
    - "Needs Attention" (escalated only)
    - "AI Handled" (auto-responded only)

  **Right Panel: Chat Thread**
  - [ ] Displays the full message history for the selected conversation
  - [ ] Messages are displayed in chronological order (oldest at top, newest at bottom, or newest at top based on common chat UX)
  - [ ] Each message shows:
    - Sender: "Tenant" or "Landlord" or "AI Assistant"
    - Message text
    - Timestamp (e.g., "10:42 AM")
  - [ ] **AI responses are visually distinguished** with a bot badge/icon and a light background color (e.g., light blue or gray)
  - [ ] **Human (landlord) responses are visually distinguished** with a different background color or alignment (e.g., right-aligned, blue background)
  - [ ] **Tenant messages** are displayed with a neutral background (e.g., white or light gray)

  **Escalation Indicator:**
  - [ ] When the AI escalates a question, the escalated message is **highlighted** with a yellow/orange background and a label: "AI escalated: Needs your response"
  - [ ] Below the escalated tenant message, a text input box is displayed for the landlord to type their response

  **Sending a Response:**
  - [ ] The landlord types their response in the input box at the bottom of the chat thread
  - [ ] A "Send" button (or Enter key) sends the message immediately to the tenant
  - [ ] The message is added to the chat thread with a "Landlord" label
  - [ ] The escalation indicator is cleared once the landlord responds
  - [ ] The conversation is marked as resolved (red dot removed from the conversation list)

- [ ] If there are no conversations, the right panel shows a message: "No conversation selected. Click on a conversation from the list to view it."

---

## 3. Scope and Boundaries

### In-Scope

- Complete UI/UX design and implementation for the RentOS web application
- Sidebar navigation with dark/light mode toggle
- Apartments list view with card grid and interactive calendar view
- Apartment detail page with 4 tabs (Overview, Listings, Conversations, Inspection)
- 3-step Add Apartment wizard with photo upload and AI inventory generation
- Listing generation view with platform selection, preview, and copy-to-clipboard functionality
- Chat interface with split-view layout, conversation list, and message thread
- Visual indicators for AI-handled vs. escalated conversations
- Inline editing capabilities for inventory, listings, and apartment details
- Responsive design for desktop, laptop, and tablet screens

### Out-of-Scope

- **Mobile app (native iOS/Android):** The UI is responsive for tablet/mobile browsers, but native mobile apps are not included
- **Real-time WebSocket chat:** Chat messages are fetched via HTTP polling or page refresh; real-time WebSocket support is deferred to a future iteration
- **Advanced calendar features:** Recurring lease periods, automated reminders, or calendar sync with external apps (Google Calendar, Outlook) are not included
- **User authentication and multi-tenancy:** For the hackathon MVP, the app assumes a single landlord user; login, registration, and multi-user support are out of scope
- **Platform API integrations:** No direct publishing to otodom.pl, olx.pl, Airbnb, or Booking.com via their APIs; landlords manually copy/paste listings
- **Payment tracking or financial reporting:** No rent collection, expense tracking, or financial dashboards
- **Tenant-facing portal:** Tenants do not have access to the RentOS UI; all interactions are mediated by the landlord
- **Legal document generation:** No lease agreements, contracts, or rental application forms
- **Advanced AI settings:** Landlords cannot customize AI behavior (temperature, prompt templates, etc.) in this version
- **Notification system:** No email, SMS, or push notifications for escalated chats or new inquiries; landlords must manually check the dashboard
- **Export/import functionality:** No bulk import of apartments from CSV, no export of listings or reports to external formats (beyond the PDF damage report in the Inspection tab)
- **Accessibility (WCAG AA/AAA compliance):** While the UI aims for basic usability, full WCAG compliance is deferred to a future iteration
- **Internationalization (i18n):** The UI is in English only; Polish language support and multi-language options are out of scope for MVP

---

## 4. Additional Notes and Open Questions

### Design System
- A Figma or design mockup will be created to define the exact color palette, typography, spacing, and component library before frontend implementation begins.

### Photo Storage and Performance
- Photo uploads may take time depending on file size and network speed. Consider implementing client-side image compression or progressive upload to improve perceived performance.

### AI Processing Time
- Inventory generation and listing creation depend on AI API response times (Google Gemini). If processing takes longer than 30 seconds, consider adding a "process in background and notify me" option.

### Calendar View Complexity
- Interactive calendar with drag-to-edit functionality is complex. Consider using a third-party calendar library (e.g., FullCalendar, React Big Calendar) to accelerate development.

### Chat Interface UX
- The split-view chat interface requires careful UX design to ensure it feels intuitive on smaller screens (laptops, tablets). Consider responsive behavior: on tablets, the conversation list may collapse into a drawer or slide-out panel.

---

**Next Steps:**
- Review and approve this functional specification
- Proceed to `/awos:tech` to define the technical implementation details (component structure, API contracts, state management, etc.)
