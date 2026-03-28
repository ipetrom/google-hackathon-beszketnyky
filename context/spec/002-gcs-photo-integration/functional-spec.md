# Functional Specification: Google Cloud Storage Photo Integration

- **Roadmap Item:** Phase 1 - Photo Upload & Management (cloud storage backend)
- **Status:** Draft
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

### Context

RentOS currently saves apartment photos to the local filesystem (`backend/uploads/`). This works for local development but is not suitable for production or demo scenarios because:
- Photos are lost when the backend container restarts
- Photos cannot be served to the frontend over HTTP without a static file server
- No integration with Google Cloud services (Vertex AI needs GCS URLs to analyze photos)

### Problem Statement

Landlords upload apartment photos during onboarding and move-out inspection. These photos must be:
1. Stored durably in Google Cloud Storage (GCS)
2. Accessible via public or signed URLs so the frontend can display them
3. Available to Vertex AI (Gemini) for inventory generation and damage detection
4. Organized by apartment and photo type (move-in / move-out)

### Desired Outcome

Replace local file storage with Google Cloud Storage so that:
- Photos are uploaded to a GCS bucket using the existing project credentials
- Photos are organized in GCS with a clear folder structure (`apartments/{apartment_id}/move-in/`, `apartments/{apartment_id}/move-out/`)
- The frontend can load and display photos via GCS URLs
- Vertex AI agents can access photos from GCS for analysis
- The GCS bucket is initialized with the required folder prefixes on app startup or via a setup script

### Success Metrics

- All uploaded photos are stored in GCS (not locally)
- Photos are accessible from the frontend via URL
- AI inventory generation can receive GCS photo URLs
- Moving from local to GCS is transparent to the frontend (no UI changes needed)

---

## 2. Functional Requirements (The "What")

### 2.1 Photo Upload to GCS

**As a** landlord, **I want** my uploaded apartment photos to be stored in Google Cloud Storage, **so that** they are durable, accessible from anywhere, and available for AI processing.

**Acceptance Criteria:**

- [ ] When a landlord uploads photos via the wizard (Step 2) or the Inspection tab, the photos are uploaded to GCS bucket `rent-ai-bucket-2803`
- [ ] Move-in photos are stored at path: `apartments/{apartment_id}/move-in/{photo_id}.{ext}`
- [ ] Move-out photos are stored at path: `apartments/{apartment_id}/move-out/{photo_id}.{ext}`
- [ ] The `storage_url` saved in the database is the full GCS URI (e.g., `gs://rent-ai-bucket-2803/apartments/{id}/move-in/{photo_id}.jpg`) or a public/signed HTTPS URL
- [ ] The backend uses the service account credentials from `.env` (`GOOGLE_APPLICATION_CREDENTIALS`) to authenticate with GCS
- [ ] The backend uses the GCS client pattern from `notebooks/google_cloud_examples.py` (same `create_storage_client()` approach)

### 2.2 Photo Retrieval from GCS

**As a** landlord, **I want** to see my uploaded photos in the apartment detail page, **so that** I can review them at any time.

**Acceptance Criteria:**

- [ ] When the frontend requests photos via `GET /api/apartments/{id}/photos`, the response includes URLs that the browser can load directly
- [ ] URLs are either signed URLs (time-limited, secure) or public URLs depending on bucket configuration
- [ ] Photos load correctly in the PhotoGallery component, the OverviewTab, and the InspectionTab

### 2.3 GCS Bucket Initialization

**As a** developer, **I want** the GCS bucket to have the required folder structure initialized, **so that** the application can start uploading photos without manual setup.

**Acceptance Criteria:**

- [ ] A setup script or app startup routine creates the `apartments/` folder prefix in the GCS bucket
- [ ] The script uses the `create_prefix_folder()` pattern from `notebooks/google_cloud_examples.py`
- [ ] If the folder already exists, the script does not fail

### 2.4 GCS Cleanup

**As a** developer, **I want** to clean up GCS storage when an apartment is deleted, **so that** orphaned photos don't consume storage.

**Acceptance Criteria:**

- [ ] When an apartment is deleted via `DELETE /api/apartments/{id}`, all associated photos are deleted from GCS
- [ ] Both move-in and move-out photo folders for that apartment are cleaned up
- [ ] The cleanup does not fail if photos don't exist in GCS (idempotent)

### 2.5 Vertex AI Integration Readiness

**As a** system, **I want** photo URLs to be in a format that Vertex AI (Gemini) can access, **so that** the AI agents can analyze photos for inventory generation and damage detection.

**Acceptance Criteria:**

- [ ] The inventory generation agent can receive GCS URIs (`gs://bucket/path`) and pass them to Vertex AI
- [ ] The Vertex AI client is created using the pattern from `notebooks/google_cloud_examples.py` (`create_vertex_client()`)
- [ ] The AI agents use the `VERTEX_AI_MODEL` and `VERTEX_AI_LOCATION` from `.env`

---

## 3. Scope and Boundaries

### In-Scope

- Replace local file storage with GCS in the photo upload endpoints
- Create a GCS photo service using the pattern from `notebooks/google_cloud_examples.py`
- Initialize GCS bucket folder structure (`apartments/`)
- Delete photos from GCS when apartment is deleted
- Update `storage_url` in database to use GCS URLs
- Ensure frontend can display photos from GCS URLs
- Set up Vertex AI client configuration for AI agents

### Out-of-Scope

- **AI agent implementation:** The actual LangChain/Gemini agents for inventory generation, listing creation, chatbot, and damage detection are separate specifications
- **Frontend changes:** No UI changes needed — the frontend already displays photos from URLs in `storage_url`
- **Bucket creation:** The GCS bucket `rent-ai-bucket-2803` already exists — we only create folder prefixes inside it
- **Multi-bucket support:** Only one bucket is used for the MVP
- **CDN or caching:** No CDN configuration for photo serving
- **Image resizing or compression:** Photos are stored as-is
