# Sheet 3: REST API & Endpoints Matrix

## 1. Middleware Server Specifications
- **Base URL**: `http://127.0.0.1:8080/api`
- **Server Engine**: Node.js HTTP Daemon (`backend/server.js`)
- **Protocol**: HTTP/1.1 RESTful JSON API
- **CORS Support**: `*` (All Methods: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`)

---

## 2. API Endpoints Reference Matrix

| # | Endpoint | Method | Query / URL Params | Request Payload | Response & Description |
|---|:---|:---:|:---|:---|:---|
| **1** | `/api/health` | `GET` | None | None | `{ status: "online", service: "...", version: "2.0.0" }` |
| **2** | `/api/stats` | `GET` | None | None | Aggregate counts of students, teachers, classes, and fees |
| **3** | `/api/students` | `GET` | None | None | Full list of students joined with `classes` and `teachers` |
| **4** | `/api/students` | `POST` | None | Student object | Creates student record (`on_conflict=roll_number`) |
| **5** | `/api/students/:id` | `PATCH` | `id` | Partial student fields | Updates student record |
| **6** | `/api/students/:id` | `DELETE`| `id` | None | Deletes student record |
| **7** | `/api/teachers` | `GET` | None | None | List of all faculty members |
| **8** | `/api/teachers` | `POST` | None | Teacher object | Creates faculty record (`on_conflict=employee_id`) |
| **9** | `/api/teachers/:id` | `PATCH` | `id` | Partial teacher fields | Updates faculty profile |
| **10**| `/api/teachers/:id` | `DELETE`| `id` | None | Deletes faculty record |
| **11**| `/api/classes` | `GET` | None | None | List of all classes with appointed Class Teacher |
| **12**| `/api/classes` | `POST` | None | Class object | Creates class cohort & section |
| **13**| `/api/classes/:id` | `PATCH` | `id` | Partial class fields | Updates class name, section, fee, teacher_id |
| **14**| `/api/fees` | `GET` | None | None | Fee collection records with student details |
| **15**| `/api/fees` | `POST` | None | Fee record object | Generates fee receipt & updates ledger |
| **16**| `/api/fees/:id` | `PATCH` | `id` | Fee updates | Modifies fee record |
| **17**| `/api/fees/:id` | `DELETE`| `id` | None | Deletes fee receipt |
| **18**| `/api/salaries` | `GET` | None | None | Teacher payroll ledger & payslips with teacher join |
| **19**| `/api/salaries` | `POST` | None | Salary slip object | Generates payslip (`on_conflict=payslip_no`) |
| **20**| `/api/salaries/:id` | `DELETE`| `id` | None | Deletes salary record |
| **21**| `/api/attendance` | `GET` | `date`, `student_id`, `month` | None | Daily or monthly attendance punches |
| **22**| `/api/attendance` | `POST` | None | `{ student_id, date, status, remarks }` | Upserts attendance punch (`on_conflict=student_id,date`) |
| **23**| `/api/teacher-attendance` | `GET` | `teacher_id`, `month` | None | Daily biometric punches for faculty |
| **24**| `/api/teacher-attendance` | `POST` | None | `{ teacher_id, attendance_date, status, ... }` | Upserts faculty punch (`on_conflict=teacher_id,attendance_date`) |
| **25**| `/api/leaves` | `GET` | `student_id`, `teacher_id` | None | Student leave applications joined with students & teachers |
| **26**| `/api/leaves` | `POST` | None | `{ student_id, class_id, leave_type, start_date, end_date, reason }` | Submits student leave application |
| **27**| `/api/leaves/:id` | `PATCH` | `id` | `{ status, admin_remarks, teacher_remarks, reviewed_at }` | Reviews/approves/rejects student leave |
| **28**| `/api/attendance-regularizations` | `GET` | `student_id`, `teacher_id` | None | Student attendance dispute claims with relations |
| **29**| `/api/attendance-regularizations` | `POST` | None | `{ student_id, attendance_date, original_status, requested_status, reason_category, reason }` | Submits student attendance regularization |
| **30**| `/api/attendance-regularizations/:id` | `PATCH` | `id` | `{ status, admin_remarks, teacher_remarks, reviewed_at }` | Reviews/regularizes attendance dispute |
| **31**| `/api/teacher-leaves` | `GET` | `teacher_id` | None | Faculty leave requests with teacher join |
| **32**| `/api/teacher-leaves` | `POST` | None | Faculty leave payload | Submits faculty leave request |
| **33**| `/api/teacher-leaves/:id` | `PATCH` | `id` | `{ status, admin_remarks, reviewed_at }` | Admin approves/rejects faculty leave |
| **34**| `/api/teacher-attendance-regularizations` | `GET` | `teacher_id` | None | Faculty biometric dispute regularizations |
| **35**| `/api/teacher-attendance-regularizations` | `POST` | None | Dispute payload | Submits faculty biometric regularization |
| **36**| `/api/teacher-attendance-regularizations/:id` | `PATCH` | `id` | `{ status, admin_remarks, reviewed_at }` | Admin regularizes faculty attendance |
| **37**| `/api/timetable` | `GET` | `class_id`, `teacher_id` | None | Timetable schedule joined with class & teacher |
| **38**| `/api/timetable` | `POST` | None | Timetable entry payload | Creates timetable schedule slot |
| **39**| `/api/timetable/:id` | `DELETE`| `id` | None | Deletes timetable slot |
| **40**| `/api/student-grades` | `GET` | `student_id` | None | Examination results, terms & marks |
| **41**| `/api/student-grades` | `POST` | None | Grade result payload | Records examination assessment score |
| **42**| `/api/student-grades/:id`| `DELETE`| `id` | None | Deletes grade record |
| **43**| `/api/remarks` | `GET` | `student_id` | None | Qualitative progress remarks for student |
| **44**| `/api/remarks` | `POST` | None | Remark payload | Records teacher progress remark |
| **45**| `/api/remarks/:id` | `DELETE`| `id` | None | Deletes progress remark |
| **46**| `/api/auth/login` | `POST` | None | `{ username, password }` | Authenticates user & returns profile + role |
| **47**| `/api/permissions` | `GET` | None | None | RBAC matrix & user accounts list |
| **48**| `/api/permissions/:id` | `PATCH`| `id` | `{ status, permissions }` | Updates RBAC overrides & locks/unlocks user |
| **49**| `/api/system/reset` | `POST` | None | None | Wipes all 14 operational relational tables & clears non-admin accounts while preserving `admin` |
