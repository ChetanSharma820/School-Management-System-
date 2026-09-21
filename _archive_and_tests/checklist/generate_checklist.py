import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

wb = openpyxl.Workbook()

# Define Color Palette & Styles
PRIMARY_COLOR = "1E3A8A"      # Deep Navy Blue
ACCENT_BLUE = "2563EB"        # Royal Blue
TEAL_HEADER = "0F766E"        # Deep Teal
ACCENT_TEAL = "14B8A6"        # Teal
EMERALD_HEADER = "065F46"     # Deep Emerald
ACCENT_EMERALD = "10B981"     # Emerald Green
DARK_BG = "0F172A"            # Slate Dark
LIGHT_ZEBRA = "F8FAFC"        # Off-white / light gray
PURE_WHITE = "FFFFFF"
BORDER_COLOR = "CBD5E1"       # Light gray border

font_title = Font(name="Segoe UI", size=16, bold=True, color="FFFFFF")
font_subtitle = Font(name="Segoe UI", size=11, italic=True, color="E2E8F0")
font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
font_regular = Font(name="Segoe UI", size=10)
font_bold = Font(name="Segoe UI", size=10, bold=True)
font_code = Font(name="Consolas", size=9)

thin_border = Border(
    left=Side(style='thin', color=BORDER_COLOR),
    right=Side(style='thin', color=BORDER_COLOR),
    top=Side(style='thin', color=BORDER_COLOR),
    bottom=Side(style='thin', color=BORDER_COLOR)
)

# ==============================================================================
# TAB 1: STEP-BY-STEP LEARNING CHECKLIST & PROGRESS TRACKER
# ==============================================================================
ws1 = wb.active
ws1.title = "Step-by-Step Checklist"
ws1.views.sheetView[0].showGridLines = True

# 1. Main Title
ws1.merge_cells("A1:H1")
ws1["A1"] = "🎓 School Management System — Learning & Development Checklist"
ws1["A1"].font = font_title
ws1["A1"].fill = PatternFill(start_color=PRIMARY_COLOR, end_color=PRIMARY_COLOR, fill_type="solid")
ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[1].height = 42

