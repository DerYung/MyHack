import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/api/briefs/generate',
    data=json.dumps({"company_uid": "zXj4Gq827RNDJ84R23m9"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print(e)
