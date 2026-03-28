# Technical Specification: RentOS Dashboard & Complete UI

- **Functional Specification:** `context/spec/001-rentos-dashboard-ui/functional-spec.md`
- **Status:** Draft
- **Author(s):** Engineering Team

---

## 1. High-Level Technical Approach

This specification covers the complete frontend and backend implementation for the RentOS web application, including:

- **Frontend**: Next.js 14 (App Router) with TypeScript and Tailwind CSS for all UI components and pages
- **Backend**: FastAPI REST API with async handlers for AI operations and business logic
- **Database**: PostgreSQL schema with tables for apartments, photos, inventory, listings, conversations, and lease periods
- **AI Integration**: LangChain agents orchestrating Google Gemini Vision and Text APIs
- **File Storage**: Google Cloud Storage for apartment photos with signed URLs

**Overall Strategy:**
1. Frontend makes REST API calls to FastAPI backend
2. Backend handles business logic, database operations, and AI orchestration
3. LangChain agents process photos (inventory generation), generate listings, and power the chatbot
4. PostgreSQL stores all structured data; GCS stores photos
5. No authentication required for MVP (single-user landlord)

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Frontend Architecture (Next.js + TypeScript + Tailwind CSS)

#### 2.1.1 Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with sidebar navigation
│   │   ├── page.tsx                  # Home/Dashboard page
│   │   ├── apartments/
│   │   │   ├── page.tsx             # Apartments list (card grid + calendar toggle)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Apartment detail page (tabbed view)
│   │   │   └── new/
│   │   │       └── page.tsx         # Add apartment wizard
│   │   └── conversations/
│   │       ├── page.tsx             # Chat interface (split view)
│   │       └── [id]/
│   │           └── page.tsx         # Individual conversation thread
│   ├── components/                   # Reusable React components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Sidebar navigation
│   │   │   └── ThemeToggle.tsx      # Dark/light mode toggle
│   │   ├── apartments/
│   │   │   ├── ApartmentCard.tsx    # Card for grid view
│   │   │   ├── ApartmentCalendar.tsx # Interactive calendar view
│   │   │   ├── ApartmentDetail/
│   │   │   │   ├── OverviewTab.tsx
│   │   │   │   ├── ListingsTab.tsx
│   │   │   │   ├── ConversationsTab.tsx
│   │   │   │   └── InspectionTab.tsx
│   │   │   └── AddApartmentWizard/
│   │   │       ├── Step1Details.tsx
│   │   │       ├── Step2Photos.tsx
│   │   │       └── Step3Inventory.tsx
│   │   ├── listings/
│   │   │   ├── ListingGeneratorForm.tsx
│   │   │   └── ListingCard.tsx
│   │   ├── chat/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ChatThread.tsx
│   │   │   └── MessageBubble.tsx
│   │   └── common/
│   │       ├── PhotoUpload.tsx      # Drag-and-drop upload
│   │       ├── PhotoGallery.tsx     # Grid with lightbox
│   │       ├── StatusBadge.tsx      # Color-coded status
│   │       └── Button.tsx           # Reusable button
│   ├── lib/                          # Utilities and helpers
│   │   ├── api.ts                   # Axios instance + API functions
│   │   ├── theme.ts                 # Theme context provider
│   │   └── utils.ts                 # General utilities
│   └── types/                        # TypeScript type definitions
│       ├── apartment.ts
│       ├── listing.ts
│       ├── conversation.ts
│       └── api.ts
└── tailwind.config.ts
```

#### 2.1.2 State Management

**Approach:** React Context for theme (dark/light mode) + URL state (Next.js params/searchParams) + local component state

- **Theme Context** (`lib/theme.ts`): Manages dark/light mode preference, persists to localStorage
- **No global state library** (Zustand, Redux): Not needed for MVP; API data fetched per-page and prop-drilled to components
- **Form State**: Local useState or React Hook Form for wizard steps and forms

#### 2.1.3 Routing

**Next.js 14 App Router** with file-based routing:

| Route | Purpose |
|-------|---------|
| `/` | Dashboard home (redirects to `/apartments`) |
| `/apartments` | Apartments list (card grid + calendar view) |
| `/apartments/new` | Add apartment wizard |
| `/apartments/[id]` | Apartment detail page (4 tabs) |
| `/conversations` | Chat interface (split view) |
| `/conversations/[id]` | Individual conversation (optional, or handled in split view) |

**Dynamic routing:** Use `[id]` segments for apartment and conversation IDs

#### 2.1.4 Key Third-Party Libraries

| Library | Purpose |
|---------|---------|
| `axios` | HTTP client for API calls |
| `react-big-calendar` or `@fullcalendar/react` | Interactive calendar view for lease periods |
| `yet-another-react-lightbox` | Photo lightbox/gallery |
| `react-dropzone` | Drag-and-drop file upload |
| `react-hook-form` | Form handling and validation |
| `zod` | Schema validation for forms (pairs with react-hook-form) |
| `date-fns` | Date formatting and manipulation |
| `clsx` + `tailwind-merge` | Tailwind class name utilities |

#### 2.1.5 Dark/Light Mode Implementation

**Approach:** Use Tailwind CSS `dark:` variant + React Context

- Store theme preference in localStorage
- Apply `dark` class to `<html>` element
- All components use Tailwind `dark:` variants for styling
- ThemeToggle component in sidebar/header

---

### 2.2 Backend Architecture (FastAPI + Python 3.12)

#### 2.2.1 Project Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI app initialization, CORS, routers
│   ├── api/                          # API route handlers
│   │   ├── __init__.py
│   │   ├── apartments.py            # Apartment CRUD, photo upload
│   │   ├── inventory.py             # Inventory generation, editing
│   │   ├── listings.py              # Listing generation, editing
│   │   ├── conversations.py         # Conversation CRUD, chat endpoints
│   │   └── lease_periods.py         # Lease period CRUD for calendar
│   ├── core/                         # Configuration and settings
│   │   ├── __init__.py
│   │   ├── config.py                # Pydantic settings from .env
│   │   └── dependencies.py          # Dependency injection (DB session, etc.)
│   ├── models/                       # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── apartment.py
│   │   ├── photo.py
│   │   ├── inventory_item.py
│   │   ├── listing.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   └── lease_period.py
│   ├── schemas/                      # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── apartment.py             # ApartmentCreate, ApartmentResponse, etc.
│   │   ├── inventory.py
│   │   ├── listing.py
│   │   └── conversation.py
│   ├── services/                     # Business logic layer
│   │   ├── __init__.py
│   │   ├── apartment_service.py     # Apartment CRUD logic
│   │   ├── photo_service.py         # GCS upload, signed URLs
│   │   ├── inventory_service.py     # Trigger AI, save results
│   │   ├── listing_service.py       # Generate listings
│   │   └── conversation_service.py  # Chat logic, escalation
│   ├── agents/                       # LangChain AI agents
│   │   ├── __init__.py
│   │   ├── inventory_agent.py       # Gemini Vision for inventory
│   │   ├── listing_agent.py         # Gemini Text for listings
│   │   ├── chatbot_agent.py         # Gemini Text for Q&A
│   │   └── damage_detection_agent.py # Gemini Vision for move-out
│   └── database.py                   # SQLAlchemy engine, session
├── alembic/                          # Database migrations
│   ├── versions/
│   └── env.py
├── tests/
└── pyproject.toml
```

