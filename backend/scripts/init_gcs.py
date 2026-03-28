"""
Initialize GCS bucket with required folder structure for RentOS.
Run from backend/ directory: python -m scripts.init_gcs
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv


def main() -> None:
    # Load .env from project root
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(env_path)

    # Also try backend/.env
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(backend_env)

    # Set credentials env var
    creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./service-account.json")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds

    project = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    bucket_name = os.getenv("GCS_BUCKET_NAME", "rent-ai-bucket-2803")

    if not project:
        print("ERROR: GOOGLE_CLOUD_PROJECT not set in .env")
        sys.exit(1)

    os.environ["GOOGLE_CLOUD_PROJECT"] = project

    # Verify credentials file exists
    creds_path = Path(creds)
    if not creds_path.exists():
        print(f"ERROR: Service account JSON not found at: {creds_path.resolve()}")
        print("Download it from GCP Console and place it at the specified path.")
        sys.exit(1)

    print(f"Project:     {project}")
    print(f"Bucket:      {bucket_name}")
    print(f"Credentials: {creds_path.resolve()}")
    print()

    try:
        from google.cloud import storage

        client = storage.Client(project=project)
        bucket = client.bucket(bucket_name)

        # Verify bucket exists
        if not bucket.exists():
            print(f"ERROR: Bucket '{bucket_name}' does not exist!")
            sys.exit(1)

        print(f"Bucket '{bucket_name}' exists. ✓")

        # Create folder prefixes
        folders = ["apartments/"]
        for folder in folders:
            blob = bucket.blob(folder)
            blob.upload_from_string("", content_type="application/x-www-form-urlencoded")
            print(f"Created folder prefix: gs://{bucket_name}/{folder} ✓")

        print()
        print("GCS initialization complete!")

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
