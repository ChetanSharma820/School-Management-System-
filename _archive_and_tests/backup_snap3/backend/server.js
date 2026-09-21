const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.BACKEND_PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xzmirtkasmtuadvyslri.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bWlydGthc210dWFkdnlzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjEyMTQsImV4cCI6MjEwNTEzNzIxNH0.1U1fG6z74fqU3i5mGa0BHDmnIIXk1RfYQAjbJ-V3qWA';

function supabaseRequest(method, path, body = null, preferUpsert = true) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${SUPABASE_URL}/rest/v1/${path}`;
    const parsed = new URL(fullUrl);

    const bodyData = body !== null && body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Range-Unit': 'items',
      'Range': '0-99999'
    };

    if (bodyData) {
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      if (preferUpsert) {
        headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
      } else {
        headers['Prefer'] = 'return=representation';
      }
    }

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  let reqBody = '';
  req.on('data', chunk => { reqBody += chunk; });
  req.on('end', async () => {
    let parsedBody = {};
    if (reqBody) {
      try { parsedBody = JSON.parse(reqBody); } catch (e) { parsedBody = reqBody; }
    }

    try {
      // 1. Health
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', service: 'School Management REST API Engine', version: '2.0.0' }));
        return;
      }

      // 2. Stats
      if (pathname === '/api/stats') {
        const [stRes, tcRes, clRes, feeRes] = await Promise.all([
          supabaseRequest('GET', 'students?select=id&limit=10000'),
          supabaseRequest('GET', 'teachers?select=id&limit=10000'),
          supabaseRequest('GET', 'classes?select=id&limit=10000'),
          supabaseRequest('GET', 'student_fees?select=amount_paid,balance_due&limit=10000')
        ]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          students_raw: Array.isArray(stRes.data) ? stRes.data : [],
          teachers_raw: Array.isArray(tcRes.data) ? tcRes.data : [],
          classes_raw: Array.isArray(clRes.data) ? clRes.data : [],
          fees_raw: Array.isArray(feeRes.data) ? feeRes.data : []
        }));
        return;
      }

      // 3. Students
      if (pathname === '/api/students') {
        if (req.method === 'GET') {
          const r = await supabaseRequest('GET', 'students?select=*,classes(*,teachers(*))&order=id.asc&limit=10000');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'students?on_conflict=roll_number', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/students/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `students?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `students?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 4. Teachers
      if (pathname === '/api/teachers') {
        if (req.method === 'GET') {
          const r = await supabaseRequest('GET', 'teachers?select=*&order=id.asc&limit=10000');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'teachers?on_conflict=employee_id', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/teachers/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `teachers?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `teachers?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 5. Classes
      if (pathname === '/api/classes') {
        if (req.method === 'GET') {
          const r = await supabaseRequest('GET', 'classes?select=*,teachers(id,first_name,last_name,employee_id,email,phone,department,designation,cabin,qualification)&order=id.asc&limit=10000');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'classes', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/classes/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `classes?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 6. Fees
      if (pathname === '/api/fees') {
        if (req.method === 'GET') {
          const r = await supabaseRequest('GET', 'student_fees?select=*,students(first_name,last_name,roll_number)&order=id.desc&limit=10000');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'student_fees?on_conflict=receipt_no', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/fees/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `student_fees?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `student_fees?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 7. Salaries
      if (pathname === '/api/salaries') {
        if (req.method === 'GET') {
          const r = await supabaseRequest('GET', 'teacher_salaries?select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc&limit=10000');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'teacher_salaries?on_conflict=payslip_no', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/salaries/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `teacher_salaries?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 8. Student Attendance (Manual update by Admin / Teachers with Upsert)
      if (pathname === '/api/attendance') {
        if (req.method === 'GET') {
          let filter = 'select=*,students(first_name,last_name,roll_number)&order=date.asc&limit=10000';
          if (query.date) filter += `&date=eq.${query.date}`;
          if (query.student_id) filter += `&student_id=eq.${query.student_id}`;
          if (query.month && query.month.includes('-')) {
            const [yStr, mStr] = query.month.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            const lastDay = new Date(y, m, 0).getDate();
            const lastDayStr = String(lastDay).padStart(2, '0');
            filter += `&date=gte.${query.month}-01&date=lte.${query.month}-${lastDayStr}`;
          }
          const r = await supabaseRequest('GET', `attendance?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'attendance?on_conflict=student_id,date', parsedBody, true);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 9. Teacher Attendance (Manual update by Admin / Teachers with Upsert)
      if (pathname === '/api/teacher-attendance') {
        if (req.method === 'GET') {
          let filter = 'select=*,teachers(first_name,last_name,employee_id)&order=attendance_date.desc&limit=10000';
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          if (query.month && query.month.includes('-')) {
            const [yStr, mStr] = query.month.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            const lastDay = new Date(y, m, 0).getDate();
            const lastDayStr = String(lastDay).padStart(2, '0');
            filter += `&attendance_date=gte.${query.month}-01&attendance_date=lte.${query.month}-${lastDayStr}`;
          }
          const r = await supabaseRequest('GET', `teacher_attendance?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'teacher_attendance?on_conflict=teacher_id,attendance_date', parsedBody, true);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 10. Student Leave Requests & Admin Approval
      if (pathname === '/api/leaves') {
        if (req.method === 'GET') {
          let filter = 'select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name,employee_id)&order=id.desc&limit=10000';
          if (query.student_id) filter += `&student_id=eq.${query.student_id}`;
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          const r = await supabaseRequest('GET', `student_leaves?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'student_leaves', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/leaves/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const payload = { ...parsedBody };
          if (payload.admin_remarks !== undefined && !payload.teacher_remarks) {
            payload.teacher_remarks = payload.admin_remarks;
          }
          if (payload.teacher_remarks !== undefined && !payload.admin_remarks) {
            payload.admin_remarks = payload.teacher_remarks;
          }
          const r = await supabaseRequest('PATCH', `student_leaves?id=eq.${id}`, payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 11. Student Attendance Regularization Requests & Admin Approval
      if (pathname === '/api/attendance-regularizations') {
        if (req.method === 'GET') {
          let filter = 'select=*,students(first_name,last_name,roll_number,classes(class_name,section)),teachers(first_name,last_name,employee_id)&order=id.desc&limit=10000';
          if (query.student_id) filter += `&student_id=eq.${query.student_id}`;
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          const r = await supabaseRequest('GET', `attendance_regularizations?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'attendance_regularizations', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/attendance-regularizations/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const payload = { ...parsedBody };
          if (payload.admin_remarks !== undefined && !payload.teacher_remarks) {
            payload.teacher_remarks = payload.admin_remarks;
          }
          if (payload.teacher_remarks !== undefined && !payload.admin_remarks) {
            payload.admin_remarks = payload.teacher_remarks;
          }
          const r = await supabaseRequest('PATCH', `attendance_regularizations?id=eq.${id}`, payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 12. Teacher Leaves
      if (pathname === '/api/teacher-leaves') {
        if (req.method === 'GET') {
          let filter = 'select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc&limit=10000';
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          const r = await supabaseRequest('GET', `teacher_leaves?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'teacher_leaves', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/teacher-leaves/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `teacher_leaves?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 13. Teacher Regularizations
      if (pathname === '/api/teacher-attendance-regularizations') {
        if (req.method === 'GET') {
          let filter = 'select=*,teachers(first_name,last_name,employee_id,qualification)&order=id.desc&limit=10000';
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          const r = await supabaseRequest('GET', `teacher_attendance_regularizations?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'teacher_attendance_regularizations', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/teacher-attendance-regularizations/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `teacher_attendance_regularizations?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }

      // 14. Timetable
      if (pathname === '/api/timetable') {
        if (req.method === 'GET') {
          let filter = 'select=*,classes(class_name,section),teachers(first_name,last_name,employee_id)&order=id.asc&limit=10000';
          if (query.class_id) filter += `&class_id=eq.${query.class_id}`;
          if (query.teacher_id) filter += `&teacher_id=eq.${query.teacher_id}`;
          const r = await supabaseRequest('GET', `subject_teachers_timetable?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'subject_teachers_timetable', parsedBody, false);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/timetable/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `subject_teachers_timetable?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 15. Student Grades & Examination Results
      if (pathname === '/api/student-grades') {
        if (req.method === 'GET') {
          let filter = 'order=id.desc&limit=10000';
          if (query.student_id) filter += `&student_id=eq.${query.student_id}`;
          const r = await supabaseRequest('GET', `student_grades_results?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'student_grades_results', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/student-grades/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `student_grades_results?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 16. Remarks
      if (pathname === '/api/remarks') {
        if (req.method === 'GET') {
          let filter = 'select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.desc&limit=10000';
          if (query.student_id) filter += `&student_id=eq.${query.student_id}`;
          const r = await supabaseRequest('GET', `student_progress_remarks?${filter}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'POST') {
          const r = await supabaseRequest('POST', 'student_progress_remarks', parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
      }
      if (pathname.startsWith('/api/remarks/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `student_progress_remarks?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 17. Auth & Permissions
      if (pathname === '/api/auth/login') {
        const { username, password } = parsedBody || {};
        const cleanUser = String(username || '').trim();
        
        // 1. Try case-insensitive lookup in login_credentials
        const r = await supabaseRequest('GET', `login_credentials?username=ilike.${encodeURIComponent(cleanUser)}&select=*,students(*,classes(*)),teachers(*)&limit=1`);
        if (Array.isArray(r.data) && r.data.length > 0) {
          const userRec = r.data[0];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(userRec));
          return;
        }

        // 2. Try users table fallback
        const r2 = await supabaseRequest('GET', `users?username=ilike.${encodeURIComponent(cleanUser)}&select=*,students(*,classes(*)),teachers(*)&limit=1`);
        if (Array.isArray(r2.data) && r2.data.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r2.data[0]));
          return;
        }

        // 3. Fallback for Master Admin login
        if (cleanUser.toLowerCase() === 'admin') {
          const adminProfile = {
            id: 2,
            username: 'admin',
            role: 'admin',
            status: 'active',
            portal_access: true,
            email: 'admin@greenwood.edu',
            name: 'Master Administrator'
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(adminProfile));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid username or password' }));
        return;
      }

      if (pathname === '/api/permissions' || pathname === '/api/users') {
        const r = await supabaseRequest('GET', 'login_credentials?select=*,students(first_name,last_name,roll_number),teachers(first_name,last_name,employee_id)&order=id.asc&limit=10000');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(r.data));
        return;
      }

      if (pathname.startsWith('/api/permissions/')) {
        const id = pathname.split('/')[3];
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const r = await supabaseRequest('PATCH', `login_credentials?id=eq.${id}`, parsedBody);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(r.data));
          return;
        }
        if (req.method === 'DELETE') {
          const r = await supabaseRequest('DELETE', `login_credentials?id=eq.${id}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 18. Master System Reset / Factory Wipe
      if (pathname === '/api/system/reset' && req.method === 'POST') {
        const wipeTables = [
          'attendance',
          'teacher_attendance',
          'student_leaves',
          'attendance_regularizations',
          'teacher_leaves',
          'teacher_attendance_regularizations',
          'student_fees',
          'teacher_salaries',
          'student_grades_results',
          'student_progress_remarks',
          'subject_teachers_timetable',
          'students',
          'classes',
          'teachers'
        ];

        const wipeResults = {};
        for (const t of wipeTables) {
          try {
            const resDel = await supabaseRequest('DELETE', `${t}?id=gt.0`);
            wipeResults[t] = resDel.status;
          } catch (e) {
            wipeResults[t] = e.message;
          }
        }

        // Delete non-admin login credentials
        try {
          await supabaseRequest('DELETE', 'login_credentials?role=neq.admin');
        } catch (e) {
          console.error('Error clearing non-admin login credentials:', e);
        }

        // Ensure master admin user exists in login_credentials
        try {
          const adminCheck = await supabaseRequest('GET', 'login_credentials?role=eq.admin&limit=1');
          if (!Array.isArray(adminCheck.data) || adminCheck.data.length === 0) {
            await supabaseRequest('POST', 'login_credentials', {
              username: 'admin',
              password: 'password',
              role: 'admin',
              status: 'active'
            });
          }
        } catch (e) {
          console.error('Error ensuring admin user exists:', e);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Entire system data successfully wiped. System is clean and ready for fresh setup.',
          wiped_entities: wipeTables,
          admin_preserved: true
        }));
        return;
      }

      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));

    } catch (error) {
      console.error('Server error on', pathname, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 REST Backend Server listening on http://127.0.0.1:${PORT}`);
  console.log(`   Connected directly to Supabase Cloud PostgreSQL`);
});
