// Centralized API Client Service with Automatic Supabase Fallback for Vercel & Production
const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8080/api'
  : '/api';

const SUPABASE_URL = 'https://xzmirtkasmtuadvyslri.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bWlydGthc210dWFkdnlzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjEyMTQsImV4cCI6MjEwNTEzNzIxNH0.1U1fG6z74fqU3i5mGa0BHDmnIIXk1RfYQAjbJ-V3qWA';

// Centralized Salary Calculation Formula (Fixed Allowances & Deductions Breakdown)
export function calculateSalaryBreakdown(grossInput) {
  const gross = Math.max(10000, parseFloat(grossInput) || 65000);

  // Standard Fixed Allowances:
  // HRA: 12,000, DA: 8,000, Medical: 3,000, Special Bonus: 2,000 -> Total Fixed Allowances = 25,000
  let hra = 12000;
  let da = 8000;
  let medical = 3000;
  let bonus = 2000;
  let totalAllowances = hra + da + medical + bonus; // 25000

  // The remaining after fixed allowances is the Base / Basic Academic Pay:
  let basic = gross - totalAllowances;
  if (basic < 15000) {
    basic = Math.round(gross * 0.55);
    hra = Math.round(gross * 0.20);
    da = Math.round(gross * 0.15);
    medical = 3000;
    bonus = Math.max(0, gross - (basic + hra + da + medical));
    totalAllowances = gross - basic;
  }

  // Statutory Deductions:
  // EPF (Provident Fund) ~ 10% of basic (or min 2000)
  const pf = Math.max(2000, Math.round(basic * 0.10));
  // TDS (Tax Deducted at Source)
  const tds = gross > 70000 ? 3500 : (gross > 50000 ? 2500 : 1500);
  const pt = 200; // Professional Tax
  const insurance = 340; // Staff Health & Group Insurance
  const totalDeductions = pf + tds + pt + insurance;

  const netSalary = Math.max(0, gross - totalDeductions);

  return {
    gross_earnings: gross,
    basic_salary: basic,
    hra_allowance: hra,
    da_allowance: da,
    medical_allowance: medical,
    special_bonus: bonus,
    total_allowances: totalAllowances,
    provident_fund: pf,
    tax_deducted_tds: tds,
    professional_tax: pt,
    insurance_welfare: insurance,
    total_deductions: totalDeductions,
    net_salary: netSalary
  };
}

