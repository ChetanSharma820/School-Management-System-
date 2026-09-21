# Sheet 2: Database Schema & Complete Tables Inventory

## 1. Relational Database Summary
- **Database Engine**: PostgreSQL (Supabase Cloud)
- **Schema**: `public`
- **Data Access**: PostgREST RESTful APIs + C++ / Node.js Engine Middleware
- **Cache Invalidation**: Automated via `NOTIFY pgrst, 'reload schema'`

---

## 2. Table Schemas & Column Dictionaries

### 1. `students` (Student Demographic & Enrollment Records)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique student ID |
| `roll_number` | `TEXT` | `UNIQUE NOT NULL` | Roll number (e.g. `STU-1001`) |
| `first_name` | `TEXT` | `NOT NULL` | First name |
| `last_name` | `TEXT` | `NOT NULL` | Last name |
| `email` | `TEXT` | `UNIQUE` | Student contact email |
| `phone` | `TEXT` | | Primary contact number |
| `dob` | `DATE` | | Date of birth |
| `class_id` | `BIGINT` | `REFERENCES classes(id)` | Enrolled class cohort |
| `enrollment_date` | `DATE` | `DEFAULT CURRENT_DATE` | Date joined |
| `father_name` | `TEXT` | | Father's name |
| `mother_name` | `TEXT` | | Mother's name |
| `parent_phone` | `TEXT` | | Parent emergency mobile |
| `emergency_contact` | `TEXT` | | Secondary emergency contact |
| `address` | `TEXT` | | Residential address |
| `blood_group` | `TEXT` | `DEFAULT 'O+'` | Medical blood group |
| `gender` | `TEXT` | `DEFAULT 'Male'` | Gender |
| `aadhaar_number` | `TEXT` | | Identity number |
| `admission_date` | `DATE` | | Formal admission date |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

---

### 2. `teachers` (Faculty & Academic Staff)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique faculty ID |
| `employee_id` | `TEXT` | `UNIQUE NOT NULL` | Staff ID (e.g. `TCH-001`) |
| `first_name` | `TEXT` | `NOT NULL` | First name |
| `last_name` | `TEXT` | `NOT NULL` | Last name |
| `email` | `TEXT` | `UNIQUE` | Official email address |
| `phone` | `TEXT` | | Phone number |
| `department` | `TEXT` | | Department (e.g. `Science`, `Mathematics`) |
| `designation` | `TEXT` | `DEFAULT 'Senior Faculty'` | Academic designation |
| `cabin` | `TEXT` | | Staff cabin / office room |
| `qualification` | `TEXT` | | Degrees & certifications |
| `salary_base` | `NUMERIC(10,2)` | `DEFAULT 45000.00` | Base monthly salary |
| `weekly_load` | `INTEGER` | `DEFAULT 18` | Total weekly lecture hours |
| `specialization` | `TEXT` | | Core subject expertise |
| `emergency_contact` | `TEXT` | | Emergency contact |
| `address` | `TEXT` | | Residential address |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

---

### 3. `classes` (Class Cohorts, Sections & Homeroom Teachers)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique class ID |
| `class_name` | `TEXT` | `NOT NULL` | Grade level (e.g. `Class 10`, `Grade 11`) |
| `section` | `TEXT` | `NOT NULL` | Section batch (e.g. `A`, `B`, `C`) |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Appointed Class Teacher / Homeroom |
| `academic_year` | `TEXT` | `DEFAULT '2026-2027'` | Academic session |
| `base_fee` | `NUMERIC(10,2)` | `DEFAULT 45000.00` | Standard annual tuition base |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 4. `attendance` (Daily Student Attendance Records)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique punch ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Student ID |
| `date` | `DATE` | `NOT NULL` | Attendance date (`YYYY-MM-DD`) |
| `status` | `TEXT` | `NOT NULL` | `Present`, `Absent`, `Late`, `Excused` |
| `remarks` | `TEXT` | | Remarks / justification |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |

---

### 5. `student_leaves` (Student Leave & Absence Applications)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Application ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Student applicant |
| `class_id` | `BIGINT` | `REFERENCES classes(id)` | Enrolled class |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Reviewing Class Teacher |
| `leave_type` | `TEXT` | `NOT NULL` | `Medical Leave`, `Casual`, `Academic` |
| `start_date` | `DATE` | `NOT NULL` | Leave start date |
| `end_date` | `DATE` | `NOT NULL` | Leave end date |
| `days_count` | `INTEGER` | `DEFAULT 1` | Total consecutive days |
| `reason` | `TEXT` | `NOT NULL` | Reason / note |
| `status` | `TEXT` | `DEFAULT 'Pending'` | `Pending`, `Approved`, `Rejected` |
| `teacher_remarks` | `TEXT` | | Teacher review justification |
| `admin_remarks` | `TEXT` | | Administrator review remarks |
| `reviewed_at` | `TIMESTAMPTZ` | | Decision timestamp |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Update timestamp |