#### 2.2.2 API Endpoints

**Apartments Resource:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/apartments` | List all apartments | - | `{ apartments: ApartmentResponse[] }` |
| POST | `/api/apartments` | Create apartment | `ApartmentCreate` | `ApartmentResponse` |
| GET | `/api/apartments/{id}` | Get apartment details | - | `ApartmentResponse` |
| PATCH | `/api/apartments/{id}` | Update apartment | `ApartmentUpdate` | `ApartmentResponse` |
| DELETE | `/api/apartments/{id}` | Delete apartment | - | `{ message: "Deleted" }` |

**Photo Upload:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/apartments/{id}/photos` | Upload photos | `multipart/form-data` (files, room_tags) | `{ photo_ids: str[] }` |
| DELETE | `/api/photos/{photo_id}` | Delete photo | - | `{ message: "Deleted" }` |

**Inventory:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/apartments/{id}/inventory/generate` | Trigger AI inventory generation | - | `InventoryResponse` (async, returns job_id or result) |
| GET | `/api/apartments/{id}/inventory` | Get inventory | - | `InventoryResponse` |
| PATCH | `/api/apartments/{id}/inventory` | Update inventory items | `InventoryUpdate` | `InventoryResponse` |

**Listings:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/apartments/{id}/listings/generate` | Generate listings | `{ platforms: str[], rental_type: str, price: float }` | `{ listings: ListingResponse[] }` |
| GET | `/api/apartments/{id}/listings` | Get all listings | - | `{ listings: ListingResponse[] }` |
| PATCH | `/api/listings/{listing_id}` | Edit listing | `ListingUpdate` | `ListingResponse` |

