#ifndef MODELS_H
#define MODELS_H

#include <string>
#include <vector>

// -------------------------------------------------------------
// Model: Student
// -------------------------------------------------------------
struct Student {
    long long id;
    std::string roll_number;
    std::string first_name;
    std::string last_name;
    std::string email;
    std::string phone;
    std::string dob;
    long long class_id;
    std::string class_name;
    std::string enrollment_date;
    std::string created_at;

    // Extended profile & guardian fields
    std::string father_name;
    std::string mother_name;
    std::string parent_phone;
    std::string address;
    std::string blood_group;
    std::string gender;
    std::string emergency_contact;
    std::string aadhaar_number;
    std::string admission_date;

    Student() : id(0), class_id(0) {}
};

// -------------------------------------------------------------
// Model: Teacher
// -------------------------------------------------------------
struct Teacher {
    long long id;
    std::string employee_id;
    std::string first_name;
    std::string last_name;
    std::string email;
    std::string phone;
    std::string qualification;
    std::string department;
    std::string designation;
    std::string cabin;
    double salary_base;
    std::string emergency_contact;
    std::string address;
    int weekly_load;
    std::string specialization;
    std::string created_at;

    Teacher() : id(0), salary_base(45000.0), weekly_load(18) {}
};

// -------------------------------------------------------------
// Model: Class Section
// -------------------------------------------------------------
struct ClassSection {
    long long id;
    std::string class_name;
    std::string section;
    long long teacher_id;
    std::string teacher_name;
    std::string academic_year;

    ClassSection() : id(0), teacher_id(0) {}
};

// -------------------------------------------------------------
// Model: Student Fee Receipt / Slip
// -------------------------------------------------------------
struct FeeReceipt {
    long long id;
    std::string receipt_no;
    long long student_id;
    std::string student_name;
    std::string student_roll;
    std::string academic_year;
    std::string term_name;
    std::string fee_category;
    double gross_amount;
    double discount_amount;
    double late_fine;
    double net_payable;
    double amount_paid;
    double balance_due;
    std::string payment_status; // 'Paid', 'Partial', 'Pending', 'Overdue'
    std::string payment_method; // 'Cash', 'UPI / QR', 'Card', 'Cheque'
    std::string transaction_ref;
    std::string due_date;
    std::string payment_date;
    std::string received_by;

    FeeReceipt() : id(0), student_id(0), gross_amount(0.0), discount_amount(0.0),
                   late_fine(0.0), net_payable(0.0), amount_paid(0.0), balance_due(0.0) {}
};

// -------------------------------------------------------------
// Model: Teacher Salary Pay-Slip
// -------------------------------------------------------------
struct TeacherSalarySlip {
    long long id;
    std::string payslip_no;
    long long teacher_id;
    std::string teacher_name;
    std::string teacher_employee_id;
    std::string salary_month;
    int salary_year;
    int total_working_days;
    int days_present;
    int leaves_taken;
    double basic_salary;
    double hra_allowance;
    double da_allowance;
    double medical_allowance;
    double special_bonus;
    double gross_earnings;
    double provident_fund;
    double tax_deducted_tds;
    double leave_deduction;
    double total_deductions;
    double net_salary;
    std::string payment_status; // 'Paid', 'Pending', 'Processing'
    std::string payment_method;
    std::string bank_account_last4;
    std::string payment_date;
    std::string transaction_ref;

    TeacherSalarySlip() : id(0), teacher_id(0), salary_year(2026), total_working_days(30),
                          days_present(30), leaves_taken(0), basic_salary(0.0), hra_allowance(0.0),
                          da_allowance(0.0), medical_allowance(0.0), special_bonus(0.0), gross_earnings(0.0),
                          provident_fund(0.0), tax_deducted_tds(0.0), leave_deduction(0.0),
                          total_deductions(0.0), net_salary(0.0) {}
};

// -------------------------------------------------------------
// Model: Attendance Record
// -------------------------------------------------------------
struct AttendanceRecord {
    long long id;
    long long student_id;
    std::string student_name;
    std::string date;
    std::string status; // 'Present', 'Absent', 'Late'
    std::string remarks;

