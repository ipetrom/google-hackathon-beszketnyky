from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY is missing in .env")

client = genai.Client(
    api_key=API_KEY,
    vertexai=True,
)

response = client.models.generate_content(
    model="gemini-2.5-flash-lite",
    contents="What is the capital of France?",
)

print(response.text)
