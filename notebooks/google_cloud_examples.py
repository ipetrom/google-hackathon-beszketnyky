from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import storage
from google import genai


# Load variables from .env
load_dotenv()


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


PROJECT_ID = get_required_env("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = get_required_env("GCS_BUCKET_NAME")
LOCATION = get_required_env("VERTEX_AI_LOCATION")
MODEL_ID = get_required_env("VERTEX_AI_MODEL")
GOOGLE_APPLICATION_CREDENTIALS = get_required_env(
    "GOOGLE_APPLICATION_CREDENTIALS")

# Make sure ADC sees the service account JSON
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID


def create_storage_client() -> storage.Client:
    """Create Google Cloud Storage client using service account JSON from .env."""
    return storage.Client(project=PROJECT_ID)


def create_vertex_client() -> genai.Client:
    """Create Vertex AI client using ADC/service account JSON from .env."""
    return genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )


def create_prefix_folder(bucket_name: str, folder_name: str) -> None:
    """
    Create a folder-like placeholder in GCS.
    Example: 'appartments/' or 'users/'.

    In standard GCS buckets this is just an object prefix, not a real folder.
    """
    client = create_storage_client()
    bucket = client.bucket(bucket_name)

    if not folder_name.endswith("/"):
        folder_name += "/"

    blob = bucket.blob(folder_name)
    blob.upload_from_string(
        "", content_type="application/x-www-form-urlencoded")
    print(f"Created folder placeholder: gs://{bucket_name}/{folder_name}")


def upload_text(bucket_name: str, object_name: str, text: str) -> None:
    """Upload plain text content to an object in GCS."""
    client = create_storage_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(text, content_type="text/plain; charset=utf-8")
    print(f"Uploaded: gs://{bucket_name}/{object_name}")


def list_objects(bucket_name: str, prefix: str = "") -> None:
    """List objects in a bucket, optionally filtered by prefix."""
    client = create_storage_client()
    blobs = client.list_blobs(bucket_name, prefix=prefix)

    print(f"Objects with prefix '{prefix}':")
    found_any = False
    for blob in blobs:
        found_any = True
        print(f" - {blob.name}")

    if not found_any:
        print(" - no objects found")


def ask_vertex_ai(prompt: str) -> str:
    """Send a normal request to Vertex AI Gemini model."""
    client = create_vertex_client()

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
    )
    return response.text or ""


def ask_vertex_ai_stream(prompt: str) -> None:
    """Send a streaming request to Vertex AI Gemini model."""
    client = create_vertex_client()

    for chunk in client.models.generate_content_stream(
        model=MODEL_ID,
        contents=prompt,
    ):
        if getattr(chunk, "text", None):
            print(chunk.text, end="", flush=True)

    print()


def check_json_file_exists() -> None:
    """Fail early if the JSON file path is wrong."""
    json_path = Path(GOOGLE_APPLICATION_CREDENTIALS)
    if not json_path.exists():
        raise FileNotFoundError(
            f"Service account JSON file not found: {json_path.resolve()}"
        )


if __name__ == "__main__":
    check_json_file_exists()

    print("=== Google Cloud Storage example ===")
    create_prefix_folder(BUCKET_NAME, "appartments")
    create_prefix_folder(BUCKET_NAME, "users")

    upload_text(
        BUCKET_NAME,
        "appartments/example.txt",
        "Apartment sample data",
    )
    upload_text(
        BUCKET_NAME,
        "users/example.txt",
        "User sample data",
    )

    list_objects(BUCKET_NAME, "appartments/")
    list_objects(BUCKET_NAME, "users/")

    print("\n=== Vertex AI normal response ===\n")
    answer = ask_vertex_ai("Explain how AI works in a few words")
    print(answer)

    print("\n=== Vertex AI streaming response ===\n")
    ask_vertex_ai_stream("Give me 3 short points about AI")