    AttendanceRecord() : id(0), student_id(0) {}
};

// -------------------------------------------------------------
// Model: Grade Record
// -------------------------------------------------------------
struct GradeRecord {
    long long id;
    long long student_id;
    std::string student_name;
    long long subject_id;
    std::string subject_name;
    std::string exam_term;
    double marks_obtained;
    double max_marks;
    std::string remarks;

    GradeRecord() : id(0), student_id(0), subject_id(0), marks_obtained(0.0), max_marks(100.0) {}
};

// -------------------------------------------------------------
// Model: User Account (Authentication & RBAC)
// -------------------------------------------------------------
struct UserAccount {
    long long id;
    std::string username;
    std::string email;
    std::string password_hash;
    std::string role; // 'admin', 'teacher', 'student'
    long long student_id;
    long long teacher_id;
    std::string status; // 'active', 'inactive'
    std::string avatar_url;
    std::string last_login_at;

    UserAccount() : id(0), student_id(0), teacher_id(0), role("student"), status("active") {}
};

// -------------------------------------------------------------
// Model: Student Progress Remark
// -------------------------------------------------------------
struct ProgressRemark {
    long long id;
    long long student_id;
    std::string student_name;
    long long teacher_id;
    std::string teacher_name;
    std::string academic_term;
    std::string subject_name;
    std::string performance_level;
    std::string remark_text;
    std::string created_at;

    ProgressRemark() : id(0), student_id(0), teacher_id(0) {}
};

// -------------------------------------------------------------
// Model: Subject Teachers & Lecture Timetable
// -------------------------------------------------------------
struct TimetableEntry {
    long long id;
    long long class_id;
    std::string class_name;
    std::string subject_name;
    long long teacher_id;
    std::string teacher_name;
    std::string day_of_week;
    std::string start_time;
    std::string end_time;
    std::string room_number;

    TimetableEntry() : id(0), class_id(0), teacher_id(0) {}
};

// -------------------------------------------------------------
// Model: Student Leave Request & Class Teacher Review
// -------------------------------------------------------------
struct StudentLeave {
    long long id;
    long long student_id;
    std::string student_name;
    std::string student_roll;
    long long class_id;
    std::string class_name;
    long long teacher_id;
    std::string teacher_name;
    std::string leave_type;
    std::string start_date;
    std::string end_date;
    int days_count;
    std::string reason;
    std::string status; // 'Pending', 'Approved', 'Rejected'
    std::string teacher_remarks;
    std::string reviewed_at;
    std::string created_at;

    StudentLeave() : id(0), student_id(0), class_id(0), teacher_id(0), days_count(1), status("Pending") {}
};

// -------------------------------------------------------------
// Model: Teacher Leave Request & Admin Approval
// -------------------------------------------------------------
struct TeacherLeave {
    long long id;
    long long teacher_id;
    std::string teacher_name;
    std::string employee_id;
    std::string leave_type;
    std::string start_date;
    std::string end_date;
    int days_count;
    std::string reason;
    std::string substitute_teacher;
    std::string status; // 'Pending', 'Approved', 'Rejected'
    std::string admin_remarks;
    std::string reviewed_at;
    std::string created_at;

    TeacherLeave() : id(0), teacher_id(0), days_count(1), status("Pending") {}
};

// -------------------------------------------------------------
// Model: Teacher Attendance Regularization & Admin Approval
// -------------------------------------------------------------
struct TeacherAttendanceRegularization {
    long long id;
    long long teacher_id;
    std::string teacher_name;
    std::string employee_id;
    std::string attendance_date;
    std::string original_status;
    std::string requested_status;
    std::string reason_category;
    std::string reason;
    std::string status; // 'Pending', 'Approved', 'Rejected'
    std::string admin_remarks;
    std::string reviewed_at;
    std::string created_at;

    TeacherAttendanceRegularization() : id(0), teacher_id(0), status("Pending") {}
};

#endif // MODELS_H
