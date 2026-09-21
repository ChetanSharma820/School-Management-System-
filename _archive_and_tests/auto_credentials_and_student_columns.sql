-- ============================================================================
-- Greenwood High School Management System
-- 1. ADD NEW PARENT & PROFILE COLUMNS TO STUDENTS TABLE
-- 2. DEDICATED LOGIN CREDENTIALS TABLE
-- 3. AUTO-TRIGGER TO GENERATE LOGIN CREDENTIALS ON STUDENT & TEACHER CREATION
--    Password Convention: username || '@123'
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add More Columns to Student Table (Father Name, Mother Name, etc.)
-- ----------------------------------------------------------------------------
ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male',
    ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20),
    ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN public.students.father_name IS 'Student father full name';
COMMENT ON COLUMN public.students.mother_name IS 'Student mother full name';
COMMENT ON COLUMN public.students.parent_phone IS 'Primary guardian mobile number';
COMMENT ON COLUMN public.students.address IS 'Residential postal address';
COMMENT ON COLUMN public.students.blood_group IS 'Blood group (e.g. O+, A+, B+, AB-)';


-- ----------------------------------------------------------------------------
-- STEP 2: Create Dedicated Login Credentials Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_credentials (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Defaults to username@123
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE CASCADE,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure 1:1 credential link per student/teacher
    CONSTRAINT uq_student_credential UNIQUE (student_id),
    CONSTRAINT uq_teacher_credential UNIQUE (teacher_id)
);

-- Indexes for ultra-fast login lookup
CREATE INDEX IF NOT EXISTS idx_login_creds_username ON public.login_credentials(username);
CREATE INDEX IF NOT EXISTS idx_login_creds_role ON public.login_credentials(role);
CREATE INDEX IF NOT EXISTS idx_login_creds_student ON public.login_credentials(student_id);
CREATE INDEX IF NOT EXISTS idx_login_creds_teacher ON public.login_credentials(teacher_id);


