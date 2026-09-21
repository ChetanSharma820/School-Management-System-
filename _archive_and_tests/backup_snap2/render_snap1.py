import openpyxl
from PIL import Image, ImageDraw, ImageFont
import os

wb = openpyxl.load_workbook('checklist/School_Management_System_Checklist.xlsx')
ws = wb['Role-Based Auth & Access Plan']

# Dimensions
WIDTH = 1920
HEIGHT = 1680
img = Image.new('RGB', (WIDTH, HEIGHT), color='#0B1120')
draw = ImageDraw.Draw(img)

# Try loading fonts, fallback to default if not found
try:
    font_title = ImageFont.truetype("seguiemj.ttf", 30)
except:
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 28)
    except:
        font_title = ImageFont.load_default()

try:
    font_sub = ImageFont.truetype("segoeui.ttf", 16)
    font_h2 = ImageFont.truetype("segoeuib.ttf", 18)
    font_th = ImageFont.truetype("segoeuib.ttf", 13)
    font_body = ImageFont.truetype("segoeui.ttf", 12)
    font_body_bold = ImageFont.truetype("segoeuib.ttf", 12)
    font_small = ImageFont.truetype("segoeui.ttf", 11)
except:
    font_sub = font_title
    font_h2 = font_title
    font_th = font_title
    font_body = font_title
    font_body_bold = font_title
    font_small = font_title

