# Sheet 5: SQL Queries, Table Schemas & Migration Scripts

This sheet contains all SQL queries, table definitions, constraints, indexes, column updates, and migration scripts used in the Greenwood / EduCore OS database.

---

## 1. Schema Modifications & Column Additions

### Add `admin_remarks` to Student Governance Tables
```sql
-- 1. Add admin_remarks to student_leaves
ALTER TABLE public.student_leaves 
ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

-- 2. Add admin_remarks to attendance_regularizations
ALTER TABLE public.attendance_regularizations 
ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

-- 3. Reload PostgREST schema cache to make new columns immediately available via REST API
NOTIFY pgrst, 'reload schema';
```

---

## 2. Complete Database DDL Statements

### A. Core Academic Tables
```sql
-- 1. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id BIGSERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    section TEXT NOT NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    academic_year TEXT DEFAULT '2026-2027',
    base_fee NUMERIC(10,2) DEFAULT 45000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_section UNIQUE (class_name, section)
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id BIGSERIAL PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    designation TEXT DEFAULT 'Senior Faculty',
    cabin TEXT,
    qualification TEXT,
    salary_base NUMERIC(10,2) DEFAULT 45000.00,
    weekly_load INTEGER DEFAULT 18,
    specialization TEXT,
    emergency_contact TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id BIGSERIAL PRIMARY KEY,
    roll_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    dob DATE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    father_name TEXT,
    mother_name TEXT,
    parent_phone TEXT,
    emergency_contact TEXT,
    address TEXT,
    blood_group TEXT DEFAULT 'O+',
    gender TEXT DEFAULT 'Male',
    aadhaar_number TEXT,
    admission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_date_attendance UNIQUE (student_id, date)
);
```

---

### B. Student & Faculty Governance Tables
```sql
-- 5. Student Leaves Table
CREATE TABLE IF NOT EXISTS public.student_leaves (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER DEFAULT 1,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    teacher_remarks TEXT,
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Attendance Regularization Claims Table
CREATE TABLE IF NOT EXISTS public.attendance_regularizations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    original_status TEXT NOT NULL,
    requested_status TEXT NOT NULL,
    reason_category TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    teacher_remarks TEXT,
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Teacher Leaves Table
CREATE TABLE IF NOT EXISTS public.teacher_leaves (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER DEFAULT 1,
    reason TEXT,
    substitute_teacher TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Teacher Attendance Regularizations Table
CREATE TABLE IF NOT EXISTS public.teacher_attendance_regularizations (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    original_status TEXT NOT NULL,
    requested_status TEXT NOT NULL,
    reason_category TEXT,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Teacher Attendance Daily Punches Table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'On-Duty', 'Absent')),
    punch_in_time TEXT,
    punch_out_time TEXT,
    remarks TEXT,
    CONSTRAINT unique_teacher_attendance_date UNIQUE (teacher_id, attendance_date)
);
```

---

