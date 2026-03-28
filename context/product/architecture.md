# System Architecture Overview: RentOS

---

## 1. Application & Technology Stack

- **Frontend Framework:** Next.js with TypeScript (React-based framework for server-side rendering and static site generation)
- **UI Styling:** Tailwind CSS (utility-first CSS framework for rapid UI development)
- **Backend Framework:** Python 3.12 with FastAPI (modern, high-performance web framework for building APIs)
- **LLM Orchestration:** LangChain (framework for developing applications powered by language models, agent tooling, and chains)
- **Programming Language (Backend):** Python 3.12
- **Programming Language (Frontend):** TypeScript

---

## 2. AI & Machine Learning Services

- **Vision AI (Photo Analysis):** Google Gemini Vision API (for apartment inventory object detection from photos)
- **Vision AI (Damage Comparison):** Google Gemini Vision API (for comparing move-in and move-out photos to detect damage and missing items)
- **Text Generation (Listings):** Google Gemini API (for generating platform-specific rental listings for otodom.pl, olx.pl, Airbnb, Booking.com)
- **Conversational AI (Chatbot):** Google Gemini API (for AI tenant inquiry concierge with apartment knowledge base)
- **Agent Framework:** LangChain (for building AI agents with tools, memory, and human-in-the-loop workflows)

---

## 3. Data & Persistence

- **Primary Database:** PostgreSQL 16+ (relational database for storing apartments, listings, conversations, inventory reports, and tenancy data)
- **Database Deployment:** Docker container running PostgreSQL (local development environment)
- **Database Schema Areas:**
  - Apartments (id, address, rooms, status, created_at, updated_at)
  - Inventory Reports (id, apartment_id, report_data, photos, created_at)
  - Listings (id, apartment_id, platform, title, description, status, created_at)
  - Conversations (id, apartment_id, messages, escalation_status, created_at)
  - Photos (id, apartment_id, storage_url, room_type, photo_type, uploaded_at)

---

## 4. Storage & File Management

- **Photo Storage:** Google Cloud Storage (GCS) bucket (for storing original apartment photos and move-out photos)
- **Storage Organization:**
  - `/apartments/{apartment_id}/move-in/{photo_id}.jpg`
  - `/apartments/{apartment_id}/move-out/{photo_id}.jpg`
- **Access Control:** GCP Service Account with signed URLs for secure photo access

---

## 5. Infrastructure & Deployment

- **Cloud Provider:** Google Cloud Platform (GCP)
- **Deployment Environment:** Docker containers (local development, can be extended to GCP Cloud Run for production)
- **Container Orchestration:** Docker Compose (for local multi-container setup: frontend, backend, PostgreSQL)
- **Service Authentication:** GCP Service Accounts (for backend access to Cloud Storage and Gemini API)
- **API Communication:** REST API (JSON over HTTP/HTTPS between Next.js frontend and FastAPI backend)

---

## 6. Authentication & Security

- **User Authentication:** None for hackathon MVP (single-user landlord assumed, no login required)
- **API Security:** CORS configuration for frontend-backend communication
- **GCP Service Account Security:** JSON key file for backend service authentication
- **Future Considerations:** Add authentication (OAuth 2.0, Auth0, or Firebase Auth) for multi-user production deployment

---

## 7. External Integrations

- **Rental Platform APIs:** Not integrated in MVP (manual copy/paste workflow for otodom.pl, olx.pl, Airbnb, Booking.com)
- **Email Notifications:** Not implemented in MVP (future: SendGrid or similar for landlord notifications)
- **Future Scope:**
  - Direct API integrations with rental platforms
  - Email/SMS notification services
  - Calendar APIs for meeting scheduling

---

## 8. Development & Tooling

- **Package Management (Frontend):** npm or pnpm
- **Package Management (Backend):** pip with requirements.txt or Poetry
- **API Documentation:** FastAPI auto-generated OpenAPI/Swagger docs at `/docs`
- **Environment Configuration:** `.env` files for local development (GCP credentials, database connection strings, API keys)
- **Version Control:** Git (GitHub repository assumed)

---

## 9. Key Architectural Decisions & Rationale

### Why Next.js?
- Server-side rendering for fast initial page loads
- Built-in routing and API routes for simplified development
- Strong TypeScript support for type safety
- Excellent developer experience with hot reload

### Why FastAPI + Python?
- FastAPI provides automatic API documentation and validation
- Python ecosystem has excellent AI/ML library support (LangChain, Google AI SDK)
- Type hints in Python 3.12 improve code quality and IDE support
- Async support for handling concurrent AI requests efficiently

