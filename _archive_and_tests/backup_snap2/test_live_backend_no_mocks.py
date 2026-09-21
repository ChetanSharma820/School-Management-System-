import urllib.request
import json

base_url = 'http://127.0.0.1:8080'

endpoints = [
    ('/api/health', 'GET', None),
    ('/api/auth/login', 'POST', {'username': 'admin', 'password': 'admin@123'}),
    ('/api/auth/login', 'POST', {'username': 'robert.miller', 'password': 'robert.miller@123'}),
    ('/api/remarks?student_id=1', 'GET', None),
    ('/api/student-grades?student_id=1', 'GET', None),
    ('/api/timetable?class_id=1', 'GET', None),
    ('/api/leaves?teacher_id=1', 'GET', None),
    ('/api/attendance-regularizations?teacher_id=1', 'GET', None),
    ('/api/teacher-attendance?teacher_id=1&month=2026-09', 'GET', None),
    ('/api/teacher-leaves?teacher_id=1', 'GET', None),
    ('/api/teacher-attendance-regularizations?teacher_id=1', 'GET', None),
    ('/api/attendance', 'GET', None)
]

for path, method, body in endpoints:
    url = f"{base_url}{path}"
    headers = {'Content-Type': 'application/json'}
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode('utf-8')
            parsed = json.loads(raw)
            count = len(parsed) if isinstance(parsed, list) else (1 if isinstance(parsed, dict) else 0)
            print(f"[{resp.code}] {method} {path} -> {count} items returned from LIVE DB")
    except Exception as e:
        print(f"[FAIL] {method} {path} -> {e}")