# 1. Header Banner
draw.rectangle([(30, 25), (WIDTH - 30, 110)], fill="#1E3A8A")
draw.text((WIDTH // 2, 55), "Role-Based Access Control (RBAC) & Multi-Role Authentication Plan", fill="#FFFFFF", font=font_title, anchor="mm")
draw.text((WIDTH // 2, 88), "Secure Login System: Student Personal Portal | Teacher Evaluation & Payroll Portal | Admin Master Console", fill="#E2E8F0", font=font_sub, anchor="mm")

# 2. KPI Cards
kpis = [
    ("TOTAL USER ROLES", "3 Distinct Roles", "#2563EB"),
    ("STUDENT PORTAL SCOPE", "Own Fees, Grades, Attendance & Schedule", "#059669"),
    ("TEACHER PORTAL SCOPE", "Own Salary, Progress Remarks (No Add/Del)", "#D97706"),
    ("ADMIN CONSOLE SCOPE", "Full System Master Control", "#7C3AED"),
    ("SECURITY ARCHITECTURE", "Role-Based Token / Session RBAC", "#0D9488"),
    ("IMPLEMENTATION STATUS", "READY FOR EXECUTION", "#10B981")
]

card_w = (WIDTH - 60 - (len(kpis) - 1) * 16) // len(kpis)
card_y = 125
for i, (label, val, accent) in enumerate(kpis):
    cx = 30 + i * (card_w + 16)
    draw.rectangle([(cx, card_y), (cx + card_w, card_y + 68)], fill="#1E293B", outline="#334155", width=1)
    draw.rectangle([(cx, card_y), (cx + card_w, card_y + 4)], fill=accent)
    draw.text((cx + card_w // 2, card_y + 22), label, fill="#94A3B8", font=font_small, anchor="mm")
    draw.text((cx + card_w // 2, card_y + 46), val, fill="#FFFFFF", font=font_body_bold, anchor="mm")

# Section 1: Role Permissions Matrix
s1_y = 210
draw.text((30, s1_y), "1. Role Permissions & Feature Access Matrix (RBAC)", fill="#60A5FA", font=font_h2)

cols1 = [
    ("Portal / Role", 170),
    ("Authentication Scope", 220),
    ("Permitted Features & Data Scope", 500),
    ("Restricted / Forbidden Actions", 400),
    ("Navigation Available", 270),
    ("Data Security Filter", 300)
]

th_y = s1_y + 30
cur_x = 30
for title, w in cols1:
    draw.rectangle([(cur_x, th_y), (cur_x + w, th_y + 28)], fill="#2563EB", outline="#3B82F6", width=1)
    draw.text((cur_x + 10, th_y + 8), title, fill="#FFFFFF", font=font_th)
    cur_x += w

matrix_data = [
    ("Student Portal\n(role: 'student')",
     "Roll No / Username + Password\nLinked: student_id",
     "• View own fee receipts & installment breakdown\n• Check current outstanding balance & dues\n• View own semester grades & exam marks\n• Track personal daily attendance percentage\n• View weekly lecture timetable & assigned faculty",
     "• CANNOT view other students' data or fees\n• CANNOT modify, add, or delete any record\n• CANNOT view teacher salaries or payroll\n• Read-Only personal dashboard",
     "1. My Overview / Profile\n2. My Fee Receipts & Dues\n3. My Grades & Report Card\n4. My Attendance Records\n5. Class Timetable & Teachers",
     "WHERE student_id = :auth_student_id\n(Enforced at API & DB level)"),

    ("Faculty / Teacher Portal\n(role: 'teacher')",
     "Employee ID / Email + Password\nLinked: teacher_id",
     "• View own monthly salary pay-slips & history\n• View assigned students directory (roll, name, class)\n• Enter & update student progress remarks / feedback\n• View personal teaching schedule & assigned classes\n• Mark student class attendance",
     "• CANNOT add, enroll, or remove/delete students\n• CANNOT modify student fees or collect payments\n• CANNOT view other faculty salaries\n• CANNOT access Excel DB Studio or system settings",
     "1. Faculty Dashboard\n2. My Salary Pay-Slips\n3. Assigned Students Directory\n4. Student Progress Remarks\n5. My Teaching Schedule",
     "WHERE teacher_id = :auth_teacher_id\nWHERE class_id IN (teacher_classes)"),

    ("Administrator Console\n(role: 'admin')",
     "Admin Username / Email + Password\nSuperuser Privileges",
     "• Master management across entire institution\n• Student directory: Add, edit, bulk import, delete\n• Faculty directory: Add, manage, assign classes\n• Fee collection: Multi-installment receipts & slips\n• Payroll processing: Disburse monthly faculty salaries\n• Excel Database Studio: Bulk data import/export",
     "• No restrictions (Superuser / Management level)",
     "1. Master Dashboard KPIs\n2. Student Directory\n3. Faculty & Staff\n4. Fee Receipts & Installments\n5. Faculty Payroll & Pay-Slips\n6. Excel Database Studio",
     "Full read/write access across all tables without filter restriction")
]

row_y = th_y + 28
for r_idx, row in enumerate(matrix_data):
    row_h = 100
    cur_x = 30
    bg = "#1E293B" if r_idx % 2 == 0 else "#0F172A"
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols1)):
        draw.rectangle([(cur_x, row_y), (cur_x + w, row_y + row_h)], fill=bg, outline="#334155", width=1)
        # Multi-line text draw
        lines = text.split("\n")
        line_y = row_y + 8
        for line in lines:
            f = font_body_bold if c_idx == 0 else font_body
            color = "#F1F5F9" if c_idx == 0 else ("#10B981" if c_idx == 2 else ("#F87171" if c_idx == 3 else "#CBD5E1"))
            draw.text((cur_x + 10, line_y), line, fill=color, font=f)
            line_y += 17
        cur_x += w
    row_y += row_h

# Section 2: Database Schema & Authentication Tables
s2_y = row_y + 25
draw.text((30, s2_y), "2. Database Schema for Authentication & RBAC Support", fill="#2DD4BF", font=font_h2)

cols2 = [
    ("Table Name", 230),
    ("Primary Key", 140),
    ("Foreign Keys", 250),
    ("Key Columns & Constraints", 550),
    ("Role in RBAC System", 470)
]

th2_y = s2_y + 30
cur_x = 30
for title, w in cols2:
    draw.rectangle([(cur_x, th2_y), (cur_x + w, th2_y + 28)], fill="#0F766E", outline="#14B8A6", width=1)
    draw.text((cur_x + 10, th2_y + 8), title, fill="#FFFFFF", font=font_th)
    cur_x += w

db_data = [
    ("users (Central Auth Store)", "id BIGSERIAL", "student_id -> students(id)\nteacher_id -> teachers(id)", "username UNIQUE, email UNIQUE, password_hash,\nrole CHECK (role IN ('admin','teacher','student')),\nstatus ('active','inactive'), last_login_at, created_at", "Master authentication store with hashed credentials and role assignment linking to student/teacher profile."),
    ("student_progress_remarks (Evaluation)", "id BIGSERIAL", "student_id -> students(id)\nteacher_id -> teachers(id)", "academic_term, subject_name, performance_level,\nremark_text TEXT NOT NULL, created_at", "Allows teachers to write evaluation remarks for students without granting them add/delete permissions for students."),
    ("student_grades_results (Grades)", "id BIGSERIAL", "student_id -> students(id)", "subject_name, exam_type (Midterm/Final), marks_obtained,\nmax_marks (100.00), grade (A+, A, B, etc.), academic_year", "Stores course examination grades and terminal marks for student personal report card view."),
    ("subject_teachers_timetable (Schedule)", "id BIGSERIAL", "class_id -> classes(id)\nteacher_id -> teachers(id)", "subject_name, day_of_week (Monday..Friday),\nstart_time, end_time, room_number", "Connects subjects with teachers and class timings so students view assigned faculty and lecture schedule.")
]

row2_y = th2_y + 28
for r_idx, row in enumerate(db_data):
    row_h = 58
    cur_x = 30
    bg = "#1E293B" if r_idx % 2 == 0 else "#0F172A"
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols2)):
        draw.rectangle([(cur_x, row2_y), (cur_x + w, row2_y + row_h)], fill=bg, outline="#334155", width=1)
        lines = text.split("\n")
        line_y = row2_y + 8
        for line in lines:
            f = font_body_bold if c_idx in [0, 1] else font_body
            color = "#F1F5F9" if c_idx == 0 else "#CBD5E1"
            draw.text((cur_x + 10, line_y), line, fill=color, font=f)
            line_y += 16
        cur_x += w
    row2_y += row_h

# Section 3: Step-by-Step Implementation Roadmap
s3_y = row2_y + 25
draw.text((30, s3_y), "3. Step-by-Step Execution Plan & Milestones", fill="#34D399", font=font_h2)

cols3 = [
    ("Step ID", 110),
    ("Phase", 180),
    ("Milestone / Implementation Task", 420),
    ("Scope & Deliverables", 590),
    ("Target Files", 240),
    ("Priority", 100)
]

th3_y = s3_y + 30
cur_x = 30
for title, w in cols3:
    draw.rectangle([(cur_x, th3_y), (cur_x + w, th3_y + 28)], fill="#065F46", outline="#10B981", width=1)
    draw.text((cur_x + 10, th3_y + 8), title, fill="#FFFFFF", font=font_th)
    cur_x += w

steps_data = [
    ("AUTH-01", "Database Migration", "Create Auth & RBAC Tables in Supabase", "Run SQL DDL for users, remarks, grades, timetable", "Supabase / models.h", "High"),
    ("AUTH-02", "Data Seeding", "Seed Default Role Accounts & Test Credentials", "Create Admin, 3 Teacher accounts, 3 Student accounts", "SQL Seed Script", "High"),
    ("AUTH-03", "Backend Core", "Implement C++ Login REST Endpoint", "Add POST /api/auth/login validating credentials & role", "http_server.cpp", "High"),
    ("AUTH-04", "Frontend UI", "Build Authentication Login Screen & Demo Switcher", "Glassmorphism Login page with role switcher tabs", "Login.jsx", "High"),
    ("AUTH-05", "Frontend Security", "Implement Session State & Navigation Guard", "Store active session in React state with Logout button", "App.jsx", "High"),
    ("AUTH-06", "Student Portal", "Build Student Personal Dashboard & My Records", "Student views own fees, grades, attendance, timetable", "StudentPortal.jsx", "High"),
    ("AUTH-07", "Teacher Portal", "Build Teacher Portal & Student Remarks System", "Teacher views own salary, students list, adds remarks", "TeacherPortal.jsx", "High"),
    ("AUTH-08", "Verification", "End-to-End Testing & Visual Audit", "Verify login across all 3 roles, test permission guards", "All Components", "High")
]

row3_y = th3_y + 28
for r_idx, row in enumerate(steps_data):
    row_h = 32
    cur_x = 30
    bg = "#1E293B" if r_idx % 2 == 0 else "#0F172A"
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols3)):
        draw.rectangle([(cur_x, row3_y), (cur_x + w, row3_y + row_h)], fill=bg, outline="#334155", width=1)
        f = font_body_bold if c_idx in [0, 5] else font_body
        color = "#FBBF24" if c_idx == 0 else ("#10B981" if c_idx == 5 else "#CBD5E1")
        draw.text((cur_x + 10, row3_y + 8), text, fill=color, font=f)
        cur_x += w
    row3_y += row_h

# Footer timestamp
draw.text((WIDTH - 40, HEIGHT - 20), "EduCore OS - Architecture & RBAC Checklist Snapshot | Greenwood International Academy", fill="#64748B", font=font_small, anchor="rm")

# Save image in multiple locations
out_root = "b:/school management-anti/snap1.png"
out_checklist = "b:/school management-anti/checklist/snap1.png"
out_artifact = "C:/Users/bhuvn/.gemini/antigravity-ide/brain/a44e506e-693a-40ce-8d02-a99ca51b35ba/snap1.png"

img.save(out_root)
img.save(out_checklist)
try:
    img.save(out_artifact)
except:
    pass

print(f"Snapshot generated successfully at: {out_root} and {out_checklist}")
