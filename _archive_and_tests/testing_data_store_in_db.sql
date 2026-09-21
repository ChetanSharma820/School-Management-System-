-- =====================================================================================
-- EduCore OS & Greenwood International - Master Testing Data Seed Script
-- File: testing_data_store_in_db.sql
-- Description: Complete seed data filling every table across Academic, Governance,
--              Finance, Timetable, Attendance, Gradebook, and RBAC Authentication.
-- Note: Fully idempotent with ON CONFLICT DO UPDATE on every table.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 0. SAFE CLEANUP / PURGE EXISTING OPERATIONAL DATA (Optional - Cascading Deletion)
-- -------------------------------------------------------------------------------------
TRUNCATE TABLE 
    public.student_progress_remarks,
    public.student_grades_results,
    public.subject_teachers_timetable,
    public.teacher_salaries,
    public.student_fees,
    public.teacher_attendance_regularizations,
    public.teacher_leaves,
    public.attendance_regularizations,
    public.student_leaves,
    public.teacher_attendance,
    public.attendance,
    public.login_credentials,
    public.students,
    public.classes,
    public.teachers
RESTART IDENTITY CASCADE;

-- -------------------------------------------------------------------------------------
-- 1. FACULTY & TEACHERS (teachers)
-- -------------------------------------------------------------------------------------
INSERT INTO public.teachers (
    id, employee_id, first_name, last_name, email, phone, 
    department, designation, cabin, qualification, 
    salary_base, weekly_load, specialization, emergency_contact, address, created_at
) VALUES 
(
    1, 'TCH-001', 'Robert', 'Miller', 'robert.miller@greenwood.edu', '+91 98765 43210',
    'Mathematics & Computing', 'Department Head & Senior Faculty', 'Cabin A-101', 'M.Sc. Applied Mathematics, B.Ed (Gold Medalist)',
    65000.00, 18, 'Advanced Calculus, Linear Algebra & Algorithms', '+91 98765 43219', 'Block C, Faculty Enclave, Greenwood Campus', NOW() - INTERVAL '60 days'
),
(
    2, 'TCH-002', 'Dr. Sarah', 'Jenkins', 'sarah.jenkins@greenwood.edu', '+91 98765 43211',
    'Physical & Natural Sciences', 'Senior Research Professor', 'Cabin B-204', 'Ph.D. Quantum Physics, M.Sc. Theoretical Physics',
    72000.00, 16, 'Mechanics, Quantum Optics & Electromagnetism', '+91 98765 43218', '74 Rosewood Avenue, Civil Lines', NOW() - INTERVAL '55 days'
),
(
    3, 'TCH-003', 'Elena', 'Rostova', 'elena.rostova@greenwood.edu', '+91 98765 43212',
    'English & World Literature', 'Senior Lecturer & Debate Mentor', 'Cabin A-108', 'M.A. English Literature (Oxon), Cambridge CELTA',
    58000.00, 20, 'Contemporary Prose, Creative Writing & Rhetoric', '+91 98765 43217', '12 Lakeview Heights, Greenwood Boulevard', NOW() - INTERVAL '50 days'
),
(
    4, 'TCH-004', 'Dr. Arvind', 'Swaminathan', 'arvind.swaminathan@greenwood.edu', '+91 98765 43213',
    'Computer Science & IT', 'Lead Systems Educator', 'Lab CS-1', 'M.Tech Computer Science, Oracle Certified Java Master',
    68000.00, 18, 'Data Structures, C++ Systems Programming & SQL', '+91 98765 43216', 'Flat 402, Silicon Towers, Tech City', NOW() - INTERVAL '45 days'
),
(
    5, 'TCH-005', 'Chetan', 'Sharma', 'chetan.sharma@greenwood.edu', '+91 98765 43214',
    'Chemical & Life Sciences', 'Associate Faculty', 'Cabin B-105', 'M.Sc. Organic Chemistry, CSIR NET Qualified',
    55000.00, 22, 'Inorganic Reactions, Biochemistry & Analytical Labs', '+91 98765 43215', '18 Vasant Kunj, Sector 4', NOW() - INTERVAL '40 days'
)
ON CONFLICT (id) DO UPDATE SET 
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    cabin = EXCLUDED.cabin,
    qualification = EXCLUDED.qualification,
    salary_base = EXCLUDED.salary_base,
    weekly_load = EXCLUDED.weekly_load,
    specialization = EXCLUDED.specialization,
    emergency_contact = EXCLUDED.emergency_contact,
    address = EXCLUDED.address;

SELECT setval('teachers_id_seq', (SELECT MAX(id) FROM public.teachers));

-- -------------------------------------------------------------------------------------
-- 2. CLASS COHORTS & SECTIONS (classes)
-- -------------------------------------------------------------------------------------
INSERT INTO public.classes (
    id, class_name, section, teacher_id, academic_year, base_fee, created_at
) VALUES 
(
    1, 'Grade 10', 'A', 1, '2026-2027', 65000.00, NOW() - INTERVAL '60 days'
),
(
    2, 'Grade 10', 'B', 5, '2026-2027', 65000.00, NOW() - INTERVAL '55 days'
),
(
    3, 'Grade 11', 'Science A', 2, '2026-2027', 75000.00, NOW() - INTERVAL '50 days'
),
(
    4, 'Grade 12', 'Tech & AI', 4, '2026-2027', 85000.00, NOW() - INTERVAL '45 days'
)
ON CONFLICT (id) DO UPDATE SET 
    class_name = EXCLUDED.class_name,
    section = EXCLUDED.section,
    teacher_id = EXCLUDED.teacher_id,
    academic_year = EXCLUDED.academic_year,
    base_fee = EXCLUDED.base_fee;