### Why Google Gemini?
- Multimodal capabilities (vision + text) in a single API
- Strong performance on image understanding tasks (furniture/object detection)
- Competitive pricing for hackathon and early-stage development
- Native integration with GCP infrastructure

### Why PostgreSQL?
- Robust relational model fits structured apartment/listing/conversation data
- JSONB support for flexible inventory report storage
- Strong consistency guarantees for critical business data
- Well-supported by ORMs (SQLAlchemy, Prisma)

### Why Google Cloud Storage?
- Seamless integration with GCP ecosystem (Gemini API, Service Accounts)
- Cost-effective for image storage with high durability
- Signed URLs enable secure, temporary photo access without exposing credentials

---

## 10. System Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Landlord)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js + TypeScript)                │
│  - Dashboard (Table & Calendar Views)                       │
│  - Photo Upload Interface                                   │
│  - Inventory Review & Editing                               │
│  - Listing Generator & Copy UI                              │
│  - Chatbot Interface                                        │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + Python 3.12)                │
│  - API Endpoints (apartments, inventory, listings, chat)    │
│  - LangChain Agent Orchestration                            │
│  - Business Logic & Validation                              │
└─────┬──────────────┬──────────────┬─────────────────────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌────────────────────────┐
│PostgreSQL│  │Google Gemini │  │Google Cloud Storage    │
│(Docker)  │  │API           │  │(GCS Bucket)            │
│          │  │              │  │                        │
│- Apts    │  │- Vision API  │  │- Move-in Photos        │
│- Listings│  │- Text Gen    │  │- Move-out Photos       │
│- Convos  │  │- Chat Agent  │  │                        │
│- Inventory│ │              │  │                        │
└──────────┘  └──────────────┘  └────────────────────────┘
```

---

## 11. Deployment Architecture (Hackathon MVP)

**Local Development Setup:**
1. **Frontend Container:** Next.js dev server (localhost:3000)
2. **Backend Container:** FastAPI with uvicorn (localhost:8000)
3. **Database Container:** PostgreSQL 16 (localhost:5432)
4. **GCP Services:** Cloud Storage + Gemini API (remote, accessed via service account)

**Docker Compose Services:**
- `frontend`: Next.js app
- `backend`: FastAPI app with LangChain
- `db`: PostgreSQL database
- Shared network for inter-container communication

---

## 12. Data Flow Examples

### Flow 1: Apartment Onboarding
1. Landlord uploads 10 photos via Next.js UI
2. Frontend sends photos to FastAPI `/apartments/upload` endpoint
3. Backend uploads photos to GCS, stores metadata in PostgreSQL
4. Backend sends photos to Gemini Vision API for object detection
5. LangChain agent processes Gemini response into structured inventory
6. Backend stores inventory report in PostgreSQL (JSONB column)
7. Frontend displays inventory for landlord review/editing

### Flow 2: Listing Generation
1. Landlord clicks "Generate Listings" for an apartment
2. Frontend calls FastAPI `/listings/generate/{apartment_id}` endpoint
3. Backend retrieves inventory from PostgreSQL
4. LangChain agent calls Gemini API 4 times (once per platform: otodom, olx, Airbnb, Booking)
5. Backend stores generated listings in PostgreSQL
6. Frontend displays all 4 listings with copy-to-clipboard buttons

### Flow 3: AI Chatbot Inquiry
1. Prospective tenant asks: "Does the apartment have a dishwasher?"
2. Frontend sends message to FastAPI `/chat/{apartment_id}` endpoint
3. Backend retrieves apartment inventory from PostgreSQL
4. LangChain agent uses Gemini to answer question based on inventory knowledge
5. If confident: return answer immediately
6. If uncertain: flag for human review, notify landlord
7. Frontend displays AI response or escalation notice

---

## 13. Scalability & Performance Considerations

**Current Scope (Hackathon MVP):**
- Single landlord, up to ~20 apartments
- Sequential photo processing (acceptable for demo)
- No caching layer required

**Future Optimizations (Production):**
- Add Redis for caching inventory reports and listing text
- Implement async batch photo processing with Cloud Tasks/Pub/Sub
- Use CDN (Cloud CDN) for serving photos
- Database connection pooling (pgBouncer)
- Horizontal scaling with GCP Cloud Run (stateless FastAPI containers)

---

## 14. Cost Estimation (Hackathon MVP)

- **Gemini API:** Free tier or minimal cost (<$10 for demo with ~50 photos + 100 chat messages)
- **Google Cloud Storage:** ~$0.50/month for 10GB of photos
- **GCP Service Account:** Free
- **PostgreSQL (Docker):** Free (local development)
- **Total Estimated Cost:** <$15 for hackathon demo period
