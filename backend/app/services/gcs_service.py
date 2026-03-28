"""Google Cloud Storage service for photo management."""
from __future__ import annotations

import logging
from datetime import timedelta

from google.cloud import storage

from app.core.config import settings

logger = logging.getLogger(__name__)


def create_storage_client() -> storage.Client:
    """Create Google Cloud Storage client using service account JSON from env.
    Pattern from notebooks/google_cloud_examples.py:34-36
    """
    return storage.Client(project=settings.GOOGLE_CLOUD_PROJECT)


def create_prefix_folder(folder_name: str) -> None:
    """Create a folder-like placeholder in GCS.
    Pattern from notebooks/google_cloud_examples.py:48-63
    """
    client = create_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)

    if not folder_name.endswith("/"):
        folder_name += "/"

    blob = bucket.blob(folder_name)
    blob.upload_from_string("", content_type="application/x-www-form-urlencoded")
    logger.info("Created folder placeholder: gs://%s/%s", settings.GCS_BUCKET_NAME, folder_name)


def upload_photo(
    apartment_id: str,
    photo_id: str,
    file_bytes: bytes,
    content_type: str,
    ext: str,
    photo_type: str,
) -> str:
    """Upload photo bytes to GCS and return the object path.

    Args:
        apartment_id: UUID of the apartment
        photo_id: UUID for the photo
        file_bytes: Raw file bytes
        content_type: MIME type (e.g., "image/jpeg")
        ext: File extension including dot (e.g., ".jpg")
        photo_type: "move-in" or "move-out"

    Returns:
        Object path in GCS (e.g., "apartments/{id}/move-in/{photo_id}.jpg")
    """
    client = create_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)

    object_path = f"apartments/{apartment_id}/{photo_type}/{photo_id}{ext}"
    blob = bucket.blob(object_path)
    blob.upload_from_string(file_bytes, content_type=content_type)

    logger.info("Uploaded photo to gs://%s/%s", settings.GCS_BUCKET_NAME, object_path)
    return object_path


def get_public_url(object_path: str) -> str:
    """Return an accessible URL for a GCS object.

    Uses signed URLs (valid for 24 hours) since the bucket uses uniform access control.
    """
    return generate_signed_url(object_path, expiration_minutes=1440)


def generate_signed_url(object_path: str, expiration_minutes: int = 60) -> str:
    """Generate a signed URL for a GCS object.

    Args:
        object_path: Path to the object in the bucket
        expiration_minutes: URL validity in minutes (default: 60)

    Returns:
        Signed URL string
    """
    client = create_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(object_path)

    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="GET",
    )
    return url


def delete_apartment_photos(apartment_id: str) -> int:
    """Delete all photos for an apartment from GCS.

    Deletes all objects under the apartments/{apartment_id}/ prefix.
    Returns the number of deleted objects.
    """
    client = create_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    prefix = f"apartments/{apartment_id}/"

    blobs = list(bucket.list_blobs(prefix=prefix))
    count = 0
    for blob in blobs:
        blob.delete()
        count += 1

    logger.info("Deleted %d objects from gs://%s/%s", count, settings.GCS_BUCKET_NAME, prefix)
    return count


def delete_single_photo(object_path: str) -> None:
    """Delete a single object from GCS."""
    client = create_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(object_path)
    blob.delete()
    logger.info("Deleted gs://%s/%s", settings.GCS_BUCKET_NAME, object_path)