SELECT setval('classes_id_seq', (SELECT MAX(id) FROM public.classes));

-- -------------------------------------------------------------------------------------
-- 3. STUDENTS DIRECTORY (students)
-- -------------------------------------------------------------------------------------
INSERT INTO public.students (
    id, roll_number, first_name, last_name, email, phone, 
    dob, class_id, enrollment_date, father_name, mother_name, 
    parent_phone, emergency_contact, address, blood_group, gender, 
    aadhaar_number, admission_date, created_at
) VALUES 
(
    1, 'STU-1001', 'Aarav', 'Sharma', 'aarav.sharma@student.greenwood.edu', '+91 98111 22334',
    '2010-05-14', 1, '2026-04-10', 'Dr. Rajesh Sharma', 'Dr. Sunita Sharma',
    '+91 98111 22334', '+91 98111 22335', '42 Orchid Residency, Civil Lines, Jaipur - 302006', 'O+', 'Male',
    '7482-9104-5821', '2026-04-10', NOW() - INTERVAL '60 days'
),
(
    2, 'STU-1002', 'Diya', 'Patel', 'diya.patel@student.greenwood.edu', '+91 98222 33445',
    '2010-08-22', 1, '2026-04-12', 'Vikram Patel', 'Meera Patel',
    '+91 98222 33445', '+91 98222 33446', '108 Silver Oak Meadows, Green Glen Layout', 'B+', 'Female',
    '8192-3049-1122', '2026-04-12', NOW() - INTERVAL '58 days'
),
(
    3, 'STU-1003', 'Rohan', 'Verma', 'rohan.verma@student.greenwood.edu', '+91 98333 44556',
    '2010-11-03', 2, '2026-04-15', 'Anil Verma', 'Pooja Verma',
    '+91 98333 44556', '+91 98333 44557', '15 Sterling Park, Rajendra Nagar', 'A+', 'Male',
    '9283-4710-3849', '2026-04-15', NOW() - INTERVAL '55 days'
),
(
    4, 'STU-1004', 'Ananya', 'Iyer', 'ananya.iyer@student.greenwood.edu', '+91 98444 55667',
    '2009-02-18', 3, '2026-04-18', 'Karthik Iyer', 'Lakshmi Iyer',
    '+91 98444 55667', '+91 98444 55668', '88 Palm Grove Enclave, Indiranagar', 'AB+', 'Female',
    '4592-1084-7733', '2026-04-18', NOW() - INTERVAL '50 days'
),
(
    5, 'STU-1005', 'Kabir', 'Mehta', 'kabir.mehta@student.greenwood.edu', '+91 98555 66778',
    '2008-09-30', 4, '2026-04-20', 'Sanjay Mehta', 'Geeta Mehta',
    '+91 98555 66778', '+91 98555 66779', '24 Heritage Villa, DLF Phase 2', 'O-', 'Male',
    '3847-5920-1948', '2026-04-20', NOW() - INTERVAL '45 days'
)
ON CONFLICT (id) DO UPDATE SET 
    roll_number = EXCLUDED.roll_number,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    dob = EXCLUDED.dob,
    class_id = EXCLUDED.class_id,
    enrollment_date = EXCLUDED.enrollment_date,
    father_name = EXCLUDED.father_name,
    mother_name = EXCLUDED.mother_name,
    parent_phone = EXCLUDED.parent_phone,
    emergency_contact = EXCLUDED.emergency_contact,
    address = EXCLUDED.address,
    blood_group = EXCLUDED.blood_group,
    gender = EXCLUDED.gender,
    aadhaar_number = EXCLUDED.aadhaar_number,
    admission_date = EXCLUDED.admission_date;

SELECT setval('students_id_seq', (SELECT MAX(id) FROM public.students));

