import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY is not set in .env")
    exit(1)

print(f"Testing API Key starting with: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    print("\n[SUCCESS] Connected to Gemini API!")
    print("\nAvailable models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f" - {m.name}")
    print("-" * 40)
except Exception as e:
    print("\n[FAILED] Failed to connect to Gemini API")
    print(f"Error details:\n{str(e)}")
