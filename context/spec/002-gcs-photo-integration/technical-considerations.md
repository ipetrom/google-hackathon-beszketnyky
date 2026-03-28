# Technical Specification: Google Cloud Storage Photo Integration

- **Functional Specification:** `context/spec/002-gcs-photo-integration/functional-spec.md`
- **Status:** Draft
- **Author(s):** Engineering Team

---

## 1. High-Level Technical Approach

Replace the local filesystem photo storage in `backend/app/api/apartments.py` with Google Cloud Storage using the client patterns already proven in `notebooks/google_cloud_examples.py`. The key changes:

1. **New service file** `backend/app/services/gcs_service.py` — wraps GCS and Vertex AI client creation, photo upload, signed URL generation, and deletion
2. **Update config** `backend/app/core/config.py` — align env var names with `.env` (use `GOOGLE_CLOUD_PROJECT` instead of `GCP_PROJECT_ID`)
3. **Update photo endpoints** in `backend/app/api/apartments.py` — replace `_save_uploaded_photos()` local I/O with GCS upload via the new service
4. **Update delete endpoint** — add GCS cleanup when apartment is deleted
5. **GCS init script** `backend/scripts/init_gcs.py` — creates folder prefixes in the bucket
6. **Vertex AI client setup** in `backend/app/services/vertex_ai_service.py` — ready for AI agents to use

No frontend changes needed — the frontend loads photos from whatever URL is in `storage_url`.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Configuration Changes

**File:** `backend/app/core/config.py`

Update Settings to match the actual `.env` variable names:

| Setting Field | Env Var | Default | Purpose |
|---|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `GOOGLE_CLOUD_PROJECT` | `""` | GCP project ID |
| `GCS_BUCKET_NAME` | `GCS_BUCKET_NAME` | `"rent-ai-bucket-2803"` | GCS bucket for photos |
| `GOOGLE_APPLICATION_CREDENTIALS` | `GOOGLE_APPLICATION_CREDENTIALS` | `"./service-account.json"` | Path to service account JSON |
| `VERTEX_AI_LOCATION` | `VERTEX_AI_LOCATION` | `"global"` | Vertex AI region |
| `VERTEX_AI_MODEL` | `VERTEX_AI_MODEL` | `"gemini-2.5-flash-lite"` | Gemini model ID |

Remove the old `GCP_PROJECT_ID` and `GEMINI_API_KEY` fields. Add the new Vertex AI fields. Ensure `os.environ["GOOGLE_APPLICATION_CREDENTIALS"]` is set on import (same pattern as `google_cloud_examples.py` line 30).

---

### 2.2 GCS Photo Service

**File:** `backend/app/services/gcs_service.py`

A service module that mirrors the patterns from `notebooks/google_cloud_examples.py`:

**Functions:**

| Function | Purpose | Pattern Source |
|---|---|---|
| `create_storage_client()` | Create GCS client using project ID from settings | `google_cloud_examples.py:34-36` |
| `create_prefix_folder(folder_name)` | Create folder placeholder in bucket | `google_cloud_examples.py:48-63` |
| `upload_photo(apartment_id, photo_id, file_bytes, ext, photo_type)` | Upload photo bytes to `apartments/{apartment_id}/{photo_type}/{photo_id}.{ext}` | Adapted from `upload_text()` |
| `generate_signed_url(object_path, expiration_minutes=60)` | Generate a signed URL for a GCS object | New — uses `blob.generate_signed_url()` |
| `get_public_url(object_path)` | Return public HTTPS URL (`https://storage.googleapis.com/{bucket}/{path}`) | New |
| `delete_apartment_photos(apartment_id)` | Delete all objects under `apartments/{apartment_id}/` prefix | New — uses `bucket.list_blobs(prefix=...)` then `blob.delete()` |
| `delete_single_photo(object_path)` | Delete a single object from GCS | New |

**Storage URL strategy:** Store `storage_url` in the database as the GCS object path (e.g., `apartments/{id}/move-in/{photo_id}.jpg`). When serving to frontend, generate a signed URL or construct public URL. This keeps the DB clean and allows switching URL strategies without migration.

