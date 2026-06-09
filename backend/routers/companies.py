from models.firestore_models import CompanyDoc
import services.firestore_client as firestore_client
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("/{uid}", response_model=CompanyDoc)
async def get_company(uid: str):
    company = await firestore_client.get_company(uid)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {uid} not found")
    return company