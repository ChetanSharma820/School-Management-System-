#include "../include/http_server.h"
#include <iostream>
#include <sstream>
#include <vector>

HttpServer::HttpServer(int p) : port(p), serverSocket(INVALID_SOCKET), running(false) {}

HttpServer::~HttpServer() {
    stop();
}

bool HttpServer::init(const Config& config) {
    port = config.getInt("BACKEND_PORT", 8080);
    if (!dbClient.init(config)) {
        std::cerr << "[Server] Failed to initialize DatabaseClient." << std::endl;
        return false;
    }

    WSADATA wsaData;
    int res = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (res != 0) {
        std::cerr << "[Server] WSAStartup failed: " << res << std::endl;
        return false;
    }

    serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "[Server] Socket creation failed: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return false;
    }

    // Set SO_REUSEADDR
    BOOL opt = TRUE;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "[Server] Bind failed on port " << port << " with error: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return false;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "[Server] Listen failed: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return false;
    }

    std::cout << "==========================================================" << std::endl;
    std::cout << "🚀 C++ REST API Server initialized on http://127.0.0.1:" << port << std::endl;
    std::cout << "   - Database: Supabase Cloud PostgreSQL" << std::endl;
    std::cout << "   - CORS Enabled: True (*)" << std::endl;
    std::cout << "==========================================================" << std::endl;

    return true;
}

HttpRequest HttpServer::parseRequest(const std::string& rawRequest) {
    HttpRequest req;
    req.method = "GET";
    req.path = "/";

    std::istringstream stream(rawRequest);
    std::string line;
    if (std::getline(stream, line)) {
        std::istringstream lineStream(line);
        lineStream >> req.method >> req.path;
        
        size_t qPos = req.path.find('?');
        if (qPos != std::string::npos) {
            req.query = req.path.substr(qPos + 1);
            req.path = req.path.substr(0, qPos);
        }
    }

    // Find body (after \r\n\r\n)
    size_t headerEnd = rawRequest.find("\r\n\r\n");
    if (headerEnd != std::string::npos) {
        req.body = rawRequest.substr(headerEnd + 4);
    }

    return req;
}

