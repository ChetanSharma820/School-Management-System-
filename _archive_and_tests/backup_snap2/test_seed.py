import urllib.request
import json

SUPABASE_URL = 'https://xzmirtkasmtuadvyslri.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bWlydGthc210dWFkdnlzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjEyMTQsImV4cCI6MjEwNTEzNzIxNH0.1U1fG6z74fqU3i5mGa0BHDmnIIXk1RfYQAjbJ-V3qWA'

headers = {
    'apikey': ANON_KEY,
    'Authorization': f'Bearer {ANON_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

row = {
    'student_id': 1,
    'date': '2026-09-18',
    'status': 'Present'
}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/attendance', data=json.dumps(row).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print("ATTENDANCE INSERT SUCCESS:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("ATTENDANCE ERROR:", e.read().decode('utf-8'))
