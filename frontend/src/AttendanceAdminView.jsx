import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { 
  CalendarCheck, 
  Search, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  UserCheck,
  GraduationCap,
  Briefcase,
  Building,
  Calendar
} from 'lucide-react';

export default function AttendanceAdminView({ classes = [], students = [], teachers = [], onRefreshAll }) {
  // Mode switcher: 'students' | 'teachers'
  const [attendanceMode, setAttendanceMode] = useState('students');

  // Shared Date State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ==========================================
  // STUDENT ATTENDANCE STATE
  // ==========================================
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
  const [studentStatusMap, setStudentStatusMap] = useState({}); // { [studentId]: { status, remarks } }
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [savingStudentBatch, setSavingStudentBatch] = useState(false);

  // ==========================================
  // TEACHER ATTENDANCE STATE
  // ==========================================
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('ALL');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('ALL');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState([]);
  const [teacherStatusMap, setTeacherStatusMap] = useState({}); // { [teacherId]: { status, check_in_time, check_out_time, remarks } }
  const [savingTeacherId, setSavingTeacherId] = useState(null);
  const [savingTeacherBatch, setSavingTeacherBatch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Load data whenever date changes
  useEffect(() => {
    loadAllAttendanceData(selectedDate);
  }, [selectedDate]);

  const loadAllAttendanceData = async (date) => {
    setLoading(true);
    setSuccessMsg('');
    const month = date.substring(0, 7);
    try {
      const [stuRecords, tchRecords] = await Promise.all([
        api.getAttendance(date).catch(() => []),
        api.getTeacherAttendance('', month).catch(() => [])
      ]);

      const safeStu = Array.isArray(stuRecords) ? stuRecords : [];
      setStudentAttendanceRecords(safeStu);
      const stuMap = {};
      safeStu.forEach(rec => {
        if (rec.student_id) {
          stuMap[rec.student_id] = {
            id: rec.id,
            status: rec.status || 'Present',
            remarks: rec.remarks || ''
          };
        }
      });
      setStudentStatusMap(stuMap);

      const safeTch = Array.isArray(tchRecords) ? tchRecords : [];
      setTeacherAttendanceRecords(safeTch);
      const tchMap = {};
      safeTch.forEach(rec => {
        if (rec.teacher_id && rec.attendance_date === date) {
          tchMap[rec.teacher_id] = {
            id: rec.id,
            status: rec.status || 'Present',
            in_time: rec.in_time || '08:45 AM',
            out_time: rec.out_time || '04:30 PM',
            remarks: rec.remarks || ''
          };
        }
      });
      setTeacherStatusMap(tchMap);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STUDENT FILTERING & KPIS
  // ==========================================
  const eligibleStudents = useMemo(() => {
    return students.filter(st => {
      if (selectedClassId !== 'ALL') {
        if (st.class_id?.toString() !== selectedClassId.toString()) return false;
      }
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const fullName = `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase();
        const roll = (st.roll_number || '').toLowerCase();
        if (!fullName.includes(q) && !roll.includes(q)) return false;
      }
      return true;
    });
  }, [students, selectedClassId, studentSearchQuery]);

  const filteredStudents = useMemo(() => {
    if (studentStatusFilter === 'ALL') return eligibleStudents;
    return eligibleStudents.filter(st => {
      const current = studentStatusMap[st.id]?.status || 'Present';
      return current === studentStatusFilter;
    });
  }, [eligibleStudents, studentStatusFilter, studentStatusMap]);

  const studentStats = useMemo(() => {
    const total = eligibleStudents.length;
    let present = 0, absent = 0, late = 0, excused = 0;
    eligibleStudents.forEach(st => {
      const stStatus = studentStatusMap[st.id]?.status || 'Present';
      if (stStatus === 'Present') present++;
      else if (stStatus === 'Absent') absent++;
      else if (stStatus === 'Late') late++;
      else if (stStatus === 'Excused') excused++;
    });
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, presentRate };
  }, [eligibleStudents, studentStatusMap]);

  // Student Actions
  const handleSetStudentStatus = (studentId, status) => {
    setStudentStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
        remarks: prev[studentId]?.remarks || ''
      }
    }));
  };

  const handleSetStudentRemarks = (studentId, remarks) => {
    setStudentStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Present' }),
        remarks
      }
    }));
  };

  const handleBulkMarkStudents = (targetStatus) => {
    setStudentStatusMap(prev => {
      const next = { ...prev };
      eligibleStudents.forEach(st => {
        next[st.id] = {
          ...(next[st.id] || {}),
          status: targetStatus,
          remarks: next[st.id]?.remarks || ''
        };
      });
      return next;
    });
  };

  const handleSaveSingleStudent = async (studentId) => {
    setSavingStudentId(studentId);
    setSuccessMsg('');
    const entry = studentStatusMap[studentId] || { status: 'Present', remarks: '' };
    try {
      await api.markAttendance({
        student_id: studentId,
        date: selectedDate,
        status: entry.status || 'Present',
        remarks: entry.remarks || ''
      });
      setSuccessMsg(`✓ Attendance for student saved successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAllAttendanceData(selectedDate);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error saving student attendance: ' + err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleSaveAllStudentsBatch = async () => {
    if (eligibleStudents.length === 0) return;
    setSavingStudentBatch(true);
    setSuccessMsg('');
    try {
      let count = 0;
      for (const st of eligibleStudents) {
        const entry = studentStatusMap[st.id] || { status: 'Present', remarks: '' };
        await api.markAttendance({
          student_id: st.id,
          date: selectedDate,
          status: entry.status || 'Present',
          remarks: entry.remarks || ''
        });
        count++;
      }
      setSuccessMsg(`✓ Successfully recorded attendance for ${count} students on ${selectedDate}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAllAttendanceData(selectedDate);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error saving batch student attendance: ' + err.message);
    } finally {
      setSavingStudentBatch(false);
    }
  };

  // ==========================================
  // TEACHER FILTERING & KPIS
  // ==========================================
  const eligibleTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (teacherDeptFilter !== 'ALL') {
        if (t.department !== teacherDeptFilter) return false;
      }
      if (teacherSearchQuery.trim()) {
        const q = teacherSearchQuery.toLowerCase().trim();
        const fullName = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
        const empId = (t.employee_id || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        if (!fullName.includes(q) && !empId.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [teachers, teacherDeptFilter, teacherSearchQuery]);

  const filteredTeachers = useMemo(() => {
    if (teacherStatusFilter === 'ALL') return eligibleTeachers;
    return eligibleTeachers.filter(t => {
      const current = teacherStatusMap[t.id]?.status || 'Present';
      return current === teacherStatusFilter;
    });
  }, [eligibleTeachers, teacherStatusFilter, teacherStatusMap]);

  const teacherStats = useMemo(() => {
    const total = eligibleTeachers.length;
    let present = 0, absent = 0, onLeave = 0, halfDay = 0, late = 0;
    eligibleTeachers.forEach(t => {
      const current = teacherStatusMap[t.id]?.status || 'Present';
      if (current === 'Present') present++;
      else if (current === 'Absent') absent++;
      else if (current === 'On Leave') onLeave++;
      else if (current === 'Half Day') halfDay++;
      else if (current === 'Late') late++;
    });
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, onLeave, halfDay, late, presentRate };
  }, [eligibleTeachers, teacherStatusMap]);

  // Teacher Actions
  const handleSetTeacherStatus = (teacherId, status) => {
    setTeacherStatusMap(prev => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { in_time: '08:45 AM', out_time: '04:30 PM' }),
        status
      }
    }));
  };

  const handleSetTeacherTime = (teacherId, field, val) => {
    setTeacherStatusMap(prev => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { status: 'Present', in_time: '08:45 AM', out_time: '04:30 PM' }),
        [field]: val
      }
    }));
  };

  const handleSetTeacherRemarks = (teacherId, remarks) => {
    setTeacherStatusMap(prev => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { status: 'Present', in_time: '08:45 AM', out_time: '04:30 PM' }),
        remarks
      }
    }));
  };

  const handleBulkMarkTeachers = (targetStatus) => {
    setTeacherStatusMap(prev => {
      const next = { ...prev };
      eligibleTeachers.forEach(t => {
        next[t.id] = {
          ...(next[t.id] || { in_time: '08:45 AM', out_time: '04:30 PM', remarks: '' }),
          status: targetStatus
        };
      });
      return next;
    });
  };

  const handleSaveSingleTeacher = async (teacherId) => {
    setSavingTeacherId(teacherId);
    setSuccessMsg('');
    const entry = teacherStatusMap[teacherId] || { status: 'Present', in_time: '08:45 AM', out_time: '04:30 PM', remarks: '' };
    try {
      await api.punchTeacherAttendance({
        teacher_id: teacherId,
        attendance_date: selectedDate,
        status: entry.status || 'Present',
        in_time: entry.in_time || '08:45 AM',
        out_time: entry.out_time || '04:30 PM',
        total_hours: entry.status === 'Half Day' ? 4.0 : (entry.status === 'Absent' ? 0.0 : 8.0),
        shift_type: 'Standard Full Day',
        remarks: entry.remarks || 'Manual attendance recorded by Administrator'
      });
      setSuccessMsg(`✓ Attendance for faculty member saved successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAllAttendanceData(selectedDate);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error saving faculty attendance: ' + err.message);
    } finally {
      setSavingTeacherId(null);
    }
  };

  const handleSaveAllTeachersBatch = async () => {
    if (eligibleTeachers.length === 0) return;
    setSavingTeacherBatch(true);
    setSuccessMsg('');
    try {
      let count = 0;
      for (const t of eligibleTeachers) {
        const entry = teacherStatusMap[t.id] || { status: 'Present', in_time: '08:45 AM', out_time: '04:30 PM', remarks: '' };
        await api.punchTeacherAttendance({
          teacher_id: t.id,
          attendance_date: selectedDate,
          status: entry.status || 'Present',
          in_time: entry.in_time || '08:45 AM',
          out_time: entry.out_time || '04:30 PM',
          total_hours: entry.status === 'Half Day' ? 4.0 : (entry.status === 'Absent' ? 0.0 : 8.0),
          shift_type: 'Standard Full Day',
          remarks: entry.remarks || 'Manual attendance batch recorded by Administrator'
        });
        count++;
      }
      setSuccessMsg(`✓ Successfully recorded attendance for ${count} faculty members on ${selectedDate}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAllAttendanceData(selectedDate);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error saving batch faculty attendance: ' + err.message);
    } finally {
      setSavingTeacherBatch(false);
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.class_name} - ${cls.section}` : (classId ? `Class #${classId}` : 'Unassigned');
  };

  return (
    <div className="attendance-admin-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="card-table-wrapper" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <CalendarCheck size={22} color="#0284c7" />
              <span>Master Attendance Management Console (Admin Desk)</span>
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Admin Rights: Manually update and certify daily attendance status for Students and Faculty members.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Calendar Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Date:</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              />
              <button 
                type="button" 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }}
                title="Jump to Today"
              >
                Today
              </button>
            </div>

            <button 
              className="btn-secondary"
              onClick={() => loadAllAttendanceData(selectedDate)}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Refresh attendance records"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${attendanceMode === 'students' ? 'btn-primary' : ''}`}
            onClick={() => setAttendanceMode('students')}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              borderRadius: '8px',
              background: attendanceMode === 'students' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'var(--bg-input)',
              color: attendanceMode === 'students' ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border-color)'
            }}
          >
            <GraduationCap size={16} />
            <span>Student Attendance ({students.length} Enrolled)</span>
          </button>

          <button
            className={`btn-secondary ${attendanceMode === 'teachers' ? 'btn-primary' : ''}`}
            onClick={() => setAttendanceMode('teachers')}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              borderRadius: '8px',
              background: attendanceMode === 'teachers' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'var(--bg-input)',
              color: attendanceMode === 'teachers' ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border-color)'
            }}
          >
            <UserCheck size={16} />
            <span>Faculty & Teacher Attendance ({teachers.length} Faculty)</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div style={{
            marginTop: '14px',
            padding: '10px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: STUDENT ATTENDANCE */}
      {/* ========================================================= */}
      {attendanceMode === 'students' && (
        <>
          {/* KPI Cards Grid */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '4px' }}>
            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Cohort Strength</h3>
                <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 800 }}>{studentStats.total}</div>
              </div>
              <div className="kpi-icon-wrap icon-blue">
                <Users size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Present Today</h3>
                <div className="kpi-value" style={{ color: '#059669', fontSize: '24px', fontWeight: 800 }}>
                  {studentStats.present} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({studentStats.presentRate}%)</span>
                </div>
              </div>
              <div className="kpi-icon-wrap icon-emerald">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Absent</h3>
                <div className="kpi-value" style={{ color: '#dc2626', fontSize: '24px', fontWeight: 800 }}>{studentStats.absent}</div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
                <X size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Late / Tardy</h3>
                <div className="kpi-value" style={{ color: '#d97706', fontSize: '24px', fontWeight: 800 }}>{studentStats.late}</div>
              </div>
              <div className="kpi-icon-wrap icon-amber">
                <Clock size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Excused / Leave</h3>
                <div className="kpi-value" style={{ color: '#0284c7', fontSize: '24px', fontWeight: 800 }}>{studentStats.excused}</div>
              </div>
              <div className="kpi-icon-wrap icon-purple">
                <CalendarCheck size={20} />
              </div>
            </div>
          </div>

          {/* Main Roster & Marking Console */}
          <div className="card-table-wrapper">
            {/* Action Toolbar */}
            <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-box" style={{ minWidth: '220px' }}>
                  <Search className="search-icon" size={15} />
                  <input 
                    type="text"
                    placeholder="Search student or roll no..."
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                  />
                </div>

                {/* Class Dropdown */}
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Class Cohorts ({students.length})</option>
                  {classes.map(c => {
                    const count = students.filter(s => s.class_id === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.class_name} - Section {c.section} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Quick Bulk Marking Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Mark:</span>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkStudents('Present')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#059669', borderColor: '#a7f3d0' }}
                  >
                    ✓ All Present
                  </button>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkStudents('Absent')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#dc2626', borderColor: '#fecaca' }}
                  >
                    ✕ All Absent
                  </button>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkStudents('Late')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#d97706', borderColor: '#fde68a' }}
                  >
                    ⏱ All Late
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Status Filter Pills */}
                <div className="filter-pills-bar" style={{ margin: 0 }}>
                  <button 
                    className={`filter-pill ${studentStatusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStudentStatusFilter('ALL')}
                  >
                    All ({eligibleStudents.length})
                  </button>
                  <button 
                    className={`filter-pill ${studentStatusFilter === 'Present' ? 'active' : ''}`}
                    onClick={() => setStudentStatusFilter('Present')}
                    style={{ color: studentStatusFilter === 'Present' ? 'white' : '#059669' }}
                  >
                    Present ({studentStats.present})
                  </button>
                  <button 
                    className={`filter-pill ${studentStatusFilter === 'Absent' ? 'active' : ''}`}
                    onClick={() => setStudentStatusFilter('Absent')}
                    style={{ color: studentStatusFilter === 'Absent' ? 'white' : '#dc2626' }}
                  >
                    Absent ({studentStats.absent})
                  </button>
                  <button 
                    className={`filter-pill ${studentStatusFilter === 'Late' ? 'active' : ''}`}
                    onClick={() => setStudentStatusFilter('Late')}
                    style={{ color: studentStatusFilter === 'Late' ? 'white' : '#d97706' }}
                  >
                    Late ({studentStats.late})
                  </button>
                  <button 
                    className={`filter-pill ${studentStatusFilter === 'Excused' ? 'active' : ''}`}
                    onClick={() => setStudentStatusFilter('Excused')}
                    style={{ color: studentStatusFilter === 'Excused' ? 'white' : '#0284c7' }}
                  >
                    Excused ({studentStats.excused})
                  </button>
                </div>

                {/* Save Entire Class Button */}
                <button 
                  className="btn-primary"
                  onClick={handleSaveAllStudentsBatch}
                  disabled={savingStudentBatch || eligibleStudents.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)'
                  }}
                >
                  <Save size={15} />
                  <span>{savingStudentBatch ? 'Saving...' : `Save All Attendance (${eligibleStudents.length})`}</span>
                </button>
              </div>
            </div>

            {/* Table Roster */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '940px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Roll Number</th>
                    <th>Student Profile & Contact</th>
                    <th>Class & Section</th>
                    <th style={{ width: '330px', textAlign: 'center' }}>Attendance Status Toggle</th>
                    <th>Pastoral / Observation Remarks</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px', width: '90px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(st => {
                    const currentEntry = studentStatusMap[st.id] || { status: 'Present', remarks: '' };
                    const currentStatus = currentEntry.status || 'Present';
                    const isSavingThis = savingStudentId === st.id;

                    return (
                      <tr key={st.id}>
                        <td>
                          <span style={{
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {st.roll_number}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: 'rgba(2, 132, 199, 0.15)',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}>
                              {st.first_name?.[0] || 'S'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                                {st.first_name} {st.last_name}
                              </strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {st.phone ? `📞 ${st.phone}` : (st.email || '—')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="roster-class-tag" style={{ fontSize: '12px' }}>
                            {getClassName(st.class_id)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            background: 'var(--bg-input)',
                            padding: '3px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            gap: '3px'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'Present')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: currentStatus === 'Present' ? '#059669' : 'transparent',
                                color: currentStatus === 'Present' ? '#ffffff' : '#059669'
                              }}
                            >
                              <Check size={12} /> Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'Absent')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: currentStatus === 'Absent' ? '#dc2626' : 'transparent',
                                color: currentStatus === 'Absent' ? '#ffffff' : '#dc2626'
                              }}
                            >
                              <X size={12} /> Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'Late')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: currentStatus === 'Late' ? '#d97706' : 'transparent',
                                color: currentStatus === 'Late' ? '#ffffff' : '#d97706'
                              }}
                            >
                              <Clock size={12} /> Late
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'Excused')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: currentStatus === 'Excused' ? '#0284c7' : 'transparent',
                                color: currentStatus === 'Excused' ? '#ffffff' : '#0284c7'
                              }}
                            >
                              <AlertCircle size={12} /> Excused
                            </button>
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text"
                            placeholder="e.g. Arrived late, sick leave, verified by parent..."
                            value={currentEntry.remarks || ''}
                            onChange={e => handleSetStudentRemarks(st.id, e.target.value)}
                            style={{
                              width: '100%',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              color: 'var(--text-main)'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <button
                            type="button"
                            className="action-btn edit"
                            onClick={() => handleSaveSingleStudent(st.id)}
                            disabled={isSavingThis}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(2, 132, 199, 0.15)',
                              color: '#0284c7',
                              border: '1px solid rgba(2, 132, 199, 0.3)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600
                            }}
                            title="Save single attendance record"
                          >
                            <Save size={13} />
                            <span>{isSavingThis ? '...' : 'Save'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No students found for current cohort and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: FACULTY & TEACHER ATTENDANCE */}
      {/* ========================================================= */}
      {attendanceMode === 'teachers' && (
        <>
          {/* Teacher KPI Cards */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '4px' }}>
            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Total Faculty</h3>
                <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 800 }}>{teacherStats.total}</div>
              </div>
              <div className="kpi-icon-wrap icon-purple">
                <Briefcase size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Present Faculty</h3>
                <div className="kpi-value" style={{ color: '#059669', fontSize: '24px', fontWeight: 800 }}>
                  {teacherStats.present} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({teacherStats.presentRate}%)</span>
                </div>
              </div>
              <div className="kpi-icon-wrap icon-emerald">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>On Leave</h3>
                <div className="kpi-value" style={{ color: '#0284c7', fontSize: '24px', fontWeight: 800 }}>{teacherStats.onLeave}</div>
              </div>
              <div className="kpi-icon-wrap icon-blue">
                <CalendarCheck size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Half-Day / Late</h3>
                <div className="kpi-value" style={{ color: '#d97706', fontSize: '24px', fontWeight: 800 }}>{teacherStats.halfDay + teacherStats.late}</div>
              </div>
              <div className="kpi-icon-wrap icon-amber">
                <Clock size={20} />
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="kpi-info">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 700 }}>Absent</h3>
                <div className="kpi-value" style={{ color: '#dc2626', fontSize: '24px', fontWeight: 800 }}>{teacherStats.absent}</div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
                <X size={20} />
              </div>
            </div>
          </div>

          {/* Teacher Roster Card */}
          <div className="card-table-wrapper">
            {/* Table Toolbar */}
            <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-box" style={{ minWidth: '220px' }}>
                  <Search className="search-icon" size={15} />
                  <input 
                    type="text"
                    placeholder="Search faculty name, ID, dept..."
                    value={teacherSearchQuery}
                    onChange={e => setTeacherSearchQuery(e.target.value)}
                  />
                </div>

                {/* Department Filter */}
                <select
                  value={teacherDeptFilter}
                  onChange={e => setTeacherDeptFilter(e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Departments ({teachers.length})</option>
                  <option value="Department of Mathematics & Sciences">Math & Sciences</option>
                  <option value="Department of Computer Science & IT">Computer Science & IT</option>
                  <option value="Department of Physics & Natural Sciences">Physics & Natural Sciences</option>
                  <option value="Department of Chemistry">Chemistry</option>
                  <option value="Department of Languages & Humanities">Languages & Humanities</option>
                  <option value="Department of Commerce & Social Studies">Commerce & Social Studies</option>
                </select>

                {/* Quick Bulk Marking Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Mark:</span>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkTeachers('Present')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#059669', borderColor: '#a7f3d0' }}
                  >
                    ✓ All Present
                  </button>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkTeachers('Absent')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#dc2626', borderColor: '#fecaca' }}
                  >
                    ✕ All Absent
                  </button>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleBulkMarkTeachers('On Leave')}
                    style={{ padding: '5px 9px', fontSize: '11.5px', color: '#0284c7', borderColor: '#bae6fd' }}
                  >
                    🏖 All On Leave
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Status Filter Pills */}
                <div className="filter-pills-bar" style={{ margin: 0 }}>
                  <button 
                    className={`filter-pill ${teacherStatusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setTeacherStatusFilter('ALL')}
                  >
                    All ({eligibleTeachers.length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherStatusFilter === 'Present' ? 'active' : ''}`}
                    onClick={() => setTeacherStatusFilter('Present')}
                    style={{ color: teacherStatusFilter === 'Present' ? 'white' : '#059669' }}
                  >
                    Present ({teacherStats.present})
                  </button>
                  <button 
                    className={`filter-pill ${teacherStatusFilter === 'On Leave' ? 'active' : ''}`}
                    onClick={() => setTeacherStatusFilter('On Leave')}
                    style={{ color: teacherStatusFilter === 'On Leave' ? 'white' : '#0284c7' }}
                  >
                    On Leave ({teacherStats.onLeave})
                  </button>
                  <button 
                    className={`filter-pill ${teacherStatusFilter === 'Half Day' ? 'active' : ''}`}
                    onClick={() => setTeacherStatusFilter('Half Day')}
                    style={{ color: teacherStatusFilter === 'Half Day' ? 'white' : '#8b5cf6' }}
                  >
                    Half Day ({teacherStats.halfDay})
                  </button>
                  <button 
                    className={`filter-pill ${teacherStatusFilter === 'Absent' ? 'active' : ''}`}
                    onClick={() => setTeacherStatusFilter('Absent')}
                    style={{ color: teacherStatusFilter === 'Absent' ? 'white' : '#dc2626' }}
                  >
                    Absent ({teacherStats.absent})
                  </button>
                </div>

                {/* Save All Faculty Button */}
                <button 
                  className="btn-primary"
                  onClick={handleSaveAllTeachersBatch}
                  disabled={savingTeacherBatch || eligibleTeachers.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)'
                  }}
                >
                  <Save size={15} />
                  <span>{savingTeacherBatch ? 'Saving...' : `Save Faculty Attendance (${eligibleTeachers.length})`}</span>
                </button>
              </div>
            </div>

            {/* Teacher Attendance Table */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '1020px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Faculty ID</th>
                    <th>Faculty Member & Department</th>
                    <th style={{ width: '380px', textAlign: 'center' }}>Manual Attendance Status</th>
                    <th style={{ width: '180px' }}>Daily Timecard (In / Out)</th>
                    <th>Administrative Remarks / Duty Note</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px', width: '90px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(t => {
                    const currentEntry = teacherStatusMap[t.id] || { status: 'Present', check_in_time: '08:45 AM', check_out_time: '04:30 PM', remarks: '' };
                    const currentStatus = currentEntry.status || 'Present';
                    const isSavingThis = savingTeacherId === t.id;

                    return (
                      <tr key={t.id}>
                        <td>
                          <span style={{
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {t.employee_id || `TCH-${t.id}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: 'rgba(2, 132, 199, 0.15)',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}>
                              {t.first_name?.[0] || 'T'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                                Prof. {t.first_name} {t.last_name}
                              </strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {t.department || 'Faculty'} • <span style={{ color: '#0284c7' }}>{t.designation || 'Faculty Member'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            background: 'var(--bg-input)',
                            padding: '3px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            gap: '3px'
                          }}>
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleSetTeacherStatus(t.id, 'Present')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: currentStatus === 'Present' ? '#059669' : 'transparent',
                                color: currentStatus === 'Present' ? '#ffffff' : '#059669'
                              }}
                            >
                              <Check size={12} /> Present
                            </button>

                            {/* On Leave */}
                            <button
                              type="button"
                              onClick={() => handleSetTeacherStatus(t.id, 'On Leave')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: currentStatus === 'On Leave' ? '#0284c7' : 'transparent',
                                color: currentStatus === 'On Leave' ? '#ffffff' : '#0284c7'
                              }}
                            >
                              <CalendarCheck size={12} /> On Leave
                            </button>

                            {/* Half Day */}
                            <button
                              type="button"
                              onClick={() => handleSetTeacherStatus(t.id, 'Half Day')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: currentStatus === 'Half Day' ? '#8b5cf6' : 'transparent',
                                color: currentStatus === 'Half Day' ? '#ffffff' : '#8b5cf6'
                              }}
                            >
                              <Clock size={12} /> Half Day
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => handleSetTeacherStatus(t.id, 'Late')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: currentStatus === 'Late' ? '#d97706' : 'transparent',
                                color: currentStatus === 'Late' ? '#ffffff' : '#d97706'
                              }}
                            >
                              <Clock size={12} /> Late
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleSetTeacherStatus(t.id, 'Absent')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: currentStatus === 'Absent' ? '#dc2626' : 'transparent',
                                color: currentStatus === 'Absent' ? '#ffffff' : '#dc2626'
                              }}
                            >
                              <X size={12} /> Absent
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="text"
                              placeholder="In: 08:45 AM"
                              value={currentEntry.check_in_time || '08:45 AM'}
                              onChange={e => handleSetTeacherTime(t.id, 'check_in_time', e.target.value)}
                              style={{
                                width: '80px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '11px',
                                color: 'var(--text-main)',
                                textAlign: 'center'
                              }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                            <input 
                              type="text"
                              placeholder="Out: 04:30 PM"
                              value={currentEntry.check_out_time || '04:30 PM'}
                              onChange={e => handleSetTeacherTime(t.id, 'check_out_time', e.target.value)}
                              style={{
                                width: '80px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '11px',
                                color: 'var(--text-main)',
                                textAlign: 'center'
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text"
                            placeholder="e.g. Biometric verified, invigilation duty, approved leave..."
                            value={currentEntry.remarks || ''}
                            onChange={e => handleSetTeacherRemarks(t.id, e.target.value)}
                            style={{
                              width: '100%',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              color: 'var(--text-main)'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <button
                            type="button"
                            className="action-btn edit"
                            onClick={() => handleSaveSingleTeacher(t.id)}
                            disabled={isSavingThis}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(2, 132, 199, 0.15)',
                              color: '#0284c7',
                              border: '1px solid rgba(2, 132, 199, 0.3)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600
                            }}
                            title="Save single faculty attendance record"
                          >
                            <Save size={13} />
                            <span>{isSavingThis ? '...' : 'Save'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No faculty members found for current department and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
