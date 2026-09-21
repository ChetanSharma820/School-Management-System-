// Centralized API Client Service for C++ Backend
const API_BASE_URL = 'http://127.0.0.1:8080/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // PostgREST returns empty body for DELETE; other mutations return array or object
    const text = await response.text().catch(() => '');
    let data = {};
    if (text) {
      try { data = JSON.parse(text); } catch { data = {}; }
    }

    // PostgREST PATCH/POST with return=representation returns [{...}] (array)
    // Normalise to a single object so callers work uniformly
    if (Array.isArray(data)) {
      if (data.length > 0 && (data[0].error || (data[0].code && data[0].message))) {
        throw new Error(data[0].message || data[0].error || data[0].details || `HTTP error ${response.status}`);
      }
      // For mutating requests return first element; for GETs return the full array
      if (method !== 'GET') {
        return data[0] || { success: true };
      }
      return data;
    }

    if (!response.ok || data.error || (data.code && data.message)) {
      throw new Error(data.message || data.error || data.details || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health & Stats
  getHealth: () => request('/health'),
  getStats: () => request('/stats'),

  // Students
  getStudents: () => request('/students'),
  getStudentById: (id) => request(`/students/${id}`),
  addStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Teachers
  getTeachers: () => request('/teachers'),
  addTeacher: (data) => request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id, data) => request(`/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTeacher: (id) => request(`/teachers/${id}`, { method: 'DELETE' }),

  // Classes
  getClasses: () => request('/classes'),
  addClass: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id, data) => request(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Fees & Receipts
  getFees: () => request('/fees'),
  collectFee: (data) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
  getFeeReceipt: (receiptNo) => request(`/fees/receipt/${receiptNo}`),
  deleteFee: (id) => request(`/fees/${id}`, { method: 'DELETE' }),

  // Salaries & Pay-Slips
  getSalaries: () => request('/salaries'),
  generateSalary: (data) => request('/salaries', { method: 'POST', body: JSON.stringify(data) }),
  deleteSalary: (id) => request(`/salaries/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (date) => request(`/attendance${date ? `?date=${date}` : ''}`),
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Grades
  getGrades: () => request('/grades'),
  addGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),

  // Authentication & RBAC Permissions
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getUsers: () => request('/users'),
  getPermissions: () => request('/permissions'),
  updatePermission: (id, data) => request(`/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/permissions/${id}`, { method: 'DELETE' }),

  // Student Progress Remarks
  getRemarks: (studentId) => request(`/remarks${studentId ? `?student_id=${studentId}` : ''}`),
  addRemark: (data) => request('/remarks', { method: 'POST', body: JSON.stringify(data) }),

  // Student Examination Results & Report Card
  getStudentGrades: (studentId) => request(`/student-grades${studentId ? `?student_id=${studentId}` : ''}`),
  addStudentGrade: (data) => request('/student-grades', { method: 'POST', body: JSON.stringify(data) }),

  // Lecture Timetable & Subject Teachers
  getTimetable: (classId, teacherId) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (teacherId) params.append('teacher_id', teacherId);
    const qs = params.toString();
    return request(`/timetable${qs ? `?${qs}` : ''}`);
  },
  addTimetable: (data) => request('/timetable', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimetable: (id) => request(`/timetable/${id}`, { method: 'DELETE' }),

  // Student Leave Requests & Class Teacher Approval
  getLeaves: (studentId, teacherId) => {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (teacherId) params.append('teacher_id', teacherId);
    const qs = params.toString();
    return request(`/leaves${qs ? `?${qs}` : ''}`);
  },
  applyLeave: (data) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  reviewLeave: (leaveId, data) => request(`/leaves/${leaveId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Student Attendance Regularization Requests & Class Teacher Approval
  getAttendanceRegularizations: (studentId, teacherId) => {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (teacherId) params.append('teacher_id', teacherId);
    const qs = params.toString();
    return request(`/attendance-regularizations${qs ? `?${qs}` : ''}`);
  },
  applyAttendanceRegularization: (data) => request('/attendance-regularizations', { method: 'POST', body: JSON.stringify(data) }),
  reviewAttendanceRegularization: (regId, data) => request(`/attendance-regularizations/${regId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Teacher Self-Attendance & Timecard System
  getTeacherAttendance: (teacherId, month) => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacher_id', teacherId);
    if (month) params.append('month', month);
    const qs = params.toString();
    return request(`/teacher-attendance${qs ? `?${qs}` : ''}`);
  },
  punchTeacherAttendance: (data) => request('/teacher-attendance', { method: 'POST', body: JSON.stringify(data) }),
  saveStudentGrades: (data) => request('/student-grades', { method: 'POST', body: JSON.stringify(data) }),

  // Teacher Leaves & Admin Governance
  getTeacherLeaves: (teacherId) => {
    const qs = teacherId ? `?teacher_id=${teacherId}` : '';
    return request(`/teacher-leaves${qs}`);
  },
  applyTeacherLeave: (data) => request('/teacher-leaves', { method: 'POST', body: JSON.stringify(data) }),
  reviewTeacherLeave: (leaveId, data) => request(`/teacher-leaves/${leaveId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Teacher Attendance Regularizations & Admin Governance
  getTeacherAttendanceRegularizations: (teacherId) => {
    const qs = teacherId ? `?teacher_id=${teacherId}` : '';
    return request(`/teacher-attendance-regularizations${qs}`);
  },
  applyTeacherAttendanceRegularization: (data) => request('/teacher-attendance-regularizations', { method: 'POST', body: JSON.stringify(data) }),
  reviewTeacherAttendanceRegularization: (regId, data) => request(`/teacher-attendance-regularizations/${regId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};