**Conversations:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/conversations` | List all conversations | Query: `?status=escalated` | `{ conversations: ConversationResponse[] }` |
| GET | `/api/apartments/{id}/conversations` | Get conversations for apartment | - | `{ conversations: ConversationResponse[] }` |
| POST | `/api/conversations` | Create new conversation | `ConversationCreate` | `ConversationResponse` |
| POST | `/api/conversations/{id}/messages` | Send message (tenant or landlord) | `{ sender: str, text: str }` | `MessageResponse` (+ AI response if applicable) |
| PATCH | `/api/conversations/{id}/status` | Update status (resolve escalation) | `{ status: str }` | `ConversationResponse` |

**Lease Periods (Calendar):**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/apartments/{id}/lease-periods` | Get lease periods | - | `{ lease_periods: LeasePeriodResponse[] }` |
| POST | `/api/apartments/{id}/lease-periods` | Create lease period | `LeasePeriodCreate` | `LeasePeriodResponse` |
| PATCH | `/api/lease-periods/{id}` | Update lease period | `LeasePeriodUpdate` | `LeasePeriodResponse` |
| DELETE | `/api/lease-periods/{id}` | Delete lease period | - | `{ message: "Deleted" }` |

**Move-Out Inspection:**

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/apartments/{id}/move-out-photos` | Upload move-out photos | `multipart/form-data` | `{ photo_ids: str[] }` |
| POST | `/api/apartments/{id}/damage-report/generate` | Generate damage report | - | `DamageReportResponse` |
| PATCH | `/api/apartments/{id}/damage-report` | Update damage report (confirm/dismiss issues) | `DamageReportUpdate` | `DamageReportResponse` |

#### 2.2.3 Service Layer Pattern

**Example: `apartment_service.py`**

```python
# Pseudo-code structure (not full implementation)
class ApartmentService:
    def __init__(self, db_session, photo_service, inventory_service):
        self.db = db_session
        self.photo_service = photo_service
        self.inventory_service = inventory_service

    async def create_apartment(self, data: ApartmentCreate) -> Apartment:
        # Create apartment record in DB
        # Return apartment model

    async def upload_photos(self, apartment_id: str, files: List[UploadFile]) -> List[Photo]:
        # Delegate to photo_service to upload to GCS
        # Save photo metadata to DB

    async def generate_inventory(self, apartment_id: str) -> Inventory:
        # Fetch photos from DB
        # Delegate to inventory_service (calls LangChain agent)
        # Save inventory to DB
```

---

### 2.3 Database Schema (PostgreSQL + SQLAlchemy)

#### 2.3.1 Tables Overview

| Table | Purpose |
|-------|---------|
| `apartments` | Core apartment data (address, rooms, sqm, status) |
| `photos` | Photo metadata (GCS URLs, room type, move-in/move-out) |
| `inventory_items` | Individual inventory items detected by AI |
| `listings` | Generated listings per platform |
| `conversations` | Tenant inquiry threads |
| `messages` | Individual messages within conversations |
| `lease_periods` | Lease/occupancy periods for calendar view |

#### 2.3.2 Table Definitions

**`apartments`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| address | VARCHAR(255) | NOT NULL | Street address |
| building | VARCHAR(50) | NULL | Building number |
| apartment_number | VARCHAR(50) | NULL | Apt number |
| city | VARCHAR(100) | NOT NULL | |
| rooms | INTEGER | NOT NULL | Number of rooms |
| sqm | FLOAT | NOT NULL | Square meters |
| floor | INTEGER | NULL | Floor number |
| specifications | JSONB | NULL | {parking: bool, balcony: bool, ...} |
| status | VARCHAR(50) | NOT NULL | 'vacant', 'listed', 'rented', 'move-out' |
| thumbnail_url | VARCHAR(500) | NULL | First photo for card display |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_apartments_status`, `idx_apartments_city`

---

**`photos`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| apartment_id | UUID | FOREIGN KEY (apartments.id) ON DELETE CASCADE | |
| storage_url | VARCHAR(500) | NOT NULL | GCS signed URL or public URL |
| room_type | VARCHAR(50) | NULL | 'living_room', 'bedroom', 'kitchen', 'bathroom', 'other' |
| photo_type | VARCHAR(50) | NOT NULL | 'move-in' or 'move-out' |
| uploaded_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_photos_apartment_id`, `idx_photos_photo_type`

---

**`inventory_items`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| apartment_id | UUID | FOREIGN KEY (apartments.id) ON DELETE CASCADE | |
| room_type | VARCHAR(50) | NULL | Room where item was detected |
| item_type | VARCHAR(100) | NOT NULL | 'Sofa', 'Coffee table', 'Washing machine', etc. |
| condition_notes | TEXT | NULL | AI-generated or landlord-added notes |
| photo_id | UUID | FOREIGN KEY (photos.id) ON DELETE SET NULL | Reference photo |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_inventory_apartment_id`

