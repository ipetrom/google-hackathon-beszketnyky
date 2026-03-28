# Task List: Google Cloud Storage Photo Integration

**Specification:** `context/spec/002-gcs-photo-integration/`
**Status:** Implementation Complete
**Strategy:** Vertical Slicing — each slice is runnable and testable

---

## Slice 1: Config Alignment & GCS Service

**Goal:** Update backend config to match `.env` vars, create GCS service with upload/delete/URL functions

- [x] **Update `backend/app/core/config.py`**
  - [x] Replace `GCP_PROJECT_ID` with `GOOGLE_CLOUD_PROJECT` (matching `.env`)
  - [x] Replace `GEMINI_API_KEY` with Vertex AI fields: `VERTEX_AI_LOCATION` (default `"global"`), `VERTEX_AI_MODEL` (default `"gemini-2.5-flash-lite"`)
  - [x] Update `GCS_BUCKET_NAME` default to `"rent-ai-bucket-2803"`
  - [x] Update `GOOGLE_APPLICATION_CREDENTIALS` default to `"./service-account.json"`
  - [x] Add `env_file = "../.env"` to also load from project root `.env`
  - [x] Set `os.environ["GOOGLE_APPLICATION_CREDENTIALS"]` and `os.environ["GOOGLE_CLOUD_PROJECT"]` on module load (same pattern as `notebooks/google_cloud_examples.py` lines 30-31)

- [x] **Create `backend/app/services/gcs_service.py`**
  - [x] `create_storage_client()` — returns `storage.Client(project=settings.GOOGLE_CLOUD_PROJECT)` (pattern from `google_cloud_examples.py:34-36`)
  - [x] `create_prefix_folder(folder_name)` — creates folder placeholder in bucket (pattern from `google_cloud_examples.py:48-63`)
  - [x] `upload_photo(apartment_id, photo_id, file_bytes, content_type, ext, photo_type)` — uploads to `apartments/{apartment_id}/{photo_type}/{photo_id}.{ext}`, returns object path
  - [x] `get_public_url(object_path)` — returns `https://storage.googleapis.com/{bucket}/{path}`
  - [x] `generate_signed_url(object_path, expiration_minutes=60)` — returns signed URL using `blob.generate_signed_url()`
  - [x] `delete_apartment_photos(apartment_id)` — lists and deletes all blobs under `apartments/{apartment_id}/` prefix
  - [x] `delete_single_photo(object_path)` — deletes a single blob

- [x] **Create `backend/app/services/vertex_ai_service.py`**
  - [x] `create_vertex_client()` — returns `genai.Client(vertexai=True, project=..., location=...)` (pattern from `google_cloud_examples.py:39-45`)
  - [x] `get_model_id()` — returns `settings.VERTEX_AI_MODEL`

**Verification:** Import the services in a Python shell, call `create_storage_client()` — should connect without error if `service-account.json` exists and env vars are set.

---

## Slice 2: Replace Local Photo Storage with GCS

**Goal:** Photo uploads go to GCS instead of local disk, photos served via GCS URLs

- [x] **Update `backend/app/api/apartments.py`**
  - [x] Replace `_save_uploaded_photos()` to use `gcs_service.upload_photo()` instead of local file I/O
  - [x] Read file bytes from `UploadFile` with `await file.read()`
  - [x] Call `gcs_service.upload_photo(apartment_id, photo_id, file_bytes, file.content_type, ext, photo_type)`
  - [x] Store the returned object path as `storage_url` in DB
  - [x] In `get_photos()` endpoint, convert `storage_url` to public URL using `gcs_service.get_public_url()` before returning
  - [x] Remove `os`, `shutil` imports and `UPLOAD_BASE_DIR` constant
  - [x] Remove local directory creation logic

- [x] **Add static file mount as fallback in `backend/app/main.py`**
  - [x] Mount `/uploads` path to serve any existing local photos: `app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")`
  - [x] Import `StaticFiles` from `fastapi.staticfiles`

**Verification:** Start backend. Upload a photo via curl to `POST /api/apartments/{id}/photos`. Check GCS bucket (via GCP Console or `gsutil ls gs://rent-ai-bucket-2803/apartments/`) for the uploaded file. Call `GET /api/apartments/{id}/photos` and verify the returned URL opens in browser.

---

## Slice 3: GCS Cleanup on Apartment Delete

**Goal:** When an apartment is deleted, its photos are removed from GCS

- [x] **Update `delete_apartment()` in `backend/app/api/apartments.py`**
  - [x] Before DB deletion, call `gcs_service.delete_apartment_photos(apartment_id)`
  - [x] Wrap GCS cleanup in try/except — log error but don't block DB deletion
  - [x] DB cascade handles deleting photo records from the database

**Verification:** Create apartment, upload photos, verify in GCS. Delete apartment. Verify photos removed from GCS bucket. Verify DB records deleted.

---

## Slice 4: GCS Initialization Script

**Goal:** Script to create required folder prefixes in GCS bucket

- [x] **Create `backend/scripts/init_gcs.py`**
  - [x] Load `.env` using `dotenv`
  - [x] Set `GOOGLE_APPLICATION_CREDENTIALS` env var
  - [x] Call `gcs_service.create_prefix_folder("apartments")`
  - [x] Print success message with bucket name
  - [x] Verify bucket exists and service account has access
  - [x] Handle errors gracefully (missing credentials, bucket not found)
  - [x] Add `if __name__ == "__main__"` block

**Verification:** Run `cd backend && python -m scripts.init_gcs`. See success message. Check GCS bucket has `apartments/` prefix. Run again — should succeed without error (idempotent).

---

## Recommendations

All tasks use the **python-backend** agent. No frontend changes needed.

| Slice | Estimated Complexity |
|-------|---------------------|
| Slice 1 (Config + Services) | Medium — new files, follows existing pattern |
| Slice 2 (Replace upload logic) | Medium — modify existing endpoint |
| Slice 3 (Delete cleanup) | Low — add one function call |
| Slice 4 (Init script) | Low — small script |
