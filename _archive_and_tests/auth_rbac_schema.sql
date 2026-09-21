-- ============================================================================
-- Greenwood High School Management System
-- Multi-Role Authentication & Access Control (RBAC) Database Migration Script
-- Compatible with PostgreSQL 13+ / Supabase Cloud DB
-- ============================================================================

-- 1. Create Core Users Authentication Table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON public.users(teacher_id);


-- 2. Create Student Progress Remarks Table (For Teachers to evaluate students)
CREATE TABLE IF NOT EXISTS public.student_progress_remarks (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    remark_type VARCHAR(50) DEFAULT 'Academic Evaluation',
    remark TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remarks_student ON public.student_progress_remarks(student_id);
CREATE INDEX IF NOT EXISTS idx_remarks_teacher ON public.student_progress_remarks(teacher_id);


-- 3. Create Student Grades & Examination Results Table
CREATE TABLE IF NOT EXISTS public.student_grades_results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL,
    total_marks NUMERIC(5,2) DEFAULT 100.00,
    grade VARCHAR(5) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_student ON public.student_grades_results(student_id);


-- 4. Create Subject Teachers & Lecture Timetable Table
CREATE TABLE IF NOT EXISTS public.subject_teachers_timetable (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    room_number VARCHAR(50) DEFAULT 'Room 101',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.subject_teachers_timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.subject_teachers_timetable(teacher_id);


-- ============================================================================
-- 5. Seed Initial Demo Accounts & Access Credentials
-- ============================================================================

-- A. Master Administrator Account
INSERT INTO public.users (username, password_hash, role, email, status)
VALUES ('admin', 'admin123', 'admin', 'admin@greenwood.edu', 'active')
ON CONFLICT (username) DO NOTHING;

-- B. Teacher Accounts
INSERT INTO public.users (username, password_hash, role, teacher_id, email, status)
VALUES 
  ('robert.miller', 'teacher123', 'teacher', 1, 'robert.m@school.edu', 'active'),
  ('sarah.connor', 'teacher123', 'teacher', 2, 'sarah.c@school.edu', 'active')
ON CONFLICT (username) DO NOTHING;

-- C. Student Accounts
INSERT INTO public.users (username, password_hash, role, student_id, email, status)
VALUES 
  ('aarav.sharma', 'student123', 'student', 1, 'aarav.sharma1@email.com', 'active'),
  ('reyansh.jain', 'student123', 'student', 5, 'reyansh.jain5@email.com', 'active')
ON CONFLICT (username) DO NOTHING;

-- D. Sample Progress Remarks
INSERT INTO public.student_progress_remarks (student_id, teacher_id, subject, remark_type, remark)
VALUES
  (1, 1, 'Mathematics', 'Academic Evaluation', 'Demonstrates superior analytical clarity in algebra and differential calculus.'),
  (1, 2, 'Physics', 'Class Participation', 'Outstanding dedication in laboratory experimentation and optics project.')
ON CONFLICT DO NOTHING;

-- E. Sample Student Grades
INSERT INTO public.student_grades_results (student_id, exam_name, subject, marks_obtained, total_marks, grade, remarks)
VALUES
  (1, 'Mid-Term Exam 2026', 'Mathematics', 96.00, 100.00, 'A+', 'Distinction performance'),
  (1, 'Mid-Term Exam 2026', 'Physics', 89.00, 100.00, 'A', 'Strong theoretical foundations'),
  (1, 'Mid-Term Exam 2026', 'Chemistry', 84.00, 100.00, 'A', 'Good lab reports'),
  (1, 'Mid-Term Exam 2026', 'English Literature', 92.00, 100.00, 'A+', 'Commendable creative writing'),
  (1, 'Mid-Term Exam 2026', 'Computer Science', 98.00, 100.00, 'O', 'Exemplary problem-solving logic')
ON CONFLICT DO NOTHING;

-- F. Sample Lecture Timetable
INSERT INTO public.subject_teachers_timetable (class_id, teacher_id, subject, day_of_week, start_time, end_time, room_number)
VALUES
  (1, 1, 'Mathematics', 'Monday', '09:00 AM', '10:00 AM', 'Room 102'),
  (1, 2, 'Physics', 'Monday', '10:15 AM', '11:15 AM', 'Physics Lab'),
  (1, 1, 'Computer Science', 'Wednesday', '11:30 AM', '12:30 PM', 'Comp Lab 2')
ON CONFLICT DO NOTHING;