-- -------------------------------------------------------------------------------------
-- 4. AUTHENTICATION & RBAC CREDENTIALS (login_credentials)
-- -------------------------------------------------------------------------------------
INSERT INTO public.login_credentials (
    id, username, password, role, student_id, teacher_id, 
    email, status, portal_access, can_apply_leave, can_view_grades, 
    can_download_fee_receipt, can_post_remarks, can_approve_leaves, can_view_payroll, created_at
) VALUES 
-- Master Admin
(
    1, 'admin', 'admin123', 'admin', NULL, NULL,
    'admin@greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, NOW() - INTERVAL '60 days'
),
-- Teachers
(
    2, 'robert.miller', 'robert.miller@123', 'teacher', NULL, 1,
    'robert.miller@greenwood.edu', 'active', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, NOW() - INTERVAL '60 days'
),
(
    3, 'sarah.jenkins', 'sarah.jenkins@123', 'teacher', NULL, 2,
    'sarah.jenkins@greenwood.edu', 'active', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, NOW() - INTERVAL '55 days'
),
(
    4, 'elena.rostova', 'elena.rostova@123', 'teacher', NULL, 3,
    'elena.rostova@greenwood.edu', 'active', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, NOW() - INTERVAL '50 days'
),
(
    5, 'arvind.swaminathan', 'arvind.swaminathan@123', 'teacher', NULL, 4,
    'arvind.swaminathan@greenwood.edu', 'active', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, NOW() - INTERVAL '45 days'
),
(
    6, 'chetan.sharma', 'chetan.sharma@123', 'teacher', NULL, 5,
    'chetan.sharma@greenwood.edu', 'active', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, NOW() - INTERVAL '40 days'
),
-- Students
(
    7, 'aarav.sharma', 'aarav.sharma@123', 'student', 1, NULL,
    'aarav.sharma@student.greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, NOW() - INTERVAL '60 days'
),
(
    8, 'diya.patel', 'diya.patel@123', 'student', 2, NULL,
    'diya.patel@student.greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, NOW() - INTERVAL '58 days'
),
(
    9, 'rohan.verma', 'rohan.verma@123', 'student', 3, NULL,
    'rohan.verma@student.greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, NOW() - INTERVAL '55 days'
),
(
    10, 'ananya.iyer', 'ananya.iyer@123', 'student', 4, NULL,
    'ananya.iyer@student.greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, NOW() - INTERVAL '50 days'
),
(
    11, 'kabir.mehta', 'kabir.mehta@123', 'student', 5, NULL,
    'kabir.mehta@student.greenwood.edu', 'active', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, NOW() - INTERVAL '45 days'
)
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id,
    teacher_id = EXCLUDED.teacher_id,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    portal_access = EXCLUDED.portal_access,
    can_apply_leave = EXCLUDED.can_apply_leave,
    can_view_grades = EXCLUDED.can_view_grades,
    can_download_fee_receipt = EXCLUDED.can_download_fee_receipt,
    can_post_remarks = EXCLUDED.can_post_remarks,
    can_approve_leaves = EXCLUDED.can_approve_leaves,
    can_view_payroll = EXCLUDED.can_view_payroll;

SELECT setval('login_credentials_id_seq', (SELECT MAX(id) FROM public.login_credentials));

-- -------------------------------------------------------------------------------------
-- 5. SUBJECT TEACHERS & TIMETABLE ROUTINE (subject_teachers_timetable)
-- -------------------------------------------------------------------------------------
INSERT INTO public.subject_teachers_timetable (
    id, class_id, teacher_id, subject, day_of_week, start_time, end_time, room_number
) VALUES 
(
    1, 1, 1, 'Mathematics', 'Monday - Friday', '09:00 AM', '10:00 AM', 'Room 101'
),
(
    2, 1, 2, 'Physics', 'Monday', '10:15 AM', '11:15 AM', 'Physics Lab 1'
),
(
    3, 1, 5, 'Chemistry', 'Tuesday', '10:15 AM', '11:15 AM', 'Chemistry Lab'
),
(
    4, 1, 3, 'English Literature', 'Wednesday', '11:30 AM', '12:30 PM', 'Room 101'
),
(
    5, 1, 4, 'Computer Science & IT', 'Thursday', '01:30 PM', '02:30 PM', 'Computer Lab 2'
),
(
    6, 1, 2, 'Environmental Studies', 'Friday', '02:30 PM', '03:30 PM', 'Room 101'
),
(
    7, 2, 5, 'Chemistry', 'Monday', '09:00 AM', '10:00 AM', 'Chemistry Lab'
),
(
    8, 2, 1, 'Mathematics', 'Tuesday', '10:15 AM', '11:15 AM', 'Room 102'
),
(
    9, 3, 2, 'Advanced Physics', 'Monday - Friday', '09:00 AM', '10:00 AM', 'Physics Lab 2'
),
(
    10, 4, 4, 'Artificial Intelligence & C++', 'Monday - Friday', '10:00 AM', '11:30 AM', 'Innovation Hub'
)
ON CONFLICT (id) DO UPDATE SET 
    class_id = EXCLUDED.class_id,
    teacher_id = EXCLUDED.teacher_id,
    subject = EXCLUDED.subject,
    day_of_week = EXCLUDED.day_of_week,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    room_number = EXCLUDED.room_number;

SELECT setval('subject_teachers_timetable_id_seq', (SELECT MAX(id) FROM public.subject_teachers_timetable));

-- -------------------------------------------------------------------------------------
-- 6. STUDENT DAILY ATTENDANCE LOGS (attendance)
-- -------------------------------------------------------------------------------------
INSERT INTO public.attendance (
    student_id, date, status, remarks, created_at
) VALUES 
-- Student 1 (Aarav Sharma) - September 2026 Attendance
(1, '2026-09-01', 'Present', 'On time - Biometric Gate 1', NOW() - INTERVAL '20 days'),
(1, '2026-09-02', 'Present', 'On time', NOW() - INTERVAL '19 days'),
(1, '2026-09-03', 'Present', 'On time', NOW() - INTERVAL '18 days'),
(1, '2026-09-04', 'Present', 'On time', NOW() - INTERVAL '17 days'),
(1, '2026-09-07', 'Present', 'On time', NOW() - INTERVAL '14 days'),
(1, '2026-09-08', 'Excused', 'Interschool Math Olympiad Duty', NOW() - INTERVAL '13 days'),
(1, '2026-09-09', 'Present', 'On time', NOW() - INTERVAL '12 days'),
(1, '2026-09-10', 'Present', 'On time', NOW() - INTERVAL '11 days'),
(1, '2026-09-11', 'Excused', 'Medical Leave - Doctor certificate approved', NOW() - INTERVAL '10 days'),
(1, '2026-09-12', 'Excused', 'Medical Leave - Approved by Class Teacher', NOW() - INTERVAL '9 days'),
(1, '2026-09-14', 'Present', 'On time', NOW() - INTERVAL '7 days'),
(1, '2026-09-15', 'Present', 'Regularized - RFID scanner timeout resolved', NOW() - INTERVAL '6 days'),
(1, '2026-09-16', 'Present', 'On time', NOW() - INTERVAL '5 days'),
(1, '2026-09-17', 'Present', 'On time', NOW() - INTERVAL '4 days'),
(1, '2026-09-18', 'Present', 'On time', NOW() - INTERVAL '3 days'),
(1, '2026-09-19', 'Present', 'On time', NOW() - INTERVAL '2 days'),