---

### 6. `attendance_regularizations` (Student Attendance Dispute Claims)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Dispute claim ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Student claimant |
| `class_id` | `BIGINT` | `REFERENCES classes(id)` | Enrolled class |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Reviewing Class Teacher |
| `attendance_date` | `DATE` | `NOT NULL` | Date in dispute |
| `original_status` | `TEXT` | `NOT NULL` | Original punch (`Absent`, `Late`) |
| `requested_status` | `TEXT` | `NOT NULL` | Requested punch (`Present`, `On-Duty`) |
| `reason_category` | `TEXT` | `NOT NULL` | `Biometric Issue`, `Medical`, `Bus Delay` |
| `reason` | `TEXT` | `NOT NULL` | Detailed explanation |
| `status` | `TEXT` | `DEFAULT 'Pending'` | `Pending`, `Approved`, `Rejected` |
| `teacher_remarks` | `TEXT` | | Teacher review notes |
| `admin_remarks` | `TEXT` | | Administrator review notes |
| `reviewed_at` | `TIMESTAMPTZ` | | Decision timestamp |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Update timestamp |

---

### 7. `teacher_leaves` (Faculty Leave Approvals Desk)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Application ID |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Faculty applicant |
| `leave_type` | `TEXT` | `NOT NULL` | `Casual`, `Medical`, `Earned`, `Duty` |
| `start_date` | `DATE` | `NOT NULL` | Start date |
| `end_date` | `DATE` | `NOT NULL` | End date |
| `days_count` | `INTEGER` | `DEFAULT 1` | Days count |
| `reason` | `TEXT` | | Explanation |
| `substitute_teacher` | `TEXT` | | Appointed substitute faculty |
| `status` | `TEXT` | `DEFAULT 'Pending'` | `Pending`, `Approved`, `Rejected` |
| `admin_remarks` | `TEXT` | | Administrator decision remarks |
| `reviewed_at` | `TIMESTAMPTZ` | | Review timestamp |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 8. `teacher_attendance_regularizations` (Faculty Biometric Regularization Desk)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Claim ID |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Faculty claimant |
| `attendance_date` | `DATE` | `NOT NULL` | Date in dispute |
| `original_status` | `TEXT` | `NOT NULL` | Original punch status |
| `requested_status` | `TEXT` | `NOT NULL` | Requested punch status |
| `reason_category` | `TEXT` | | `Biometric Glitch`, `Official Duty` |
| `reason` | `TEXT` | `NOT NULL` | Justification |
| `status` | `TEXT` | `DEFAULT 'Pending'` | `Pending`, `Approved`, `Rejected` |
| `admin_remarks` | `TEXT` | | Admin review notes |
| `reviewed_at` | `TIMESTAMPTZ` | | Review timestamp |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 9. `student_fees` (Fee Collections, Invoices & Receipts)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Receipt ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Payer student |
| `fee_category` | `TEXT` | `DEFAULT 'Tuition Fee'` | Fee category |
| `academic_year` | `TEXT` | `DEFAULT '2026-2027'` | Academic year |
| `term_name` | `TEXT` | `DEFAULT 'Installment #1'` | Installment term |
| `gross_amount` | `NUMERIC(10,2)` | `NOT NULL` | Total fee invoiced |
| `discount_amount` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Scholarship / waiver |
| `late_fine` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Penalty fine |
| `net_payable` | `NUMERIC(10,2)` | `NOT NULL` | Net amount payable (`gross - discount + fine`) |
| `amount_paid` | `NUMERIC(10,2)` | `NOT NULL` | Total amount paid |
| `balance_due` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Remaining balance |
| `payment_status` | `TEXT` | `DEFAULT 'Paid'` | `Paid`, `Partial`, `Pending` |
| `payment_method` | `TEXT` | `DEFAULT 'UPI / QR'` | `UPI`, `Net Banking`, `Card`, `Cash` |
| `receipt_no` | `TEXT` | `UNIQUE NOT NULL` | Receipt number (e.g. `REC-2026-001`) |
| `transaction_ref` | `TEXT` | | Bank transaction reference |
| `due_date` | `DATE` | `DEFAULT CURRENT_DATE` | Invoice payment deadline |
| `payment_date` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Payment date |
| `notes` | `TEXT` | | Receipt memo |

---