**Signed URL vs Public URL:** For hackathon MVP, use public URLs (`https://storage.googleapis.com/{bucket}/{path}`). This requires the bucket or objects to have public read access. If the bucket is not public, fall back to signed URLs (1-hour expiry).

---

### 2.3 Vertex AI Service

**File:** `backend/app/services/vertex_ai_service.py`

A thin wrapper for creating the Vertex AI (Gemini) client:

| Function | Purpose | Pattern Source |
|---|---|---|
| `create_vertex_client()` | Create `genai.Client(vertexai=True, ...)` | `google_cloud_examples.py:39-45` |
| `get_model_id()` | Return configured model ID from settings | Returns `settings.VERTEX_AI_MODEL` |

This service will be consumed by the AI agents (inventory, listings, chatbot, damage detection) in future specs.

---

### 2.4 Photo Upload Endpoint Changes

**File:** `backend/app/api/apartments.py`

Replace the `_save_uploaded_photos()` function:

**Current flow (local):**
1. Create local directory
2. Write file to disk with `shutil.copyfileobj()`
3. Store local path as `storage_url`

**New flow (GCS):**
1. Read file bytes from `UploadFile`
2. Call `gcs_service.upload_photo(apartment_id, photo_id, file_bytes, ext, photo_type)`
3. Get URL via `gcs_service.get_public_url(object_path)` or `gcs_service.generate_signed_url(object_path)`
4. Store URL as `storage_url` in database

Remove imports: `os`, `shutil`, `UPLOAD_BASE_DIR`
Add import: `from app.services.gcs_service import upload_photo, get_public_url`

The three endpoints (`upload_photos`, `upload_move_out_photos`, `get_photos`) keep the same API contract — only the internal storage changes.

---

### 2.5 Apartment Delete — GCS Cleanup

**File:** `backend/app/api/apartments.py`

Update `delete_apartment()` to also clean up GCS:

```
# Before deleting from DB:
gcs_service.delete_apartment_photos(apartment_id)
# Then delete from DB (cascade handles DB records)
```

This is best-effort — if GCS deletion fails, log the error but don't block the DB deletion.

---

### 2.6 GCS Initialization Script

**File:** `backend/scripts/init_gcs.py`

A script to create the required folder prefixes:

```
apartments/
```

Uses `create_prefix_folder()` from `gcs_service.py`. Run once during setup:
```bash
cd backend && python -m scripts.init_gcs
```

Also verify the bucket exists and the service account has write access.

---

### 2.7 Static File Serving (Fallback)

**File:** `backend/app/main.py`

Add a `StaticFiles` mount for the local `uploads/` directory as a fallback for any locally-stored photos that haven't been migrated:

```python
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

This ensures backward compatibility with any existing local photos during the transition.

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Impact | Mitigation |
|---|---|---|
| GCS bucket access | Photo upload/display fails if GCS is unreachable | Log errors, return meaningful error messages |
| Service account JSON | All GCS operations fail without valid credentials | Validate on startup, fail fast with clear error |
| Network latency | GCS upload may be slower than local disk | Acceptable for MVP; could add async upload later |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Service account missing or invalid | Medium | High (all uploads fail) | Add startup check in `main.py` that validates credentials |
| Bucket not publicly readable | Medium | Medium (signed URLs needed) | Implement both public URL and signed URL fallback |
| Large file uploads (>10MB) | Low | Low (slow upload) | Frontend already validates 10MB max; GCS handles large files |
| GCS cleanup fails on delete | Low | Low (orphaned files) | Best-effort delete, log errors, don't block DB operation |

---

## 4. Testing Strategy

- **Manual testing:** Upload photos via the wizard, verify they appear in GCS bucket (check via GCP Console or `gsutil ls`)
- **Endpoint testing:** Use curl to upload a photo, verify the `storage_url` in the response is a GCS URL, open the URL in browser
- **Delete testing:** Delete an apartment, verify photos are removed from GCS
- **Fallback testing:** Verify locally-stored photos from before the migration still display via `/uploads/` static mount
- **Init script testing:** Run `python -m scripts.init_gcs` and verify folder prefix exists in bucket
