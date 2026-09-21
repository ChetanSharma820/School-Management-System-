import urllib.request
import json

SUPABASE_URL = 'https://xzmirtkasmtuadvyslri.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bWlydGthc210dWFkdnlzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjEyMTQsImV4cCI6MjEwNTEzNzIxNH0.1U1fG6z74fqU3i5mGa0BHDmnIIXk1RfYQAjbJ-V3qWA'
headers = {'apikey': ANON_KEY, 'Authorization': f'Bearer {ANON_KEY}'}

tables = [
    'student_fees',
    'teacher_salaries',
    'subject_teachers_timetable',
    'student_leaves',
    'student_progress_remarks',
    'grades',
    'students',
    'teachers',
    'classes',
    'attendance',
    'attendance_regularizations',
    'teacher_attendance',
    'teacher_leaves',
    'teacher_attendance_regularizations',
    'login_credentials'
]

for t in tables:
    try:
        req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{t}?select=count', headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            print(f"TABLE '{t}': EXISTS! Count = {data}")
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print(f"TABLE '{t}': HTTP {e.code} -> {err.strip()}")