-- Student 2 (Diya Patel)
(2, '2026-09-01', 'Present', 'On time', NOW() - INTERVAL '20 days'),
(2, '2026-09-02', 'Present', 'On time', NOW() - INTERVAL '19 days'),
(2, '2026-09-03', 'Late', 'Arrived 10 mins late - Traffic delay', NOW() - INTERVAL '18 days'),
(2, '2026-09-04', 'Present', 'On time', NOW() - INTERVAL '17 days'),
(2, '2026-09-07', 'Present', 'On time', NOW() - INTERVAL '14 days'),
(2, '2026-09-08', 'Present', 'On time', NOW() - INTERVAL '13 days'),
(2, '2026-09-09', 'Absent', 'Uninformed absence', NOW() - INTERVAL '12 days'),
(2, '2026-09-10', 'Present', 'On time', NOW() - INTERVAL '11 days'),

-- Student 3 (Rohan Verma)
(3, '2026-09-01', 'Present', 'On time', NOW() - INTERVAL '20 days'),
(3, '2026-09-02', 'Present', 'On time', NOW() - INTERVAL '19 days'),
(3, '2026-09-03', 'Present', 'On time', NOW() - INTERVAL '18 days'),

-- Student 4 & 5
(4, '2026-09-01', 'Present', 'On time', NOW() - INTERVAL '20 days'),
(5, '2026-09-01', 'Present', 'On time', NOW() - INTERVAL '20 days')
ON CONFLICT (student_id, date) DO UPDATE SET 
    status = EXCLUDED.status, 
    remarks = EXCLUDED.remarks;