std::string HttpServer::handleRoute(const HttpRequest& req) {
    std::cout << "[HTTP " << req.method << "] " << req.path << std::endl;

    // OPTIONS preflight check for CORS
    if (req.method == "OPTIONS") {
        return "{\"status\":\"ok\"}";
    }

    // Root / Health Check
    if (req.path == "/" || req.path == "/api/health") {
        return "{\"status\":\"online\",\"service\":\"School Management C++ Backend\",\"version\":\"1.0.0\"}";
    }

    // Dashboard Analytics Stats
    if (req.path == "/api/stats") {
        return dbClient.getDashboardStats();
    }

    // Students Endpoints
    if (req.path == "/api/students") {
        if (req.method == "GET") return dbClient.getAllStudents();
        if (req.method == "POST") return dbClient.addStudent(req.body);
    }
    if (req.path.rfind("/api/students/", 0) == 0) {
        std::string idStr = req.path.substr(14);
        long long id = std::stoll(idStr);
        if (req.method == "GET") return dbClient.getStudentById(id);
        if (req.method == "PUT" || req.method == "PATCH") return dbClient.updateStudent(id, req.body);
        if (req.method == "DELETE") return dbClient.deleteStudent(id);
    }

    // Teachers Endpoints
    if (req.path == "/api/teachers") {
        if (req.method == "GET") return dbClient.getAllTeachers();
        if (req.method == "POST") return dbClient.addTeacher(req.body);
    }
    if (req.path.rfind("/api/teachers/", 0) == 0) {
        std::string idStr = req.path.substr(14);
        long long id = std::stoll(idStr);
        if (req.method == "PUT" || req.method == "PATCH") return dbClient.updateTeacher(id, req.body);
        if (req.method == "DELETE") return dbClient.deleteTeacher(id);
    }

    // Classes Endpoints
    if (req.path == "/api/classes") {
        if (req.method == "GET") return dbClient.getAllClasses();
        if (req.method == "POST") return dbClient.addClass(req.body);
    }
    if (req.path.rfind("/api/classes/", 0) == 0) {
        std::string idStr = req.path.substr(13);
        try {
            long long id = std::stoll(idStr);
            if (req.method == "PUT" || req.method == "PATCH") return dbClient.updateClass(id, req.body);
        } catch (...) {}
    }

    // Fees Endpoints
    if (req.path == "/api/fees") {
        if (req.method == "GET") return dbClient.getAllFees();
        if (req.method == "POST") return dbClient.collectFee(req.body);
    }
    if (req.path.rfind("/api/fees/receipt/", 0) == 0) {
        std::string receiptNo = req.path.substr(18);
        return dbClient.getFeeReceipt(receiptNo);
    }
    if (req.path.rfind("/api/fees/", 0) == 0 && req.path.find("/receipt/") == std::string::npos) {
        std::string idStr = req.path.substr(10);
        long long id = std::stoll(idStr);
        if (req.method == "DELETE") return dbClient.deleteFee(id);
    }

    // Salaries / Payroll Endpoints
    if (req.path == "/api/salaries") {
        if (req.method == "GET") return dbClient.getAllSalaries();
        if (req.method == "POST") return dbClient.generateSalary(req.body);
    }
    if (req.path.rfind("/api/salaries/", 0) == 0) {
        std::string idStr = req.path.substr(14);
        long long id = std::stoll(idStr);
        if (req.method == "DELETE") return dbClient.deleteSalary(id);
    }

    // Permissions & RBAC Endpoints
    if (req.path == "/api/permissions" || req.path == "/api/users") {
        if (req.method == "GET") return dbClient.getAllUsers();
    }
    if (req.path.rfind("/api/permissions/", 0) == 0 || req.path.rfind("/api/users/", 0) == 0) {
        size_t slash = req.path.find_last_of('/');
        std::string idStr = req.path.substr(slash + 1);
        long long id = std::stoll(idStr);
        if (req.method == "PUT" || req.method == "PATCH") return dbClient.updateUserPermission(id, req.body);
        if (req.method == "DELETE") return dbClient.deleteUser(id);
    }

    // Attendance Endpoints
    if (req.path == "/api/attendance") {
        if (req.method == "GET") {
            std::string date = "";
            size_t dPos = req.query.find("date=");
            if (dPos != std::string::npos) {
                date = req.query.substr(dPos + 5);
            }
            return dbClient.getAttendance(date);
        }
        if (req.method == "POST") return dbClient.markAttendance(req.body);
    }

    // Grades Endpoints
    if (req.path == "/api/grades") {
        if (req.method == "GET") return dbClient.getGrades();
        if (req.method == "POST") return dbClient.addGrade(req.body);
    }

    // Authentication & RBAC Routes
    if (req.path == "/api/auth/login" && req.method == "POST") {
        std::string username = "";
        std::string password = "";

        // Helper extraction allowing spaces
        auto extractField = [](const std::string& json, const std::string& key) -> std::string {
            size_t kPos = json.find("\"" + key + "\"");
            if (kPos == std::string::npos) return "";
            size_t colon = json.find(":", kPos);
            if (colon == std::string::npos) return "";
            size_t q1 = json.find("\"", colon);
            if (q1 == std::string::npos) return "";
            size_t q2 = json.find("\"", q1 + 1);
            if (q2 == std::string::npos) return "";
            return json.substr(q1 + 1, q2 - (q1 + 1));
        };

        username = extractField(req.body, "username");
        password = extractField(req.body, "password");

        if (!username.empty()) {
            std::string userRes = dbClient.loginUser(username, password);
            // PostgREST successful select is always a JSON array
            if (!userRes.empty() && userRes[0] == '[' && userRes != "[]") {
                if (userRes.find("\"status\":\"suspended\"") != std::string::npos ||
                    userRes.find("\"status\":\"disabled\"") != std::string::npos ||
                    userRes.find("\"portal_access\":false") != std::string::npos) {
                    return "{\"error\":\"Account access has been revoked or suspended by Administrator.\"}";
                }
                return userRes;
            }
        }

        return "{\"error\":\"Invalid username or password\"}";
    }

    if (req.path == "/api/users") {
        if (req.method == "GET") {
            std::string res = dbClient.getAllUsers();
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
    }

    // Student Progress Remarks
    if (req.path == "/api/remarks") {
        if (req.method == "GET") {
            long long sid = 0;
            size_t sPos = req.query.find("student_id=");
            if (sPos != std::string::npos) {
                try { sid = std::stoll(req.query.substr(sPos + 11)); } catch (...) { sid = 0; }
            }
            std::string res = dbClient.getProgressRemarks(sid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") return dbClient.addProgressRemark(req.body);
    }

    // Student Grades & Examination Results
    if (req.path == "/api/student-grades") {
        if (req.method == "GET") {
            long long sid = 0;
            size_t sPos = req.query.find("student_id=");
            if (sPos != std::string::npos) {
                try { sid = std::stoll(req.query.substr(sPos + 11)); } catch (...) { sid = 0; }
            }
            std::string res = dbClient.getStudentGradesResults(sid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            std::string res = dbClient.addStudentGradeResult(req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"message\":\"Grade recorded successfully\"}";
        }
    }

    // Lecture Timetable & Subject Teachers
    if (req.path == "/api/timetable") {
        if (req.method == "GET") {
            long long cid = 0;
            long long tid = 0;
            size_t cPos = req.query.find("class_id=");
            if (cPos != std::string::npos) {
                try { cid = std::stoll(req.query.substr(cPos + 9)); } catch (...) { cid = 0; }
            }
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }
            std::string res = dbClient.getTimetable(cid, tid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            return dbClient.addTimetableEntry(req.body);
        }
    }
    if (req.path.rfind("/api/timetable/", 0) == 0) {
        std::string idStr = req.path.substr(15);
        try {
            long long id = std::stoll(idStr);
            if (req.method == "DELETE") return dbClient.deleteTimetableEntry(id);
        } catch (...) {}
    }

    // Student Leave Requests & Class Teacher Approval
    if (req.path == "/api/leaves") {
        if (req.method == "GET") {
            long long sid = 0;
            long long tid = 0;
            size_t sPos = req.query.find("student_id=");
            if (sPos != std::string::npos) {
                try { sid = std::stoll(req.query.substr(sPos + 11)); } catch (...) { sid = 0; }
            }
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }

            std::string res = dbClient.getStudentLeaves(sid, tid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            return dbClient.createStudentLeave(req.body);
        }
    }

    if (req.path.rfind("/api/leaves/", 0) == 0) {
        std::string idStr = req.path.substr(12);
        long long id = 0;
        try { id = std::stoll(idStr); } catch (...) { id = 0; }
        if (id > 0 && (req.method == "PUT" || req.method == "PATCH")) {
            return dbClient.updateStudentLeaveStatus(id, req.body);
        }
    }

    // Student Attendance Regularization Requests & Class Teacher Approvals
    if (req.path == "/api/attendance-regularizations") {
        if (req.method == "GET") {
            long long sid = 0;
            long long tid = 0;
            size_t sPos = req.query.find("student_id=");
            if (sPos != std::string::npos) {
                try { sid = std::stoll(req.query.substr(sPos + 11)); } catch (...) { sid = 0; }
            }
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }

            std::string res = dbClient.getAttendanceRegularizations(sid, tid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            std::string res = dbClient.createAttendanceRegularization(req.body);
            if (!res.empty() && res[0] == '{') return res;
            return "{\"success\":true,\"message\":\"Regularization request submitted successfully\"}";
        }
    }

    if (req.path.rfind("/api/attendance-regularizations/", 0) == 0) {
        std::string idStr = req.path.substr(32);
        long long id = 0;
        try { id = std::stoll(idStr); } catch (...) { id = 0; }
        if (id > 0 && (req.method == "PUT" || req.method == "PATCH")) {
            std::string res = dbClient.updateAttendanceRegularizationStatus(id, req.body);
            if (!res.empty() && res[0] == '{') return res;
            return "{\"success\":true,\"id\":" + idStr + ",\"status\":\"updated\"}";
        }
    }

    // Teacher Self-Attendance & Timecard System
    if (req.path == "/api/teacher-attendance") {
        if (req.method == "GET") {
            long long tid = 0;
            std::string month = "";
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }
            size_t mPos = req.query.find("month=");
            if (mPos != std::string::npos) {
                month = req.query.substr(mPos + 6, 7);
            }

            std::string res = dbClient.getTeacherAttendance(tid, month);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            std::string res = dbClient.recordTeacherAttendance(req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"message\":\"Teacher attendance recorded successfully\"}";
        }
    }

    // Teacher Leave Applications & Admin Governance
    if (req.path == "/api/teacher-leaves") {
        if (req.method == "GET") {
            long long tid = 0;
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }
            std::string res = dbClient.getTeacherLeaves(tid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            std::string res = dbClient.createTeacherLeave(req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"message\":\"Teacher leave application submitted to Administration for review\"}";
        }
    }

    const std::string tlPrefix = "/api/teacher-leaves/";
    if (req.path.rfind(tlPrefix, 0) == 0) {
        std::string idStr = req.path.substr(tlPrefix.length());
        long long id = 0;
        try { id = std::stoll(idStr); } catch (...) { id = 0; }
        if (id > 0 && (req.method == "PUT" || req.method == "PATCH")) {
            std::string res = dbClient.updateTeacherLeaveStatus(id, req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"id\":" + idStr + ",\"status\":\"updated\"}";
        }
    }

    // Teacher Attendance Regularization Requests & Admin Governance
    if (req.path == "/api/teacher-attendance-regularizations") {
        if (req.method == "GET") {
            long long tid = 0;
            size_t tPos = req.query.find("teacher_id=");
            if (tPos != std::string::npos) {
                try { tid = std::stoll(req.query.substr(tPos + 11)); } catch (...) { tid = 0; }
            }
            std::string res = dbClient.getTeacherAttendanceRegularizations(tid);
            if (!res.empty() && res[0] == '[') return res;
            return "[]";
        }
        if (req.method == "POST") {
            std::string res = dbClient.createTeacherAttendanceRegularization(req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"message\":\"Teacher attendance regularization submitted to Administration\"}";
        }
    }

    const std::string trPrefix = "/api/teacher-attendance-regularizations/";
    if (req.path.rfind(trPrefix, 0) == 0) {
        std::string idStr = req.path.substr(trPrefix.length());
        long long id = 0;
        try { id = std::stoll(idStr); } catch (...) { id = 0; }
        if (id > 0 && (req.method == "PUT" || req.method == "PATCH")) {
            std::string res = dbClient.updateTeacherAttendanceRegularizationStatus(id, req.body);
            if (!res.empty() && (res[0] == '{' || res[0] == '[')) return res;
            return "{\"success\":true,\"id\":" + idStr + ",\"status\":\"updated\"}";
        }
    }

    return "{\"error\":\"Endpoint not found\",\"path\":\"" + req.path + "\"}";
}

void HttpServer::sendResponse(SOCKET clientSocket, int statusCode, const std::string& contentType, const std::string& body) {
    std::string statusText = "OK";
    if (statusCode == 404) statusText = "Not Found";
    if (statusCode == 500) statusText = "Internal Server Error";
    if (statusCode == 201) statusText = "Created";

    std::ostringstream response;
    response << "HTTP/1.1 " << statusCode << " " << statusText << "\r\n"
             << "Content-Type: " << contentType << "\r\n"
             << "Content-Length: " << body.length() << "\r\n"
             << "Access-Control-Allow-Origin: *\r\n"
             << "Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS\r\n"
             << "Access-Control-Allow-Headers: Content-Type, Authorization, apikey, Prefer\r\n"
             << "Connection: close\r\n\r\n"
             << body;

    std::string respStr = response.str();
    int totalSent = 0;
    int toSend = (int)respStr.length();
    const char* ptr = respStr.c_str();
    while (totalSent < toSend) {
        int sentBytes = send(clientSocket, ptr + totalSent, toSend - totalSent, 0);
        if (sentBytes <= 0) break;
        totalSent += sentBytes;
    }
}

void HttpServer::start() {
    running = true;
    std::cout << "[Server] Listening for incoming requests..." << std::endl;

    while (running) {
        sockaddr_in clientAddr;
        int clientLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientLen);
        if (clientSocket == INVALID_SOCKET) {
            if (running) {
                std::cerr << "[Server] Accept failed: " << WSAGetLastError() << std::endl;
            }
            break;
        }

        std::string rawRequest = "";
        char tempBuffer[8192];
        int bytesReceived = 0;
        int contentLength = 0;
        size_t headerEnd = std::string::npos;

        // 1. Read headers
        while ((bytesReceived = recv(clientSocket, tempBuffer, sizeof(tempBuffer) - 1, 0)) > 0) {
            tempBuffer[bytesReceived] = '\0';
            rawRequest.append(tempBuffer, bytesReceived);

            headerEnd = rawRequest.find("\r\n\r\n");
            if (headerEnd != std::string::npos) {
                // Find Content-Length if present
                std::string lowerHeader = rawRequest.substr(0, headerEnd);
                size_t clPos = lowerHeader.find("Content-Length: ");
                if (clPos == std::string::npos) {
                    clPos = lowerHeader.find("content-length: ");
                }
                if (clPos != std::string::npos) {
                    size_t lineEnd = lowerHeader.find("\r\n", clPos);
                    std::string clStr = lowerHeader.substr(clPos + 16, lineEnd - (clPos + 16));
                    try {
                        contentLength = std::stoi(clStr);
                    } catch (...) {
                        contentLength = 0;
                    }
                }
                break;
            }
        }

        // 2. Read remaining body if Content-Length exceeds already received bytes
        if (headerEnd != std::string::npos && contentLength > 0) {
            size_t currentBodyLen = rawRequest.length() - (headerEnd + 4);
            while (currentBodyLen < (size_t)contentLength) {
                int needed = (int)(contentLength - currentBodyLen);
                int toRead = (needed < (int)sizeof(tempBuffer) - 1) ? needed : (int)sizeof(tempBuffer) - 1;
                bytesReceived = recv(clientSocket, tempBuffer, toRead, 0);
                if (bytesReceived <= 0) break;
                tempBuffer[bytesReceived] = '\0';
                rawRequest.append(tempBuffer, bytesReceived);
                currentBodyLen += bytesReceived;
            }
        }

        if (!rawRequest.empty()) {
            HttpRequest req = parseRequest(rawRequest);
            std::string responseJson = handleRoute(req);
            sendResponse(clientSocket, 200, "application/json", responseJson);
        }

        closesocket(clientSocket);
    }
}

void HttpServer::stop() {
    if (running) {
        running = false;
        if (serverSocket != INVALID_SOCKET) {
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
        }
        WSACleanup();
        std::cout << "[Server] Stopped." << std::endl;
    }
}