# 2. Subtitle
ws1.merge_cells("A2:H2")
ws1["A2"] = "Full-Stack Project: C++ Backend (REST API) + Supabase (Cloud PostgreSQL) + React Frontend (Vite)"
ws1["A2"].font = font_subtitle
ws1["A2"].fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
ws1["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[2].height = 24

# 3. Summary KPI Cards
summary_labels = ["Total Tasks", "Not Started", "In Progress", "Completed", "High Priority", "Medium Priority", "Optional", "Completion %"]
summary_formulas = [
    '=COUNTA(B6:B39)',
    '=COUNTIF(G6:G39, "Not Started")',
    '=COUNTIF(G6:G39, "In Progress")',
    '=COUNTIF(G6:G39, "Completed")',
    '=COUNTIF(F6:F39, "High")',
    '=COUNTIF(F6:F39, "Medium")',
    '=COUNTIF(F6:F39, "Optional")',
    '=IFERROR(D4/A4, 0)'
]

ws1.row_dimensions[3].height = 18
ws1.row_dimensions[4].height = 24
for col_idx, (lbl, formula) in enumerate(zip(summary_labels, summary_formulas), start=1):
    c_lbl = ws1.cell(row=3, column=col_idx, value=lbl)
    c_lbl.font = Font(name="Segoe UI", size=8, bold=True, color="64748B")
    c_lbl.alignment = Alignment(horizontal="center", vertical="center")
    
    c_val = ws1.cell(row=4, column=col_idx, value=formula)
    c_val.font = Font(name="Segoe UI", size=12, bold=True, color=PRIMARY_COLOR)
    c_val.fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
    c_val.alignment = Alignment(horizontal="center", vertical="center")
    c_val.border = thin_border
    if col_idx == 8:
        c_val.number_format = '0.0%'

# 4. Table Headers
headers = [
    "Phase", 
    "Step ID", 
    "Task / Topic Name", 
    "Description & Key Learning Objectives", 
    "Tech & Libraries", 
    "Priority", 
    "Status", 
    "My Notes / Questions"
]

ws1.row_dimensions[5].height = 28
for col_idx, h in enumerate(headers, start=1):
    c = ws1.cell(row=5, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color=ACCENT_BLUE, end_color=ACCENT_BLUE, fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = thin_border

# 5. Checklist Data (Updated with Fees & Salaries)
checklist_data = [
    # Phase 1: Environment & Architecture Setup
    ("Phase 1: Setup & Tools", "1.1", "C++ Compiler & Build System Setup", "Verify GCC (MinGW) / compiler. Understand C++ compilation, linking, WinSock2, and include paths.", "GCC, WinSock2 / C++14", "High", "Completed", "Verified working with C++14 & WinSock2 on current GCC!"),
    ("Phase 1: Setup & Tools", "1.2", "Supabase Account & Project Creation", "Create Supabase project. Obtain PostgreSQL direct/pooler URI, API URL, Anon Key, and Service Role Key.", "Supabase Cloud, PostgreSQL", "High", "Completed", "Project initialized: xzmirtkasmtuadvyslri & .env created!"),
    ("Phase 1: Setup & Tools", "1.3", "C++ PostgreSQL / Supabase Connector Setup", "Setup WinINet HTTPS SSL connection to Supabase PostgREST in C++.", "WinINet / SSL / C++14", "High", "Completed", "C++ DatabaseClient tested & fetching live Supabase data!"),
    ("Phase 1: Setup & Tools", "1.4", "C++ HTTP Server & REST API Setup", "Build multi-client WinSock2 HTTP server with CORS and JSON routing on port 8080.", "WinSock2, C++14", "High", "Completed", "C++ REST API Server live on http://127.0.0.1:8080!"),
    ("Phase 1: Setup & Tools", "1.5", "React + Vite Project Initialization", "Create modern React single-page app using Vite (`npm create vite@latest frontend`).", "Node.js, React, Vite", "High", "Completed", "React + Vite frontend scaffolded & dependencies installed!"),

    # Phase 2: Supabase Database Modeling & Design
    ("Phase 2: Database Design (Supabase)", "2.1", "Core Entity-Relationship (ER) Architecture", "Design schema: students, teachers, classes, subjects, attendance, grades.", "Database Modeling, ER Diagrams", "High", "Completed", "Executed Core DDL in Supabase!"),
    ("Phase 2: Database Design (Supabase)", "2.2", "Student Fees & Receipt Schema", "Create student_fees table with gross amount, discounts, fines, net payable, balance, receipt_no.", "PostgreSQL DDL / Constraints", "High", "Completed", "Created student_fees table in Supabase!"),
    ("Phase 2: Database Design (Supabase)", "2.3", "Teacher Salary & Pay-Slip Schema", "Create teacher_salaries table with basic, HRA, DA, PF, TDS, unpaid leaves, net salary, payslip_no.", "PostgreSQL DDL / Constraints", "High", "Completed", "Created teacher_salaries table in Supabase!"),
    ("Phase 2: Database Design (Supabase)", "2.4", "Seed Realistic Test Data", "Insert sample records for students, teachers, fee receipts, and teacher salary slips in Supabase.", "PostgreSQL DML / Supabase", "High", "Completed", "Seeded demo data successfully!"),
    ("Phase 2: Database Design (Supabase)", "2.5", "Row-Level Security (RLS) & Policies", "Understand Supabase RLS security model and configure policies for read/write access.", "Supabase RLS & Security", "Medium", "Completed", "Configured direct access for backend API!"),

    # Phase 3: C++ Data Access Layer (DAO Pattern)
    ("Phase 3: C++ Backend DAO", "3.1", "Configuration & Environment Management", "Create .env reader or config module in C++ to securely load Supabase credentials without hardcoding.", "C++ Config / Env", "High", "Completed", "Built config.h loading .env credentials dynamically!"),
    ("Phase 3: C++ Backend DAO", "3.2", "C++ Domain Models (Structs/Classes)", "Define C++ models: Student, Teacher, ClassSection, FeeReceipt, TeacherSalarySlip, Attendance, Grade.", "C++14 Structs / Classes", "High", "Completed", "Defined all domain structs in models.h!"),
    ("Phase 3: C++ Backend DAO", "3.3", "Supabase HTTPS Connection Client", "Implement a robust DB Connection Manager in C++ using WinINet HTTPS with SSL.", "WinINet / C++ Client", "High", "Completed", "Implemented db_client.cpp connecting to Supabase!"),
    ("Phase 3: C++ Backend DAO", "3.4", "Parameterized Prepared Queries", "Implement safe parameterized URL queries in C++ to eliminate SQL Injection risks.", "SQL Security / URL Encoding", "High", "Completed", "Tested parameterized PostgREST calls!"),
    ("Phase 3: C++ Backend DAO", "3.5", "Student & Teacher DAO (Full CRUD)", "Implement getAllStudents(), getStudentById(), addStudent(), updateStudent(), deleteStudent().", "C++ DAO Pattern", "High", "Completed", "Built full student & teacher DAO methods!"),
    ("Phase 3: C++ Backend DAO", "3.6", "Fee Receipt & Collection DAO", "Implement recordFeePayment(), getStudentReceipts(), getPendingFees(), generateReceiptNo().", "C++ Business Logic / DAO", "High", "Completed", "Built fee receipts and collection DAO!"),
    ("Phase 3: C++ Backend DAO", "3.7", "Teacher Payroll & Salary Slip DAO", "Implement generateSalarySlip(), getTeacherPaySlips(), computeSalaryCalculations().", "C++ Business Logic / DAO", "High", "Completed", "Built salary pay-slips and payroll DAO!"),
    ("Phase 3: C++ Backend DAO", "3.8", "Attendance & Gradebook Logic", "Write queries to batch-mark attendance and compute student GPA / term averages.", "C++ Business Logic", "High", "Completed", "Built attendance & grades DAO methods!"),
    ("Phase 3: C++ Backend DAO", "3.9", "C++ DAO Verification Test", "Test executable against live Supabase PostgreSQL tables.", "C++ Testing / CLI", "Medium", "Completed", "Verified live data fetching from Supabase!"),

    # Phase 4: C++ REST API Server
    ("Phase 4: C++ REST API", "4.1", "HTTP Server Lifecycle & Port Listener", "Initialize multi-client WinSock2 HTTP server listening on port 8080. Handle server shutdown cleanly.", "WinSock2 Server", "High", "Completed", "Built http_server.cpp listening on port 8080!"),
    ("Phase 4: C++ REST API", "4.2", "CORS Middleware (Cross-Origin Resource Sharing)", "Configure OPTIONS pre-flight handler and Access-Control-Allow-* headers for React frontend.", "HTTP CORS Protocols", "High", "Completed", "Enabled full CORS headers for React frontend!"),
    ("Phase 4: C++ REST API", "4.3", "JSON Serialization & Deserialization", "Format JSON responses and parse request payloads.", "JSON / C++", "High", "Completed", "Built JSON request parser & response builder!"),
    ("Phase 4: C++ REST API", "4.4", "Student & Teacher REST Endpoints", "Build `GET/POST/PUT/DELETE /api/students` and `GET/POST/PUT/DELETE /api/teachers`.", "REST API Design", "High", "Completed", "Built /api/students & /api/teachers routes!"),
    ("Phase 4: C++ REST API", "4.5", "Fee Management REST Endpoints", "Build `GET /api/fees`, `POST /api/fees/collect`, `GET /api/fees/receipt/:receipt_no`.", "REST API Design", "High", "Completed", "Built /api/fees endpoints!"),
    ("Phase 4: C++ REST API", "4.6", "Teacher Payroll REST Endpoints", "Build `GET /api/salaries`, `POST /api/salaries/generate`, `GET /api/salaries/payslip/:id`.", "REST API Design", "High", "Completed", "Built /api/salaries endpoints!"),
    ("Phase 4: C++ REST API", "4.7", "Attendance & Grades REST Endpoints", "Build `GET/POST /api/attendance` and `GET/POST /api/grades` endpoints.", "REST API Design", "High", "Completed", "Built /api/attendance & /api/grades endpoints!"),
    ("Phase 4: C++ REST API", "4.8", "Standardized Error Responses & HTTP Statuses", "Ensure 200 OK, 201 Created, 400 Bad Request, 404 Not Found formatted as JSON.", "HTTP Error Standards", "Medium", "Completed", "Configured standardized HTTP responses!"),

    # Phase 5: React Frontend Development
    ("Phase 5: React Frontend", "5.1", "Design System, Navigation & Layout", "Create modern dark/light responsive layout: Sidebar, Header, Breadcrumbs, and content viewport.", "React, CSS Grid / Flexbox", "High", "Completed", "Built glassmorphism sidebar, tabs, and layout!"),
    ("Phase 5: React Frontend", "5.2", "API Client Service Module (`api.js`)", "Build centralized API service using Fetch with baseURL, error parsing, and JSON support.", "Fetch API / REST", "High", "Completed", "Centralized API service in api.js with robust error parsing!"),
    ("Phase 5: React Frontend", "5.3", "Dashboard Metrics & Statistics Page", "Create KPI overview cards (Total Students, Total Fees Collected, Salaries Paid).", "React Hooks (useState, useEffect)", "High", "Completed", "Live KPI metrics updating in real time!"),
    ("Phase 5: React Frontend", "5.4", "Student Directory & Management Modal", "Data table with real-time search, filter by class, Add Student Modal with validation, and Delete.", "React Components, Controlled Forms", "High", "Completed", "Full directory with live search and delete!"),
    ("Phase 5: React Frontend", "5.5", "Teacher Management Page", "Faculty profile cards, subject assignments, and add/edit teacher directory.", "React Components", "Medium", "Completed", "Faculty directory live with Supabase sync!"),
    ("Phase 5: React Frontend", "5.6", "Student Fee Collection & Receipt Generator", "Fee payment collection modal, live calculation of discount/fines, and printable official receipt slip.", "React Components / PDF Print", "High", "Completed", "Printable fee receipt slips working!"),
    ("Phase 5: React Frontend", "5.7", "Teacher Payroll & Salary Slip Generator", "Monthly salary generation matrix, earnings vs deductions calculation, and printable salary pay-slip.", "React Components / PDF Print", "High", "Completed", "Printable salary pay-slips working!"),
    ("Phase 5: React Frontend", "5.8", "Attendance Roll-Call Tracker", "Daily student attendance marking checklist with batch toggle (Present/Absent/Late) and save.", "React State Management", "High", "Completed", "Attendance tracker module live!"),
    ("Phase 5: React Frontend", "5.9", "Grades & Report Card Viewer", "Subject marks entry form, calculated percentages/grades, and printable student report card.", "React Components", "High", "Completed", "Gradebook module live!"),
    ("Phase 5: React Frontend", "5.10", "Excel Database Studio & Multi-Sheet Manager", "Create multi-sheet workbooks, export DB to Excel, and bulk import 100+ to thousands of rows into Supabase with upsert.", "xlsx, Supabase PostgREST Upsert", "High", "Completed", "Bulk upload & multi-sheet manager live!"),

    # Phase 6: Integration, Polish & Enhancements
    ("Phase 6: Integration & Polish", "6.1", "End-to-End Integration Testing", "Test complete lifecycle: React UI -> C++ REST API -> Supabase PostgreSQL DB -> Instant UI refresh.", "E2E Testing & Verification", "High", "Completed", "All 103+ records live and syncing across Dashboard & Directory!"),
    ("Phase 6: Integration & Polish", "6.2", "Input Validation & Latency Handling", "Form validation on frontend & backend (prevent duplicate roll numbers, empty names, invalid emails).", "Data Integrity & Validation", "Medium", "Completed", "Upsert resolution merge-duplicates enabled on all entities!"),
    ("Phase 6: Integration & Polish", "6.3", "Optional: Supabase Auth / Role-based Access", "Implement login screen for Admin vs Teacher vs Student with JWT authentication.", "Supabase Auth / JWT", "Optional", "Not Started", ""),
    ("Phase 6: Integration & Polish", "6.4", "Optional: Export to CSV / PDF", "Export student fee ledger and teacher payroll summaries as CSV or printable PDF documents.", "File Exporting", "Optional", "Completed", "Multi-sheet Excel export active in Excel Studio!")
]

# Write checklist rows
for idx, row_data in enumerate(checklist_data, start=6):
    ws1.row_dimensions[idx].height = 24
    fill_color = LIGHT_ZEBRA if idx % 2 == 0 else PURE_WHITE
    row_fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    
    for col_idx, val in enumerate(row_data, start=1):
        cell = ws1.cell(row=idx, column=col_idx, value=val)
        cell.fill = row_fill
        cell.border = thin_border
        cell.font = font_regular
        
        # Alignments
        if col_idx in [1, 3, 4, 5, 8]:
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        else:
            cell.alignment = Alignment(horizontal="center", vertical="center")
            
        if col_idx == 2:
            cell.font = font_bold
        elif col_idx == 6: # Priority styling
            if val == "High":
                cell.font = Font(name="Segoe UI", size=10, bold=True, color="DC2626")
            elif val == "Medium":
                cell.font = Font(name="Segoe UI", size=10, bold=True, color="D97706")
            else:
                cell.font = Font(name="Segoe UI", size=10, italic=True, color="64748B")
        elif col_idx == 7: # Status styling
            if val == "Completed":
                cell.font = Font(name="Segoe UI", size=10, bold=True, color="059669")

# Add Dropdown Data Validations
dv_status = DataValidation(type="list", formula1='"Not Started,In Progress,Completed,Blocked"', allow_blank=True)
ws1.add_data_validation(dv_status)
dv_status.add(f"G6:G{len(checklist_data)+5}")

dv_priority = DataValidation(type="list", formula1='"High,Medium,Optional"', allow_blank=True)
ws1.add_data_validation(dv_priority)
dv_priority.add(f"F6:F{len(checklist_data)+5}")


# ==============================================================================
# TAB 2: ARCHITECTURE & SYSTEM SPECIFICATIONS
# ==============================================================================
ws2 = wb.create_sheet(title="Architecture & Tech Stack")
ws2.views.sheetView[0].showGridLines = True

# Title Header
ws2.merge_cells("A1:E1")
ws2["A1"] = "🏛️ System Architecture & Technology Breakdown"
ws2["A1"].font = font_title
ws2["A1"].fill = PatternFill(start_color=TEAL_HEADER, end_color=TEAL_HEADER, fill_type="solid")
ws2["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws2.row_dimensions[1].height = 40

# Tech Stack Section
ws2.merge_cells("A3:E3")
ws2["A3"] = "1. Full-Stack Layer Specification"
ws2["A3"].font = Font(name="Segoe UI", size=12, bold=True, color=TEAL_HEADER)

arch_headers = ["Layer", "Technology / Library", "Role in System", "Key Learning Takeaways"]
ws2.row_dimensions[4].height = 26
for col_idx, h in enumerate(arch_headers, start=1):
    c = ws2.cell(row=4, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color=ACCENT_TEAL, end_color=ACCENT_TEAL, fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

arch_rows = [
    ("Frontend UI", "React (Vite) + CSS3", "Modern responsive Single Page App", "Component structure, state hooks, props, responsive dashboards"),
    ("API Client", "Fetch API / Axios", "HTTP client calling C++ backend", "Asynchronous promises, error interceptors, headers, CORS handling"),
    ("Backend Core", "C++ (C++14 / C++17)", "High-performance business logic & controllers", "Modern C++ memory management, smart pointers, structs, DAO pattern"),
    ("HTTP Web Server", "cpp-httplib / WinSock2", "Lightweight C++ REST API Server", "HTTP routing, request dispatching, CORS headers, status codes"),
    ("JSON Engine", "nlohmann/json", "JSON parsing & serialization", "Modern C++ JSON manipulation, object serialization macros"),
    ("Cloud Database", "Supabase (PostgreSQL 15+)", "Persistent relational storage in the cloud", "Relational database modeling, SQL DDL/DML, Foreign Keys, RLS"),
    ("Receipt & Slip Engine", "React Printable Slips", "Generate printable fee receipts and salary slips", "CSS @media print styling, calculated financial breakdowns")
]

for r_idx, r_data in enumerate(arch_rows, start=5):
    ws2.row_dimensions[r_idx].height = 24
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws2.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

# Database Tables Overview
ws2.merge_cells("A14:E14")
ws2["A14"] = "2. Complete Database Table Blueprint (All 8 Tables)"
ws2["A14"].font = Font(name="Segoe UI", size=12, bold=True, color=TEAL_HEADER)

table_headers = ["Table Name", "Primary Key", "Foreign Keys", "Key Columns", "Description"]
ws2.row_dimensions[15].height = 26
for col_idx, h in enumerate(table_headers, start=1):
    c = ws2.cell(row=15, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color=TEAL_HEADER, end_color=TEAL_HEADER, fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

table_rows = [
    ("students", "id (BIGSERIAL PK)", "class_id -> classes(id)", "roll_number (UNIQUE), first_name, last_name, email, phone, dob, created_at", "Student profiles and academic registration"),
    ("teachers", "id (BIGSERIAL PK)", "None", "employee_id (UNIQUE), first_name, last_name, email, phone, qualification, created_at", "Faculty and staff details"),
    ("classes", "id (BIGSERIAL PK)", "teacher_id -> teachers(id)", "class_name, section, academic_year", "Classroom divisions (e.g. Grade 10 - Section A)"),
    ("subjects", "id (BIGSERIAL PK)", "None", "subject_code (UNIQUE), subject_name, credits", "Courses taught in curriculum"),
    ("attendance", "id (BIGSERIAL PK)", "student_id -> students(id)", "date, status ('Present', 'Absent', 'Late'), remarks, created_at", "Daily attendance roll-call records"),
    ("grades", "id (BIGSERIAL PK)", "student_id -> students(id), subject_id -> subjects(id)", "exam_term ('Midterm', 'Final'), marks_obtained, max_marks, remarks", "Subject examination marks and GPA records"),
    ("student_fees", "id (BIGSERIAL PK)", "student_id -> students(id)", "receipt_no (UNIQUE), gross_amount, discount_amount, late_fine, net_payable, amount_paid, balance_due, payment_status, payment_method", "Fee collection records and printable receipt generation"),
    ("teacher_salaries", "id (BIGSERIAL PK)", "teacher_id -> teachers(id)", "payslip_no (UNIQUE), salary_month, salary_year, basic_salary, hra, da, pf, tds, leave_deduction, gross_earnings, total_deductions, net_salary", "Payroll management and monthly teacher pay-slips")
]

for r_idx, r_data in enumerate(table_rows, start=16):
    ws2.row_dimensions[r_idx].height = 24
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws2.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)


# ==============================================================================
# TAB 3: FEES & SALARY SCHEMAS & RECEIPTS (NEW DEDICATED TAB!)
# ==============================================================================
ws3 = wb.create_sheet(title="Fees & Salaries (Slips)")
ws3.views.sheetView[0].showGridLines = True

# Title Header
ws3.merge_cells("A1:D1")
ws3["A1"] = "💵 Student Fee Receipts & Teacher Salary Pay-Slips Blueprint"
ws3["A1"].font = font_title
ws3["A1"].fill = PatternFill(start_color=EMERALD_HEADER, end_color=EMERALD_HEADER, fill_type="solid")
ws3["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws3.row_dimensions[1].height = 40

# Section 1: Fee Slip Breakdown
ws3.merge_cells("A3:D3")
ws3["A3"] = "1. Student Fee Slip / Receipt Data Structure"
ws3["A3"].font = Font(name="Segoe UI", size=12, bold=True, color=EMERALD_HEADER)

fee_slip_headers = ["Field Name", "Data Type", "Role in Receipt Generation", "Example Receipt Value"]
ws3.row_dimensions[4].height = 26
for col_idx, h in enumerate(fee_slip_headers, start=1):
    c = ws3.cell(row=4, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color=ACCENT_EMERALD, end_color=ACCENT_EMERALD, fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

fee_slip_rows = [
    ("receipt_no", "VARCHAR(50) UNIQUE", "Official Receipt Reference ID printed at top of slip", "REC-2026-00101"),
    ("student_id", "BIGINT FK -> students(id)", "Fetches Student Name, Roll No, Class, and Parent details", "1 (Alex Johnson - Grade 10A)"),
    ("academic_year & term_name", "VARCHAR(20), VARCHAR(50)", "Academic session and fee period", "2026-2027 / Term 1"),
    ("fee_category", "VARCHAR(50)", "Head of Account / Purpose", "Tuition & Laboratory Fee"),
    ("gross_amount", "NUMERIC(10,2)", "Base fee amount before discounts or penalties", "₹ 30,000.00"),
    ("discount_amount", "NUMERIC(10,2)", "Scholarship / sibling concession deducted", "₹ 2,000.00"),
    ("late_fine", "NUMERIC(10,2)", "Late fee penalty added if paid after due date", "₹ 0.00"),
    ("net_payable", "NUMERIC(10,2)", "Formula: (gross_amount - discount_amount + late_fine)", "₹ 28,000.00"),
    ("amount_paid", "NUMERIC(10,2)", "Amount actually received from student/parent", "₹ 28,000.00"),
    ("balance_due", "NUMERIC(10,2)", "Formula: (net_payable - amount_paid)", "₹ 0.00 (Fully Settled)"),
    ("payment_status", "VARCHAR(20)", "Status indicator on receipt ('Paid', 'Partial', 'Overdue')", "Paid"),
    ("payment_method & transaction_ref", "VARCHAR(50), VARCHAR(100)", "Mode of payment (UPI/Card/Cash) & Bank reference", "UPI / QR (Ref: UPI/20260901/7839210)"),
    ("received_by & payment_date", "VARCHAR(100), TIMESTAMP", "Cashier/Admin signature line & payment timestamp", "Finance Desk 1 / Sep 05, 2026 11:30 AM")
]

for r_idx, r_data in enumerate(fee_slip_rows, start=5):
    ws3.row_dimensions[r_idx].height = 22
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws3.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

# Section 2: Teacher Salary Pay-Slip Breakdown
ws3.merge_cells("A19:D19")
ws3["A19"] = "2. Teacher Salary Pay-Slip Data Structure"
ws3["A19"].font = Font(name="Segoe UI", size=12, bold=True, color=EMERALD_HEADER)

salary_slip_headers = ["Field Name", "Data Type", "Role in Pay-Slip Generation", "Example Pay-Slip Value"]
ws3.row_dimensions[20].height = 26
for col_idx, h in enumerate(salary_slip_headers, start=1):
    c = ws3.cell(row=20, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color=ACCENT_EMERALD, end_color=ACCENT_EMERALD, fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

salary_slip_rows = [
    ("payslip_no", "VARCHAR(50) UNIQUE", "Official Pay-Slip Reference ID printed on top right", "PAY-2026-AUG-01"),
    ("teacher_id", "BIGINT FK -> teachers(id)", "Fetches Teacher Name, Employee ID, Subject & Designation", "1 (Robert Miller - Mathematics)"),
    ("salary_month & salary_year", "VARCHAR(20), INT", "Salary pay period", "August 2026"),
    ("working_days & leaves_taken", "INT, INT", "Attendance section: Working days vs Present vs Unpaid Leaves", "31 Days Worked / 0 Leaves"),
    ("basic_salary (Earnings)", "NUMERIC(10,2)", "Base contract salary", "₹ 45,000.00"),
    ("hra_allowance (Earnings)", "NUMERIC(10,2)", "House Rent Allowance", "₹ 12,000.00"),
    ("da_allowance (Earnings)", "NUMERIC(10,2)", "Dearness Allowance", "₹ 8,000.00"),
    ("medical & special_bonus (Earnings)", "NUMERIC(10,2)", "Medical allowance and performance bonus", "₹ 3,000.00 + ₹ 2,000.00"),
    ("gross_earnings", "NUMERIC(10,2)", "Total Gross Earnings = Basic + HRA + DA + Medical + Bonus", "₹ 70,000.00"),
    ("provident_fund (Deductions)", "NUMERIC(10,2)", "PF retirement contribution deduction", "₹ 4,000.00"),
    ("tax_deducted_tds (Deductions)", "NUMERIC(10,2)", "Income Tax TDS deduction", "₹ 2,500.00"),
    ("leave_deduction (Deductions)", "NUMERIC(10,2)", "Salary deducted for unpaid absence", "₹ 0.00"),
    ("total_deductions", "NUMERIC(10,2)", "Total Deductions = PF + TDS + Leave Deductions", "₹ 6,500.00"),
    ("net_salary", "NUMERIC(10,2)", "Net Take-Home Pay = (Gross Earnings - Total Deductions)", "₹ 63,500.00"),
    ("payment_method & bank_account_last4", "VARCHAR(50), VARCHAR(10)", "Bank transfer method & masked account number", "Direct Bank Transfer (A/C: XXXX-5678)"),
    ("transaction_ref & payment_date", "VARCHAR(100), TIMESTAMP", "Bank NEFT/RTGS transaction ID & payment timestamp", "NEFT-HDFC-99887711 / Aug 31, 2026")
]

for r_idx, r_data in enumerate(salary_slip_rows, start=21):
    ws3.row_dimensions[r_idx].height = 22
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws3.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)


# ==============================================================================
# TAB 4: COMPLETE COPY-PASTE SQL SCRIPTS FOR SUPABASE
# ==============================================================================
ws4 = wb.create_sheet(title="Supabase SQL Scripts")
ws4.views.sheetView[0].showGridLines = True

ws4.merge_cells("A1:B1")
ws4["A1"] = "⚡ Complete Executable SQL Scripts for Supabase SQL Editor"
ws4["A1"].font = font_title
ws4["A1"].fill = PatternFill(start_color="475569", end_color="475569", fill_type="solid") # Slate Dark
ws4["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws4.row_dimensions[1].height = 40

ws4.cell(row=3, column=1, value="Section").font = font_header
ws4.cell(row=3, column=1).fill = PatternFill(start_color="64748B", end_color="64748B", fill_type="solid")
ws4.cell(row=3, column=2, value="SQL DDL & DML Code (Run in Supabase Dashboard -> SQL Editor)").font = font_header
ws4.cell(row=3, column=2).fill = PatternFill(start_color="64748B", end_color="64748B", fill_type="solid")
ws4.row_dimensions[3].height = 26

sql_snippets = [
    ("1. Core Tables DDL (Teachers, Classes, Students, Subjects, Attendance, Grades)", """-- 1. Create Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    qualification VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_name, section, academic_year)
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    credits INT DEFAULT 3
);

-- 5. Create Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late')),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 6. Create Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_term VARCHAR(50) NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"""),

    ("2. Fees & Salary Slips DDL (student_fees, teacher_salaries)", """-- 7. Create Student Fee Receipts Table
CREATE TABLE IF NOT EXISTS student_fees (
    id BIGSERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    term_name VARCHAR(50) NOT NULL DEFAULT 'Term 1',
    fee_category VARCHAR(50) NOT NULL,
    gross_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    late_fine NUMERIC(10,2) DEFAULT 0.00,
    net_payable NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('Paid', 'Partial', 'Pending', 'Overdue')) DEFAULT 'Pending',
    payment_method VARCHAR(50),
    transaction_ref VARCHAR(100),
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(100) DEFAULT 'Admin Office',
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Teacher Salary Pay-Slips Table
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id BIGSERIAL PRIMARY KEY,
    payslip_no VARCHAR(50) UNIQUE NOT NULL,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    salary_month VARCHAR(20) NOT NULL,
    salary_year INT NOT NULL DEFAULT 2026,
    total_working_days INT NOT NULL DEFAULT 30,
    days_present INT NOT NULL DEFAULT 30,
    leaves_taken INT NOT NULL DEFAULT 0,
    basic_salary NUMERIC(10,2) NOT NULL,
    hra_allowance NUMERIC(10,2) DEFAULT 0.00,
    da_allowance NUMERIC(10,2) DEFAULT 0.00,
    medical_allowance NUMERIC(10,2) DEFAULT 0.00,
    special_bonus NUMERIC(10,2) DEFAULT 0.00,
    gross_earnings NUMERIC(10,2) NOT NULL,
    provident_fund NUMERIC(10,2) DEFAULT 0.00,
    tax_deducted_tds NUMERIC(10,2) DEFAULT 0.00,
    leave_deduction NUMERIC(10,2) DEFAULT 0.00,
    total_deductions NUMERIC(10,2) NOT NULL,
    net_salary NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('Paid', 'Pending', 'Processing')) DEFAULT 'Pending',
    payment_method VARCHAR(50) DEFAULT 'Direct Bank Transfer',
    bank_account_last4 VARCHAR(10),
    payment_date TIMESTAMP WITH TIME ZONE,
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, salary_month, salary_year)
);"""),

    ("3. Seed Demo Data (Students, Teachers, Classes, Fees, Salaries)", """-- Seed Sample Teachers & Classes
INSERT INTO teachers (employee_id, first_name, last_name, email, phone, qualification) VALUES
('TCH-001', 'Robert', 'Miller', 'robert.miller@school.edu', '555-0101', 'M.Sc. Mathematics'),
('TCH-002', 'Sarah', 'Connor', 'sarah.connor@school.edu', '555-0102', 'Ph.D. Physics'),
('TCH-003', 'Emily', 'Davis', 'emily.davis@school.edu', '555-0103', 'M.A. English')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO classes (class_name, section, teacher_id, academic_year) VALUES
('Grade 10', 'A', 1, '2026-2027'),
('Grade 10', 'B', 2, '2026-2027'),
('Grade 11', 'A', 3, '2026-2027')
ON CONFLICT (class_name, section, academic_year) DO NOTHING;

-- Seed Sample Students
INSERT INTO students (roll_number, first_name, last_name, email, phone, dob, class_id) VALUES
('STU-1001', 'Alex', 'Johnson', 'alex.j@student.edu', '555-1101', '2008-04-12', 1),
('STU-1002', 'Sophia', 'Williams', 'sophia.w@student.edu', '555-1102', '2008-09-21', 1),
('STU-1003', 'Liam', 'Brown', 'liam.b@student.edu', '555-1103', '2008-01-15', 2),
('STU-1004', 'Emma', 'Jones', 'emma.j@student.edu', '555-1104', '2008-07-30', 2)
ON CONFLICT (roll_number) DO NOTHING;

-- Seed Sample Fee Receipts
INSERT INTO student_fees 
(receipt_no, student_id, academic_year, term_name, fee_category, gross_amount, discount_amount, late_fine, net_payable, amount_paid, balance_due, payment_status, payment_method, transaction_ref, due_date, payment_date, received_by)
VALUES
('REC-2026-001', 1, '2026-2027', 'Term 1', 'Tuition & Lab Fee', 30000.00, 2000.00, 0.00, 28000.00, 28000.00, 0.00, 'Paid', 'UPI / QR', 'UPI/20260901/7839210', '2026-09-10', '2026-09-05 11:30:00+00', 'Finance Desk 1'),
('REC-2026-002', 2, '2026-2027', 'Term 1', 'Tuition & Lab Fee', 30000.00, 0.00, 0.00, 30000.00, 15000.00, 15000.00, 'Partial', 'Debit/Credit Card', 'CARD-TXN-99881', '2026-09-10', '2026-09-08 14:15:00+00', 'Finance Desk 2'),
('REC-2026-003', 3, '2026-2027', 'Term 1', 'Tuition & Transport', 35000.00, 0.00, 500.00, 35500.00, 0.00, 35500.00, 'Overdue', NULL, NULL, '2026-09-01', NULL, 'Finance Desk 1')
ON CONFLICT (receipt_no) DO NOTHING;

-- Seed Sample Teacher Salary Pay-Slips
INSERT INTO teacher_salaries
(payslip_no, teacher_id, salary_month, salary_year, total_working_days, days_present, leaves_taken, basic_salary, hra_allowance, da_allowance, medical_allowance, special_bonus, gross_earnings, provident_fund, tax_deducted_tds, leave_deduction, total_deductions, net_salary, payment_status, payment_method, bank_account_last4, payment_date, transaction_ref)
VALUES
('PAY-2026-AUG-01', 1, 'August', 2026, 31, 31, 0, 45000.00, 12000.00, 8000.00, 3000.00, 2000.00, 70000.00, 4000.00, 2500.00, 0.00, 6500.00, 63500.00, 'Paid', 'Direct Bank Transfer', '5678', '2026-08-31 10:00:00+00', 'NEFT-HDFC-99887711'),
('PAY-2026-AUG-02', 2, 'August', 2026, 31, 30, 1, 50000.00, 15000.00, 9000.00, 3000.00, 0.00, 77000.00, 4500.00, 3200.00, 1000.00, 8700.00, 68300.00, 'Paid', 'Direct Bank Transfer', '9012', '2026-08-31 10:00:00+00', 'NEFT-SBI-44556622')
ON CONFLICT (teacher_id, salary_month, salary_year) DO NOTHING;""")
]

for row_idx, (sec_name, sql_code) in enumerate(sql_snippets, start=4):
    ws4.row_dimensions[row_idx].height = 200
    
    c1 = ws4.cell(row=row_idx, column=1, value=sec_name)
    c1.font = font_bold
    c1.border = thin_border
    c1.alignment = Alignment(horizontal="center", vertical="top")
    c1.fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    
    c2 = ws4.cell(row=row_idx, column=2, value=sql_code)
    c2.font = font_code
    c2.border = thin_border
    c2.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    c2.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")


# ==============================================================================
# TAB 5: ROLE-BASED ACCESS CONTROL (RBAC) & MULTI-PORTAL PLAN
# ==============================================================================
ws5 = wb.create_sheet(title="Role-Based Auth & Access Plan")
ws5.views.sheetView[0].showGridLines = True

# 1. Main Title
ws5.merge_cells("A1:F1")
ws5["A1"] = "🔐 Role-Based Access Control (RBAC) & Multi-Role Authentication Plan"
ws5["A1"].font = font_title
ws5["A1"].fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
ws5["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws5.row_dimensions[1].height = 40

# 2. Subtitle
ws5.merge_cells("A2:F2")
ws5["A2"] = "Secure Login System: Student Personal Portal • Teacher Evaluation & Payroll Portal • Admin Master Console"
ws5["A2"].font = font_subtitle
ws5["A2"].fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
ws5["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws5.row_dimensions[2].height = 24

# 3. KPI Cards
kpi_labels = ["Total User Roles", "Student Portal Scope", "Teacher Portal Scope", "Admin Console Scope", "Security Model", "Status"]
kpi_values = ["3 Distinct Roles", "Own Fees, Grades, Attendance & Timetable", "Own Salary, Student Remarks (No Add/Remove)", "Full System Master Control", "Role-Based Token / Session RBAC", "Planned & Ready"]

ws5.row_dimensions[3].height = 18
ws5.row_dimensions[4].height = 24
for col_idx, (lbl, val) in enumerate(zip(kpi_labels, kpi_values), start=1):
    c_lbl = ws5.cell(row=3, column=col_idx, value=lbl)
    c_lbl.font = Font(name="Segoe UI", size=8, bold=True, color="64748B")
    c_lbl.alignment = Alignment(horizontal="center", vertical="center")
    
    c_val = ws5.cell(row=4, column=col_idx, value=val)
    c_val.font = Font(name="Segoe UI", size=10, bold=True, color="1E3A8A")
    c_val.fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
    c_val.alignment = Alignment(horizontal="center", vertical="center")
    c_val.border = thin_border

# Section 1: Role Permissions & Access Control Matrix
ws5.merge_cells("A6:F6")
ws5["A6"] = "1. Role Permissions & Feature Access Matrix (RBAC)"
ws5["A6"].font = Font(name="Segoe UI", size=12, bold=True, color="1E3A8A")

matrix_headers = ["Portal / User Role", "Authentication Method", "Permitted Features & Data Scope", "Restricted / Forbidden Actions", "Navigation Items Available", "Database Data Security Filter"]
ws5.row_dimensions[7].height = 26
for col_idx, h in enumerate(matrix_headers, start=1):
    c = ws5.cell(row=7, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

matrix_rows = [
    ("Student Portal\n(role: 'student')", 
     "Username / Roll Number + Password\n(FK: student_id)", 
     "• View own fee receipts & installment payment history\n• Check current outstanding fee balance\n• View own semester grades, report card & marks\n• Track personal daily attendance & percentage\n• View weekly class timetable & assigned subject faculty", 
     "• CANNOT view other students' records or fees\n• CANNOT modify, delete, or create any record\n• CANNOT view faculty payroll, salaries, or admissions\n• Strictly Read-Only personal dashboard", 
     "1. My Overview / Profile\n2. My Fee Receipts & Dues\n3. My Grades & Report Card\n4. My Attendance Records\n5. Class Timetable & Teachers", 
     "WHERE student_id = :authenticated_student_id\n(Enforced at API and Database query level)"),

    ("Faculty / Teacher Portal\n(role: 'teacher')", 
     "Employee ID / Email + Password\n(FK: teacher_id)", 
     "• View own monthly salary pay-slips & annual payroll ledger\n• View assigned students directory (roll no, name, class)\n• Enter & update student progress remarks / feedback\n• View personal teaching schedule & assigned classes\n• Check student attendance in assigned classes", 
     "• CANNOT add, enroll, or remove/delete students\n• CANNOT modify student fees or collect payments\n• CANNOT view other teachers' salaries\n• CANNOT access Excel Database Studio or system configs", 
     "1. Faculty Dashboard\n2. My Salary Pay-Slips\n3. Assigned Students Directory\n4. Student Progress Remarks\n5. My Teaching Schedule", 
     "WHERE teacher_id = :authenticated_teacher_id (for salaries)\nWHERE class_id IN (teacher_classes) (for students)"),

    ("Administrator Console\n(role: 'admin')", 
     "Admin Username / Email + Password\n(Superuser privileges)", 
     "• Complete master management across entire school\n• Student directory: Add, edit, bulk import, delete\n• Faculty directory: Add, manage, assign classes\n• Fee collection: Multi-installment receipts & slips\n• Payroll processing: Disburse monthly faculty salaries\n• Excel Database Studio: 1-click bulk import & export", 
     "• No restrictions (Superuser / Management level access)", 
     "1. Master Dashboard KPIs\n2. Student Directory\n3. Faculty & Staff\n4. Fee Receipts & Installments\n5. Faculty Payroll & Pay-Slips\n6. Excel Database Studio", 
     "Full read/write access across all system tables without filter restriction")
]

for r_idx, r_data in enumerate(matrix_rows, start=8):
    ws5.row_dimensions[r_idx].height = 80
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws5.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_bold if c_idx == 1 else font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

# Section 2: Database Schema & Authentication Tables
ws5.merge_cells("A12:F12")
ws5["A12"] = "2. Database Schema for Authentication & RBAC Support"
ws5["A12"].font = Font(name="Segoe UI", size=12, bold=True, color="1E3A8A")

db_headers = ["Table Name", "Primary Key", "Foreign Keys", "Key Columns & Constraints", "Role in RBAC System", "Target Access Role"]
ws5.row_dimensions[13].height = 26
for col_idx, h in enumerate(db_headers, start=1):
    c = ws5.cell(row=13, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

db_rows = [
    ("users\n(Central Auth)", "id BIGSERIAL", "student_id -> students(id)\nteacher_id -> teachers(id)", "username (UNIQUE), email (UNIQUE), password_hash,\nrole CHECK (role IN ('admin','teacher','student')),\nstatus ('active','inactive'), last_login_at", "Master authentication store with hashed credentials and role assignment linking to student/teacher profile.", "Admin / Teacher / Student (Login Entry)"),
    ("student_progress_remarks\n(Evaluation)", "id BIGSERIAL", "student_id -> students(id)\nteacher_id -> teachers(id)", "academic_term, subject_name, performance_level,\nremark_text TEXT NOT NULL, created_at", "Allows teachers to write evaluation remarks for students without granting them add/delete permissions for students.", "Teacher (Write/Read),\nStudent (Read-Only)"),
    ("student_grades_results\n(Academic Results)", "id BIGSERIAL", "student_id -> students(id)", "subject_name, exam_type (Midterm/Final), marks_obtained,\nmax_marks (100.00), grade (A+, A, B, etc.), academic_year", "Stores course examination grades and terminal marks for student personal report card view.", "Admin/Teacher (Manage),\nStudent (Read-Only)"),
    ("subject_teachers_timetable\n(Class Schedule)", "id BIGSERIAL", "class_id -> classes(id)\nteacher_id -> teachers(id)", "subject_name, day_of_week (Monday..Friday),\nstart_time, end_time, room_number", "Connects subjects with teachers and class timings so students view assigned faculty and lecture schedule.", "Admin (Manage),\nTeacher & Student (Read-Only)")
]

for r_idx, r_data in enumerate(db_rows, start=14):
    ws5.row_dimensions[r_idx].height = 46
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws5.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_bold if c_idx in [1, 2] else font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

# Section 3: Implementation Steps & Execution Plan
ws5.merge_cells("A19:F19")
ws5["A19"] = "3. Step-by-Step Execution Plan & Milestones"
ws5["A19"].font = Font(name="Segoe UI", size=12, bold=True, color="1E3A8A")

step_headers = ["Step ID", "Phase", "Milestone / Implementation Task", "Scope & Deliverables", "Target Files", "Priority"]
ws5.row_dimensions[20].height = 26
for col_idx, h in enumerate(step_headers, start=1):
    c = ws5.cell(row=20, column=col_idx, value=h)
    c.font = font_header
    c.fill = PatternFill(start_color="065F46", end_color="065F46", fill_type="solid")
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border

step_rows = [
    ("AUTH-01", "Database Migration", "Create Auth & RBAC Tables in Supabase", "Run SQL DDL for users, student_progress_remarks, student_grades, subject_teachers_timetable", "Supabase SQL Editor / models.h", "High"),
    ("AUTH-02", "Data Seeding", "Seed Default Role Accounts & Test Credentials", "Create Admin account, 3 Teacher accounts (TCH-001..003), and 3 Student accounts (STU-1001..1005)", "SQL Seed Script / Checklist", "High"),
    ("AUTH-03", "Backend Core", "Implement C++ Login REST Endpoint", "Add POST /api/auth/login validating username/password and returning user role, token & profile ID", "backend/src/http_server.cpp", "High"),
    ("AUTH-04", "Frontend UI", "Build Authentication Login Screen & Demo Switcher", "Glassmorphism Login page with role switcher tabs (Student / Teacher / Admin) and 1-click test fill", "frontend/src/Login.jsx", "High"),
    ("AUTH-05", "Frontend Security", "Implement Session State & Navigation Guard", "Store active session in React state/localStorage with Logout button and role-aware navigation bar", "frontend/src/App.jsx", "High"),
    ("AUTH-06", "Student Portal", "Build Student Personal Dashboard & My Records", "Student views own fees & installments, grades/results, attendance, lecture schedule & subject faculty", "frontend/src/StudentPortal.jsx", "High"),
    ("AUTH-07", "Teacher Portal", "Build Teacher Portal & Student Remarks System", "Teacher views own salary pay-slips, assigned student directory (read-only), adds academic remarks", "frontend/src/TeacherPortal.jsx", "High"),
    ("AUTH-08", "Verification", "End-to-End Testing & Visual Audit", "Verify login across all 3 roles, test permission boundaries, capture visual snapshot 'snap1'", "All Components & Walkthrough", "High")
]

for r_idx, r_data in enumerate(step_rows, start=21):
    ws5.row_dimensions[r_idx].height = 28
    fill_to_use = LIGHT_ZEBRA if r_idx % 2 == 0 else PURE_WHITE
    for c_idx, val in enumerate(r_data, start=1):
        cell = ws5.cell(row=r_idx, column=c_idx, value=val)
        cell.border = thin_border
        cell.font = font_bold if c_idx == 1 else font_regular
        cell.fill = PatternFill(start_color=fill_to_use, end_color=fill_to_use, fill_type="solid")
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

# ==============================================================================
# COLUMN WIDTH ADJUSTMENTS
# ==============================================================================
ws1.column_dimensions["A"].width = 30  # Phase
ws1.column_dimensions["B"].width = 10  # Step ID
ws1.column_dimensions["C"].width = 36  # Task Name
ws1.column_dimensions["D"].width = 64  # Description
ws1.column_dimensions["E"].width = 32  # Tech
ws1.column_dimensions["F"].width = 14  # Priority
ws1.column_dimensions["G"].width = 16  # Status
ws1.column_dimensions["H"].width = 32  # Notes

ws2.column_dimensions["A"].width = 24  # Layer / Table
ws2.column_dimensions["B"].width = 28  # Tech / PK
ws2.column_dimensions["C"].width = 32  # Role / FK
ws2.column_dimensions["D"].width = 64  # Learning / Key Columns
ws2.column_dimensions["E"].width = 38  # Description

ws3.column_dimensions["A"].width = 34  # Field Name
ws3.column_dimensions["B"].width = 26  # Data Type
ws3.column_dimensions["C"].width = 64  # Role in Receipt / Slip
ws3.column_dimensions["D"].width = 36  # Example Value

ws4.column_dimensions["A"].width = 25  # Section
ws4.column_dimensions["B"].width = 100 # SQL Code

ws5.column_dimensions["A"].width = 25  # Role / Table / Step ID
ws5.column_dimensions["B"].width = 28  # Auth Method / PK / Phase
ws5.column_dimensions["C"].width = 44  # Scope / FK / Milestone
ws5.column_dimensions["D"].width = 48  # Restricted / Columns / Deliverables
ws5.column_dimensions["E"].width = 34  # Nav Items / Purpose / Files
ws5.column_dimensions["F"].width = 34  # Filter / Target / Priority

# Save workbook
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "School_Management_System_Checklist.xlsx")
try:
    wb.save(output_path)
    print(f"Successfully generated 5-sheet workbook: {output_path}")
except PermissionError:
    print(f"[Note] {output_path} is currently open in Excel. Please save/close it in Excel to refresh file on disk.")

