import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  ShieldCheck,
  FileText,
  Download,
  Filter,
  Sparkles,
  ArrowRight,
  UserCheck,
  Award,
  CreditCard,
  Check,
  X,
  RefreshCw,
  Sliders,
  Send,
  HelpCircle,
  Layers,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { api } from './api';

export default function StudentAttendanceCalendarTracker({
  studentData,
  studentId,
  classTeacher,
  classNameDisplay,
  teacherNameDisplay,
  teacherEmpIdDisplay,
  onNavigateTab,
  onRefreshAll,
  totalBalance = 0,
  avgMarks = '88.5'
}) {
  // Current date reference
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0-indexed

  // Calendar State
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(8); // September (0-indexed: 8)
  const [selectedDateStr, setSelectedDateStr] = useState('2026-09-09');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Present' | 'Absent' | 'Late' | 'Regularized' | 'Pending'

  // Data State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Regularization Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regModalData, setRegModalData] = useState({
    attendance_date: '2026-09-15',
    original_status: 'Absent',
    requested_status: 'Present',
    reason_category: 'Biometric / Scanner Technical Issue',
    reason: ''
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthString = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;

  // Fetch Attendance & Regularization Data for Logged-In Student
  useEffect(() => {
    loadMonthlyAttendanceData();
  }, [studentId, monthString]);

  const loadMonthlyAttendanceData = async () => {
    if (!studentId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [attRes, regRes, leavesRes] = await Promise.allSettled([
        api.getStudentAttendance(studentId, monthString),
        api.getRegularizationRequests(studentId),
        api.getLeaves(studentId)
      ]);

      if (attRes.status === 'fulfilled') {
        const list = Array.isArray(attRes.value) ? attRes.value : [];
        setAttendanceRecords(list);
      } else {
        setAttendanceRecords([]);
      }

      if (regRes.status === 'fulfilled') {
        const list = Array.isArray(regRes.value) ? regRes.value : [];
        setRegularizations(list);
      } else {
        setRegularizations([]);
      }

      if (leavesRes.status === 'fulfilled') {
        const list = Array.isArray(leavesRes.value) ? leavesRes.value : [];
        setLeaves(list);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      console.error('Error fetching student monthly attendance:', err);
      setErrorMsg('Unable to load attendance records from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback default sample records for September 2026 to ensure rich visual demonstration
  const baseSampleSchedule = useMemo(() => ({
    '2026-09-01': { status: 'Present', in_time: '08:25 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified. Punctual arrival.' },
    '2026-09-02': { status: 'Present', in_time: '08:28 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-03': { status: 'Present', in_time: '08:20 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-04': { status: 'Present', in_time: '08:24 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-05': { status: 'Late', in_time: '08:42 AM', out_time: '01:30 PM', punch: 'Gate 2 Late Desk', session: 'Half Day (Periods 1-4)', remarks: 'Late Entry (+12 min delay due to bus hold).' },
    '2026-09-08': { status: 'Present', in_time: '08:30 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Official Inter-School Science Quiz.' },
    '2026-09-09': { status: 'Present', in_time: '08:22 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified. All periods present.' },
    '2026-09-10': { status: 'Present', in_time: '08:26 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-11': { status: 'Absent', in_time: '—', out_time: '—', punch: 'No punch recorded', session: 'Full Day (Periods 1-6)', remarks: 'Medical Leave Sanctioned.' },
    '2026-09-12': { status: 'Absent', in_time: '—', out_time: '—', punch: 'No punch recorded', session: 'Full Day (Periods 1-6)', remarks: 'Medical Leave Sanctioned.' },
    '2026-09-15': { status: 'Absent', in_time: '—', out_time: '—', punch: 'Missed at Gate Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric Scanner Technical Failure.' },
    '2026-09-16': { status: 'Present', in_time: '08:21 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-17': { status: 'Present', in_time: '08:23 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-18': { status: 'Present', in_time: '08:20 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Biometric verified.' },
    '2026-09-19': { status: 'Present', in_time: '08:25 AM', out_time: '01:30 PM', punch: 'Gate 1 Turnstile', session: 'Half Day (Periods 1-4)', remarks: 'Half Day Session.' },
    '2026-09-20': { status: 'Present', in_time: '08:22 AM', out_time: '03:20 PM', punch: 'Gate 1 Turnstile', session: 'Full Day (Periods 1-6)', remarks: 'Manual certification updated by Admin.' }
  }), []);

  // Map of regularizations keyed by date
  const regularizationMap = useMemo(() => {
    const map = {};
    regularizations.forEach(r => {
      if (!map[r.attendance_date] || r.status === 'Approved') {
        map[r.attendance_date] = r;
      }
    });
    return map;
  }, [regularizations]);

  // Combined day-by-day attendance dictionary for the selected month
  const monthDaysData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();
    const map = {};

    // 1. Index DB records
    const dbRecordMap = {};
    attendanceRecords.forEach(rec => {
      if (rec.date) {
        dbRecordMap[rec.date] = rec;
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}-${dayStr}`;
      const dObj = new Date(selectedYear, selectedMonthIdx, day);
      const dayOfWeekIdx = dObj.getDay(); // 0 = Sun, 6 = Sat
      const isSunday = dayOfWeekIdx === 0;
      const isSaturday = dayOfWeekIdx === 6;
      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
      const shortDayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });

      // Check for DB record or sample schedule
      const dbRec = dbRecordMap[dateStr];
      const sampleRec = baseSampleSchedule[dateStr];
      const reg = regularizationMap[dateStr];

      let rawStatus = 'No Record';
      let inTime = '—';
      let outTime = '—';
      let punch = 'No punch recorded';
      let session = isSaturday ? 'Half Day (Periods 1-4)' : 'Full Day (Periods 1-6)';
      let remarks = 'No attendance logged for this session.';
      let isHoliday = isSunday;

      if (isSunday) {
        rawStatus = 'Holiday';
        remarks = 'Institutional Weekend / Weekly Holiday';
        session = 'Non-Instructional Day';
      } else if (dbRec) {
        rawStatus = dbRec.status || 'Present';
        inTime = dbRec.in_time || (rawStatus === 'Present' ? '08:25 AM' : (rawStatus === 'Late' ? '08:45 AM' : '—'));
        outTime = dbRec.out_time || (rawStatus === 'Present' || rawStatus === 'Late' ? '03:20 PM' : '—');
        punch = rawStatus === 'Present' ? 'Verified at Gate 1 Turnstile' : (rawStatus === 'Late' ? 'Gate 2 Late Entry' : 'Missed punch');
        remarks = dbRec.remarks || (rawStatus === 'Present' ? 'Biometric verified by system.' : 'Daily attendance marked.');
      } else if (sampleRec && selectedYear === 2026 && selectedMonthIdx === 8) {
        rawStatus = sampleRec.status;
        inTime = sampleRec.in_time;
        outTime = sampleRec.out_time;
        punch = sampleRec.punch;
        session = sampleRec.session;
        remarks = sampleRec.remarks;
      }

      // Check if Regularized (Approved by Teacher or Admin)
      let effectiveStatus = rawStatus;
      let isRegularized = false;
      let isPendingReg = false;

      if (reg) {
        if (reg.status === 'Approved') {
          effectiveStatus = 'Regularized';
          isRegularized = true;
          remarks = `Regularized by Class Teacher (${reg.teacher_remarks || 'Dispute approved'})`;
        } else if (reg.status === 'Pending') {
          isPendingReg = true;
        }
      }

      map[dateStr] = {
        date: dateStr,
        dayNumber: day,
        dayOfWeekIdx,
        dayName,
        shortDayName,
        rawStatus,
        effectiveStatus,
        isRegularized,
        isPendingReg,
        isHoliday,
        inTime,
        outTime,
        punch,
        session,
        remarks,
        regularization: reg || null
      };
    }

    return map;
  }, [selectedYear, selectedMonthIdx, attendanceRecords, regularizationMap, baseSampleSchedule]);

  // Selected Date Details
  const selectedDayInfo = useMemo(() => {
    if (monthDaysData[selectedDateStr]) {
      return monthDaysData[selectedDateStr];
    }
    // Fallback info for date
    const d = new Date(selectedDateStr);
    return {
      date: selectedDateStr,
      dayNumber: d.getDate() || 1,
      dayName: isNaN(d.getTime()) ? 'Day' : d.toLocaleDateString('en-US', { weekday: 'long' }),
      shortDayName: isNaN(d.getTime()) ? 'Day' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      effectiveStatus: 'No Record',
      rawStatus: 'No Record',
      isRegularized: false,
      isPendingReg: false,
      isHoliday: false,
      inTime: '—',
      outTime: '—',
      punch: 'No punch recorded',
      session: 'Standard Academic Session',
      remarks: 'No attendance record found for this date.',
      regularization: regularizationMap[selectedDateStr] || null
    };
  }, [monthDaysData, selectedDateStr, regularizationMap]);

  // Monthly Overview & Statistics
  const monthStats = useMemo(() => {
    const list = Object.values(monthDaysData);
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let regularizedCount = 0;
    let holidayCount = 0;
    let pendingCount = 0;
    let recordedAcademicDays = 0;

    list.forEach(item => {
      if (item.isHoliday) {
        holidayCount++;
        return;
      }
      if (item.isPendingReg) pendingCount++;

      if (item.effectiveStatus === 'Present') {
        presentCount++;
        recordedAcademicDays++;
      } else if (item.effectiveStatus === 'Regularized') {
        regularizedCount++;
        presentCount++; // Regularized counts as verified present
        recordedAcademicDays++;
      } else if (item.effectiveStatus === 'Excused' || item.effectiveStatus === 'On Leave') {
        presentCount++; // Excused sanctioned leave counts as verified
        recordedAcademicDays++;
      } else if (item.effectiveStatus === 'Late') {
        lateCount++;
        presentCount++; // Late counts with partial credit
        recordedAcademicDays++;
      } else if (item.effectiveStatus === 'Absent') {
        absentCount++;
        recordedAcademicDays++;
      }
    });

    const totalTrackedSessions = recordedAcademicDays > 0 ? recordedAcademicDays : (presentCount + absentCount + lateCount);
    const totalPresentSessions = presentCount;
    const percentage = totalTrackedSessions > 0 ? ((totalPresentSessions / totalTrackedSessions) * 100).toFixed(1) : '85.7';

    return {
      totalDays: list.length,
      trackedSessions: totalTrackedSessions,
      presentSessions: totalPresentSessions,
      presentDays: presentCount - regularizedCount,
      absentDays: absentCount,
      lateDays: lateCount,
      regularizedDays: regularizedCount,
      holidayDays: holidayCount,
      pendingDays: pendingCount,
      percentage: parseFloat(percentage),
      percentageStr: `${percentage}%`,
      isCompliant: parseFloat(percentage) >= 75.0
    };
  }, [monthDaysData]);

  // Recent 5-7 Attendance Records
  const recentRecords = useMemo(() => {
    const list = Object.values(monthDaysData)
      .filter(item => !item.isHoliday && item.effectiveStatus !== 'No Record')
      .sort((a, b) => b.date.localeCompare(a.date));
    return list.slice(0, 6);
  }, [monthDaysData]);

  // Filtered List for Table View
  const filteredTableRows = useMemo(() => {
    const list = Object.values(monthDaysData).filter(item => !item.isHoliday && item.effectiveStatus !== 'No Record');
    if (statusFilter === 'ALL') return list;
    if (statusFilter === 'Pending') return list.filter(item => item.isPendingReg || item.regularization?.status === 'Pending');
    if (statusFilter === 'Regularized') return list.filter(item => item.effectiveStatus === 'Regularized' || item.isRegularized);
    return list.filter(item => item.effectiveStatus === statusFilter || item.rawStatus === statusFilter);
  }, [monthDaysData, statusFilter]);

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    if (selectedMonthIdx === 0) {
      setSelectedMonthIdx(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonthIdx(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx === 11) {
      setSelectedMonthIdx(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonthIdx(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setSelectedYear(2026);
    setSelectedMonthIdx(8); // September 2026
    setSelectedDateStr('2026-09-09');
  };

  // Open Regularization Modal
  const handleOpenRegularization = (dateStr, currentStatus = 'Absent') => {
    setRegModalData({
      attendance_date: dateStr || selectedDateStr,
      original_status: currentStatus === 'Present' ? 'Absent' : currentStatus,
      requested_status: 'Present',
      reason_category: 'Biometric / Scanner Technical Issue',
      reason: ''
    });
    setActionSuccess('');
    setShowRegModal(true);
  };

  // Submit Regularization Form
  const handleSubmitRegularization = async (e) => {
    e.preventDefault();
    if (!regModalData.reason.trim()) {
      alert('Please provide a short explanation for your regularization request.');
      return;
    }

    setRegSubmitting(true);
    const targetTeacherId = classTeacher?.id || studentData?.classes?.teacher_id || 1;

    const payload = {
      student_id: studentId,
      class_id: studentData?.class_id || 1,
      teacher_id: targetTeacherId,
      attendance_date: regModalData.attendance_date,
      original_status: regModalData.original_status,
      requested_status: regModalData.requested_status,
      reason_category: regModalData.reason_category,
      reason: regModalData.reason.trim(),
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    try {
      await api.createRegularizationRequest(payload);
      setActionSuccess(`✓ Attendance dispute for ${regModalData.attendance_date} submitted to Class Teacher (${teacherNameDisplay}) for review!`);
      setTimeout(() => setActionSuccess(''), 4500);
      setShowRegModal(false);
      await loadMonthlyAttendanceData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Failed to submit regularization request: ' + err.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  // Download Attendance Report (CSV Generator)
  const handleDownloadReport = () => {
    const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Student';
    const rollNo = studentData?.roll_number || `STU-${studentId}`;
    const headerLines = [
      `"EduCore OS - Official Student Attendance Ledger Report"`,
      `"Student Name:", "${studentName}", "Roll Number:", "${rollNo}"`,
      `"Enrolled Class:", "${classNameDisplay}", "Homeroom Teacher:", "${teacherNameDisplay}"`,
      `"Reporting Month:", "${monthNames[selectedMonthIdx]} ${selectedYear}", "Attendance Score:", "${monthStats.percentageStr}"`,
      `"Total Sessions:", "${monthStats.trackedSessions}", "Present Days:", "${monthStats.presentSessions}", "Absent Days:", "${monthStats.absentDays}", "Late Days:", "${monthStats.lateDays}", "Regularized Days:", "${monthStats.regularizedDays}"`,
      ``,
      `"Date","Day","Academic Session","Biometric Punch","Check-in Time","Check-out Time","Attendance Status","Remarks","Regularization Status"`
    ];

    const dataLines = Object.values(monthDaysData).map(item => {
      const regStatus = item.regularization ? `${item.regularization.status} (${item.regularization.reason_category || 'Dispute'})` : '—';
      return `"${item.date}","${item.dayName}","${item.session}","${item.punch}","${item.inTime}","${item.outTime}","${item.effectiveStatus}","${(item.remarks || '').replace(/"/g, '""')}","${regStatus}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([...headerLines, ...dataLines].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Attendance_Report_${rollNo}_${monthNames[selectedMonthIdx]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Grid Matrix Construction
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonthIdx, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();
    const prevMonthTotalDays = new Date(selectedYear, selectedMonthIdx, 0).getDate();

    const daysArray = [];

    // Previous month trailing padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevMIdx = selectedMonthIdx === 0 ? 11 : selectedMonthIdx - 1;
      const prevY = selectedMonthIdx === 0 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevY}-${String(prevMIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      daysArray.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        data: null
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArray.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        data: monthDaysData[dateStr] || null
      });
    }

    // Next month leading padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (daysArray.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
      const nextMIdx = selectedMonthIdx === 11 ? 0 : selectedMonthIdx + 1;
      const nextY = selectedMonthIdx === 11 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextY}-${String(nextMIdx + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      daysArray.push({
        dayNumber: nextDay,
        dateStr,
        isCurrentMonth: false,
        data: null
      });
    }

    return daysArray;
  }, [selectedYear, selectedMonthIdx, monthDaysData]);

  // Color & Badge Helper
  const getStatusColorConfig = (status, isRegularized, isPendingReg, isHoliday) => {
    if (isPendingReg) {
      return {
        bg: '#faf5ff',
        border: '#c084fc',
        text: '#7e22ce',
        dot: '#a855f7',
        badgeBg: '#f3e8ff',
        label: 'Pending'
      };
    }
    if (isRegularized || status === 'Regularized') {
      return {
        bg: '#eff6ff',
        border: '#93c5fd',
        text: '#1d4ed8',
        dot: '#3b82f6',
        badgeBg: '#dbeafe',
        label: 'Regularized'
      };
    }
    if (status === 'Excused' || status === 'On Leave') {
      return {
        bg: '#f0fdfa',
        border: '#99f6e4',
        text: '#0f766e',
        dot: '#14b8a6',
        badgeBg: '#ccfbf1',
        label: status === 'Excused' ? 'Excused' : 'On Leave'
      };
    }
    if (status === 'Present') {
      return {
        bg: '#f0fdf4',
        border: '#86efac',
        text: '#166534',
        dot: '#22c55e',
        badgeBg: '#dcfce7',
        label: 'Present'
      };
    }
    if (status === 'Late') {
      return {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#b45309',
        dot: '#f59e0b',
        badgeBg: '#fef3c7',
        label: 'Late'
      };
    }
    if (status === 'Absent') {
      return {
        bg: '#fef2f2',
        border: '#fca5a5',
        text: '#b91c1c',
        dot: '#ef4444',
        badgeBg: '#fee2e2',
        label: 'Absent'
      };
    }
    if (isHoliday || status === 'Holiday') {
      return {
        bg: '#f8fafc',
        border: '#e2e8f0',
        text: '#64748b',
        dot: '#94a3b8',
        badgeBg: '#f1f5f9',
        label: 'Holiday'
      };
    }
    return {
      bg: '#ffffff',
      border: '#f1f5f9',
      text: '#94a3b8',
      dot: '#cbd5e1',
      badgeBg: '#f8fafc',
      label: 'No Record'
    };
  };

  return (
    <div className="attendance-calendar-tracker-root" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div style={{
          padding: '11px 16px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#059669',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '11px 16px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#dc2626',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Quick Actions Toolbar */}
      <div className="portal-section-card" style={{ padding: '14px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#0284c7" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Student Quick Actions:</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleOpenRegularization(selectedDateStr, selectedDayInfo.rawStatus)}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(2, 132, 199, 0.08)',
                color: '#0284c7',
                borderColor: 'rgba(2, 132, 199, 0.3)',
                fontWeight: 600
              }}
            >
              <CalendarCheck size={14} />
              <span>Request Regularization</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigateTab && onNavigateTab('leaves')}
              style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} />
              <span>Apply Leave</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigateTab && onNavigateTab('timetable')}
              style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Clock size={14} />
              <span>View Timetable</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleDownloadReport}
              style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={14} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Recent Attendance Days (Compact Cards Carousel) */}
      {recentRecords.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent Attendance Days (Click to Inspect on Calendar)
            </span>
            <span style={{ fontSize: '11.5px', color: '#0284c7' }}>Showing last {recentRecords.length} sessions</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {recentRecords.map((rec) => {
              const isSelected = rec.date === selectedDateStr;
              const colCfg = getStatusColorConfig(rec.rawStatus, rec.isRegularized, rec.isPendingReg, rec.isHoliday);
              const d = new Date(rec.date);
              const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = d.getDate();

              return (
                <div
                  key={rec.date}
                  onClick={() => setSelectedDateStr(rec.date)}
                  style={{
                    padding: '12px 14px',
                    background: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-card)',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                  className="recent-day-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                        {monthShort} {dayNum}
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {rec.shortDayName}
                      </strong>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '12px',
                      background: colCfg.badgeBg,
                      color: colCfg.text,
                      border: `1px solid ${colCfg.border}`
                    }}>
                      {colCfg.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Clock size={11} />
                    <span>{rec.inTime !== '—' ? rec.inTime : (rec.effectiveStatus === 'Absent' ? 'Missed' : '—')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Main Calendar & Details Split Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
        gap: '20px',
        alignItems: 'flex-start'
      }} className="calendar-details-grid">

        {/* LEFT COLUMN: Main Attendance Calendar Card */}
        <div className="portal-section-card" style={{ padding: '22px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Card Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Attendance Calendar
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                View daily attendance status. Click on a date to see detailed records.
              </p>
            </div>

            {/* Calendar Controls: Prev, Selector, Next, Today */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrevMonth}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Month Selector Dropdown */}
              <select
                value={selectedMonthIdx}
                onChange={e => setSelectedMonthIdx(parseInt(e.target.value, 10))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>

              {/* Year Selector Dropdown */}
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleNextMonth}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleJumpToToday}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', fontWeight: 600 }}
              >
                Today
              </button>
            </div>
          </div>

          {/* Weekday Column Headers (Sun to Sat) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dName, i) => (
              <div
                key={dName}
                style={{
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: i === 0 ? '#ef4444' : (i === 6 ? '#0284c7' : 'var(--text-muted)'),
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {dName}
              </div>
            ))}
          </div>

          {/* Calendar Month Grid Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px'
          }}>
            {calendarGridDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`other-${idx}`}
                    style={{
                      minHeight: '76px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px dashed #e2e8f0',
                      opacity: 0.45,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>
                      {cell.dayNumber}
                    </span>
                  </div>
                );
              }

              const data = cell.data;
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === '2026-09-09';
              const colCfg = getStatusColorConfig(data?.rawStatus, data?.isRegularized, data?.isPendingReg, data?.isHoliday);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  style={{
                    minHeight: '78px',
                    padding: '8px 7px',
                    background: isSelected ? 'rgba(2, 132, 199, 0.09)' : (data?.isHoliday ? '#f8fafc' : colCfg.bg),
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #0284c7' : `1px solid ${colCfg.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 0 2px rgba(2, 132, 199, 0.25), 0 4px 10px rgba(2, 132, 199, 0.15)' : 'none',
                    position: 'relative'
                  }}
                  className="calendar-date-cell"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: isSelected || isToday ? 800 : 700,
                      color: isSelected ? '#0284c7' : (data?.isHoliday ? '#94a3b8' : 'var(--text-main)'),
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: isToday ? '#0284c7' : 'transparent',
                      color: isToday ? '#ffffff' : (isSelected ? '#0284c7' : (data?.isHoliday ? '#94a3b8' : 'var(--text-main)'))
                    }}>
                      {cell.dayNumber}
                    </span>

                    {/* Status indicator dot */}
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: colCfg.dot
                    }} title={colCfg.label} />
                  </div>

                  {/* Status Label & Badge */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: colCfg.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {colCfg.label}
                    </div>

                    {data?.inTime && data.inTime !== '—' && (
                      <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace', marginTop: '1px' }}>
                        {data.inTime}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accessible Status Color Legend */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <strong style={{ color: 'var(--text-main)' }}>Legend:</strong>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e' }}></span>
              <span style={{ fontWeight: 600, color: '#166534' }}>Present</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ fontWeight: 600, color: '#b91c1c' }}>Absent</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ fontWeight: 600, color: '#b45309' }}>Late</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0284c7' }}></span>
              <span style={{ fontWeight: 600, color: '#0284c7' }}>Regularized</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#a855f7' }}></span>
              <span style={{ fontWeight: 600, color: '#7e22ce' }}>Pending Review</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#94a3b8' }}></span>
              <span style={{ fontWeight: 600, color: '#64748b' }}>Holiday / Weekend</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Date Details & Month Overview Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card A: Selected Date Detail Panel */}
          <div className="portal-section-card" style={{ padding: '22px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', pb: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', fontWeight: 700 }}>
                  Selected Date Inspection
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                  {selectedDayInfo.dayName}, {selectedDayInfo.date}
                </h3>
              </div>

              {/* Status Badge */}
              {(() => {
                const cfg = getStatusColorConfig(
                  selectedDayInfo.rawStatus,
                  selectedDayInfo.isRegularized,
                  selectedDayInfo.isPendingReg,
                  selectedDayInfo.isHoliday
                );
                return (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '16px',
                    background: cfg.badgeBg,
                    color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot }}></span>
                    <span>{cfg.label}</span>
                  </span>
                );
              })()}
            </div>

            {/* Daily Detailed Metrics Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Check-in Time</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedDayInfo.inTime}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Check-out Time</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedDayInfo.outTime}
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Biometric Punch Status</span>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {selectedDayInfo.punch}
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Academic Session</span>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0284c7', marginTop: '2px' }}>
                  {selectedDayInfo.session}
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Official Remarks &amp; Notes</span>
                <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '3px', lineHeight: '1.4' }}>
                  {selectedDayInfo.remarks}
                </div>
              </div>

              {/* Regularization Status Box & Action Button */}
              {selectedDayInfo.regularization ? (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: selectedDayInfo.regularization.status === 'Approved' ? 'rgba(16, 185, 129, 0.08)' : (selectedDayInfo.regularization.status === 'Rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(168, 85, 247, 0.08)'),
                  border: `1px solid ${selectedDayInfo.regularization.status === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : (selectedDayInfo.regularization.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(168, 85, 247, 0.3)')}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                      Dispute Claim: {selectedDayInfo.regularization.status}
                    </strong>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>
                      {selectedDayInfo.regularization.requested_status}
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    {selectedDayInfo.regularization.reason}
                  </p>
                  {selectedDayInfo.regularization.teacher_remarks && (
                    <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                      Class Teacher Note: {selectedDayInfo.regularization.teacher_remarks}
                    </div>
                  )}
                </div>
              ) : (selectedDayInfo.rawStatus === 'Absent' || selectedDayInfo.rawStatus === 'Late') ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleOpenRegularization(selectedDayInfo.date, selectedDayInfo.rawStatus)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    marginTop: '4px'
                  }}
                >
                  <CalendarCheck size={16} />
                  <span>Request Regularization for this Day</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Card B: Month Overview Card with Progress Ring */}
          <div className="portal-section-card" style={{ padding: '22px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--text-main)' }}>
              {monthNames[selectedMonthIdx]} {selectedYear} Overview
            </h3>

            {/* Circular Progress & Percentage Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
              {/* SVG Circular Progress Ring */}
              <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="7"
                  />
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke={monthStats.isCompliant ? '#059669' : '#d97706'}
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - monthStats.percentage / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 42 42)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <strong style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {monthStats.percentageStr}
                  </strong>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                  {monthStats.isCompliant ? 'Target Compliant' : 'Needs Regularization'}
                </strong>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  {monthStats.presentSessions} sessions attended out of {monthStats.trackedSessions} instructional days.
                </p>
                <div style={{ marginTop: '6px', fontSize: '11px', color: monthStats.isCompliant ? '#059669' : '#d97706', fontWeight: 700 }}>
                  Institutional Goal: &ge; 75%
                </div>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  <span>Present Days:</span>
                </span>
                <strong style={{ color: '#166534' }}>{monthStats.presentDays} days</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span>Absent Days:</span>
                </span>
                <strong style={{ color: '#b91c1c' }}>{monthStats.absentDays} days</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span>Late Days:</span>
                </span>
                <strong style={{ color: '#b45309' }}>{monthStats.lateDays} days</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span>
                  <span>Regularized Days:</span>
                </span>
                <strong style={{ color: '#0284c7' }}>{monthStats.regularizedDays} days</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
                  <span>Holidays &amp; Weekends:</span>
                </span>
                <strong style={{ color: '#64748b' }}>{monthStats.holidayDays} days</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Existing Detailed Attendance Records Table */}
      <div className="portal-section-card" style={{ padding: '22px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Detailed Attendance Ledger ({monthNames[selectedMonthIdx]} {selectedYear})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Itemized log of daily biometric punches and regularization approvals.
            </p>
          </div>

          {/* Synchronized Filter Pills */}
          <div className="filter-pills-bar" style={{ margin: 0 }}>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Days ({Object.values(monthDaysData).filter(i => !i.isHoliday && i.effectiveStatus !== 'No Record').length})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'Present' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Present')}
              style={{ color: statusFilter === 'Present' ? '#fff' : '#059669' }}
            >
              Present ({monthStats.presentDays})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'Absent' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Absent')}
              style={{ color: statusFilter === 'Absent' ? '#fff' : '#dc2626' }}
            >
              Absent ({monthStats.absentDays})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'Late' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Late')}
              style={{ color: statusFilter === 'Late' ? '#fff' : '#d97706' }}
            >
              Late ({monthStats.lateDays})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'Regularized' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Regularized')}
              style={{ color: statusFilter === 'Regularized' ? '#fff' : '#0284c7' }}
            >
              Regularized ({monthStats.regularizedDays})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Pending')}
              style={{ color: statusFilter === 'Pending' ? '#fff' : '#7c3aed' }}
            >
              Pending ({monthStats.pendingDays})
            </button>
          </div>
        </div>

        {/* Responsive Table View */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="portal-data-table" style={{ width: '100%', minWidth: '850px' }}>
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Date &amp; Day</th>
                <th>Academic Session</th>
                <th>Biometric Punch</th>
                <th style={{ textAlign: 'center' }}>Check-in</th>
                <th style={{ textAlign: 'center' }}>Check-out</th>
                <th style={{ textAlign: 'center' }}>Attendance Status</th>
                <th>Remarks / Notes</th>
                <th style={{ textAlign: 'right', paddingRight: '16px', width: '180px' }}>Regularization Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableRows.map((row) => {
                const reg = row.regularization;
                const colCfg = getStatusColorConfig(row.rawStatus, row.isRegularized, row.isPendingReg, row.isHoliday);

                return (
                  <tr
                    key={row.date}
                    onClick={() => setSelectedDateStr(row.date)}
                    style={{
                      cursor: 'pointer',
                      background: row.date === selectedDateStr ? 'rgba(2, 132, 199, 0.05)' : 'transparent'
                    }}
                  >
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '12.5px' }}>{row.date}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>
                        {row.dayName}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{row.session}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{row.punch}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                      {row.inTime}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                      {row.outTime}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: colCfg.badgeBg,
                        color: colCfg.text,
                        border: `1px solid ${colCfg.border}`,
                        display: 'inline-block'
                      }}>
                        {colCfg.label}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {row.remarks}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                      {row.effectiveStatus === 'Regularized' ? (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          ✓ Approved
                        </span>
                      ) : reg?.status === 'Pending' ? (
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                          ⏳ Pending Review
                        </span>
                      ) : reg?.status === 'Rejected' ? (
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                            ✗ Rejected
                          </span>
                          <button
                            type="button"
                            className="btn-action-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRegularization(row.date, row.rawStatus);
                            }}
                            title="Re-apply with updated reason"
                          >
                            Re-Apply
                          </button>
                        </div>
                      ) : (row.rawStatus === 'Absent' || row.rawStatus === 'Late') ? (
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRegularization(row.date, row.rawStatus);
                          }}
                          style={{
                            background: 'rgba(2, 132, 199, 0.1)',
                            borderColor: '#0284c7',
                            color: '#0284c7',
                            fontWeight: 600
                          }}
                        >
                          <CalendarCheck size={12} />
                          <span>Regularize</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTableRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No attendance records found for this filter in {monthNames[selectedMonthIdx]} {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Regularization Request Modal Dialog */}
      {showRegModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowRegModal(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh', 
            zIndex: 999999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '20px'
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '540px', 
              width: '100%', 
              margin: 'auto', 
              padding: '24px', 
              borderRadius: '16px', 
              background: '#ffffff', 
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 30px rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              animation: 'modalSpringIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={20} color="#0284c7" />
                  <span>Request Attendance Regularization</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Submit dispute reconciliation to your appointed Class Teacher.
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowRegModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRegularization} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Student Name &amp; Enrolled Class
                </label>
                <input
                  type="text"
                  disabled
                  value={`${studentData?.first_name || ''} ${studentData?.last_name || ''} (${studentData?.roll_number || 'STU-1001'}) • ${classNameDisplay}`}
                  style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Attendance Dispute Date
                  </label>
                  <input
                    type="date"
                    value={regModalData.attendance_date}
                    onChange={e => setRegModalData({ ...regModalData, attendance_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Original Status
                  </label>
                  <select
                    value={regModalData.original_status}
                    onChange={e => setRegModalData({ ...regModalData, original_status: e.target.value })}
                  >
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Missed">Missed Punch</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Requested Status
                  </label>
                  <select
                    value={regModalData.requested_status}
                    onChange={e => setRegModalData({ ...regModalData, requested_status: e.target.value })}
                  >
                    <option value="Present">Present (Full Day)</option>
                    <option value="On-Duty / Activity">On-Duty / Activity</option>
                    <option value="Excused">Excused Medical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Reviewing Authority
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${teacherNameDisplay} (Class Teacher)`}
                    style={{ background: 'var(--bg-secondary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Reason Category
                </label>
                <select
                  value={regModalData.reason_category}
                  onChange={e => setRegModalData({ ...regModalData, reason_category: e.target.value })}
                >
                  <option value="Biometric / Scanner Technical Issue">Biometric / Scanner Technical Issue</option>
                  <option value="Medical Emergency / Sickness">Medical Emergency / Sickness</option>
                  <option value="Official School Duty / Inter-School Activity">Official School Duty / Inter-School Activity</option>
                  <option value="Transport / Bus Breakdown">Transport / Bus Breakdown</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Other Special Circumstances">Other Special Circumstances</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Student Explanation &amp; Supporting Justification *
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide precise details (e.g. Scanner did not beep at Gate 1 at 08:22 AM, accompanied by class monitor)..."
                  value={regModalData.reason}
                  onChange={e => setRegModalData({ ...regModalData, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRegModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={regSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
                >
                  <Send size={14} />
                  <span>{regSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
