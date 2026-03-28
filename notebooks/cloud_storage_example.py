import os
from google.cloud import storage
from google import genai

PROJECT_ID = "rent-ai-28032026"
BUCKET_NAME = "rent-ai-bucket-2803"
LOCATION = "global"
MODEL_ID = "gemini-2.5-flash-lite"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service-account.json"
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID


def create_prefix_folder(bucket_name: str, folder_name: str) -> None:
    """
    Creates a folder-like placeholder object such as 'appartments/'.
    For normal GCS buckets, this is usually just a prefix/object name convention.
    """
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(bucket_name)

    if not folder_name.endswith("/"):
        folder_name += "/"

    blob = bucket.blob(folder_name)
    blob.upload_from_string(
        "", content_type="application/x-www-form-urlencoded")
    print(f"Created folder placeholder: gs://{bucket_name}/{folder_name}")


def upload_text(bucket_name: str, object_name: str, text: str) -> None:
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(text, content_type="text/plain; charset=utf-8")
    print(f"Uploaded: gs://{bucket_name}/{object_name}")


def list_objects(bucket_name: str, prefix: str = "") -> None:
    client = storage.Client(project=PROJECT_ID)
    blobs = client.list_blobs(bucket_name, prefix=prefix)
    print(f"Objects with prefix '{prefix}':")
    for blob in blobs:
        print(" -", blob.name)


def ask_vertex_ai(prompt: str) -> str:
    """
    Uses ADC from GOOGLE_APPLICATION_CREDENTIALS.
    """
    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
    )
    return response.text


def ask_vertex_ai_stream(prompt: str) -> None:
    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )

    for chunk in client.models.generate_content_stream(
        model=MODEL_ID,
        contents=prompt,
    ):
        if getattr(chunk, "text", None):
            print(chunk.text, end="", flush=True)


if __name__ == "__main__":
    create_prefix_folder(BUCKET_NAME, "appartments")
    create_prefix_folder(BUCKET_NAME, "users")

    upload_text(BUCKET_NAME, "appartments/example.txt",
                "Apartment sample data")
    upload_text(BUCKET_NAME, "users/example.txt", "User sample data")

    list_objects(BUCKET_NAME, "appartments/")
    list_objects(BUCKET_NAME, "users/")
