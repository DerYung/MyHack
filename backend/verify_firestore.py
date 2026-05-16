"""
Quick script to verify Person B's Firestore data.
Run: python verify_firestore.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore

# Init Firebase
sa_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "./service-account.json")
cred = credentials.Certificate(sa_path)
firebase_admin.initialize_app(cred, {"projectId": "myhack-bf3ce"})
db = firestore.client(database_id="myhack")

print("=" * 60)
print("  FIRESTORE DATA VERIFICATION")
print("=" * 60)

# Check each collection
COLLECTIONS = ["companies", "mentors", "funders", "linkages", "programmes", "users"]

for col_name in COLLECTIONS:
    docs = list(db.collection(col_name).stream())
    count = len(docs)
    status = "OK" if count > 0 else "EMPTY"
    print(f"\n{'[' + status + ']':>8}  {col_name}: {count} documents")

    if count > 0:
        # Show first doc's fields
        first = docs[0].to_dict()
        fields = list(first.keys())
        print(f"          Doc ID: {docs[0].id}")
        print(f"          Fields: {', '.join(fields)}")

        # Check for critical fields per collection
        if col_name == "companies":
            required = ["name", "sector", "stage", "budget_needed", "market_goals"]
            missing = [f for f in required if f not in first]
            camel = [k for k in fields if any(c.isupper() for c in k)]
            if missing:
                print(f"   [WARN] Missing fields: {missing}")
            if camel:
                print(f"   [WARN] camelCase fields found (should be snake_case): {camel}")
            else:
                print(f"          snake_case check: PASS")

        elif col_name == "mentors":
            required = ["name", "industries", "expertise", "max_capacity", "active_count"]
            missing = [f for f in required if f not in first]
            if missing:
                print(f"   [WARN] Missing fields: {missing}")
            # Check arrays
            for arr_field in ["industries", "expertise"]:
                if arr_field in first:
                    val = first[arr_field]
                    if isinstance(val, list):
                        print(f"          {arr_field}: array with {len(val)} items - PASS")
                    else:
                        print(f"   [WARN] {arr_field} is {type(val).__name__}, should be array!")

        elif col_name == "funders":
            required = ["name", "investment_focus", "stage_interest", "min_investment", "max_investment"]
            missing = [f for f in required if f not in first]
            if missing:
                print(f"   [WARN] Missing fields: {missing}")
            if "investment_focus" in first:
                val = first["investment_focus"]
                if isinstance(val, list):
                    print(f"          investment_focus: array with {len(val)} items - PASS")
                else:
                    print(f"   [WARN] investment_focus is {type(val).__name__}, should be array!")

        elif col_name == "linkages":
            required = ["mentor_uid", "company_uid", "status", "programme_id"]
            missing = [f for f in required if f not in first]
            if missing:
                print(f"   [WARN] Missing fields: {missing}")

        # Show sample data from first doc
        print(f"          Sample: name={first.get('name', 'N/A')}")

print("\n" + "=" * 60)
print("  VERIFICATION COMPLETE")
print("=" * 60)