---

**`listings`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| apartment_id | UUID | FOREIGN KEY (apartments.id) ON DELETE CASCADE | |
| platform | VARCHAR(50) | NOT NULL | 'otodom', 'olx', 'airbnb', 'booking' |
| title | VARCHAR(255) | NOT NULL | AI-generated title |
| description | TEXT | NOT NULL | AI-generated description |
| amenities | JSONB | NULL | List of amenities/features |
| price | FLOAT | NULL | Rent price |
| rental_type | VARCHAR(50) | NULL | 'monthly' or 'daily' |
| status | VARCHAR(50) | NOT NULL | 'draft', 'copied', 'published' (future use) |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_listings_apartment_id`, `idx_listings_platform`

---

**`conversations`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| apartment_id | UUID | FOREIGN KEY (apartments.id) ON DELETE CASCADE | |
| tenant_name | VARCHAR(255) | NULL | 'Anonymous' if not provided |
| platform_source | VARCHAR(50) | NULL | 'otodom', 'olx', 'airbnb', 'booking', 'direct' |
| status | VARCHAR(50) | NOT NULL | 'ai_handled', 'escalated', 'resolved' |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_conversations_apartment_id`, `idx_conversations_status`

---

**`messages`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| conversation_id | UUID | FOREIGN KEY (conversations.id) ON DELETE CASCADE | |
| sender | VARCHAR(50) | NOT NULL | 'tenant', 'landlord', 'ai' |
| message_text | TEXT | NOT NULL | |
| timestamp | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_messages_conversation_id`, `idx_messages_timestamp`

---

**`lease_periods`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| apartment_id | UUID | FOREIGN KEY (apartments.id) ON DELETE CASCADE | |
| tenant_name | VARCHAR(255) | NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| rental_type | VARCHAR(50) | NULL | 'monthly' or 'daily' |
| status | VARCHAR(50) | NOT NULL | 'active', 'completed', 'cancelled' |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_lease_periods_apartment_id`, `idx_lease_periods_dates` (composite on start_date, end_date)

---

### 2.4 AI Agent Implementation (LangChain + Gemini)

#### 2.4.1 Inventory Generation Agent

**File:** `backend/app/agents/inventory_agent.py`

**Approach:**
- Input: List of apartment photos (GCS URLs)
- LangChain agent with Gemini Vision tool
- Prompt: "Analyze these apartment photos and identify all furniture, appliances, and amenities. For each item, specify the room type, item type, and condition."
- Output: Structured JSON with inventory items

**Pseudo-structure:**
```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, Tool

class InventoryAgent:
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-vision", api_key=gemini_api_key)

    async def generate_inventory(self, photo_urls: List[str], room_tags: Dict[str, str]) -> List[InventoryItem]:
        # Call Gemini Vision API with photos
        # Parse response into structured inventory items
        # Return list of InventoryItem objects
```

#### 2.4.2 Listing Generation Agent

**File:** `backend/app/agents/listing_agent.py`

**Approach:**
- Input: Apartment details, inventory, price, rental type
- LangChain agent with Gemini Text tool
- Platform-specific prompts (otodom, olx, Airbnb, Booking)
- Output: Generated listing title + description per platform

#### 2.4.3 Chatbot Agent

**File:** `backend/app/agents/chatbot_agent.py`

**Approach:**
- Input: Tenant question, apartment inventory context
- LangChain agent with Gemini Text + memory
- Tool: apartment knowledge base (retrieved from inventory)
- Logic: If confidence < threshold, escalate to landlord
- Output: AI response + escalation flag

#### 2.4.4 Damage Detection Agent

**File:** `backend/app/agents/damage_detection_agent.py`

**Approach:**
- Input: Move-in photos, move-out photos
- LangChain agent with Gemini Vision
- Prompt: "Compare these two sets of photos. Identify any missing items or visible damage."
- Output: List of flagged issues with confidence scores

---

### 2.5 Photo Storage & Signed URLs (Google Cloud Storage)