// Supabase Direct REST Fallback Client (when running on Vercel or when local C++ server is offline)
async function supabaseDirectRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body;

  let supabaseTable = '';
  let queryParams = '';
  let idParam = '';

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const [basePath, searchStr] = cleanEndpoint.split('?');
  const pathParts = basePath.split('/');

  const routeName = pathParts[0];
  const routeId = pathParts[1];

  // Dedicated handler for Authentication Login
  if (routeName === 'auth' && pathParts[1] === 'login') {
    const parsed = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
    const u = String(parsed.username || '').trim();
    const p = String(parsed.password || '').trim();

    if (!u) {
      throw new Error('Please enter your username, roll number, or employee ID.');
    }
    if (!p) {
      throw new Error('Please enter your password.');
    }

    const authHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };

    const queryUrl = `${SUPABASE_URL}/rest/v1/login_credentials?select=*,students(*),teachers(*)&order=id.asc&limit=10000`;
    const res = await fetch(queryUrl, {
      method: 'GET',
      headers: authHeaders
    });

    const text = await res.text().catch(() => '[]');
    let list = [];
    try {
      list = JSON.parse(text);
    } catch {
      list = [];
    }

    const uClean = u.toLowerCase();
    const match = Array.isArray(list) ? list.find(row => {
      if (!row) return false;
      const usernameMatch = row.username && row.username.toLowerCase() === uClean;
      const emailMatch = row.email && row.email.toLowerCase() === uClean;
      const teacherEmpMatch = row.teachers && row.teachers.employee_id && row.teachers.employee_id.toLowerCase() === uClean;
      const studentRollMatch = row.students && row.students.roll_number && row.students.roll_number.toLowerCase() === uClean;
      return usernameMatch || emailMatch || teacherEmpMatch || studentRollMatch;
    }) : null;

    if (!match) {
      // Fallback for Master Admin in case of initial boot or recovery
      if (uClean === 'admin' && (p === 'admin123' || p === 'admin')) {
        return {
          id: 1,
          username: 'admin',
          role: 'admin',
          status: 'active',
          portal_access: true,
          name: 'Master Administrator',
          can_apply_leave: true,
          can_view_grades: true,
          can_download_fee_receipt: true,
          can_post_remarks: true,
          can_approve_leaves: true,
          can_view_payroll: true
        };
      }
      throw new Error('Account not found. Please verify your username, roll number, or employee ID.');
    }

    // Validate Password
    if (match.password !== p) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    // Check account status and portal access
    if (match.status === 'suspended') {
      throw new Error('Access Denied: Your account has been suspended by the administrator.');
    }

    if (match.portal_access === false) {
      throw new Error('Access Denied: Portal access has been disabled for your account.');
    }

    // Attach displayName
    let displayName = match.username;
    if (match.role === 'teacher' && match.teachers) {
      displayName = `${match.teachers.first_name || ''} ${match.teachers.last_name || ''}`.trim() || match.username;
    } else if (match.role === 'student' && match.students) {
      displayName = `${match.students.first_name || ''} ${match.students.last_name || ''}`.trim() || match.username;
    } else if (match.role === 'admin') {
      displayName = 'Master Administrator';
    }

    return {
      ...match,
      name: displayName
    };
  }

  // Dedicated handler for Password Reset
  if (routeName === 'users' && routeId === 'reset-password') {
    const parsed = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
    const userId = parsed.id;
    const newPass = parsed.new_password;
    if (!userId || !newPass) {
      throw new Error('User ID and new password are required.');
    }
    const updateUrl = `${SUPABASE_URL}/rest/v1/login_credentials?id=eq.${userId}`;
    const updateHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: updateHeaders,
      body: JSON.stringify({ password: newPass, updated_at: new Date().toISOString() })
    });
    const updateData = await updateRes.json().catch(() => ({}));
    return { success: true, message: 'Password reset successfully', data: updateData };
  }

  switch (routeName) {
    case 'teachers':
      supabaseTable = 'teachers';
      queryParams = 'select=*&order=id.asc&limit=10000';
      break;
    case 'students':
      supabaseTable = 'students';
      queryParams = 'select=*,classes(id,class_name,section,base_fee)&order=id.asc&limit=10000';
      break;
    case 'classes':
      supabaseTable = 'classes';
      queryParams = 'select=*,teachers(id,first_name,last_name,employee_id,email,phone,department,designation,cabin,qualification)&order=id.asc&limit=10000';
      break;
    case 'fees':
      supabaseTable = 'student_fees';
      queryParams = 'select=*,students(first_name,last_name,roll_number,class_id,classes(class_name,section))&order=id.desc&limit=10000';
      break;
    case 'salaries':
      supabaseTable = 'teacher_salaries';
      queryParams = 'select=*,teachers(first_name,last_name,employee_id,qualification,department,designation,email,phone)&order=id.desc&limit=10000';
      break;
    case 'attendance':
      supabaseTable = 'attendance';
      queryParams = 'select=*,students(first_name,last_name,roll_number)&order=date.asc&limit=10000';
      break;
    case 'teacher-attendance':
      supabaseTable = 'teacher_attendance';
      queryParams = 'select=*&order=attendance_date.desc&limit=10000';
      break;
    case 'leaves':
      supabaseTable = 'student_leaves';
      queryParams = 'select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name)&order=id.desc&limit=10000';
      break;
    case 'teacher-leaves':
      supabaseTable = 'teacher_leaves';
      queryParams = 'select=*,teachers(first_name,last_name,employee_id,department)&order=id.desc&limit=10000';
      break;
    case 'attendance-regularizations':
      supabaseTable = 'attendance_regularizations';
      queryParams = 'select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name)&order=id.desc&limit=10000';
      break;
    case 'teacher-attendance-regularizations':
      supabaseTable = 'teacher_attendance_regularizations';
      queryParams = 'select=*,teachers(first_name,last_name,employee_id,department)&order=id.desc&limit=10000';
      break;
    case 'student-grades':
    case 'grades':
      supabaseTable = 'student_grades_results';
      queryParams = 'select=*,students(first_name,last_name,roll_number)&order=id.desc&limit=10000';
      break;
    case 'remarks':
      supabaseTable = 'student_progress_remarks';
      queryParams = 'select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name)&order=id.desc&limit=10000';
      break;
    case 'timetable':
      supabaseTable = 'subject_teachers_timetable';
      queryParams = 'select=*,classes(class_name,section),teachers(first_name,last_name)&order=id.asc&limit=10000';
      break;
    case 'permissions':
    case 'users':
      supabaseTable = 'login_credentials';
      queryParams = 'select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.asc&limit=10000';
      break;
    default:
      supabaseTable = routeName;
      break;
  }

  if (routeId) {
    idParam = `id=eq.${routeId}`;
  }

  let finalQuery = '';
  if (idParam) {
    finalQuery = idParam;
    if (searchStr) finalQuery += `&${searchStr}`;
  } else if (searchStr) {
    finalQuery = `${queryParams}&${searchStr}`;
  } else {
    finalQuery = queryParams;
  }

  const fullUrl = `${SUPABASE_URL}/rest/v1/${supabaseTable}${finalQuery ? `?${finalQuery}` : ''}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' || method === 'PATCH' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: body || undefined
  });

  const text = await res.text().catch(() => '');
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = {}; }
  }

  if (Array.isArray(data)) {
    if (method !== 'GET') {
      return data[0] || { success: true };
    }
    return data;
  }

  return data;
}

async function request(endpoint, options = {}) {
  const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalEnv) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.ok) {
        const text = await response.text().catch(() => '');
        let data = {};
        if (text) {
          try { data = JSON.parse(text); } catch { data = {}; }
        }
        if (Array.isArray(data) && options.method && options.method !== 'GET') {
          return data[0] || { success: true };
        }
        return data;
      }
    } catch (err) {
      console.warn(`Local backend unreachable for ${endpoint}, falling back to Supabase Cloud Direct API...`, err);
    }
  }

  // Direct Supabase Cloud API fallback (works everywhere: local, Vercel, production)
  return await supabaseDirectRequest(endpoint, options);
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
  addClass: (data) => {
    const { update_student_fees, ...payload } = data;
    return request('/classes', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateClass: (id, data) => {
    const { update_student_fees, ...payload } = data;
    return request(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  // Subjects & Curriculum
  getSubjects: () => request('/subjects'),
  addSubject: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Fees & Receipts
  getFees: () => request('/fees'),
  collectFee: (data) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
  updateFee: (id, data) => request(`/fees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getFeeReceipt: (receiptNo) => request(`/fees/receipt/${receiptNo}`),
  deleteFee: (id) => request(`/fees/${id}`, { method: 'DELETE' }),

  // Salaries & Pay-Slips
  getSalaries: () => request('/salaries'),
  generateSalary: (data) => request('/salaries', { method: 'POST', body: JSON.stringify(data) }),
  deleteSalary: (id) => request(`/salaries/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params) => {
    if (typeof params === 'string') {
      return request(`/attendance?date=${params}`);
    }
    if (typeof params === 'object' && params !== null) {
      const qs = new URLSearchParams();
      if (params.date) qs.append('date', params.date);
      if (params.student_id) qs.append('student_id', params.student_id);
      if (params.month) qs.append('month', params.month);
      const qStr = qs.toString();
      return request(`/attendance${qStr ? `?${qStr}` : ''}`);
    }
    return request('/attendance');
  },
  getStudentAttendance: (studentId, month) => {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (month) params.append('month', month);
    const qs = params.toString();
    return request(`/attendance${qs ? `?${qs}` : ''}`);
  },
  getAttendanceByDate: (studentId, date) => {
    return request(`/attendance?student_id=${studentId}&date=${date}`);
  },
  getRegularizationRequests: (studentId) => {
    return request(`/attendance-regularizations?student_id=${studentId}`);
  },
  createRegularizationRequest: (payload) => {
    return request('/attendance-regularizations', { method: 'POST', body: JSON.stringify(payload) });
  },
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Grades
  getGrades: () => request('/grades'),
  addGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),

  // Authentication & RBAC Permissions
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getUsers: () => request('/users'),
  getPermissions: () => request('/permissions'),
  updatePermission: (id, data) => request(`/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetPassword: (id, username, newPassword) => request('/users/reset-password', { method: 'POST', body: JSON.stringify({ id, username, new_password: newPassword }) }),
  deleteUser: (id) => request(`/permissions/${id}`, { method: 'DELETE' }),

  // Student Progress Remarks
  getRemarks: (studentId) => request(`/remarks${studentId ? `?student_id=${studentId}` : ''}`),
  addRemark: (data) => request('/remarks', { method: 'POST', body: JSON.stringify(data) }),
  deleteRemark: (id) => request(`/remarks/${id}`, { method: 'DELETE' }),

  // Student Examination Results & Report Card
  getStudentGrades: (studentId) => request(`/student-grades${studentId ? `?student_id=${studentId}` : ''}`),
  addStudentGrade: (data) => request('/student-grades', { method: 'POST', body: JSON.stringify(data) }),
  deleteStudentGrade: (id) => request(`/student-grades/${id}`, { method: 'DELETE' }),

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

  // Master System Reset & Factory Wipe
  resetEntireSystem: () => request('/system/reset', { method: 'POST' }),
};
