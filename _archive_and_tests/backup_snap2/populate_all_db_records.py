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

def post(endpoint, data):
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{endpoint}', data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"POST {endpoint}: OK")
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"POST {endpoint} ERROR {e.code}:", e.read().decode('utf-8'))
        return None

def patch(endpoint, data):
    headers_patch = dict(headers)
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{endpoint}', data=json.dumps(data).encode('utf-8'), headers=headers_patch, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"PATCH {endpoint}: OK")
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"PATCH {endpoint} ERROR {e.code}:", e.read().decode('utf-8'))
        return None

print("--- 1. Updating Student 1 Personal Details in DB ---")
patch('students?id=eq.1', {
    'father_name': 'Dr. Rajesh Sharma',
    'mother_name': 'Dr. Sunita Sharma',
    'parent_phone': '+91 98111 22334',
    'address': '42 Orchid Residency, Civil Lines, Jaipur, Rajasthan - 302006',
    'blood_group': 'O+',
    'gender': 'Male',
    'emergency_contact': '+91 98111 22335',
    'aadhaar_number': '7482-9104-5821',
    'admission_date': '2023-04-10'
})

print("--- 2. Seeding Student Attendance in DB ---")
student_att_records = [
    {"student_id": 1, "date": "2026-09-01", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-02", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-03", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-04", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-07", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-08", "status": "Absent", "remarks": "Olympiad / Excused"},
    {"student_id": 1, "date": "2026-09-09", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-10", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-11", "status": "Absent", "remarks": "Medical leave"},
    {"student_id": 1, "date": "2026-09-12", "status": "Absent", "remarks": "Medical leave"},
    {"student_id": 1, "date": "2026-09-14", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-15", "status": "Present", "remarks": "Scanner issue - Regularized"},
    {"student_id": 1, "date": "2026-09-16", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-17", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-18", "status": "Present", "remarks": "On time"},
    {"student_id": 1, "date": "2026-09-19", "status": "Present", "remarks": "On time"}
]
post('attendance?on_conflict=student_id,date', student_att_records)

print("--- 3. Seeding Teacher 1 (Robert Miller) Attendance Logs in DB ---")
teacher_att_records = [
    {"teacher_id": 1, "attendance_date": "2026-09-01", "in_time": "08:10 AM", "out_time": "04:30 PM", "total_hours": 8.33, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-02", "in_time": "08:08 AM", "out_time": "04:30 PM", "total_hours": 8.37, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-03", "in_time": "08:15 AM", "out_time": "04:30 PM", "total_hours": 8.25, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-04", "in_time": "08:12 AM", "out_time": "04:30 PM", "total_hours": 8.30, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-07", "in_time": "08:10 AM", "out_time": "04:30 PM", "total_hours": 8.33, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-08", "in_time": "08:05 AM", "out_time": "04:30 PM", "total_hours": 8.42, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-09", "in_time": "08:16 AM", "out_time": "04:30 PM", "total_hours": 8.23, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-10", "in_time": "08:11 AM", "out_time": "04:31 PM", "total_hours": 8.33, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-11", "in_time": "08:14 AM", "out_time": "04:30 PM", "total_hours": 8.27, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-14", "in_time": "08:08 AM", "out_time": "04:30 PM", "total_hours": 8.37, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-15", "in_time": "08:25 AM", "out_time": "04:35 PM", "total_hours": 8.17, "status": "Late Arrival", "shift_type": "Standard Full Day", "remarks": "Morning Transit Delay - Regularization Approved"},
    {"teacher_id": 1, "attendance_date": "2026-09-16", "in_time": "08:10 AM", "out_time": "04:28 PM", "total_hours": 8.30, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-17", "in_time": "08:15 AM", "out_time": "04:32 PM", "total_hours": 8.28, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"},
    {"teacher_id": 1, "attendance_date": "2026-09-18", "in_time": "08:12 AM", "out_time": "04:30 PM", "total_hours": 8.30, "status": "Present", "shift_type": "Standard Full Day", "remarks": "Biometric Gate 1 Verified"}
]
post('teacher_attendance', teacher_att_records)

print("--- 4. Seeding Timetable in DB ---")
timetable_records = [
    {"class_id": 1, "teacher_id": 3, "subject": "Chemistry", "day_of_week": "Tuesday", "start_time": "09:00 AM", "end_time": "10:00 AM", "room_number": "Chem Lab 1"},
    {"class_id": 1, "teacher_id": 3, "subject": "English Literature", "day_of_week": "Thursday", "start_time": "01:30 PM", "end_time": "02:30 PM", "room_number": "Room 102"},
    {"class_id": 1, "teacher_id": 1, "subject": "Mathematics", "day_of_week": "Friday", "start_time": "10:00 AM", "end_time": "11:00 AM", "room_number": "Room 102"}
]
post('subject_teachers_timetable', timetable_records)

print("--- 5. Seeding Student Leaves for Student 1 in DB ---")
student_leaves_records = [
    {
        "student_id": 1,
        "class_id": 1,
        "teacher_id": 1,
        "leave_type": "Medical Leave",
        "start_date": "2026-09-11",
        "end_date": "2026-09-12",
        "days_count": 2,
        "reason": "Severe viral fever and doctor prescribed clinical rest.",
        "status": "Approved",
        "teacher_remarks": "Approved. Medical certificate submitted to homeroom file.",
        "reviewed_at": "2026-09-11T14:30:00Z"
    },
    {
        "student_id": 1,
        "class_id": 1,
        "teacher_id": 1,
        "leave_type": "Academic / Competition",
        "start_date": "2026-09-24",
        "end_date": "2026-09-25",
        "days_count": 2,
        "reason": "Representing Greenwood High at the State Interschool Mathematics Olympiad.",
        "status": "Pending",
        "teacher_remarks": None,
        "reviewed_at": None
    }
]
post('student_leaves', student_leaves_records)

print("--- 6. Seeding Additional Progress Remarks in DB ---")
progress_remarks = [
    {
        "student_id": 1,
        "teacher_id": 1,
        "subject": "Computer Science",
        "remark_type": "Practical Project",
        "remark": "Outstanding algorithm optimization and OOP modularity in C++ semester project."
    },
    {
        "student_id": 1,
        "teacher_id": 3,
        "subject": "English Literature",
        "remark_type": "Creative Expression",
        "remark": "Excellent essay composition and analytical depth in critical prose evaluations."
    }
]
post('student_progress_remarks', progress_remarks)

print("--- Database seeding complete! ---")