-- -------------------------------------------------------------------------------------
-- 7. FACULTY BIOMETRIC ATTENDANCE (teacher_attendance)
-- -------------------------------------------------------------------------------------
INSERT INTO public.teacher_attendance (
    teacher_id, attendance_date, in_time, out_time, total_hours, status, shift_type, remarks
) VALUES 
(1, '2026-09-01', '08:10 AM', '04:30 PM', 8.33, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-02', '08:08 AM', '04:30 PM', 8.37, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-03', '08:15 AM', '04:30 PM', 8.25, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-04', '08:12 AM', '04:30 PM', 8.30, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-07', '08:10 AM', '04:30 PM', 8.33, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-08', '08:05 AM', '04:30 PM', 8.42, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-09', '08:16 AM', '04:30 PM', 8.23, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-10', '08:11 AM', '04:31 PM', 8.33, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-11', '08:14 AM', '04:30 PM', 8.27, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-14', '08:08 AM', '04:30 PM', 8.37, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-15', '08:25 AM', '04:35 PM', 8.17, 'Late Arrival', 'Standard Full Day', 'Morning Transit Delay - Regularization Approved'),
(1, '2026-09-16', '08:10 AM', '04:28 PM', 8.30, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-17', '08:15 AM', '04:32 PM', 8.28, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(1, '2026-09-18', '08:12 AM', '04:30 PM', 8.30, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),

-- Teacher 2 (Dr. Sarah Jenkins)
(2, '2026-09-18', '08:05 AM', '04:30 PM', 8.42, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified'),
(2, '2026-09-19', '08:10 AM', '04:30 PM', 8.33, 'Present', 'Standard Full Day', 'Biometric Gate 1 Verified')
ON CONFLICT (teacher_id, attendance_date) DO UPDATE SET 
    in_time = EXCLUDED.in_time, 
    out_time = EXCLUDED.out_time, 
    total_hours = EXCLUDED.total_hours,
    status = EXCLUDED.status,
    shift_type = EXCLUDED.shift_type,
    remarks = EXCLUDED.remarks;

-- -------------------------------------------------------------------------------------
-- 8. STUDENT LEAVE APPLICATIONS (student_leaves)
-- -------------------------------------------------------------------------------------
INSERT INTO public.student_leaves (
    id, student_id, class_id, teacher_id, leave_type, 
    start_date, end_date, days_count, reason, 
    status, teacher_remarks, admin_remarks, reviewed_at, created_at
) VALUES 
(
    1, 1, 1, 1, 'Medical Leave',
    '2026-09-11', '2026-09-12', 2, 'Severe viral fever; doctor recommended 2 days clinical bed rest.',
    'Approved', 'Approved. Medical certificate and prescription verified.', 'Approved by Administration.',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 days'
),
(
    2, 1, 1, 1, 'Academic / Competition',
    '2026-09-24', '2026-09-25', 2, 'Representing Greenwood High at the State Interschool Mathematics Olympiad.',
    'Pending', NULL, NULL,
    NULL, NOW() - INTERVAL '2 days'
),
(
    3, 2, 1, 1, 'Casual / Family Function',
    '2026-09-28', '2026-09-29', 2, 'Elder sister wedding ceremony out of station.',
    'Pending', NULL, NULL,
    NULL, NOW() - INTERVAL '1 days'
),
(
    4, 3, 2, 5, 'Medical Leave',
    '2026-09-05', '2026-09-06', 2, 'Dental surgery and post-operative recuperation.',
    'Approved', 'Approved by Homeroom Mentor Prof. Chetan Sharma.', 'Confirmed.',
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '16 days'
)
ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    class_id = EXCLUDED.class_id,
    teacher_id = EXCLUDED.teacher_id,
    leave_type = EXCLUDED.leave_type,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    days_count = EXCLUDED.days_count,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    teacher_remarks = EXCLUDED.teacher_remarks,
    admin_remarks = EXCLUDED.admin_remarks,
    reviewed_at = EXCLUDED.reviewed_at;

SELECT setval('student_leaves_id_seq', (SELECT MAX(id) FROM public.student_leaves));

-- -------------------------------------------------------------------------------------
-- 9. STUDENT ATTENDANCE REGULARIZATION DISPUTES (attendance_regularizations)
-- -------------------------------------------------------------------------------------
INSERT INTO public.attendance_regularizations (
    id, student_id, class_id, teacher_id, attendance_date, 
    original_status, requested_status, reason_category, reason, 
    status, teacher_remarks, admin_remarks, reviewed_at, created_at
) VALUES 
(
    1, 1, 1, 1, '2026-09-15',
    'Absent', 'Present', 'Biometric / RFID Scanner Issue',
    'Arrived on time at 08:12 AM on School Bus Route #14. The biometric machine did not register the RFID card scan.',
    'Approved', 'Verified through morning bus attendance log and classroom presence. Status corrected to Present.',
    'Regularization confirmed by Admin.',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'
),
(
    2, 2, 1, 1, '2026-09-03',
    'Late', 'Present', 'School Bus Transit Delay',
    'School Bus #8 broke down near North Highway Flyover, causing batch arrival at 08:35 AM.',
    'Approved', 'Transport Supervisor confirmed bus breakdown. Excused from late penalty.',
    'Transit delay verified.',
    NOW() - INTERVAL '17 days', NOW() - INTERVAL '18 days'
),
(
    3, 3, 2, 5, '2026-09-18',
    'Absent', 'Present', 'Classroom Activity / Lab Session',
    'Was attending National Science Talent Search orientation in Auditorium during 1st period roll call.',
    'Pending', NULL, NULL,
    NULL, NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    class_id = EXCLUDED.class_id,
    teacher_id = EXCLUDED.teacher_id,
    attendance_date = EXCLUDED.attendance_date,
    original_status = EXCLUDED.original_status,
    requested_status = EXCLUDED.requested_status,
    reason_category = EXCLUDED.reason_category,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    teacher_remarks = EXCLUDED.teacher_remarks,
    admin_remarks = EXCLUDED.admin_remarks,
    reviewed_at = EXCLUDED.reviewed_at;

SELECT setval('attendance_regularizations_id_seq', (SELECT MAX(id) FROM public.attendance_regularizations));

-- -------------------------------------------------------------------------------------
-- 10. FACULTY LEAVE APPROVALS (teacher_leaves)
-- -------------------------------------------------------------------------------------
INSERT INTO public.teacher_leaves (
    id, teacher_id, leave_type, start_date, end_date, days_count, 
    reason, substitute_teacher, status, admin_remarks, reviewed_at, created_at
) VALUES 
(
    1, 1, 'Casual Leave', '2026-09-22', '2026-09-22', 1,
    'Personal domestic commitment requiring leave of absence.', 'Dr. Arvind Swaminathan (CS)',
    'Approved', 'Approved. Period adjustments arranged with Dept.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'
),
(
    2, 2, 'Duty Leave / Conference', '2026-09-29', '2026-09-30', 2,
    'Keynote Speaker at National Physics Symposium, IIT Delhi.', 'Prof. Chetan Sharma',
    'Pending', NULL, NULL, NOW() - INTERVAL '1 days'
),
(
    3, 3, 'Medical Leave', '2026-09-08', '2026-09-09', 2,
    'Severe acute bronchitis.', 'Prof. Robert Miller',
    'Approved', 'Approved. Medical fitness certificate received.', NOW() - INTERVAL '12 days', NOW() - INTERVAL '13 days'
)
ON CONFLICT (id) DO UPDATE SET 
    teacher_id = EXCLUDED.teacher_id,
    leave_type = EXCLUDED.leave_type,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    days_count = EXCLUDED.days_count,
    reason = EXCLUDED.reason,
    substitute_teacher = EXCLUDED.substitute_teacher,
    status = EXCLUDED.status,
    admin_remarks = EXCLUDED.admin_remarks,
    reviewed_at = EXCLUDED.reviewed_at;

SELECT setval('teacher_leaves_id_seq', (SELECT MAX(id) FROM public.teacher_leaves));

-- -------------------------------------------------------------------------------------
-- 11. FACULTY BIOMETRIC REGULARIZATIONS (teacher_attendance_regularizations)
-- -------------------------------------------------------------------------------------
INSERT INTO public.teacher_attendance_regularizations (
    id, teacher_id, attendance_date, original_status, requested_status, 
    reason_category, reason, status, admin_remarks, reviewed_at, created_at
) VALUES 
(
    1, 1, '2026-09-15', 'Late Arrival', 'Present',
    'Official Duty / Campus Gate Inspection',
    'Supervised student morning bus disembarkation and security queue at Gate 2 from 08:00 AM to 08:24 AM before punching biometric terminal.',
    'Approved', 'Duty confirmed by Campus Security Head. Attendance regularized to Present.',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'
),
(
    2, 4, '2026-09-17', 'Absent', 'Present',
    'Server Room Maintenance',
    'Attended emergency fiber outage in Central Server Room from 07:45 AM. Punched out in evening.',
    'Approved', 'IT maintenance log verified.',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO UPDATE SET 
    teacher_id = EXCLUDED.teacher_id,
    attendance_date = EXCLUDED.attendance_date,
    original_status = EXCLUDED.original_status,
    requested_status = EXCLUDED.requested_status,
    reason_category = EXCLUDED.reason_category,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    admin_remarks = EXCLUDED.admin_remarks,
    reviewed_at = EXCLUDED.reviewed_at;

SELECT setval('teacher_attendance_regularizations_id_seq', (SELECT MAX(id) FROM public.teacher_attendance_regularizations));

-- -------------------------------------------------------------------------------------
-- 12. STUDENT FEES, INVOICES & GST RECEIPTS (student_fees)
-- -------------------------------------------------------------------------------------
INSERT INTO public.student_fees (
    id, student_id, fee_category, academic_year, term_name, 
    gross_amount, discount_amount, late_fine, net_payable, amount_paid, balance_due, 
    payment_status, payment_method, receipt_no, transaction_ref, due_date, payment_date, notes
) VALUES 
(
    1, 1, 'Annual Tuition & Lab Composite Fee', '2026-2027', 'Term 1 Installment',
    65000.00, 5000.00, 0.00, 60000.00, 60000.00, 0.00,
    'Paid', 'UPI / QR', 'REC-2026-001', 'UPI/984729104820/HDFC', '2026-08-15',
    NOW() - INTERVAL '45 days', 'Academic Merit Scholarship waiver of ₹5,000 applied. Full Term 1 cleared.'
),
(
    2, 2, 'Annual Tuition Fee', '2026-2027', 'Term 1 Installment',
    65000.00, 0.00, 0.00, 65000.00, 35000.00, 30000.00,
    'Partial', 'Net Banking', 'REC-2026-002', 'NEFT/SBI/49201948201', '2026-08-15',
    NOW() - INTERVAL '30 days', 'First installment paid. Balance ₹30,000 due before Term 2 examinations.'
),
(
    3, 3, 'Annual Tuition Fee', '2026-2027', 'Term 1 Installment',
    65000.00, 0.00, 0.00, 65000.00, 65000.00, 0.00,
    'Paid', 'Credit Card', 'REC-2026-003', 'CARD/ICICI/5839201948', '2026-08-15',
    NOW() - INTERVAL '25 days', 'Full annual fee paid in single transaction.'
),
(
    4, 4, 'Senior Secondary Science Tuition Fee', '2026-2027', 'Term 1 Installment',
    75000.00, 7500.00, 0.00, 67500.00, 67500.00, 0.00,
    'Paid', 'Net Banking', 'REC-2026-004', 'NEFT/AXIS/8492019482', '2026-08-15',
    NOW() - INTERVAL '20 days', 'Sibling concession (10%) applied. Term 1 paid.'
),
(
    5, 5, 'Senior Secondary Tech & AI Fee', '2026-2027', 'Term 1 Installment',
    85000.00, 0.00, 0.00, 85000.00, 85000.00, 0.00,
    'Paid', 'UPI / QR', 'REC-2026-005', 'UPI/748392019482/ICICI', '2026-08-15',
    NOW() - INTERVAL '15 days', 'Comprehensive tuition and innovation lab fee paid in full.'
)
ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    fee_category = EXCLUDED.fee_category,
    academic_year = EXCLUDED.academic_year,
    term_name = EXCLUDED.term_name,
    gross_amount = EXCLUDED.gross_amount,
    discount_amount = EXCLUDED.discount_amount,
    late_fine = EXCLUDED.late_fine,
    net_payable = EXCLUDED.net_payable,
    amount_paid = EXCLUDED.amount_paid,
    balance_due = EXCLUDED.balance_due,
    payment_status = EXCLUDED.payment_status,
    payment_method = EXCLUDED.payment_method,
    receipt_no = EXCLUDED.receipt_no,
    transaction_ref = EXCLUDED.transaction_ref,
    due_date = EXCLUDED.due_date,
    payment_date = EXCLUDED.payment_date,
    notes = EXCLUDED.notes;

SELECT setval('student_fees_id_seq', (SELECT MAX(id) FROM public.student_fees));

-- -------------------------------------------------------------------------------------
-- 13. TEACHER MONTHLY PAYROLL & PAYSLIPS (teacher_salaries)
-- -------------------------------------------------------------------------------------
INSERT INTO public.teacher_salaries (
    id, teacher_id, salary_month, salary_year, payslip_no, 
    basic_salary, hra_allowance, da_allowance, medical_allowance, special_bonus, 
    gross_earnings, provident_fund, tax_deducted_tds, total_deductions, 
    net_salary, payment_status, payment_date, payment_method, transaction_ref
) VALUES 
(
    1, 1, 'August', 2026, 'PAY-2026-AUG-101',
    42000.00, 12600.00, 6300.00, 2500.00, 1600.00,
    65000.00, 5040.00, 2500.00, 7540.00,
    57460.00, 'Paid', NOW() - INTERVAL '20 days', 'Direct Bank Transfer', 'NEFT/HDFC/20260831001'
),
(
    2, 2, 'August', 2026, 'PAY-2026-AUG-102',
    46000.00, 13800.00, 6900.00, 2500.00, 2800.00,
    72000.00, 5520.00, 3200.00, 8720.00,
    63280.00, 'Paid', NOW() - INTERVAL '20 days', 'Direct Bank Transfer', 'NEFT/HDFC/20260831002'
),
(
    3, 3, 'August', 2026, 'PAY-2026-AUG-103',
    38000.00, 11400.00, 5700.00, 2000.00, 900.00,
    58000.00, 4560.00, 1800.00, 6360.00,
    51640.00, 'Paid', NOW() - INTERVAL '20 days', 'Direct Bank Transfer', 'NEFT/HDFC/20260831003'
),
(
    4, 4, 'August', 2026, 'PAY-2026-AUG-104',
    44000.00, 13200.00, 6600.00, 2500.00, 1700.00,
    68000.00, 5280.00, 2800.00, 8080.00,
    59920.00, 'Paid', NOW() - INTERVAL '20 days', 'Direct Bank Transfer', 'NEFT/HDFC/20260831004'
),
(
    5, 5, 'August', 2026, 'PAY-2026-AUG-105',
    36000.00, 10800.00, 5400.00, 2000.00, 800.00,
    55000.00, 4320.00, 1500.00, 5820.00,
    49180.00, 'Paid', NOW() - INTERVAL '20 days', 'Direct Bank Transfer', 'NEFT/HDFC/20260831005'
)
ON CONFLICT (id) DO UPDATE SET 
    teacher_id = EXCLUDED.teacher_id,
    salary_month = EXCLUDED.salary_month,
    salary_year = EXCLUDED.salary_year,
    payslip_no = EXCLUDED.payslip_no,
    basic_salary = EXCLUDED.basic_salary,
    hra_allowance = EXCLUDED.hra_allowance,
    da_allowance = EXCLUDED.da_allowance,
    medical_allowance = EXCLUDED.medical_allowance,
    special_bonus = EXCLUDED.special_bonus,
    gross_earnings = EXCLUDED.gross_earnings,
    provident_fund = EXCLUDED.provident_fund,
    tax_deducted_tds = EXCLUDED.tax_deducted_tds,
    total_deductions = EXCLUDED.total_deductions,
    net_salary = EXCLUDED.net_salary,
    payment_status = EXCLUDED.payment_status,
    payment_date = EXCLUDED.payment_date,
    payment_method = EXCLUDED.payment_method,
    transaction_ref = EXCLUDED.transaction_ref;

SELECT setval('teacher_salaries_id_seq', (SELECT MAX(id) FROM public.teacher_salaries));

-- -------------------------------------------------------------------------------------
-- 14. STUDENT EXAMINATION GRADES & REPORT CARDS (student_grades_results)
-- -------------------------------------------------------------------------------------
INSERT INTO public.student_grades_results (
    id, student_id, exam_name, subject, marks_obtained, total_marks, grade, remarks, exam_date
) VALUES 
-- Student 1 (Aarav Sharma) - Mid-Term & Assessments
(1, 1, 'Mid-Term Examination 2026', 'Mathematics', 96.00, 100.00, 'A+', 'Exemplary problem-solving and rigorous algebraic proofs.', '2026-09-15'),
(2, 1, 'Mid-Term Examination 2026', 'Physics', 92.50, 100.00, 'A+', 'Thorough conceptual mastery in Newtonian mechanics and optics.', '2026-09-15'),
(3, 1, 'Mid-Term Examination 2026', 'Chemistry', 88.00, 100.00, 'A', 'Very good analytical lab experiments and organic reaction mechanisms.', '2026-09-16'),
(4, 1, 'Mid-Term Examination 2026', 'Computer Science', 98.00, 100.00, 'A+', 'Flawless C++ data structures design and algorithmic execution.', '2026-09-16'),
(5, 1, 'Mid-Term Examination 2026', 'English Literature', 91.00, 100.00, 'A+', 'Nuanced prose critique and eloquent rhetorical composition.', '2026-09-17'),

-- Student 1 Historical Assessment Trends (10 Tests)
(6, 1, 'Unit Test 1', 'Mathematics', 94.00, 100.00, 'A+', 'Algebra & Functions', '2026-07-20'),
(7, 1, 'Unit Test 2', 'Mathematics', 91.00, 100.00, 'A+', 'Coordinate Geometry', '2026-08-10'),
(8, 1, 'Unit Test 3', 'Mathematics', 95.00, 100.00, 'A+', 'Trigonometry & Vectors', '2026-08-28'),
(9, 1, 'Unit Test 4', 'Mathematics', 98.00, 100.00, 'A+', 'Calculus & Integration', '2026-09-10'),
(10, 1, 'Unit Test 1', 'Physics', 89.00, 100.00, 'A', 'Kinematics & Dynamics', '2026-07-22'),
(11, 1, 'Unit Test 2', 'Physics', 93.00, 100.00, 'A+', 'Thermodynamics & Waves', '2026-08-25'),
(12, 1, 'Unit Test 1', 'Computer Science', 97.00, 100.00, 'A+', 'Pointers & Memory Architecture', '2026-07-25'),
(13, 1, 'Unit Test 2', 'Computer Science', 99.00, 100.00, 'A+', 'Graph Theory & DP algorithms', '2026-08-30'),

-- Student 2 (Diya Patel)
(14, 2, 'Mid-Term Examination 2026', 'Mathematics', 89.00, 100.00, 'A', 'Strong quantitative foundation and accurate geometry work.', '2026-09-15'),
(15, 2, 'Mid-Term Examination 2026', 'Physics', 94.00, 100.00, 'A+', 'Superb experimental laboratory deductions.', '2026-09-15'),
(16, 2, 'Mid-Term Examination 2026', 'English Literature', 95.00, 100.00, 'A+', 'Distinguished creative prose essay.', '2026-09-17'),

-- Student 3, 4, 5
(17, 3, 'Mid-Term Examination 2026', 'Mathematics', 84.00, 100.00, 'A', 'Good consistent performance.', '2026-09-15'),
(18, 4, 'Mid-Term Examination 2026', 'Physics', 96.00, 100.00, 'A+', 'Top score in Class 11 Science cohort.', '2026-09-15'),
(19, 5, 'Mid-Term Examination 2026', 'Computer Science', 97.50, 100.00, 'A+', 'Outstanding neural network and C++ project.', '2026-09-16')
ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    exam_name = EXCLUDED.exam_name,
    subject = EXCLUDED.subject,
    marks_obtained = EXCLUDED.marks_obtained,
    total_marks = EXCLUDED.total_marks,
    grade = EXCLUDED.grade,
    remarks = EXCLUDED.remarks,
    exam_date = EXCLUDED.exam_date;

SELECT setval('student_grades_results_id_seq', (SELECT MAX(id) FROM public.student_grades_results));

-- -------------------------------------------------------------------------------------
-- 15. STUDENT PROGRESS & QUALITATIVE REMARKS (student_progress_remarks)
-- -------------------------------------------------------------------------------------
INSERT INTO public.student_progress_remarks (
    id, student_id, teacher_id, subject, remark_type, remark, created_at
) VALUES 
(
    1, 1, 1, 'Mathematics', 'Academic Progress',
    'Aarav demonstrates outstanding analytical maturity. Consistently scores in top 1 percentile in advanced mathematical olympiad preparation modules.',
    NOW() - INTERVAL '15 days'
),
(
    2, 1, 4, 'Computer Science', 'Practical Project',
    'Delivered exceptional C++ custom memory allocator and high-performance graph processing engine for semester capstone.',
    NOW() - INTERVAL '10 days'
),
(
    3, 1, 3, 'English Literature', 'Creative Expression',
    'Eloquent critical analysis of Shakespearean tragic drama. Active leader in the Greenwood Inter-School Parliamentary Debate Team.',
    NOW() - INTERVAL '8 days'
),
(
    4, 2, 2, 'Physics', 'Laboratory Excellence',
    'Demonstrates precision in laser interferometry lab experiments and rigorous error estimation analysis.',
    NOW() - INTERVAL '12 days'
),
(
    5, 3, 5, 'Chemistry', 'Academic Growth',
    'Commendable effort and marked improvement in stoichiometry and chemical equation balancing.',
    NOW() - INTERVAL '6 days'
)
ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    teacher_id = EXCLUDED.teacher_id,
    subject = EXCLUDED.subject,
    remark_type = EXCLUDED.remark_type,
    remark = EXCLUDED.remark;

SELECT setval('student_progress_remarks_id_seq', (SELECT MAX(id) FROM public.student_progress_remarks));

-- -------------------------------------------------------------------------------------
-- 16. RELOAD POSTGREST SCHEMA CACHE
-- -------------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- -------------------------------------------------------------------------------------
-- 17. VERIFICATION QUERIES: ROW COUNTS ACROSS ALL 15 OPERATIONAL TABLES
-- -------------------------------------------------------------------------------------
SELECT 'teachers' AS table_name, COUNT(*) AS total_rows FROM public.teachers
UNION ALL
SELECT 'classes', COUNT(*) FROM public.classes
UNION ALL
SELECT 'students', COUNT(*) FROM public.students
UNION ALL
SELECT 'login_credentials', COUNT(*) FROM public.login_credentials
UNION ALL
SELECT 'subject_teachers_timetable', COUNT(*) FROM public.subject_teachers_timetable
UNION ALL
SELECT 'attendance', COUNT(*) FROM public.attendance
UNION ALL
SELECT 'teacher_attendance', COUNT(*) FROM public.teacher_attendance
UNION ALL
SELECT 'student_leaves', COUNT(*) FROM public.student_leaves
UNION ALL
SELECT 'attendance_regularizations', COUNT(*) FROM public.attendance_regularizations
UNION ALL
SELECT 'teacher_leaves', COUNT(*) FROM public.teacher_leaves
UNION ALL
SELECT 'teacher_attendance_regularizations', COUNT(*) FROM public.teacher_attendance_regularizations
UNION ALL
SELECT 'student_fees', COUNT(*) FROM public.student_fees
UNION ALL
SELECT 'teacher_salaries', COUNT(*) FROM public.teacher_salaries
UNION ALL
SELECT 'student_grades_results', COUNT(*) FROM public.student_grades_results
UNION ALL
SELECT 'student_progress_remarks', COUNT(*) FROM public.student_progress_remarks
ORDER BY total_rows DESC;
