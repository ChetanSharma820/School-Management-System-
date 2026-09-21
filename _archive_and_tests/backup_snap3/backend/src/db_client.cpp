#include "../include/db_client.h"
#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <sstream>

DatabaseClient::DatabaseClient() {}

bool DatabaseClient::init(const Config& config) {
    baseUrl = config.get("SUPABASE_URL", "https://xzmirtkasmtuadvyslri.supabase.co");
    apiKey = config.get("SUPABASE_ANON_KEY", "");
    projectId = config.get("SUPABASE_PROJECT_ID", "xzmirtkasmtuadvyslri");

    // Extract host from baseUrl (e.g. xzmirtkasmtuadvyslri.supabase.co)
    std::string prefix = "https://";
    if (baseUrl.rfind(prefix, 0) == 0) {
        host = baseUrl.substr(prefix.length());
    } else {
        host = baseUrl;
    }
    size_t slashPos = host.find('/');
    if (slashPos != std::string::npos) {
        host = host.substr(0, slashPos);
    }

    std::cout << "[DB Client] Initialized with Supabase Host: " << host << std::endl;
    return true;
}

std::string DatabaseClient::httpsRequest(const std::string& method, const std::string& path, const std::string& body) {
    HINTERNET hInternet = InternetOpenA("SchoolManagementSystem/1.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) {
        std::cerr << "[DB Client] Failed to initialize WinINet." << std::endl;
        return "{\"error\":\"WinINet initialization failed\"}";
    }

    HINTERNET hConnect = InternetConnectA(hInternet, host.c_str(), INTERNET_DEFAULT_HTTPS_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        std::cerr << "[DB Client] Failed to connect to host: " << host << std::endl;
        return "{\"error\":\"Connection to Supabase failed\"}";
    }

    DWORD flags = INTERNET_FLAG_SECURE | INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_KEEP_CONNECTION;
    HINTERNET hRequest = HttpOpenRequestA(hConnect, method.c_str(), path.c_str(), NULL, NULL, NULL, flags, 0);
    if (!hRequest) {
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return "{\"error\":\"Failed to open HTTP request\"}";
    }

    std::string headers = "apikey: " + apiKey + "\r\n" +
                          "Authorization: Bearer " + apiKey + "\r\n" +
                          "Content-Type: application/json\r\n" +
                          "Prefer: resolution=merge-duplicates,return=representation\r\n" +
                          "Range-Unit: items\r\n" +
                          "Range: 0-99999\r\n";

    BOOL sent = FALSE;
    if (body.empty()) {
        sent = HttpSendRequestA(hRequest, headers.c_str(), (DWORD)headers.length(), NULL, 0);
    } else {
        sent = HttpSendRequestA(hRequest, headers.c_str(), (DWORD)headers.length(), (LPVOID)body.c_str(), (DWORD)body.length());
    }

    if (!sent) {
        DWORD err = GetLastError();
        std::cerr << "[DB Client] HttpSendRequest failed with error: " << err << std::endl;
        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return "{\"error\":\"HttpSendRequest failed\"}";
    }

    std::string response;
    char buffer[16384];
    DWORD bytesRead = 0;
    while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        response.append(buffer, bytesRead);
    }

    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);

    return response;
}

std::string DatabaseClient::query(const std::string& table, const std::string& queryParams) {
    std::string path = "/rest/v1/" + table;
    std::string finalParams = "limit=100000";
    if (!queryParams.empty()) {
        finalParams = queryParams + "&limit=100000";
    }
    path += "?" + finalParams;
    return httpsRequest("GET", path);
}

std::string DatabaseClient::insert(const std::string& table, const std::string& jsonPayload) {
    std::string path = "/rest/v1/" + table;
    return httpsRequest("POST", path, jsonPayload);
}

std::string DatabaseClient::update(const std::string& table, const std::string& filterParam, const std::string& jsonPayload) {
    std::string path = "/rest/v1/" + table + "?" + filterParam;
    return httpsRequest("PATCH", path, jsonPayload);
}

std::string DatabaseClient::remove(const std::string& table, const std::string& filterParam) {
    std::string path = "/rest/v1/" + table + "?" + filterParam;
    return httpsRequest("DELETE", path);
}

// -------------------------------------------------------------
// Domain Methods (Supporting Thousands of Records)
// -------------------------------------------------------------
std::string DatabaseClient::getAllStudents() {
    return query("students", "select=*,classes(id,class_name,section,teacher_id,teachers(id,first_name,last_name,employee_id,email,phone,department,designation,cabin,qualification))&order=id.asc");
}

std::string DatabaseClient::getStudentById(long long id) {
    return query("students", "id=eq." + std::to_string(id) + "&select=*,classes(id,class_name,section,teacher_id,teachers(id,first_name,last_name,employee_id,email,phone,department,designation,cabin,qualification))");
}

std::string DatabaseClient::addStudent(const std::string& jsonPayload) {
    return insert("students?on_conflict=roll_number", jsonPayload);
}

std::string DatabaseClient::updateStudent(long long id, const std::string& jsonPayload) {
    return update("students", "id=eq." + std::to_string(id), jsonPayload);
}

std::string DatabaseClient::deleteStudent(long long id) {
    return remove("students", "id=eq." + std::to_string(id));
}

std::string DatabaseClient::getAllTeachers() {
    return query("teachers", "select=*&order=id.asc");
}

std::string DatabaseClient::addTeacher(const std::string& jsonPayload) {
    return insert("teachers?on_conflict=employee_id", jsonPayload);
}

std::string DatabaseClient::getAllClasses() {
    return query("classes", "select=*,teachers(id,first_name,last_name,employee_id,email,phone,department,designation,cabin,qualification)&order=id.asc");
}

std::string DatabaseClient::addClass(const std::string& jsonPayload) {
    return insert("classes", jsonPayload);
}

std::string DatabaseClient::updateClass(long long id, const std::string& jsonPayload) {
    return update("classes", "id=eq." + std::to_string(id), jsonPayload);
}

std::string DatabaseClient::getAllFees() {
    return query("student_fees", "select=*,students(first_name,last_name,roll_number)&order=id.desc");
}

std::string DatabaseClient::collectFee(const std::string& jsonPayload) {
    return insert("student_fees?on_conflict=receipt_no", jsonPayload);
}

std::string DatabaseClient::getFeeReceipt(const std::string& receiptNo) {
    return query("student_fees", "receipt_no=eq." + receiptNo + "&select=*,students(first_name,last_name,roll_number,email,phone)");
}

std::string DatabaseClient::getAllSalaries() {
    return query("teacher_salaries", "select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc");
}

std::string DatabaseClient::generateSalary(const std::string& jsonPayload) {
    return insert("teacher_salaries?on_conflict=payslip_no", jsonPayload);
}

std::string DatabaseClient::getAttendance(const std::string& date) {
    std::string filter = "select=*,students(first_name,last_name,roll_number)&order=id.asc";
    if (!date.empty()) {
        filter += "&date=eq." + date;
    }
    return query("attendance", filter);
}

std::string DatabaseClient::markAttendance(const std::string& jsonPayload) {
    return insert("attendance?on_conflict=student_id,date", jsonPayload);
}

std::string DatabaseClient::getGrades() {
    return query("grades", "select=*,students(first_name,last_name,roll_number),subjects(subject_name,subject_code)&order=id.desc");
}

std::string DatabaseClient::addGrade(const std::string& jsonPayload) {
    return insert("grades", jsonPayload);
}


std::string DatabaseClient::getDashboardStats() {
    // Return aggregated stats summary
    std::string students = query("students", "select=id");
    std::string teachers = query("teachers", "select=id");
    std::string classes = query("classes", "select=id");
    std::string fees = query("student_fees", "select=amount_paid,balance_due");

    std::stringstream ss;
    ss << "{"
       << "\"students_raw\":" << (students.empty() ? "[]" : students) << ","
       << "\"teachers_raw\":" << (teachers.empty() ? "[]" : teachers) << ","
       << "\"classes_raw\":" << (classes.empty() ? "[]" : classes) << ","
       << "\"fees_raw\":" << (fees.empty() ? "[]" : fees)
       << "}";
    return ss.str();
}

// -------------------------------------------------------------
// Authentication & Role-Based Access Control (RBAC)
// -------------------------------------------------------------
std::string DatabaseClient::loginUser(const std::string& username, const std::string& password) {
    // 1. Try dedicated login_credentials table first
    std::string creds = query("login_credentials", "username=eq." + username + "&select=*,students(*,classes(*)),teachers(*)");
    if (!creds.empty() && creds[0] == '[' && creds != "[]") {
        return creds;
    }
    // 2. Fallback to users table
    return query("users", "username=eq." + username + "&select=*,students(*,classes(*)),teachers(*)");
}

std::string DatabaseClient::getAllUsers() {
    std::string creds = query("login_credentials", "select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.asc");
    if (!creds.empty() && creds[0] == '[' && creds != "[]") {
        return creds;
    }
    return query("users", "select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.asc");
}

std::string DatabaseClient::getProgressRemarks(long long studentId) {
    if (studentId > 0) {
        return query("student_progress_remarks", "student_id=eq." + std::to_string(studentId) + "&select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.desc");
    }
    return query("student_progress_remarks", "select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.desc");
}

std::string DatabaseClient::addProgressRemark(const std::string& jsonPayload) {
    return insert("student_progress_remarks", jsonPayload);
}

std::string DatabaseClient::getStudentGradesResults(long long studentId) {
    if (studentId > 0) {
        return query("student_grades_results", "student_id=eq." + std::to_string(studentId) + "&order=id.desc");
    }
    return query("student_grades_results", "select=*,students(first_name,last_name,roll_number)&order=id.desc");
}

std::string DatabaseClient::addStudentGradeResult(const std::string& jsonPayload) {
    return insert("student_grades_results", jsonPayload);
}

std::string DatabaseClient::getTimetable(long long classId, long long teacherId) {
    std::string filters = "select=*,classes(class_name,section),teachers(first_name,last_name,employee_id)&order=id.asc";
    if (classId > 0 && teacherId > 0) {
        filters = "class_id=eq." + std::to_string(classId) + "&teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    } else if (classId > 0) {
        filters = "class_id=eq." + std::to_string(classId) + "&" + filters;
    } else if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    return query("subject_teachers_timetable", filters);
}

std::string DatabaseClient::addTimetableEntry(const std::string& jsonPayload) {
    return insert("subject_teachers_timetable", jsonPayload);
}

std::string DatabaseClient::deleteTimetableEntry(long long id) {
    return remove("subject_teachers_timetable", "id=eq." + std::to_string(id));
}

std::string DatabaseClient::getStudentLeaves(long long studentId, long long teacherId) {
    std::string filters = "select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name,employee_id)&order=id.desc";
    if (studentId > 0) {
        filters = "student_id=eq." + std::to_string(studentId) + "&" + filters;
    } else if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    return query("student_leaves", filters);
}

std::string DatabaseClient::createStudentLeave(const std::string& jsonPayload) {
    return insert("student_leaves", jsonPayload);
}

std::string DatabaseClient::updateStudentLeaveStatus(long long leaveId, const std::string& jsonPayload) {
    return update("student_leaves", "id=eq." + std::to_string(leaveId), jsonPayload);
}

// -------------------------------------------------------------
// Student Attendance Regularization Requests & Approvals
// -------------------------------------------------------------
std::string DatabaseClient::getAttendanceRegularizations(long long studentId, long long teacherId) {
    std::string filters = "select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name,employee_id)&order=id.desc";
    if (studentId > 0) {
        filters = "student_id=eq." + std::to_string(studentId) + "&" + filters;
    } else if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    return query("attendance_regularizations", filters);
}

std::string DatabaseClient::createAttendanceRegularization(const std::string& jsonPayload) {
    return insert("attendance_regularizations", jsonPayload);
}

std::string DatabaseClient::updateAttendanceRegularizationStatus(long long regId, const std::string& jsonPayload) {
    return update("attendance_regularizations", "id=eq." + std::to_string(regId), jsonPayload);
}

// -------------------------------------------------------------
// Teacher Self-Attendance & Timecard System
// -------------------------------------------------------------
std::string DatabaseClient::getTeacherAttendance(long long teacherId, const std::string& month) {
    std::string filters = "select=*,teachers(first_name,last_name,employee_id)&order=attendance_date.desc";
    if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    if (!month.empty() && month.length() >= 7) {
        int y = 2026, m = 9;
        try {
            y = std::stoi(month.substr(0, 4));
            m = std::stoi(month.substr(5, 2));
        } catch (...) {}
        int nextY = (m == 12) ? y + 1 : y;
        int nextM = (m == 12) ? 1 : m + 1;
        char nextBuf[16];
        sprintf(nextBuf, "%04d-%02d-01", nextY, nextM);
        filters += "&attendance_date=gte." + month + "-01&attendance_date=lt." + std::string(nextBuf);
    }
    return query("teacher_attendance", filters);
}

std::string DatabaseClient::recordTeacherAttendance(const std::string& jsonPayload) {
    return insert("teacher_attendance?on_conflict=teacher_id,attendance_date", jsonPayload);
}

// -------------------------------------------------------------
// Admin Master Governance & RBAC Permission Management
// -------------------------------------------------------------
std::string DatabaseClient::updateTeacher(long long id, const std::string& jsonPayload) {
    return update("teachers", "id=eq." + std::to_string(id), jsonPayload);
}

std::string DatabaseClient::deleteTeacher(long long id) {
    return remove("teachers", "id=eq." + std::to_string(id));
}

std::string DatabaseClient::deleteFee(long long id) {
    return remove("fees", "id=eq." + std::to_string(id));
}

std::string DatabaseClient::deleteSalary(long long id) {
    return remove("teacher_salaries", "id=eq." + std::to_string(id));
}

std::string DatabaseClient::updateUserPermission(long long id, const std::string& jsonPayload) {
    return update("login_credentials", "id=eq." + std::to_string(id), jsonPayload);
}

std::string DatabaseClient::deleteUser(long long id) {
    return remove("login_credentials", "id=eq." + std::to_string(id));
}

// -------------------------------------------------------------
// Teacher Leave Requests & Admin Approvals
// -------------------------------------------------------------
std::string DatabaseClient::getTeacherLeaves(long long teacherId) {
    std::string filters = "select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc";
    if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    return query("teacher_leaves", filters);
}

std::string DatabaseClient::createTeacherLeave(const std::string& jsonPayload) {
    return insert("teacher_leaves", jsonPayload);
}

std::string DatabaseClient::updateTeacherLeaveStatus(long long leaveId, const std::string& jsonPayload) {
    return update("teacher_leaves", "id=eq." + std::to_string(leaveId), jsonPayload);
}

// -------------------------------------------------------------
// Teacher Attendance Regularization Requests & Admin Approvals
// -------------------------------------------------------------
std::string DatabaseClient::getTeacherAttendanceRegularizations(long long teacherId) {
    std::string filters = "select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc";
    if (teacherId > 0) {
        filters = "teacher_id=eq." + std::to_string(teacherId) + "&" + filters;
    }
    return query("teacher_attendance_regularizations", filters);
}

std::string DatabaseClient::createTeacherAttendanceRegularization(const std::string& jsonPayload) {
    return insert("teacher_attendance_regularizations", jsonPayload);
}

std::string DatabaseClient::updateTeacherAttendanceRegularizationStatus(long long regId, const std::string& jsonPayload) {
    return update("teacher_attendance_regularizations", "id=eq." + std::to_string(regId), jsonPayload);
}

