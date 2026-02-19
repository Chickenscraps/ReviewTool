import requests
import os

URL = "https://ztixihgacithgnghymau.supabase.co"

try:
    print(f"Checking {URL}...")
    response = requests.get(URL)
    print(f"Status: {response.status_code}")
except Exception as e:
    print(f"Failed: {e}")