### C. Finance, Timetable, Examination & RBAC Tables
```sql
-- 10. Student Fees Table
CREATE TABLE IF NOT EXISTS public.student_fees (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_category TEXT DEFAULT 'Tuition & Lab Fee',
    academic_year TEXT DEFAULT '2026-2027',
    term_name TEXT DEFAULT 'Installment #1',
    gross_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    late_fine NUMERIC(10,2) DEFAULT 0.00,
    net_payable NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL,
    balance_due NUMERIC(10,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Partial', 'Pending')),
    payment_method TEXT DEFAULT 'UPI / QR',
    receipt_no TEXT UNIQUE NOT NULL,
    transaction_ref TEXT,
    due_date DATE DEFAULT CURRENT_DATE,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 11. Teacher Salaries Table
CREATE TABLE IF NOT EXISTS public.teacher_salaries (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    salary_month TEXT NOT NULL,
    salary_year INTEGER NOT NULL,
    payslip_no TEXT UNIQUE NOT NULL,
    basic_salary NUMERIC(10,2) NOT NULL,
    hra_allowance NUMERIC(10,2) DEFAULT 0.00,
    da_allowance NUMERIC(10,2) DEFAULT 0.00,
    medical_allowance NUMERIC(10,2) DEFAULT 0.00,
    special_bonus NUMERIC(10,2) DEFAULT 0.00,
    gross_earnings NUMERIC(10,2) NOT NULL,
    provident_fund NUMERIC(10,2) DEFAULT 0.00,
    tax_deducted_tds NUMERIC(10,2) DEFAULT 0.00,
    total_deductions NUMERIC(10,2) NOT NULL,
    net_salary NUMERIC(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending')),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT DEFAULT 'Direct Bank Transfer',
    transaction_ref TEXT
);

-- 12. Timetable Table
CREATE TABLE IF NOT EXISTS public.subject_teachers_timetable (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    subject_code TEXT,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room_number TEXT DEFAULT 'Room 204'
);

-- 13. Examination Grades Table
CREATE TABLE IF NOT EXISTS public.student_grades_results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    exam_term TEXT NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) DEFAULT 100.00,
    grade_letter TEXT,
    percentage NUMERIC(5,2),
    remarks TEXT
);

-- 14. Student Progress Remarks Table
CREATE TABLE IF NOT EXISTS public.student_progress_remarks (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    remark_category TEXT DEFAULT 'Academic Progress',
    remark_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Authentication & RBAC Table
CREATE TABLE IF NOT EXISTS public.login_credentials (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    student_id BIGINT REFERENCES public.students(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Seed Queries & Verification Commands

```sql
-- Verify active student leaves in PostgreSQL
SELECT 
    l.id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.roll_number,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.status,
    l.admin_remarks
FROM public.student_leaves l
JOIN public.students s ON l.student_id = s.id
ORDER BY l.id DESC;

-- Verify attendance regularizations
SELECT 
    r.id,
    s.first_name || ' ' || s.last_name AS student_name,
    r.attendance_date,
    r.original_status,
    r.requested_status,
    r.reason_category,
    r.status,
    r.admin_remarks
FROM public.attendance_regularizations r
JOIN public.students s ON r.student_id = s.id
ORDER BY r.id DESC;
```

---

## 4. Master System Reset & Factory Wipe SQL Scripts

```sql
-- ====================================================================
-- MASTER FACTORY RESET CASCADE SCRIPT
-- WARNING: Destructive operation. Deletes all operational data.
-- Master Administrator ('admin') login is safely retained.
-- ====================================================================

-- 1. Wipe Attendance & Governance Dispute Records (Child Tables)
DELETE FROM public.attendance WHERE id > 0;
DELETE FROM public.teacher_attendance WHERE id > 0;
DELETE FROM public.student_leaves WHERE id > 0;
DELETE FROM public.attendance_regularizations WHERE id > 0;
DELETE FROM public.teacher_leaves WHERE id > 0;
DELETE FROM public.teacher_attendance_regularizations WHERE id > 0;

-- 2. Wipe Financial Ledgers & Payroll Slips
DELETE FROM public.student_fees WHERE id > 0;
DELETE FROM public.teacher_salaries WHERE id > 0;

-- 3. Wipe Academic Assessments, Observational Remarks & Timetables
DELETE FROM public.student_grades_results WHERE id > 0;
DELETE FROM public.student_progress_remarks WHERE id > 0;
DELETE FROM public.subject_teachers_timetable WHERE id > 0;

-- 4. Wipe Core Academic Entities in FK Hierarchy Order
DELETE FROM public.students WHERE id > 0;
DELETE FROM public.classes WHERE id > 0;
DELETE FROM public.teachers WHERE id > 0;

-- 5. Wipe Non-Admin Login Credentials (Retaining Master Admin Account)
DELETE FROM public.login_credentials WHERE role != 'admin';

-- 6. Guarantee Master Admin Account Exists
INSERT INTO public.login_credentials (username, password, role, status)
VALUES ('admin', 'password', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- 7. Verification of Clean State
SELECT 
    (SELECT COUNT(*) FROM public.students) AS remaining_students,
    (SELECT COUNT(*) FROM public.teachers) AS remaining_teachers,
    (SELECT COUNT(*) FROM public.classes) AS remaining_classes,
    (SELECT COUNT(*) FROM public.student_fees) AS remaining_fees,
    (SELECT COUNT(*) FROM public.teacher_salaries) AS remaining_salaries,
    (SELECT COUNT(*) FROM public.login_credentials) AS remaining_admin_logins;
```

