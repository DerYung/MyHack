import sys
import os
import asyncio
from dotenv import load_dotenv

backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
load_dotenv(os.path.join(backend_dir, '.env'))
sys.path.insert(0, backend_dir)

from services import firestore_client

async def main():
    try:
        company = await firestore_client.get_company("nonexistent")
        print("Company:", company)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