**Approach:**
- Backend uploads photos to GCS bucket: `rentos-apartment-photos`
- File path structure: `/apartments/{apartment_id}/move-in/{photo_id}.jpg`
- Store GCS object path in `photos.storage_url`
- Generate signed URLs (valid for 1 hour) when serving photos to frontend
- Frontend displays photos using signed URLs

**Photo Upload Flow:**
1. Frontend sends multipart/form-data to `/api/apartments/{id}/photos`
2. Backend receives files, uploads to GCS
3. Backend saves photo metadata to `photos` table
4. Backend returns photo IDs and signed URLs

---

## 3. Impact and Risk Analysis

### 3.1 System Dependencies

| Dependency | Impact | Mitigation |
|------------|--------|------------|
| **Google Gemini API** | Core feature (inventory, listings, chatbot) depends on Gemini availability | Implement retry logic, error handling, fallback messages |
| **Google Cloud Storage** | Photo storage is critical for all features | Use GCS reliability SLA, implement upload retry logic |
| **PostgreSQL** | Database downtime blocks all operations | Use Docker health checks, implement connection pooling |
| **Next.js Frontend** | UI is critical for landlord interaction | Implement loading states, error boundaries, offline-friendly design |

### 3.2 Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **AI API latency (>30s for inventory)** | Medium | High (poor UX) | Add loading indicators, async processing with webhooks/polling |
| **Large photo uploads (10+ MB each)** | Medium | Medium (slow uploads) | Implement client-side image compression (max 2MB per photo) |
| **AI hallucinations (incorrect inventory)** | High | Medium (landlord must review) | Always show inventory for landlord review/edit; never auto-publish |
| **Calendar drag-and-drop complexity** | Low | Medium (dev time) | Use battle-tested library (react-big-calendar or FullCalendar) |
| **No real-time chat** | Low | Low (MVP acceptable) | Implement polling (every 5-10s) or defer to future WebSocket implementation |
| **Concurrent photo processing** | Medium | Medium (Gemini rate limits) | Process photos sequentially or in small batches; implement queue |

---

## 4. Testing Strategy

### 4.1 Frontend Testing

- **Unit Tests (Jest + React Testing Library):** Test individual components (ApartmentCard, StatusBadge, etc.)
- **Integration Tests:** Test page flows (apartment creation wizard, listing generation)
- **Visual Regression Testing:** Optional - use Chromatic or Percy for UI snapshots
- **Manual Browser Testing:** Test dark/light mode, responsive design, drag-and-drop upload

### 4.2 Backend Testing

- **Unit Tests (pytest):** Test service layer functions (apartment_service, photo_service)
- **API Integration Tests (pytest + httpx):** Test FastAPI endpoints with mocked AI agents
- **AI Agent Tests:** Test LangChain agents with sample photos and mock Gemini responses
- **Database Tests:** Test SQLAlchemy models and migrations (use pytest fixtures with in-memory SQLite or test DB)

### 4.3 End-to-End Testing

- **Critical User Flows:**
  1. Add apartment wizard (upload photos → generate inventory → confirm)
  2. Generate listings → copy to clipboard
  3. Chat interface → AI response → escalation → landlord response
  4. Calendar view → drag to create lease period
- **Tools:** Playwright or Cypress for E2E automation (optional for MVP, manual testing acceptable)

---

## 5. Additional Technical Considerations

### 5.1 Performance Optimization

- **Frontend:**
  - Use Next.js Image component for optimized photo loading
  - Lazy load heavy components (calendar, lightbox) with React.lazy()
  - Implement virtual scrolling for long conversation lists

- **Backend:**
  - Use async/await for all I/O operations
  - Implement connection pooling for PostgreSQL
  - Cache inventory reports in memory (optional, if AI latency is high)

### 5.2 Security

- **CORS:** Configure FastAPI CORS middleware to allow `http://localhost:3000` (dev) and production frontend URL
- **Input Validation:** Use Pydantic schemas for all request bodies
- **File Upload Validation:** Check file types (JPG, PNG only), max size (10MB), scan for malware (optional)
- **GCS Access:** Use signed URLs with 1-hour expiration; never expose GCS bucket publicly

### 5.3 Deployment Notes

- **Development:** Docker Compose with hot reload for frontend and backend
- **Production (future):** Deploy frontend to Vercel, backend to GCP Cloud Run, PostgreSQL to Cloud SQL
- **Environment Variables:** Store in `.env` (dev) and GCP Secret Manager (prod)

---

**Next Steps:**
- Review and approve this technical specification
- Break down implementation into tasks with `/awos:tasks`
- Assign tasks to specialist agents (nextjs-frontend, python-backend, postgres-database, gcp-infra)