-- ----------------------------------------------------------------------------
-- STEP 2B: Create Student Leave Requests & Class Teacher Approval Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_leaves (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL, -- Assigned Class Teacher
    leave_type VARCHAR(50) NOT NULL DEFAULT 'Medical Leave', -- 'Medical Leave', 'Family/Casual', 'Academic/Competition', 'Emergency'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT DEFAULT 1,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    teacher_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_student ON public.student_leaves(student_id);
CREATE INDEX IF NOT EXISTS idx_leaves_teacher ON public.student_leaves(teacher_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.student_leaves(status);


-- ----------------------------------------------------------------------------
-- STEP 3: Trigger Function for Students
-- Whenever Admin inserts a Student, auto-create Login Credential with username@123
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_auto_create_student_credential()
RETURNS TRIGGER AS $$
DECLARE
    v_base_username TEXT;
    v_username TEXT;
    v_suffix INT := 1;
BEGIN
    -- 1. Generate base username: e.g. "aarav.sharma" or roll number
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        v_base_username := lower(regexp_replace(NEW.first_name || '.' || NEW.last_name, '[^a-zA-Z0-9._]', '', 'g'));
    ELSIF NEW.roll_number IS NOT NULL THEN
        v_base_username := lower(regexp_replace(NEW.roll_number, '[^a-zA-Z0-9._]', '', 'g'));
    ELSE
        v_base_username := 'student.' || NEW.id;
    END IF;

    v_username := v_base_username;

    -- 2. Guarantee unique username
    WHILE EXISTS (
        SELECT 1 FROM public.login_credentials 
        WHERE username = v_username AND (student_id IS NULL OR student_id <> NEW.id)
    ) LOOP
        v_username := v_base_username || v_suffix;
        v_suffix := v_suffix + 1;
    END LOOP;

    -- 3. Insert or update login credentials with password = username@123
    INSERT INTO public.login_credentials (
        username,
        password,
        role,
        student_id,
        email,
        status,
        updated_at
    )
    VALUES (
        v_username,
        v_username || '@123', -- Default password requirement
        'student',
        NEW.id,
        COALESCE(NEW.email, v_username || '@school.edu'),
        'active',
        NOW()
    )
    ON CONFLICT (student_id) DO UPDATE
    SET 
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to students table
DROP TRIGGER IF EXISTS trg_student_credential_generator ON public.students;
CREATE TRIGGER trg_student_credential_generator
AFTER INSERT OR UPDATE OF first_name, last_name, roll_number, email ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_create_student_credential();


-- ----------------------------------------------------------------------------
-- STEP 4: Trigger Function for Teachers
-- Whenever Admin inserts a Teacher, auto-create Login Credential with username@123
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_auto_create_teacher_credential()
RETURNS TRIGGER AS $$
DECLARE
    v_base_username TEXT;
    v_username TEXT;
    v_suffix INT := 1;
BEGIN
    -- 1. Generate base username: e.g. "robert.miller" or employee id
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        v_base_username := lower(regexp_replace(NEW.first_name || '.' || NEW.last_name, '[^a-zA-Z0-9._]', '', 'g'));
    ELSIF NEW.employee_id IS NOT NULL THEN
        v_base_username := lower(regexp_replace(NEW.employee_id, '[^a-zA-Z0-9._]', '', 'g'));
    ELSE
        v_base_username := 'teacher.' || NEW.id;
    END IF;

    v_username := v_base_username;

    -- 2. Guarantee unique username
    WHILE EXISTS (
        SELECT 1 FROM public.login_credentials 
        WHERE username = v_username AND (teacher_id IS NULL OR teacher_id <> NEW.id)
    ) LOOP
        v_username := v_base_username || v_suffix;
        v_suffix := v_suffix + 1;
    END LOOP;

    -- 3. Insert or update login credentials with password = username@123
    INSERT INTO public.login_credentials (
        username,
        password,
        role,
        teacher_id,
        email,
        status,
        updated_at
    )
    VALUES (
        v_username,
        v_username || '@123', -- Default password requirement
        'teacher',
        NEW.id,
        COALESCE(NEW.email, v_username || '@school.edu'),
        'active',
        NOW()
    )
    ON CONFLICT (teacher_id) DO UPDATE
    SET 
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to teachers table
DROP TRIGGER IF EXISTS trg_teacher_credential_generator ON public.teachers;
CREATE TRIGGER trg_teacher_credential_generator
AFTER INSERT OR UPDATE OF first_name, last_name, employee_id, email ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_create_teacher_credential();


-- ----------------------------------------------------------------------------
-- STEP 5: Create Master Admin Credential
-- ----------------------------------------------------------------------------
INSERT INTO public.login_credentials (username, password, role, email, status)
VALUES ('admin', 'admin@123', 'admin', 'admin@greenwood.edu', 'active')
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password, updated_at = NOW();


-- ----------------------------------------------------------------------------
-- STEP 6: Backfill Existing Students & Teachers (One-Time Run)
-- Generates username@123 for all existing students & teachers already in DB
-- ----------------------------------------------------------------------------

-- A. Backfill Existing Teachers
INSERT INTO public.login_credentials (
    username,
    password,
    role,
    teacher_id,
    email,
    status
)
SELECT 
    final_u AS username,
    final_u || '@123' AS password,
    'teacher' AS role,
    id AS teacher_id,
    email,
    'active' AS status
FROM (
    SELECT 
        id,
        COALESCE(email, base_u || '@greenwood.edu') AS email,
        CASE 
            WHEN rn = 1 THEN base_u
            ELSE base_u || rn
        END AS final_u
    FROM (
        SELECT 
            id,
            email,
            lower(regexp_replace(COALESCE(first_name || '.' || last_name, employee_id, 'teacher.' || id), '[^a-zA-Z0-9._]', '', 'g')) AS base_u,
            ROW_NUMBER() OVER (
                PARTITION BY lower(regexp_replace(COALESCE(first_name || '.' || last_name, employee_id, 'teacher.' || id), '[^a-zA-Z0-9._]', '', 'g'))
                ORDER BY id
            ) AS rn
        FROM public.teachers
    ) t1
) t2
ON CONFLICT (teacher_id) DO NOTHING;

-- B. Backfill Existing Students
INSERT INTO public.login_credentials (
    username,
    password,
    role,
    student_id,
    email,
    status
)
SELECT 
    final_u AS username,
    final_u || '@123' AS password,
    'student' AS role,
    id AS student_id,
    email,
    'active' AS status
FROM (
    SELECT 
        id,
        COALESCE(email, base_u || '@greenwood.edu') AS email,
        CASE 
            WHEN rn = 1 THEN base_u
            ELSE base_u || rn
        END AS final_u
    FROM (
        SELECT 
            id,
            email,
            lower(regexp_replace(COALESCE(first_name || '.' || last_name, roll_number, 'student.' || id), '[^a-zA-Z0-9._]', '', 'g')) AS base_u,
            ROW_NUMBER() OVER (
                PARTITION BY lower(regexp_replace(COALESCE(first_name || '.' || last_name, roll_number, 'student.' || id), '[^a-zA-Z0-9._]', '', 'g'))
                ORDER BY id
            ) AS rn
        FROM public.students
    ) s1
) s2
ON CONFLICT (student_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 7: Verification Query (Check generated credentials)
-- ----------------------------------------------------------------------------
SELECT id, username, password, role, student_id, teacher_id, status, created_at 
FROM public.login_credentials 
ORDER BY role ASC, id ASC 
LIMIT 30;

-- ----------------------------------------------------------------------------
-- STEP 8: Role-Based Access Control (RBAC) Granular Permissions
-- Admin has exclusive control to toggle student and teacher access
-- ----------------------------------------------------------------------------
ALTER TABLE public.login_credentials 
    ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_apply_leave BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_view_grades BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_download_fee_receipt BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_post_remarks BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_approve_leaves BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS can_view_payroll BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.login_credentials.portal_access IS 'Master toggle: Allows user to authenticate into the portal';
COMMENT ON COLUMN public.login_credentials.can_apply_leave IS 'Student permission: Submit formal leave applications';
COMMENT ON COLUMN public.login_credentials.can_view_grades IS 'Student permission: View examination marks and report cards';
COMMENT ON COLUMN public.login_credentials.can_download_fee_receipt IS 'Student permission: View and download official fee receipts';
COMMENT ON COLUMN public.login_credentials.can_post_remarks IS 'Teacher permission: Add student academic progress remarks';
COMMENT ON COLUMN public.login_credentials.can_approve_leaves IS 'Teacher permission: Review, approve, or reject student leaves';
COMMENT ON COLUMN public.login_credentials.can_view_payroll IS 'Teacher permission: View faculty salary pay-slips and compensation';

-- ----------------------------------------------------------------------------
-- STEP 9: Student Attendance Regularization System
-- Enables students to dispute/regularize absent/late marks with Class Teacher review
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_regularizations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    original_status VARCHAR(20) NOT NULL DEFAULT 'Absent',
    requested_status VARCHAR(30) NOT NULL DEFAULT 'Present',
    reason_category VARCHAR(60) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    teacher_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_reg_student ON public.attendance_regularizations(student_id);
CREATE INDEX IF NOT EXISTS idx_att_reg_teacher ON public.attendance_regularizations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_att_reg_status ON public.attendance_regularizations(status);
CREATE INDEX IF NOT EXISTS idx_att_reg_date ON public.attendance_regularizations(attendance_date);

COMMENT ON TABLE public.attendance_regularizations IS 'Student attendance dispute and regularization records reviewed by assigned Class Teachers';

-- ----------------------------------------------------------------------------
-- STEP 10: Teacher Self-Attendance & Timecard System
-- Tracks faculty punch-in, punch-out, working hours, and monthly days worked
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    in_time VARCHAR(20),
    out_time VARCHAR(20),
    total_hours NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Present',
    shift_type VARCHAR(50) DEFAULT 'Standard Full Day',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_att_teacher ON public.teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_att_date ON public.teacher_attendance(attendance_date);

-- ----------------------------------------------------------------------------
-- STEP 11: Examination Terms & 10-Assessment Historical Grade Tracking
-- Stores last 10 assessment marks per subject with explicit examination terms
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_grades_results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_name VARCHAR(120) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL,
    total_marks NUMERIC(5,2) DEFAULT 100.00,
    grade VARCHAR(5) NOT NULL,
    remarks TEXT,
    exam_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_grades_hist ON public.student_grades_results(student_id, subject, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_grades_term ON public.student_grades_results(student_id, exam_name);

COMMENT ON TABLE public.student_grades_results IS 'Chronological terminal exam and unit test marks history (last 10 assessments per subject)';

-- Seed 10 Chronological Assessments per Subject for Student 1 (Aarav Sharma)
INSERT INTO public.student_grades_results (student_id, exam_name, subject, marks_obtained, total_marks, grade, remarks, exam_date)
VALUES
  -- 1. Mathematics (10 Historical Assessments)
  (1, 'Unit Test 2 (September 2026)', 'Mathematics', 96.00, 100.00, 'O', 'Mastery in differential calculus and algebraic geometry.', '2026-09-18'),
  (1, 'Mid-Term Examination 2026', 'Mathematics', 94.00, 100.00, 'O', 'Top 2% ranking in senior secondary mathematics.', '2026-09-10'),
  (1, 'Unit Test 1 (August 2026)', 'Mathematics', 91.00, 100.00, 'O', 'Outstanding precision in trigonometric proofs.', '2026-08-22'),
  (1, 'Monthly Assessment 3 (July 2026)', 'Mathematics', 88.00, 100.00, 'A+', 'Strong problem solving in polynomial equations.', '2026-07-28'),
  (1, 'Monthly Assessment 2 (June 2026)', 'Mathematics', 92.00, 100.00, 'O', 'Excellent analytical clarity in coordinate geometry.', '2026-06-25'),
  (1, 'Monthly Assessment 1 (May 2026)', 'Mathematics', 85.00, 100.00, 'A+', 'Good comprehension of linear functions.', '2026-05-20'),
  (1, 'Diagnostic Aptitude Test (April 2026)', 'Mathematics', 82.00, 100.00, 'A+', 'Solid logical and quantitative reasoning foundations.', '2026-04-18'),
  (1, 'Annual Final Exam 2026', 'Mathematics', 89.00, 100.00, 'A+', 'High distinction across all term modules.', '2026-03-24'),
  (1, 'Pre-Board Examination 2026', 'Mathematics', 86.00, 100.00, 'A+', 'Very good time management during mock board exam.', '2026-02-19'),
  (1, 'Periodic Assessment 3 (January 2026)', 'Mathematics', 80.00, 100.00, 'A', 'Consistent effort and accurate computations.', '2026-01-22'),

  -- 2. Physics (10 Historical Assessments)
  (1, 'Unit Test 2 (September 2026)', 'Physics', 92.00, 100.00, 'O', 'Flawless numerical derivation in electrostatics.', '2026-09-18'),
  (1, 'Mid-Term Examination 2026', 'Physics', 89.00, 100.00, 'A+', 'Strong theoretical clarity in wave optics.', '2026-09-10'),
  (1, 'Unit Test 1 (August 2026)', 'Physics', 88.00, 100.00, 'A+', 'Accurate vector diagrams and ray optics analysis.', '2026-08-22'),
  (1, 'Monthly Assessment 3 (July 2026)', 'Physics', 85.00, 100.00, 'A+', 'Excellent performance in thermodynamics quiz.', '2026-07-28'),
  (1, 'Monthly Assessment 2 (June 2026)', 'Physics', 90.00, 100.00, 'O', 'Thorough understanding of kinematic equations.', '2026-06-25'),
  (1, 'Monthly Assessment 1 (May 2026)', 'Physics', 82.00, 100.00, 'A+', 'Good grasp of Newton laws and friction coefficients.', '2026-05-20'),
  (1, 'Diagnostic Aptitude Test (April 2026)', 'Physics', 78.00, 100.00, 'A', 'Satisfactory physical concept visualization.', '2026-04-18'),
  (1, 'Annual Final Exam 2026', 'Physics', 86.00, 100.00, 'A+', 'Strong performance in both theory and practical viva.', '2026-03-24'),
  (1, 'Pre-Board Examination 2026', 'Physics', 84.00, 100.00, 'A', 'Good accuracy in circuit analysis problems.', '2026-02-19'),
  (1, 'Periodic Assessment 3 (January 2026)', 'Physics', 79.00, 100.00, 'A', 'Well-organized answers in magnetism unit.', '2026-01-22'),

  -- 3. Chemistry (10 Historical Assessments)
  (1, 'Unit Test 2 (September 2026)', 'Chemistry', 88.00, 100.00, 'A+', 'Sound understanding of coordination compounds.', '2026-09-18'),
  (1, 'Mid-Term Examination 2026', 'Chemistry', 84.00, 100.00, 'A', 'Good practical performance in organic titrations.', '2026-09-10'),
  (1, 'Unit Test 1 (August 2026)', 'Chemistry', 86.00, 100.00, 'A+', 'Clear stoichiometry calculations and reaction equations.', '2026-08-22'),
  (1, 'Monthly Assessment 3 (July 2026)', 'Chemistry', 82.00, 100.00, 'A+', 'Strong conceptual hold on periodic periodicity.', '2026-07-28'),
  (1, 'Monthly Assessment 2 (June 2026)', 'Chemistry', 85.00, 100.00, 'A+', 'Accurate molecular orbital theory diagrams.', '2026-06-25'),
  (1, 'Monthly Assessment 1 (May 2026)', 'Chemistry', 80.00, 100.00, 'A', 'Satisfactory grasp of chemical bonding concepts.', '2026-05-20'),
  (1, 'Diagnostic Aptitude Test (April 2026)', 'Chemistry', 75.00, 100.00, 'A', 'Competent understanding of atomic structures.', '2026-04-18'),
  (1, 'Annual Final Exam 2026', 'Chemistry', 83.00, 100.00, 'A', 'Well structured qualitative salt analysis.', '2026-03-24'),
  (1, 'Pre-Board Examination 2026', 'Chemistry', 81.00, 100.00, 'A', 'Consistent answers in organic reaction mechanisms.', '2026-02-19'),
  (1, 'Periodic Assessment 3 (January 2026)', 'Chemistry', 76.00, 100.00, 'A', 'Solid effort in redox reactions and balancing.', '2026-01-22'),

  -- 4. Computer Science (10 Historical Assessments)
  (1, 'Unit Test 2 (September 2026)', 'Computer Science', 99.00, 100.00, 'O', 'Exceptional C++ OOP design and dynamic memory management.', '2026-09-18'),
  (1, 'Mid-Term Examination 2026', 'Computer Science', 98.00, 100.00, 'O', 'Flawless algorithm optimization and recursive structures.', '2026-09-10'),
  (1, 'Unit Test 1 (August 2026)', 'Computer Science', 96.00, 100.00, 'O', 'Superior implementation of binary search trees and hashing.', '2026-08-22'),
  (1, 'Monthly Assessment 3 (July 2026)', 'Computer Science', 95.00, 100.00, 'O', 'Top marks in SQL relational database queries and normalization.', '2026-07-28'),
  (1, 'Monthly Assessment 2 (June 2026)', 'Computer Science', 97.00, 100.00, 'O', 'Excellent code modularity and syntax discipline.', '2026-06-25'),
  (1, 'Monthly Assessment 1 (May 2026)', 'Computer Science', 92.00, 100.00, 'O', 'Strong understanding of computational complexity and Big-O.', '2026-05-20'),
  (1, 'Diagnostic Aptitude Test (April 2026)', 'Computer Science', 90.00, 100.00, 'O', 'Impressive foundational algorithmic thinking.', '2026-04-18'),
  (1, 'Annual Final Exam 2026', 'Computer Science', 96.00, 100.00, 'O', 'Class topper in practical computer programming lab.', '2026-03-24'),
  (1, 'Pre-Board Examination 2026', 'Computer Science', 94.00, 100.00, 'O', 'Comprehensive answers in networking architecture.', '2026-02-19'),
  (1, 'Periodic Assessment 3 (January 2026)', 'Computer Science', 89.00, 100.00, 'A+', 'Clean code execution in Boolean algebra and logic gates.', '2026-01-22'),

  -- 5. English Literature (10 Historical Assessments)
  (1, 'Unit Test 2 (September 2026)', 'English Literature', 94.00, 100.00, 'O', 'Insightful literary critiques of Shakespearean tragedy.', '2026-09-18'),
  (1, 'Mid-Term Examination 2026', 'English Literature', 92.00, 100.00, 'O', 'Outstanding essay composition and sophisticated vocabulary.', '2026-09-10'),
  (1, 'Unit Test 1 (August 2026)', 'English Literature', 90.00, 100.00, 'O', 'Compelling argumentation in persuasive discourse.', '2026-08-22'),
  (1, 'Monthly Assessment 3 (July 2026)', 'English Literature', 87.00, 100.00, 'A+', 'Nuanced interpretation of romantic poetry symbolism.', '2026-07-28'),
  (1, 'Monthly Assessment 2 (June 2026)', 'English Literature', 89.00, 100.00, 'A+', 'Strong comprehension and precise syntactic structuring.', '2026-06-25'),
  (1, 'Monthly Assessment 1 (May 2026)', 'English Literature', 85.00, 100.00, 'A+', 'Engaging character sketch analysis and thematic flow.', '2026-05-20'),
  (1, 'Diagnostic Aptitude Test (April 2026)', 'English Literature', 83.00, 100.00, 'A', 'Expressive writing with good grammatical command.', '2026-04-18'),
  (1, 'Annual Final Exam 2026', 'English Literature', 88.00, 100.00, 'A+', 'High distinction in comprehension and creative writing.', '2026-03-24'),
  (1, 'Pre-Board Examination 2026', 'English Literature', 86.00, 100.00, 'A+', 'Well-organized essay on post-colonial literature.', '2026-02-19'),
  (1, 'Periodic Assessment 3 (January 2026)', 'English Literature', 82.00, 100.00, 'A+', 'Thoughtful response to prose and poetic devices.', '2026-01-22')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 12: Teacher Leave Applications & Attendance Regularizations Governance
-- Allows faculty to apply for leave and attendance adjustments; Admin reviews & approves
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_leaves (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    leave_type VARCHAR(60) NOT NULL, -- 'Casual Leave', 'Sick / Medical Leave', 'Earned Leave', 'Academic Duty', 'Emergency Leave'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    substitute_teacher VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_leaves_teacher ON public.teacher_leaves(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_leaves_status ON public.teacher_leaves(status);

CREATE TABLE IF NOT EXISTS public.teacher_attendance_regularizations (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    original_status VARCHAR(50) NOT NULL DEFAULT 'Absent', -- 'Absent', 'Late Arrival', 'Missed Punch Out'
    requested_status VARCHAR(50) NOT NULL DEFAULT 'Present', -- 'Present', 'On-Duty / School Event', 'Medical Waiver'
    reason_category VARCHAR(100) NOT NULL, -- 'Biometric Scanner Glitch', 'Official School Event / Exam Duty', 'Transit / Bus Delay', 'Medical Waiver'
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    admin_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_reg_teacher ON public.teacher_attendance_regularizations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reg_status ON public.teacher_attendance_regularizations(status);

-- Seed initial faculty leave requests
INSERT INTO public.teacher_leaves (teacher_id, leave_type, start_date, end_date, days_count, reason, substitute_teacher, status, admin_remarks, reviewed_at, created_at)
VALUES
  (1, 'Academic Duty', '2026-09-24', '2026-09-25', 2, 'Accompanying student contingent to State Mathematics Olympiad as faculty lead.', 'Prof. Sarah Connor', 'Pending', NULL, NULL, NOW() - INTERVAL '1 day'),
  (1, 'Casual Leave', '2026-09-11', '2026-09-11', 1, 'Family commitment and personal administrative work.', 'Prof. David Wilson', 'Approved', 'Approved. Faculty substitution acknowledged by Academic Dean.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '10 days'),
  (2, 'Sick / Medical Leave', '2026-09-28', '2026-09-29', 2, 'Scheduled dental surgical procedure and mandatory post-op rest.', 'Prof. Robert Miller', 'Pending', NULL, NULL, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Seed initial faculty attendance regularizations
INSERT INTO public.teacher_attendance_regularizations (teacher_id, attendance_date, original_status, requested_status, reason_category, reason, status, admin_remarks, reviewed_at, created_at)
VALUES
  (1, '2026-09-15', 'Late Arrival', 'Present', 'Biometric Scanner Glitch', 'East Faculty Gate 1 biometric scanner terminal malfunctioned during morning log. Homeroom attendance log verifies on-time presence.', 'Pending', NULL, NULL, NOW() - INTERVAL '3 days'),
  (2, '2026-09-08', 'Absent', 'On-Duty / School Event', 'Official School Event / Exam Duty', 'Designated external exam observer at City High School per Directorate instructions.', 'Approved', 'Approved. Official Duty Certificate on record with Administration.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