### 10. `teacher_salaries` (Faculty Payroll & Monthly Pay-Slips)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Payslip ID |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Faculty recipient |
| `salary_month` | `TEXT` | `NOT NULL` | Month (e.g. `September`) |
| `salary_year` | `INTEGER` | `NOT NULL` | Year (e.g. `2026`) |
| `payslip_no` | `TEXT` | `UNIQUE NOT NULL` | Number (e.g. `PAY-2026-SEP-101`) |
| `basic_salary` | `NUMERIC(10,2)` | `NOT NULL` | Base salary |
| `hra_allowance` | `NUMERIC(10,2)` | `DEFAULT 0.00` | House rent allowance |
| `da_allowance` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Dearness allowance |
| `medical_allowance`| `NUMERIC(10,2)` | `DEFAULT 0.00` | Medical allowance |
| `special_bonus` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Performance bonus |
| `gross_earnings` | `NUMERIC(10,2)` | `NOT NULL` | Total earnings |
| `provident_fund` | `NUMERIC(10,2)` | `DEFAULT 0.00` | PF deduction |
| `tax_deducted_tds`| `NUMERIC(10,2)` | `DEFAULT 0.00` | TDS income tax deduction |
| `total_deductions`| `NUMERIC(10,2)` | `NOT NULL` | Total deductions |
| `net_salary` | `NUMERIC(10,2)` | `NOT NULL` | Net payout amount |
| `payment_status` | `TEXT` | `DEFAULT 'Paid'` | `Paid`, `Pending` |
| `payment_date` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Payout timestamp |
| `payment_method` | `TEXT` | `DEFAULT 'Bank Transfer'` | Method |
| `transaction_ref` | `TEXT` | | NEFT/IMPS ref |

---

### 11. `subject_teachers_timetable` (Lecture Schedule & Subject Allocation)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Timetable entry ID |
| `class_id` | `BIGINT` | `REFERENCES classes(id)` | Class cohort |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Assigned teacher |
| `subject_name` | `TEXT` | `NOT NULL` | Subject (e.g. `Mathematics`) |
| `subject_code` | `TEXT` | | Code (e.g. `MTH-101`) |
| `day_of_week` | `TEXT` | `NOT NULL` | `Monday`, `Tuesday`, etc. |
| `start_time` | `TEXT` | `NOT NULL` | Start time (e.g. `09:00 AM`) |
| `end_time` | `TEXT` | `NOT NULL` | End time (e.g. `09:45 AM`) |
| `room_number` | `TEXT` | `DEFAULT 'Room 204'` | Classroom room allocation |

---

### 12. `student_grades_results` (Exam Terms & Subject Marks)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Grade record ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Student ID |
| `subject_name` | `TEXT` | `NOT NULL` | Subject |
| `exam_term` | `TEXT` | `NOT NULL` | `Mid-Term Examination`, `Final Exam` |
| `marks_obtained` | `NUMERIC(5,2)` | `NOT NULL` | Score obtained |
| `max_marks` | `NUMERIC(5,2)` | `DEFAULT 100.00` | Maximum possible marks |
| `grade_letter` | `TEXT` | | `A+`, `A`, `B`, `C`, etc. |
| `percentage` | `NUMERIC(5,2)` | | Percentage |
| `remarks` | `TEXT` | | Teacher assessment feedback |

---

### 13. `student_progress_remarks` (Qualitative Student Feedback)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Remark ID |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Student |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Reviewing faculty |
| `remark_category`| `TEXT` | `DEFAULT 'Academic'` | `Academic`, `Discipline`, `Sports` |
| `remark_text` | `TEXT` | `NOT NULL` | Detailed qualitative feedback |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |

---

### 14. `teacher_attendance` (Daily Faculty Biometric Punches)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Punch ID |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Faculty ID |
| `attendance_date` | `DATE` | `NOT NULL` | Date of punch |
| `status` | `TEXT` | `NOT NULL` | `Present`, `Late`, `On-Duty`, `Absent` |
| `punch_in_time` | `TEXT` | | Punch in (e.g. `08:15 AM`) |
| `punch_out_time` | `TEXT` | | Punch out (e.g. `04:30 PM`) |
| `remarks` | `TEXT` | | Notes |

---

### 15. `login_credentials` / `users` (Authentication & RBAC Matrix)
| Column Name | Data Type | Constraints / References | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | User ID |
| `username` | `TEXT` | `UNIQUE NOT NULL` | Login username |
| `password` | `TEXT` | `NOT NULL` | Login password |
| `role` | `TEXT` | `NOT NULL` | `admin`, `teacher`, `student` |
| `student_id` | `BIGINT` | `REFERENCES students(id)` | Associated student account |
| `teacher_id` | `BIGINT` | `REFERENCES teachers(id)` | Associated teacher account |
| `status` | `TEXT` | `DEFAULT 'active'` | `active`, `suspended` |
| `permissions` | `JSONB` | `DEFAULT '{}'` | Granular RBAC permissions overrides |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |
