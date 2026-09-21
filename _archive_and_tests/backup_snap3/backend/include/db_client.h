#ifndef DB_CLIENT_H
#define DB_CLIENT_H

#include <string>
#include <vector>
#include "config.h"
#include "models.h"

class DatabaseClient {
private:
    std::string baseUrl;
    std::string host;
    std::string apiKey;
    std::string projectId;

    std::string httpsRequest(const std::string& method, const std::string& path, const std::string& body = "");

public:
    DatabaseClient();
    bool init(const Config& config);

    // Generic REST query to Supabase PostgREST
    std::string query(const std::string& table, const std::string& queryParams = "");
    std::string insert(const std::string& table, const std::string& jsonPayload);
    std::string update(const std::string& table, const std::string& filterParam, const std::string& jsonPayload);
    std::string remove(const std::string& table, const std::string& filterParam);

    // High level domain methods
    std::string getAllStudents();
    std::string getStudentById(long long id);
    std::string addStudent(const std::string& jsonPayload);
    std::string updateStudent(long long id, const std::string& jsonPayload);
    std::string deleteStudent(long long id);

    std::string getAllTeachers();
    std::string addTeacher(const std::string& jsonPayload);

    std::string getAllClasses();
    std::string addClass(const std::string& jsonPayload);
    std::string updateClass(long long id, const std::string& jsonPayload);

    std::string getAllFees();
    std::string collectFee(const std::string& jsonPayload);
    std::string getFeeReceipt(const std::string& receiptNo);

    std::string getAllSalaries();
    std::string generateSalary(const std::string& jsonPayload);

    std::string getAttendance(const std::string& date);
    std::string markAttendance(const std::string& jsonPayload);

    std::string getGrades();
    std::string addGrade(const std::string& jsonPayload);

    std::string getDashboardStats();

    // Authentication & Role-Based Access Control (RBAC)
    std::string loginUser(const std::string& username, const std::string& password);
    std::string getAllUsers();
    std::string getProgressRemarks(long long studentId = 0);
    std::string addProgressRemark(const std::string& jsonPayload);
    std::string getStudentGradesResults(long long studentId = 0);
    std::string addStudentGradeResult(const std::string& jsonPayload);
    std::string getTimetable(long long classId = 0, long long teacherId = 0);
    std::string addTimetableEntry(const std::string& jsonPayload);
    std::string deleteTimetableEntry(long long id);

    // Student Leave Requests & Approvals
    std::string getStudentLeaves(long long studentId = 0, long long teacherId = 0);
    std::string createStudentLeave(const std::string& jsonPayload);
    std::string updateStudentLeaveStatus(long long leaveId, const std::string& jsonPayload);

    // Student Attendance Regularization Requests & Class Teacher Approvals
    std::string getAttendanceRegularizations(long long studentId = 0, long long teacherId = 0);
    std::string createAttendanceRegularization(const std::string& jsonPayload);
    std::string updateAttendanceRegularizationStatus(long long regId, const std::string& jsonPayload);

    // Teacher Self-Attendance & Timecard System
    std::string getTeacherAttendance(long long teacherId = 0, const std::string& month = "");
    std::string recordTeacherAttendance(const std::string& jsonPayload);

    // Teacher Leave Requests & Admin Approvals
    std::string getTeacherLeaves(long long teacherId = 0);
    std::string createTeacherLeave(const std::string& jsonPayload);
    std::string updateTeacherLeaveStatus(long long leaveId, const std::string& jsonPayload);

    // Teacher Attendance Regularization Requests & Admin Approvals
    std::string getTeacherAttendanceRegularizations(long long teacherId = 0);
    std::string createTeacherAttendanceRegularization(const std::string& jsonPayload);
    std::string updateTeacherAttendanceRegularizationStatus(long long regId, const std::string& jsonPayload);

    // Admin Master Governance & RBAC Permission Management
    std::string updateTeacher(long long id, const std::string& jsonPayload);
    std::string deleteTeacher(long long id);
    std::string deleteFee(long long id);
    std::string deleteSalary(long long id);
    std::string updateUserPermission(long long id, const std::string& jsonPayload);
    std::string deleteUser(long long id);
};

#endif // DB_CLIENT_H
