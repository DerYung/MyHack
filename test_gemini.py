import os
import sys
from dotenv import load_dotenv

# Load env
backend_env = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(backend_env)

import google.generativeai as genai

api_key = os.getenv("GOOGLE_API_KEY")
print("API KEY:", api_key)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    print("Generating...")
    response = model.generate_content("Hello")
    print("Response:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
