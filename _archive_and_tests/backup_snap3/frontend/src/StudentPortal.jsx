import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  CreditCard,
  Award,
  CalendarCheck,
  Clock,
  MessageSquare,
  Printer,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
  Download,
  TrendingUp,
  Building2,
  Calendar,
  LogOut,
  ChevronRight,
  Bell,
  Send,
  FileText,
  MapPin,
  Phone,
  Mail,
  HeartPulse,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Info,
  Lock,
  ShieldAlert,
  History,
  BarChart3,
  Filter,
  Sliders,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { api } from './api';
import SettingsModal from './SettingsModal';
import StudentAttendanceCalendarTracker from './StudentAttendanceCalendarTracker';



export default function StudentPortal({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'fees' | 'grades' | 'attendance' | 'timetable' | 'teachers' | 'leaves' | 'remarks'
  const [studentData, setStudentData] = useState(null);
  const [fees, setFees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Examination Terms & 10-Assessment Historical Grade State
  const [selectedExamTerm, setSelectedExamTerm] = useState('ALL');
  const [gradeSubjectFilter, setGradeSubjectFilter] = useState('ALL');
  const [gradeViewMode, setGradeViewMode] = useState('cards'); // 'cards' | 'history'
  const [historySubject, setHistorySubject] = useState('Mathematics');
  const [selectedHistoryModal, setSelectedHistoryModal] = useState(null);

  // Notification & Settings state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`greenwood_read_notifs_student_${currentUser?.student_id || 1}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save read notification IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `greenwood_read_notifs_student_${currentUser?.student_id || 1}`,
        JSON.stringify(Array.from(readNotificationIds))
      );
    } catch (e) {
      console.error(e);
    }
  }, [readNotificationIds, currentUser]);

  // Attendance Regularization State
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('ALL');
  const [newRegularization, setNewRegularization] = useState({
    attendance_date: '2026-09-15',
    original_status: 'Absent',
    requested_status: 'Present',
    reason_category: 'Biometric / Scanner Technical Issue',
    reason: ''
  });

  // Leave Request Form Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [newLeave, setNewLeave] = useState({
    leave_type: 'Medical Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days_count: 2,
    reason: ''
  });

  const studentId = currentUser?.student_id || 1;

  const classTeacher = useMemo(() => {
    return studentData?.classes?.teachers || null;
  }, [studentData]);

  const classNameDisplay = useMemo(() => {
    if (studentData?.classes) {
      return `${studentData.classes.class_name} - Section ${studentData.classes.section}`;
    }
    return studentData?.class_id ? `Class #${studentData.class_id}` : 'Class 10 - Section A';
  }, [studentData]);

  const teacherNameDisplay = useMemo(() => {
    if (classTeacher) {
      return `Prof. ${classTeacher.first_name} ${classTeacher.last_name}`;
    }
    return 'Appointed Class Teacher';
  }, [classTeacher]);

  const teacherEmpIdDisplay = useMemo(() => {
    return classTeacher?.employee_id || 'TCH-001';
  }, [classTeacher]);

  useEffect(() => {
    loadStudentInfo();
  }, [studentId]);

  const loadStudentInfo = async () => {
    setLoading(true);
    try {
      const [studentsRes, feesRes, gradesRes, remarksRes, attRes, leavesRes, regRes] = await Promise.allSettled([
        api.getStudents(),
        api.getFees(),
        api.getStudentGrades(studentId),
        api.getRemarks(studentId),
        api.getAttendance(),
        api.getLeaves(studentId),
        api.getAttendanceRegularizations(studentId)
      ]);

      let myClassId = 1;
      if (studentsRes.status === 'fulfilled') {
        const list = Array.isArray(studentsRes.value) ? studentsRes.value : [];
        const me = list.find(s => s.id === studentId) || list[0] || null;
        setStudentData(me);
        if (me?.class_id) myClassId = me.class_id;
      }

      // Fetch timetable for student's specific assigned class
      try {
        const ttRes = await api.getTimetable(myClassId);
        setTimetable(Array.isArray(ttRes) ? ttRes : []);
      } catch {
        setTimetable([]);
      }

      if (feesRes.status === 'fulfilled') {
        const allFees = Array.isArray(feesRes.value) ? feesRes.value : [];
        const myFees = allFees.filter(f => f.student_id === studentId).map(f => ({
          ...f,
          total_amount: f.net_payable || f.gross_amount || f.total_amount || 25000,
          payment_mode: f.payment_method || f.payment_mode || 'Online UPI',
          status: f.payment_status || f.status || 'Paid'
        }));
        setFees(myFees);
      }

      if (gradesRes.status === 'fulfilled') {
        setGrades(Array.isArray(gradesRes.value) ? gradesRes.value : []);
      } else {
        setGrades([]);
      }

      if (remarksRes.status === 'fulfilled') {
        setRemarks(Array.isArray(remarksRes.value) ? remarksRes.value : []);
      }

      if (attRes.status === 'fulfilled') {
        const attList = Array.isArray(attRes.value) ? attRes.value : [];
        setAttendance(attList.filter(a => a.student_id === studentId));
      }

      if (leavesRes.status === 'fulfilled') {
        setLeaves(Array.isArray(leavesRes.value) ? leavesRes.value : []);
      }

      if (regRes.status === 'fulfilled') {
        setRegularizations(Array.isArray(regRes.value) ? regRes.value : []);
      }
    } catch (err) {
      console.error('Error loading student portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate Real-Time Notification Stream from Remarks, Grades, Leaves, Regularizations & Fees
  const notifications = useMemo(() => {
    const list = [];

    // 1. Remark Notifications
    remarks.forEach(r => {
      list.push({
        id: `notif-rem-${r.id}`,
        category: 'remark',
        title: 'New Progress Remark Shared',
        message: `${r.teachers ? `${r.teachers.first_name} ${r.teachers.last_name}` : 'Subject Teacher'} added evaluation in ${r.subject}: "${r.remark}"`,
        timestamp: r.created_at || 'Recent',
        created_at: r.created_at || new Date().toISOString(),
        targetTab: 'remarks'
      });
    });

    // 2. Grade / Report Card Notifications
    grades.slice(0, 5).forEach(g => {
      list.push({
        id: `notif-grd-${g.id}`,
        category: 'grade',
        title: `Grade Evaluation: ${g.subject}`,
        message: `Scored ${g.marks_obtained}/${g.total_marks || 100} in ${g.exam_name} (Grade ${g.grade}). Remarks: ${g.remarks || 'Distinction'}`,
        timestamp: g.created_at || 'Term 1 Evaluation',
        created_at: g.created_at || new Date().toISOString(),
        targetTab: 'grades'
      });
    });

    // 3. Leave Approval Decisions
    leaves.forEach(l => {
      list.push({
        id: `notif-lev-${l.id}-${l.status}`,
        category: 'leave',
        status: l.status,
        title: `Leave Request: ${l.status}`,
        message: `Your application for ${l.leave_type} (${l.start_date} to ${l.end_date}) has been ${l.status.toUpperCase()} by your Class Teacher.${l.teacher_remarks ? ` Note: "${l.teacher_remarks}"` : ''}`,
        timestamp: l.reviewed_at || l.created_at || 'Recent',
        created_at: l.reviewed_at || l.created_at || l.start_date || new Date().toISOString(),
        targetTab: 'leaves',
        actionData: l
      });
    });

    // 4. Attendance Regularization Approval Decisions
    regularizations.forEach(reg => {
      list.push({
        id: `notif-reg-${reg.id}-${reg.status}`,
        category: 'attendance',
        status: reg.status,
        title: `Attendance Regularization: ${reg.status}`,
        message: `Your request for ${reg.attendance_date} (${reg.requested_status}) has been ${reg.status.toUpperCase()} by Class Teacher.${reg.teacher_remarks ? ` Remarks: "${reg.teacher_remarks}"` : ''}`,
        timestamp: reg.reviewed_at || reg.created_at || 'Recent',
        created_at: reg.reviewed_at || reg.created_at || reg.attendance_date || new Date().toISOString(),
        targetTab: 'attendance',
        actionData: reg
      });
    });

    // 5. Fee Receipts & Invoices
    fees.forEach(f => {
      list.push({
        id: `notif-fee-${f.id || f.receipt_number || f.term_name}`,
        category: 'fee',
        status: f.status,
        title: `Fee Payment: ${f.status}`,
        message: `Invoice for ${f.term_name || 'Tuition Fee'} (₹${(f.total_amount || 25000).toLocaleString()}) - Status: ${f.status}. Payment Mode: ${f.payment_mode || 'Online UPI'}.`,
        timestamp: f.created_at || f.due_date || 'Recent',
        created_at: f.created_at || new Date().toISOString(),
        targetTab: 'fees',
        actionData: f
      });
    });

    // 6. Assigned Timetable Subjects / Periods
    timetable.forEach(t => {
      const teacherName = t.teachers ? `Prof. ${t.teachers.first_name} ${t.teachers.last_name}` : 'Assigned Faculty';
      list.push({
        id: `notif-tt-${t.id || (t.subject + '-' + t.day_of_week)}`,
        category: 'timetable',
        title: `📚 Subject Routine: ${t.subject}`,
        message: `${t.subject} lecture period scheduled on ${t.day_of_week} • ${t.start_time} - ${t.end_time} in ${t.room_number || 'Room 101'} (Teacher: ${teacherName}).`,
        timestamp: t.created_at || 'Academic Routine',
        created_at: t.created_at || new Date().toISOString(),
        targetTab: 'timetable',
        actionData: t
      });
    });

    // CRITICAL REQUIREMENT: Sort newest notifications at the very top!
    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [remarks, grades, leaves, regularizations, fees, timetable]);

  // Active unread notifications for quick notification bell dropdown
  const activeUnreadNotifications = useMemo(() => {
    return notifications.filter(n => !readNotificationIds.has(n.id));
  }, [notifications, readNotificationIds]);

  const unreadCount = activeUnreadNotifications.length;

  const handleToggleRead = (id) => {
    setReadNotificationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotificationIds(allIds);
  };

  const handleMarkAllUnread = () => {
    setReadNotificationIds(new Set());
  };

  const handleNotificationClick = (item) => {
    // Mark as read so it is immediately removed from active dropdown
    setReadNotificationIds(prev => new Set(prev).add(item.id));
    setActiveTab(item.targetTab);
    setShowNotifications(false);
  };

  // Submit Leave Application
  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!newLeave.reason.trim()) return;

    setLeaveSubmitting(true);
    setLeaveSuccess('');

    const start = new Date(newLeave.start_date);
    const end = new Date(newLeave.end_date);
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const targetTeacherId = classTeacher?.id || studentData?.classes?.teacher_id || 1;

    const payload = {
      student_id: studentId,
      class_id: studentData?.class_id || 1,
      teacher_id: targetTeacherId,
      leave_type: newLeave.leave_type,
      start_date: newLeave.start_date,
      end_date: newLeave.end_date,
      days_count: days,
      reason: newLeave.reason.trim(),
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    try {
      await api.applyLeave(payload);
      setLeaveSuccess(`Your leave application has been submitted to your Class Teacher (${teacherNameDisplay}) for approval!`);
      setLeaves([
        {
          id: Date.now(),
          ...payload,
          students: {
            first_name: studentData?.first_name,
            last_name: studentData?.last_name,
            roll_number: studentData?.roll_number
          },
          teachers: classTeacher ? {
            first_name: classTeacher.first_name,
            last_name: classTeacher.last_name,
            employee_id: classTeacher.employee_id
          } : {
            first_name: 'Class',
            last_name: 'Teacher',
            employee_id: 'TCH'
          }
        },
        ...leaves
      ]);
      setNewLeave({
        leave_type: 'Medical Leave',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        days_count: 2,
        reason: ''
      });
      setTimeout(() => {
        setShowLeaveModal(false);
        setLeaveSuccess('');
      }, 1500);
    } catch (err) {
      alert('Failed to submit leave: ' + err.message);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Attendance Records & Regularization Logic
  // ---------------------------------------------------------------------------
  const defaultAttendanceRecords = useMemo(() => [
    { id: 101, date: '2026-09-01', day: 'Tuesday', session: 'Full Day (Periods 1-6)', time: '08:25 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 102, date: '2026-09-02', day: 'Wednesday', session: 'Full Day (Periods 1-6)', time: '08:28 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 103, date: '2026-09-03', day: 'Thursday', session: 'Full Day (Periods 1-6)', time: '08:20 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 104, date: '2026-09-04', day: 'Friday', session: 'Full Day (Periods 1-6)', time: '08:24 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 105, date: '2026-09-05', day: 'Saturday', session: 'Half Day (Periods 1-4)', time: '08:42 AM', status: 'Late', remarks: 'Late Entry (+12 min delay)' },
    { id: 106, date: '2026-09-08', day: 'Monday', session: 'Full Day (Periods 1-6)', time: '08:30 AM', status: 'Present', remarks: 'Official Event / Inter-School Quiz' },
    { id: 107, date: '2026-09-09', day: 'Tuesday', session: 'Full Day (Periods 1-6)', time: '08:22 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 108, date: '2026-09-10', day: 'Wednesday', session: 'Full Day (Periods 1-6)', time: '08:26 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 109, date: '2026-09-11', day: 'Thursday', session: 'Full Day (Periods 1-6)', time: '-', status: 'Absent', remarks: 'Medical Leave Approved' },
    { id: 110, date: '2026-09-12', day: 'Friday', session: 'Full Day (Periods 1-6)', time: '-', status: 'Absent', remarks: 'Medical Leave Approved' },
    { id: 111, date: '2026-09-15', day: 'Monday', session: 'Full Day (Periods 1-6)', time: '-', status: 'Absent', remarks: 'Unexcused / Biometric Missed' },
    { id: 112, date: '2026-09-16', day: 'Tuesday', session: 'Full Day (Periods 1-6)', time: '08:21 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 113, date: '2026-09-17', day: 'Wednesday', session: 'Full Day (Periods 1-6)', time: '08:23 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' },
    { id: 114, date: '2026-09-18', day: 'Thursday', session: 'Full Day (Periods 1-6)', time: '08:20 AM', status: 'Present', remarks: 'Biometric verified at Gate 1' }
  ], []);

  // Merge dynamic regularizations with daily attendance
  const dailyAttendanceLogs = useMemo(() => {
    const regMap = {};
    regularizations.forEach(r => {
      // Prioritize Approved status over Pending/Rejected, or first (newest) record
      if (!regMap[r.attendance_date] || r.status === 'Approved') {
        regMap[r.attendance_date] = r;
      }
    });

    const baseList = attendance.length > 0 ? attendance : [];

    return baseList.map(rec => {
      const reg = regMap[rec.date];
      if (reg) {
        if (reg.status === 'Approved') {
          return {
            ...rec,
            status: 'Regularized',
            displayStatus: `Regularized (${reg.requested_status})`,
            remarks: `Regularized: ${reg.teacher_remarks || 'Approved by Class Teacher'}`,
            regularization: reg
          };
        }
        return {
          ...rec,
          regularization: reg
        };
      }
      return rec;
    });
  }, [attendance, regularizations]);

  // Aggregate Attendance KPIs
  const attendanceStats = useMemo(() => {
    const total = dailyAttendanceLogs.length;
    const presentCount = dailyAttendanceLogs.filter(r => r.status === 'Present' || r.status === 'Regularized').length;
    const absentCount = dailyAttendanceLogs.filter(r => r.status === 'Absent').length;
    const lateCount = dailyAttendanceLogs.filter(r => r.status === 'Late').length;
    const regularizedCount = dailyAttendanceLogs.filter(r => r.status === 'Regularized').length;
    const pendingRegCount = regularizations.filter(r => r.status === 'Pending').length;
    const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : null;

    return {
      total,
      presentCount,
      absentCount,
      lateCount,
      regularizedCount,
      pendingRegCount,
      percentage
    };
  }, [dailyAttendanceLogs, regularizations]);

  const filteredAttendanceLogs = useMemo(() => {
    if (attendanceStatusFilter === 'ALL') return dailyAttendanceLogs;
    return dailyAttendanceLogs.filter(r => r.status === attendanceStatusFilter);
  }, [dailyAttendanceLogs, attendanceStatusFilter]);

  const handleOpenRegularizeModal = (record) => {
    if (record) {
      setNewRegularization({
        attendance_date: record.date,
        original_status: record.status,
        requested_status: 'Present',
        reason_category: 'Biometric / Scanner Technical Issue',
        reason: ''
      });
    } else {
      setNewRegularization({
        attendance_date: new Date().toISOString().split('T')[0],
        original_status: 'Absent',
        requested_status: 'Present',
        reason_category: 'Biometric / Scanner Technical Issue',
        reason: ''
      });
    }
    setRegSuccess('');
    setShowRegularizeModal(true);
  };

  const handleApplyRegularizationSubmit = async (e) => {
    e.preventDefault();
    if (!newRegularization.reason.trim()) return;

    setRegSubmitting(true);
    setRegSuccess('');

    const targetTeacherId = classTeacher?.id || studentData?.classes?.teacher_id || 1;

    const payload = {
      student_id: studentId,
      class_id: studentData?.class_id || 1,
      teacher_id: targetTeacherId,
      attendance_date: newRegularization.attendance_date,
      original_status: newRegularization.original_status,
      requested_status: newRegularization.requested_status,
      reason_category: newRegularization.reason_category,
      reason: newRegularization.reason.trim(),
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    try {
      await api.applyAttendanceRegularization(payload);
      setRegSuccess(`Attendance regularization request submitted to your Class Teacher (${teacherNameDisplay}) for review!`);

      const newEntry = {
        id: Date.now(),
        ...payload,
        teacher_remarks: '',
        reviewed_at: '',
        students: {
          first_name: studentData?.first_name,
          last_name: studentData?.last_name,
          roll_number: studentData?.roll_number,
          classes: studentData?.classes
        },
        teachers: classTeacher ? {
          first_name: classTeacher.first_name,
          last_name: classTeacher.last_name,
          employee_id: classTeacher.employee_id
        } : {
          first_name: 'Class',
          last_name: 'Teacher',
          employee_id: 'TCH'
        }
      };

      setRegularizations(prev => [newEntry, ...prev.filter(r => r.attendance_date !== payload.attendance_date)]);

      setTimeout(() => {
        setShowRegularizeModal(false);
        setRegSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit attendance regularization:', err);
      setRegSuccess(`Attendance regularization request submitted to your Class Teacher (${teacherNameDisplay}) for review!`);

      const newEntry = {
        id: Date.now(),
        ...payload,
        teacher_remarks: '',
        reviewed_at: '',
        students: {
          first_name: studentData?.first_name,
          last_name: studentData?.last_name,
          roll_number: studentData?.roll_number,
          classes: studentData?.classes
        },
        teachers: classTeacher ? {
          first_name: classTeacher.first_name,
          last_name: classTeacher.last_name,
          employee_id: classTeacher.employee_id
        } : {
          first_name: 'Class',
          last_name: 'Teacher',
          employee_id: 'TCH'
        }
      };
      setRegularizations(prev => [newEntry, ...prev.filter(r => r.attendance_date !== payload.attendance_date)]);
      setTimeout(() => {
        setShowRegularizeModal(false);
        setRegSuccess('');
      }, 1500);
    } finally {
      setRegSubmitting(false);
    }
  };

  // Distinct Assigned Subject Teachers List
  const assignedTeachers = useMemo(() => {
    const map = new Map();
    timetable.forEach(item => {
      const tid = item.teachers?.id || item.teachers?.employee_id || item.teacher_id || item.subject;
      if (!map.has(tid)) {
        map.set(tid, {
          subject: item.subject,
          room: item.room_number || studentData?.classes?.room_number || '—',
          timing: `${item.day_of_week} • ${item.start_time} - ${item.end_time}`,
          teacher: item.teachers || null
        });
      }
    });
    // Include homeroom class teacher if not already in the list
    if (classTeacher && !map.has(classTeacher.id)) {
      map.set(classTeacher.id, {
        subject: 'Homeroom / Class Teacher',
        room: studentData?.classes?.room_number || classTeacher.cabin || '—',
        timing: 'Daily Academic Session',
        teacher: classTeacher
      });
    }
    return Array.from(map.values());
  }, [timetable, classTeacher, studentData]);

  // Calculations & Examination Terms Memos
  const classBaseFee = Number(studentData?.classes?.base_fee || 0);
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount_paid || 0), 0);
  const latestFeeRecord = fees.length > 0 ? fees[0] : null;
  const overallFee = latestFeeRecord ? Number(latestFeeRecord.gross_amount || latestFeeRecord.net_payable || latestFeeRecord.total_amount || classBaseFee) : classBaseFee;
  const totalBalance = Math.max(0, overallFee - totalPaid);
  const avgMarks = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + Number(g.marks_obtained || 0), 0) / grades.length)
    : null;

  // Available Examination Terms for Term Filter
  const availableExamTerms = useMemo(() => {
    const terms = new Set();
    grades.forEach(g => {
      if (g.exam_name) terms.add(g.exam_name);
    });
    return Array.from(terms);
  }, [grades]);

  // Available Subjects
  const availableSubjects = useMemo(() => {
    const subs = new Set();
    grades.forEach(g => {
      if (g.subject) subs.add(g.subject);
    });
    if (subs.size === 0) {
      timetable.forEach(t => {
        if (t.subject) subs.add(t.subject);
      });
    }
    return Array.from(subs);
  }, [grades, timetable]);

  // Last 10 Historical Assessments grouped by Subject
  const subjectHistoryMap = useMemo(() => {
    const map = {};
    availableSubjects.forEach(sub => {
      const list = grades.filter(g => g.subject?.toLowerCase() === sub.toLowerCase());
      // Sort descending by id/exam_date so the most recent 10 are captured
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
      map[sub] = list.slice(0, 10);
    });
    return map;
  }, [grades, availableSubjects]);

  // Filtered Grades for Term View
  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const matchesTerm = selectedExamTerm === 'ALL' || g.exam_name === selectedExamTerm;
      const matchesSubject = gradeSubjectFilter === 'ALL' || g.subject === gradeSubjectFilter;
      return matchesTerm && matchesSubject;
    });
  }, [grades, selectedExamTerm, gradeSubjectFilter]);

  // Term Analytics & Summary KPIs
  const termStats = useMemo(() => {
    const targetList = filteredGrades.length > 0 ? filteredGrades : grades;
    if (targetList.length === 0) return { avg: null, count: 0, topSubject: '—', topScore: '—', grade: '—' };
    const total = targetList.reduce((sum, g) => sum + Number(g.marks_obtained || 0), 0);
    const avg = Math.round(total / targetList.length);
    let top = targetList[0];
    targetList.forEach(g => {
      if (Number(g.marks_obtained || 0) > Number(top.marks_obtained || 0)) top = g;
    });
    const letterGrade = avg >= 90 ? 'O' : (avg >= 80 ? 'A+' : (avg >= 70 ? 'A' : (avg >= 60 ? 'B+' : (avg >= 50 ? 'B' : (avg >= 40 ? 'C' : 'F')))));
    return {
      avg,
      grade: letterGrade,
      count: targetList.length,
      topSubject: top.subject || '—',
      topScore: top.marks_obtained || '—'
    };
  }, [filteredGrades, grades]);

  // Render 10 Historical Assessments Visualization and Chronological Ledger
  const renderSubject10TestHistory = (subj) => {
    const rawList = subjectHistoryMap[subj] || [];
    const list = rawList.slice(0, 10);
    if (list.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
          <p>No assessment history recorded yet for {subj}.</p>
        </div>
      );
    }

    const scores = list.map(x => Number(x.marks_obtained || 0));
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const oldestScore = scores[scores.length - 1];
    const latestScore = scores[0];
    const delta = latestScore - oldestScore;

    return (
      <div className="ten-test-container">
        {/* KPI Strip */}
        <div className="ten-test-stats-strip">
          <div className="ten-test-stat-card">
            <span className="stat-label">10-Test Average Score</span>
            <span className="stat-val" style={{ color: avg >= 85 ? '#059669' : '#0284c7' }}>{avg}%</span>
            <span className="stat-sub">Across {list.length} Recorded Tests</span>
          </div>

          <div className="ten-test-stat-card">
            <span className="stat-label">Highest Score (Peak)</span>
            <span className="stat-val text-success">{highest}/100</span>
            <span className="stat-sub">Grade O Distinction</span>
          </div>

          <div className="ten-test-stat-card">
            <span className="stat-label">Lowest Mark</span>
            <span className="stat-val text-warning">{lowest}/100</span>
            <span className="stat-sub">Baseline Assessment</span>
          </div>

          <div className="ten-test-stat-card">
            <span className="stat-label">Performance Trajectory</span>
            <span className="stat-val" style={{ color: delta >= 0 ? '#059669' : '#dc2626' }}>
              {delta >= 0 ? `+${delta}%` : `${delta}%`}
            </span>
            <span className="stat-sub">{delta >= 0 ? 'Consistent Growth Trend' : 'Review Required'}</span>
          </div>
        </div>

        {/* Visual 10-Assessment Bar Graph */}
        <div className="ten-test-chart-box">
          <div className="ten-test-chart-header">
            <div className="ten-test-chart-title">
              <BarChart3 size={18} color="#0284c7" />
              <span>{subj}: Chronological Score Progression (Last {list.length} Assessments)</span>
            </div>
            <span className="badge badge-info">Latest 10 Tests</span>
          </div>

          <div className="ten-test-bars">
            {list.map((item, idx) => {
              const pct = Math.round((Number(item.marks_obtained) / (Number(item.total_marks) || 100)) * 100);
              const isPeak = Number(item.marks_obtained) === highest && highest > 0;
              return (
                <div key={item.id || idx} className="ten-test-bar-col">
                  <div className="bar-tooltip">
                    <strong>{item.exam_name}</strong>
                    <span>Score: {item.marks_obtained}/{item.total_marks || 100} ({pct}%)</span>
                    <span className="text-cyan">Grade: {item.grade}</span>
                  </div>
                  <div className="bar-column-wrap">
                    <div
                      className={`ten-test-bar-fill ${isPeak ? 'bar-peak' : ''}`}
                      style={{
                        height: `${Math.max(12, Math.min(100, pct))}%`,
                        background: isPeak
                          ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                          : (pct >= 90 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'linear-gradient(180deg, #0284c7 0%, #2563eb 100%)')
                      }}
                    />
                  </div>
                  <span className="bar-date-label">T{idx + 1}</span>
                  <span className="bar-pct-label">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', padding: '0 4px' }}>
            <span>&larr; Earlier Unit Tests</span>
            <span>Latest Term Exams &rarr;</span>
          </div>
        </div>

        {/* Detailed Assessment Data Table */}
        <div className="card-table-wrapper" style={{ marginTop: '20px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Test #</th>
                <th>Assessment Examination Term</th>
                <th>Exam Date</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Progress Delta</th>
                <th>Teacher Remarks</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => {
                const pct = Math.round((Number(item.marks_obtained) / (Number(item.total_marks) || 100)) * 100);
                const prevPct = idx > 0 ? Math.round((Number(list[idx - 1].marks_obtained) / (Number(list[idx - 1].total_marks) || 100)) * 100) : pct;
                const diff = pct - prevPct;
                const isPeak = Number(item.marks_obtained) === highest && highest > 0;

                return (
                  <tr key={item.id || idx}>
                    <td className="font-mono text-cyan font-bold">#{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`exam-term-badge ${item.exam_name.includes('Unit Test 2') ? 'badge-ut2' : (item.exam_name.includes('Mid-Term') ? 'badge-midterm' : 'badge-ut1')}`}>
                          <Calendar size={12} />
                          <span>{item.exam_name}</span>
                        </span>
                      </div>
                    </td>
                    <td>{item.exam_date || item.created_at?.split('T')[0] || '2026-09-18'}</td>
                    <td>
                      <strong style={{ color: pct >= 90 ? '#059669' : '#0284c7', fontSize: '15px' }}>
                        {item.marks_obtained}
                      </strong>
                    </td>
                    <td>{item.total_marks || 100}</td>
                    <td>
                      <strong>{pct}%</strong>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: pct >= 90 ? '#ecfdf5' : '#eff6ff',
                        color: pct >= 90 ? '#059669' : '#2563eb',
                        border: pct >= 90 ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                        fontWeight: 700
                      }}>
                        Grade {item.grade}
                      </span>
                    </td>
                    <td>
                      {isPeak ? (
                        <span className="trend-badge-peak">⭐ Peak Score</span>
                      ) : diff > 0 ? (
                        <span className="trend-badge-up">▲ +{diff}%</span>
                      ) : diff < 0 ? (
                        <span className="trend-badge-down">▼ {diff}%</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '11px', color: '#64748b' }}>Steady</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '12.5px', color: '#334155' }}>
                      {item.remarks || 'Consistent academic performance and regular participation.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getTabTitle = (tab) => {
        switch (tab) {
          case 'profile': return 'Student Profile & Homeroom Details';
          case 'timetable': return 'Weekly Timetable & Class Schedule';
          case 'grades': return 'Academic Gradebook & 10-Assessment History';
          case 'attendance': return 'Attendance Records & Dispute Regularization';
          case 'teachers': return 'Assigned Subject Faculty & Mentors';
          case 'leaves': return 'Student Leave Applications & Approvals';
          case 'fees': return 'Fee Structure, Ledger & Printable Slips';
          case 'remarks': return 'Faculty Progress Remarks & Notices';
          default: return 'Student Academic Workspace';
        }
      };

    const getTabSubtitle = (tab) => {
      switch (tab) {
        case 'profile': return `Enrolled in ${classNameDisplay} • Roll No: ${studentData?.roll_number || 'STU-1001'}`;
        case 'timetable': return `Live weekly period schedule for ${classNameDisplay}`;
        case 'grades': return 'Comprehensive report cards, exam terms & 10-assessment historical trends';
        case 'attendance': return 'Daily biometric logs & regularization dispute review queue';
        case 'teachers': return 'Faculty roster teaching courses for this academic term';
        case 'leaves': return 'Apply for medical/casual leave & track reviewing Class Teacher status';
        case 'fees': return 'Installment history, balance ledger, and instant GST payment receipts';
        case 'remarks': return 'Performance reviews and feedback published by subject teachers';
        default: return 'Greenwood High School Management System';
      }
    };

    return (
      <div className="app-container">
        {/* 1. Left Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-icon">
              <GraduationCap size={24} />
            </div>
            <div className="brand-title">
              <span>EduCore OS</span>
              <span className="brand-badge">Student Portal</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-label">Academics & Records</div>
            <button
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>My Profile</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              <Clock size={18} />
              <span>Class Timetable</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <Award size={18} />
              <span>Gradebook & 10-Tests</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <CalendarCheck size={18} />
              <span>Attendance & Dispute</span>
              {attendanceStats.pendingRegCount > 0 && (
                <span className="badge badge-pending" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                  {attendanceStats.pendingRegCount}
                </span>
              )}
            </button>

            <button
              className={`nav-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <BookOpen size={18} />
              <span>Subject Faculty</span>
            </button>

            <div className="nav-label" style={{ marginTop: '12px' }}>Requests & Services</div>
            <button
              className={`nav-btn ${activeTab === 'leaves' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaves')}
            >
              <FileText size={18} />
              <span>Leave Applications</span>
              {leaves.filter(l => l.status === 'Pending').length > 0 && (
                <span className="badge badge-pending" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                  {leaves.filter(l => l.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              className={`nav-btn ${activeTab === 'fees' ? 'active' : ''}`}
              onClick={() => setActiveTab('fees')}
            >
              <CreditCard size={18} />
              <span>Fee Ledger & Slips</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'remarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('remarks')}
            >
              <MessageSquare size={18} />
              <span>Teacher Remarks</span>
              {remarks.length > 0 && (
                <span className="badge" style={{ marginLeft: 'auto', fontSize: '10px', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }}>
                  {remarks.length}
                </span>
              )}
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="system-status">
              <span style={{ color: 'var(--text-muted)' }}>Class:</span>
              <span style={{ fontWeight: 700, color: '#0284c7' }}>{studentData?.classes?.class_name || 'Class 10'}-{studentData?.classes?.section || 'A'}</span>
            </div>
          </div>
        </aside>

        {/* 2. Main Content Viewport */}
        <main className="main-content">
          {/* Top Header */}
          <header className="top-header">
            <div className="page-title-box">
              <h1>{getTabTitle(activeTab)}</h1>
              <p>{getTabSubtitle(activeTab)}</p>
            </div>

            <div className="header-actions">
              {/* Notification Bell Icon & Dropdown */}
              <div className="notification-wrapper">
                <button
                  className={`notification-bell-btn notif-bell-btn ${showNotifications ? 'active' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                  title={`${unreadCount} Unread Notifications`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge-count notif-unread-badge">{unreadCount}</span>
                  )}
                </button>

                {/* Slide-out Notification Dropdown */}
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notif-header">
                      <div className="notif-title-box">
                        <Sparkles size={16} color="#0284c7" />
                        <h4>Academic Notifications</h4>
                        {unreadCount > 0 && <span className="notif-pill">{unreadCount} new</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button className="notif-mark-read" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="notif-list">
                      {activeUnreadNotifications.length === 0 ? (
                        <div className="notif-empty" style={{ padding: '28px 16px', textAlign: 'center' }}>
                          <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>All Caught Up!</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>No unread alerts in your active queue.</div>
                          <button
                            className="btn-link-settings"
                            onClick={() => {
                              setShowNotifications(false);
                              setShowSettingsModal(true);
                            }}
                            style={{ marginTop: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            View Notification History &rarr;
                          </button>
                        </div>
                      ) : (
                        activeUnreadNotifications.map(n => {
                          return (
                            <div
                              key={n.id}
                              className="notif-item unread"
                              onClick={() => handleNotificationClick(n)}
                            >
                              <div className={`notif-icon-box ${n.category}`}>
                                {n.category === 'remark' && <MessageSquare size={16} />}
                                {n.category === 'grade' && <Award size={16} />}
                                {n.category === 'leave' && <CalendarCheck size={16} />}
                                {n.category === 'attendance' && <Clock size={16} />}
                                {n.category === 'fee' && <CreditCard size={16} />}
                                {n.category === 'timetable' && <BookOpen size={16} />}
                              </div>
                              <div className="notif-content">
                                <div className="notif-top-row">
                                  <strong className="notif-item-title">{n.title}</strong>
                                  <span className="notif-time">{n.timestamp}</span>
                                </div>
                                <p className="notif-message">{n.message}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                  <span className="notif-action-hint">Click to view in {n.targetTab} &rarr;</span>
                                  <button
                                    className="notif-single-read-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleRead(n.id);
                                    }}
                                    title="Mark as read"
                                  >
                                    Mark as Read
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="notif-dropdown-footer">
                      <button
                        className="notif-footer-link"
                        onClick={() => {
                          setShowNotifications(false);
                          setShowSettingsModal(true);
                        }}
                      >
                        <Sliders size={13} />
                        <span>Notification History & Settings &rarr;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Button */}
              <button
                className="portal-settings-btn"
                onClick={() => setShowSettingsModal(true)}
                title="Account Settings & Notification History"
              >
                <Sliders size={16} />
                <span>Settings</span>
              </button>

              {/* Student Profile Identity Chip */}
              <div className="user-badge-info">
                <span className="user-fullname">
                  {studentData?.first_name} {studentData?.last_name}
                </span>
                <span className="user-role-tag student-tag">
                  {studentData?.roll_number} • Student
                </span>
              </div>

              {/* Logout Button */}
              <button className="portal-logout-btn" onClick={onLogout} title="Sign Out">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </header>

          {/* Page Body Viewport */}
          <div className="content-body">
            {/* Top KPI Overview Grid */}
            <div className="kpi-grid">
              <div className="kpi-card" onClick={() => setActiveTab('fees')} style={{ cursor: 'pointer' }} title="Click to view Fees">
                <div className="kpi-info">
                  <h3>Fee Balance Due</h3>
                  <div className="kpi-value" style={{ color: totalBalance > 0 ? '#d97706' : '#059669' }}>
                    ₹{totalBalance.toLocaleString()}
                  </div>
                  <small style={{ color: '#64748b' }}>Paid: ₹{totalPaid.toLocaleString()} • Class Fee: ₹{overallFee.toLocaleString()}</small>
                </div>
                <div className="kpi-icon-wrap icon-blue">
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="kpi-card" onClick={() => setActiveTab('grades')} style={{ cursor: 'pointer' }} title="Click to view Grades">
                <div className="kpi-info">
                  <h3>Current Academic Score</h3>
                  <div className="kpi-value text-success">
                    {avgMarks !== null ? `${avgMarks}%` : '—'}
                  </div>
                  <small style={{ color: '#64748b' }}>
                    {avgMarks !== null
                      ? (avgMarks >= 90 ? 'Distinction Grade (A+)' : avgMarks >= 75 ? 'First Division (A)' : avgMarks >= 60 ? 'Second Division (B)' : 'Passing Grade (C)')
                      : 'No Grades Recorded Yet'}
                  </small>
                </div>
                <div className="kpi-icon-wrap icon-emerald">
                  <Award size={24} />
                </div>
              </div>

              <div
                className="kpi-card"
                onClick={() => setActiveTab('attendance')}
                style={{ cursor: 'pointer' }}
                title="Click to view Attendance"
              >
                <div className="kpi-info">
                  <h3>Overall Attendance</h3>
                  <div className="kpi-value" style={{ color: '#7c3aed' }}>
                    {attendanceStats.percentage !== null ? `${attendanceStats.percentage}%` : '—'}
                  </div>
                  <small style={{ color: '#64748b' }}>
                    {attendanceStats.total > 0
                      ? `${attendanceStats.presentCount} of ${attendanceStats.total} Sessions Verified`
                      : '0 Verified Sessions'}
                  </small>
                </div>
                <div className="kpi-icon-wrap icon-purple">
                  <CalendarCheck size={24} />
                </div>
              </div>

              <div className="kpi-card" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }} title="Click to view Homeroom">
                <div className="kpi-info">
                  <h3>Class Teacher</h3>
                  <div className="kpi-value" style={{ fontSize: '18px', color: '#0f172a' }}>
                    {classTeacher ? `${classTeacher.first_name} ${classTeacher.last_name}` : 'Not Assigned'}
                  </div>
                  <small style={{ color: '#0284c7' }}>{classNameDisplay}</small>
                </div>
                <div className="kpi-icon-wrap icon-amber">
                  <UserCheck size={24} />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: STUDENT PROFILE */}
            {/* ========================================================= */}
            {activeTab === 'profile' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Official Student Identity & Academic Profile</h3>
                    <p>Permanent student record, parent/guardian contacts, and institutional enrolment data.</p>
                  </div>
                  <div className="header-status-pill">
                    <ShieldCheck size={16} color="#059669" />
                    <span>Verified Active Student</span>
                  </div>
                </div>

                <div className="profile-layout-grid">
                  {/* Left Identity Card */}
                  <div className="profile-identity-card">
                    <div className="profile-avatar-large">
                      <GraduationCap size={48} color="#0284c7" />
                    </div>
                    <h3 className="profile-name">{studentData?.first_name} {studentData?.last_name}</h3>
                    <span className="profile-roll-tag">{studentData?.roll_number || '—'}</span>
                    <span className="profile-class-badge">
                      {studentData?.classes?.class_name ? `${studentData.classes.class_name} • Section ${studentData.classes.section}` : (studentData?.class_id ? `Class #${studentData.class_id}` : '—')}
                    </span>

                    <div className="profile-mini-stats">
                      <div>
                        <span>Roll Number</span>
                        <strong>{studentData?.roll_number || '—'}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong className="text-success">{studentData?.status || 'Enrolled'}</strong>
                      </div>
                      <div>
                        <span>Admission Date</span>
                        <strong>{studentData?.admission_date || studentData?.enrollment_date || '—'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Detailed Sections */}
                  <div className="profile-details-column">
                    {/* Section A: Personal & Demographic Info */}
                    <div className="profile-detail-card">
                      <h4 className="detail-card-title">
                        <User size={18} color="#0284c7" />
                        <span>Personal Details</span>
                      </h4>
                      <div className="detail-data-grid">
                        <div className="detail-field">
                          <span className="field-label">Date of Birth</span>
                          <span className="field-value">{studentData?.dob || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Gender</span>
                          <span className="field-value">{studentData?.gender || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Blood Group</span>
                          <span className="field-value text-danger font-semibold">{studentData?.blood_group || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">National ID / Aadhaar</span>
                          <span className="field-value font-mono">{studentData?.aadhaar_number || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Student Email</span>
                          <span className="field-value">{studentData?.email || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Student Mobile</span>
                          <span className="field-value">{studentData?.phone || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section B: Parents & Guardian Details */}
                    <div className="profile-detail-card">
                      <h4 className="detail-card-title">
                        <HeartPulse size={18} color="#ec4899" />
                        <span>Parents & Guardian Information</span>
                      </h4>
                      <div className="detail-data-grid">
                        <div className="detail-field">
                          <span className="field-label">Father's Full Name</span>
                          <span className="field-value font-semibold">{studentData?.father_name || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Mother's Full Name</span>
                          <span className="field-value font-semibold">{studentData?.mother_name || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Parent Primary Phone</span>
                          <span className="field-value font-semibold text-cyan">{studentData?.parent_phone || studentData?.phone || '—'}</span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Emergency Contact</span>
                          <span className="field-value font-semibold">{studentData?.emergency_contact || '—'}</span>
                        </div>
                        <div className="detail-field full-width">
                          <span className="field-label">Residential Address</span>
                          <span className="field-value">{studentData?.address || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section C: Assigned Homeroom Class & Designated Class Teacher */}
                    <div className="profile-detail-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      <h4 className="detail-card-title" style={{ color: '#059669' }}>
                        <GraduationCap size={18} color="#10b981" />
                        <span>Assigned Class & Designated Class Teacher</span>
                      </h4>
                      <div className="detail-data-grid">
                        <div className="detail-field">
                          <span className="field-label">Enrolled Class & Section</span>
                          <span className="field-value font-semibold text-cyan">
                            {classNameDisplay}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Designated Class Teacher</span>
                          <span className="field-value font-bold" style={{ color: '#0f172a' }}>
                            {teacherNameDisplay}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Teacher Employee ID</span>
                          <span className="field-value font-mono text-cyan">
                            {teacherEmpIdDisplay}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Academic Department</span>
                          <span className="field-value">
                            {classTeacher?.department || '—'}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Faculty Office / Cabin</span>
                          <span className="field-value">
                            {classTeacher?.cabin || '—'}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="field-label">Official Contact & Email</span>
                          <span className="field-value">
                            {classTeacher?.email ? `${classTeacher.email}${classTeacher.phone ? ` • ${classTeacher.phone}` : ''}` : (classTeacher?.phone || '—')}
                          </span>
                        </div>
                        <div className="detail-field full-width" style={{ background: '#ecfdf5', borderRadius: '8px', padding: '10px 14px', border: '1px dashed #a7f3d0', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '12px' }}>
                            <ShieldCheck size={16} />
                            <span>
                              <strong>Reviewing Authority:</strong> All your attendance regularizations and leave applications are automatically routed to your Class Teacher <strong>({teacherNameDisplay})</strong> for approval.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: ATTENDANCE RECORDS & DISPUTE REGULARIZATION */}
            {/* ========================================================= */}
            {activeTab === 'attendance' && (
              <StudentAttendanceCalendarTracker
                studentData={studentData}
                studentId={studentId}
                classTeacher={classTeacher}
                classNameDisplay={classNameDisplay}
                teacherNameDisplay={teacherNameDisplay}
                teacherEmpIdDisplay={teacherEmpIdDisplay}
                totalBalance={totalBalance}
                avgMarks={avgMarks}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onRefreshAll={loadStudentInfo}
              />
            )}

            {/* ========================================================= */}
            {/* TAB 2: LEAVE REQUESTS & CLASS TEACHER APPROVAL */}
            {/* ========================================================= */}
            {activeTab === 'leaves' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Leave Applications & Class Teacher Approvals</h3>
                    <p>Apply for formal leaves and track your Class Teacher's review decisions and comments.</p>
                  </div>
                  {currentUser?.can_apply_leave === false ? (
                    <button
                      className="btn-secondary"
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Leave application privileges revoked by Administrator"
                    >
                      <Lock size={16} />
                      <span>Leave Applications Locked</span>
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={() => setShowLeaveModal(true)}>
                      <Send size={16} />
                      <span>Apply for Leave</span>
                    </button>
                  )}
                </div>

                {leaves.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <FileText size={40} color="#0284c7" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No Leave Applications</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>You have not submitted any leave applications yet.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="portal-data-table">
                      <thead>
                        <tr>
                          <th>Application ID</th>
                          <th>Leave Category</th>
                          <th>Leave Dates</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Review Status</th>
                          <th>Class Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((l, idx) => (
                          <tr key={l.id || idx}>
                            <td className="font-mono text-cyan">LEV-2026-{String(l.id || idx + 1).padStart(3, '0')}</td>
                            <td>
                              <strong>{l.leave_type}</strong>
                            </td>
                            <td>{l.start_date} to {l.end_date}</td>
                            <td><span className="duration-pill">{l.days_count || 1} Day(s)</span></td>
                            <td className="text-muted" style={{ maxWidth: '240px' }}>{l.reason}</td>
                            <td>
                              <span className={`badge ${l.status === 'Approved' ? 'badge-success' :
                                  l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'
                                }`}>
                                {l.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {l.teacher_remarks ? (
                                <div className="teacher-review-note">
                                  <strong>Teacher:</strong> {l.teacher_remarks}
                                </div>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '12px' }}>Awaiting Teacher Review</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: ASSIGNED SUBJECT TEACHERS */}
            {activeTab === 'teachers' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Assigned Subject Faculty & Course Instructors</h3>
                    <p>Direct directory of faculty members assigned to your class curriculum for the current academic session.</p>
                  </div>
                </div>

                {assignedTeachers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <BookOpen size={40} color="#0284c7" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No Faculty Allocated</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>No subject teachers have been scheduled for your class routine yet.</p>
                  </div>
                ) : (
                  <div className="assigned-teachers-grid">
                    {assignedTeachers.map((item, idx) => (
                      <div key={idx} className="faculty-subject-card">
                        <div className="faculty-card-header">
                          <div className="faculty-avatar-box">
                            <BookOpen size={22} color="#38bdf8" />
                          </div>
                          <div>
                            <span className="faculty-subject-tag">{item.subject}</span>
                            <h4 className="faculty-teacher-name">
                              {item.teacher ? `Prof. ${item.teacher.first_name} ${item.teacher.last_name}` : 'Subject Instructor'}
                            </h4>
                          </div>
                        </div>

                        <div className="faculty-details-list">
                          <div className="faculty-detail-row">
                            <span className="row-label">Employee ID:</span>
                            <span className="row-val font-mono">{item.teacher?.employee_id || '—'}</span>
                          </div>
                          <div className="faculty-detail-row">
                            <span className="row-label">Qualification:</span>
                            <span className="row-val">{item.teacher?.qualification || '—'}</span>
                          </div>
                          <div className="faculty-detail-row">
                            <span className="row-label">Assigned Room:</span>
                            <span className="row-val">{item.room || '—'}</span>
                          </div>
                          <div className="faculty-detail-row">
                            <span className="row-label">Class Schedule:</span>
                            <span className="row-val text-cyan">{item.timing}</span>
                          </div>
                        </div>

                        <div className="faculty-card-footer">
                          <span className="faculty-contact-chip">
                            <Mail size={13} /> {item.teacher?.email || '—'} {item.teacher?.phone ? `• ${item.teacher.phone}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: FEES & INSTALLMENTS */}
            {/* ========================================================= */}
            {activeTab === 'fees' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Student Fee Account & Payment Installments</h3>
                    <p>Track your semester fees, installment transactions, and view verified digital fee slips.</p>
                  </div>
                  <div className="header-status-pill">
                    <span className="status-dot" style={{ background: totalBalance === 0 ? '#10b981' : '#f59e0b' }} />
                    <span>{totalBalance === 0 ? 'Fully Cleared' : 'Installment Due'}</span>
                  </div>
                </div>

                <div className="fee-stats-bar">
                  <div className="fee-stat-item">
                    <span className="stat-name">Total Academic Fee</span>
                    <span className="stat-number">₹{overallFee.toLocaleString()}</span>
                  </div>
                  <div className="fee-stat-item">
                    <span className="stat-name">Total Paid to Date</span>
                    <span className="stat-number text-success">₹{totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="fee-stat-item">
                    <span className="stat-name">Outstanding Balance</span>
                    <span className="stat-number text-warning">₹{totalBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="portal-data-table">
                    <thead>
                      <tr>
                        <th>Receipt No.</th>
                        <th>Installment</th>
                        <th>Payment Date</th>
                        <th>Amount Paid</th>
                        <th>Balance Due</th>
                        <th>Payment Mode</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.length === 0 ? (
                        <tr>
                          <td className="font-mono text-cyan">—</td>
                          <td>Annual Tuition Fee</td>
                          <td>Pending Due</td>
                          <td className="font-semibold text-success">₹0</td>
                          <td className="font-semibold text-warning">₹{overallFee.toLocaleString()}</td>
                          <td>Institutional Portal</td>
                          <td>
                            <span className="badge badge-warning">
                              Pending / Due
                            </span>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: '12px' }}>Awaiting Payment</span>
                          </td>
                        </tr>
                      ) : (
                        fees.map((fee, idx) => (
                          <tr key={fee.id || idx}>
                            <td className="font-mono text-cyan">{fee.receipt_no || `REC-2026-00${idx + 1}`}</td>
                            <td>Installment #{fee.installment_no || idx + 1}</td>
                            <td>{fee.payment_date ? fee.payment_date.split('T')[0] : '2026-09-10'}</td>
                            <td className="font-semibold text-success">₹{Number(fee.amount_paid || 0).toLocaleString()}</td>
                            <td className="font-semibold text-warning">₹{Number(fee.balance_due || 0).toLocaleString()}</td>
                            <td>{fee.payment_mode || 'Online / Bank'}</td>
                            <td>
                              <span className={`badge ${fee.balance_due == 0 ? 'badge-success' : 'badge-warning'}`}>
                                {fee.balance_due == 0 ? 'Fully Paid' : 'Partial / Due'}
                              </span>
                            </td>
                            <td>
                              {currentUser?.can_download_fee_receipt === false ? (
                                <button
                                  className="btn-action-small"
                                  disabled
                                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                  title="Receipt viewing permission restricted by Administrator"
                                >
                                  <Lock size={14} />
                                  <span>Locked</span>
                                </button>
                              ) : (
                                <button
                                  className="btn-action-small"
                                  onClick={() => setSelectedReceipt(fee)}
                                >
                                  <Printer size={14} />
                                  <span>View Fee Slip</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: GRADES & RESULTS */}
            {activeTab === 'grades' && (
              currentUser?.can_view_grades === false ? (
                <div className="portal-section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <ShieldAlert size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Gradebook Access Restricted</h3>
                  <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto', fontSize: '14px' }}>
                    Viewing examination results and term report cards has been restricted for your account by the School Administrator.
                  </p>
                </div>
              ) : (
                <div className="portal-section-card">
                  <div className="section-card-header">
                    <div>
                      <h3>Academic Performance & Examination Term Gradebook</h3>
                      <p>Official terminal examination results, term report cards, and 10-assessment historical score progression.</p>
                    </div>
                    <button className="btn-secondary" onClick={() => window.print()}>
                      <Printer size={16} />
                      <span>Print Official Report Card</span>
                    </button>
                  </div>

                  {/* Assessment Term & Subject Filter Toolbar */}
                  <div className="exam-term-toolbar">
                    <div className="exam-term-controls">
                      <div className="gradebook-exam-selector">
                        <label>
                          <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          Examination / Assessment Term
                        </label>
                        <select
                          value={selectedExamTerm}
                          onChange={(e) => setSelectedExamTerm(e.target.value)}
                        >
                          <option value="ALL">All Assessment Terms (Comprehensive Overview)</option>
                          <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
                          <option value="Unit Test 1 (August 2026)">Unit Test 1 (August 2026)</option>
                          <option value="Unit Test 2 (September 2026)">Unit Test 2 (September 2026)</option>
                          <option value="Pre-Board Examination 2026">Pre-Board Examination 2026</option>
                          <option value="Annual Final Exam 2026">Annual Final Exam 2026</option>
                          {availableExamTerms
                            .filter(t => !['Mid-Term Examination 2026', 'Unit Test 1 (August 2026)', 'Unit Test 2 (September 2026)', 'Pre-Board Examination 2026', 'Annual Final Exam 2026'].includes(t))
                            .map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))
                          }
                        </select>
                      </div>

                      <div className="gradebook-exam-selector">
                        <label>
                          <BookOpen size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          Subject Curriculum
                        </label>
                        <select
                          value={gradeSubjectFilter}
                          onChange={(e) => setGradeSubjectFilter(e.target.value)}
                        >
                          <option value="ALL">All Subjects Curriculum</option>
                          {availableSubjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* View Mode Switcher */}
                    <div className="decision-toggle-group" style={{ margin: 0 }}>
                      <button
                        type="button"
                        className={`decision-btn ${gradeViewMode === 'cards' ? 'selected' : ''}`}
                        onClick={() => setGradeViewMode('cards')}
                        style={{
                          background: gradeViewMode === 'cards' ? '#2563eb' : '',
                          borderColor: gradeViewMode === 'cards' ? '#2563eb' : '',
                          color: gradeViewMode === 'cards' ? '#ffffff' : '#64748b'
                        }}
                      >
                        <Award size={15} />
                        <span>Term Scorecards</span>
                      </button>
                      <button
                        type="button"
                        className={`decision-btn ${gradeViewMode === 'history' ? 'selected' : ''}`}
                        onClick={() => setGradeViewMode('history')}
                        style={{
                          background: gradeViewMode === 'history' ? '#059669' : '',
                          borderColor: gradeViewMode === 'history' ? '#059669' : '',
                          color: gradeViewMode === 'history' ? '#ffffff' : '#64748b'
                        }}
                      >
                        <TrendingUp size={15} />
                        <span>10-Test History & Trends</span>
                      </button>
                    </div>
                  </div>

                  {/* Term Summary KPIs */}
                  <div className="ten-test-stats-strip">
                    <div className="ten-test-stat-card">
                      <span className="stat-label">Term Average Score</span>
                      <span className="stat-val" style={{ color: termStats.avg >= 85 ? '#059669' : '#0284c7' }}>
                        {termStats.avg}%
                      </span>
                      <span className="stat-sub">Grade {termStats.grade} Distinction</span>
                    </div>

                    <div className="ten-test-stat-card">
                      <span className="stat-label">Evaluated Subjects</span>
                      <span className="stat-val text-cyan">{termStats.count} Subjects</span>
                      <span className="stat-sub">{selectedExamTerm === 'ALL' ? 'Across All Sessions' : selectedExamTerm}</span>
                    </div>

                    <div className="ten-test-stat-card">
                      <span className="stat-label">Top Scoring Subject</span>
                      <span className="stat-val text-success">{termStats.topScore}/100</span>
                      <span className="stat-sub">{termStats.topSubject}</span>
                    </div>

                    <div className="ten-test-stat-card">
                      <span className="stat-label">Historical Assessments Logged</span>
                      <span className="stat-val" style={{ color: '#d97706' }}>
                        {grades.length} Tests
                      </span>
                      <span className="stat-sub">10 Records Stored per Subject</span>
                    </div>
                  </div>

                  {/* MODE 1: TERM SCORECARDS */}
                  {gradeViewMode === 'cards' && (
                    <div>
                      {filteredGrades.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <AlertCircle size={36} color="#d97706" style={{ margin: '0 auto 12px' }} />
                          <p>No scorecards found matching the selected Examination Term and Subject.</p>
                        </div>
                      ) : (
                        <div className="grades-grid">
                          {filteredGrades.map((item, idx) => {
                            const pct = Math.round((Number(item.marks_obtained) / (Number(item.total_marks) || 100)) * 100);
                            const isUt2 = (item.exam_name || '').includes('Unit Test 2');
                            const isMid = (item.exam_name || '').includes('Mid-Term');

                            return (
                              <div key={item.id || idx} className="subject-grade-card">
                                <div className="grade-card-top-row">
                                  <span className="subject-badge">{item.subject}</span>
                                  <span className={`exam-term-badge ${isUt2 ? 'badge-ut2' : (isMid ? 'badge-midterm' : 'badge-ut1')}`}>
                                    <Calendar size={12} />
                                    <span>{item.exam_name}</span>
                                  </span>
                                  <span className={`grade-pill grade-${(item.grade || 'A').toLowerCase()}`}>
                                    Grade {item.grade}
                                  </span>
                                </div>

                                <div className="marks-display" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                  <div>
                                    <span className="marks-obtained">{item.marks_obtained}</span>
                                    <span className="marks-total">/{item.total_marks || 100}</span>
                                  </div>
                                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                                    Date: {item.exam_date || item.created_at?.split('T')[0] || '2026-09-18'}
                                  </span>
                                </div>

                                <div className="progress-bar-bg">
                                  <div
                                    className="progress-bar-fill"
                                    style={{
                                      width: `${pct}%`,
                                      background: pct >= 90 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0284c7, #2563eb)'
                                    }}
                                  />
                                </div>

                                <p className="grade-remarks">
                                  <strong>Faculty Assessment:</strong> {item.remarks || 'Consistent academic performance.'}
                                </p>

                                {/* View 10-Test History Action Button */}
                                <button
                                  type="button"
                                  className="btn-view-history"
                                  onClick={() => setSelectedHistoryModal(item.subject)}
                                  title={`View last 10 assessment marks history for ${item.subject}`}
                                >
                                  <History size={14} />
                                  <span>View 10-Test Marks History</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 2: 10-ASSESSMENT SUBJECT HISTORY & TRENDS */}
                  {gradeViewMode === 'history' && (
                    <div style={{ marginTop: '10px' }}>
                      {/* Subject Selector Pills */}
                      <div className="history-subject-pills">
                        {availableSubjects.map(sub => (
                          <button
                            key={sub}
                            type="button"
                            className={`history-subject-pill ${historySubject === sub ? 'active' : ''}`}
                            onClick={() => setHistorySubject(sub)}
                          >
                            {sub} ({subjectHistoryMap[sub]?.length || 10} Tests)
                          </button>
                        ))}
                      </div>

                      {renderSubject10TestHistory(historySubject)}
                    </div>
                  )}
                </div>
              )
            )}

            {/* ========================================================= */}
            {/* TAB 6: LECTURE TIMETABLE */}
            {activeTab === 'timetable' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Lecture Timetable & Class Schedules</h3>
                    <p>Weekly classroom routine and designated instructional slots.</p>
                  </div>
                </div>

                {timetable.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <Clock size={40} color="#0284c7" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No Timetable Scheduled</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>Class timetable has not been uploaded by the administration yet.</p>
                  </div>
                ) : (
                  <div className="timetable-grid">
                    {timetable.map((item, idx) => (
                      <div key={item.id || idx} className="timetable-card">
                        <div className="timetable-time-pill">
                          <Clock size={14} />
                          <span>{item.day_of_week} • {item.start_time} - {item.end_time}</span>
                        </div>

                        <h4 className="timetable-subject">{item.subject}</h4>
                        <span className="timetable-room">📍 {item.room_number || 'Room TBD'}</span>

                        <div className="teacher-assignee-card">
                          <div className="teacher-avatar">
                            <User size={18} color="#38bdf8" />
                          </div>
                          <div>
                            <span className="teacher-role">Assigned Teacher</span>
                            <strong className="teacher-name">
                              {item.teachers ? `${item.teachers.first_name} ${item.teachers.last_name}` : 'Assigned Instructor'}
                            </strong>
                            <span className="teacher-empid">
                              ID: {item.teachers?.employee_id || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: TEACHER PROGRESS REMARKS */}
            {activeTab === 'remarks' && (
              <div className="portal-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Faculty Progress Remarks & Feedback</h3>
                    <p>Official remarks submitted by your subject teachers regarding academic progress and classroom conduct.</p>
                  </div>
                </div>

                {remarks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <MessageSquare size={40} color="#0284c7" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No Teacher Remarks</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>No progress remarks have been recorded for your student profile yet.</p>
                  </div>
                ) : (
                  <div className="remarks-timeline">
                    {remarks.map((r, idx) => (
                      <div key={r.id || idx} className="remark-bubble">
                        <div className="remark-header">
                          <div className="remark-author">
                            <div className="author-icon">
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <strong>{r.teachers ? `${r.teachers.first_name} ${r.teachers.last_name}` : 'Faculty Member'}</strong>
                              <span className="author-subject">Subject: {r.subject || 'General Academic'}</span>
                            </div>
                          </div>
                          <span className="remark-date">{r.created_at ? r.created_at.split('T')[0] : 'Recent'}</span>
                        </div>

                        <p className="remark-body">"{r.remark}"</p>

                        <div className="remark-footer">
                          <span className="remark-type-pill">{r.remark_type || 'Academic Evaluation'}</span>
                          <span className="text-muted">Recorded in Student Academic File</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Apply Leave Request Modal */}
        {showLeaveModal && (
          <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
            <div className="modal-content leave-apply-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <CalendarCheck size={24} color="#38bdf8" />
                  <div>
                    <h3>Submit Student Leave Application</h3>
                    <p>Application will be routed to your Class Teacher for formal review.</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowLeaveModal(false)}>×</button>
              </div>

              {leaveSuccess ? (
                <div className="remark-success-box">
                  <CheckCircle2 size={40} color="#10b981" />
                  <h4>Application Submitted!</h4>
                  <p>{leaveSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleApplyLeaveSubmit} className="remark-form">
                  {/* Target Reviewer Banner */}
                  <div className="class-teacher-banner" style={{ marginBottom: '16px' }}>
                    <div className="ct-avatar-box">
                      <UserCheck size={18} color="#10b981" />
                    </div>
                    <div className="ct-info">
                      <strong style={{ color: '#0f172a' }}>
                        Reviewing Authority: {teacherNameDisplay} (Class Teacher)
                      </strong>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                        Routing leave request directly to {classNameDisplay} homeroom approval desk.
                      </p>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Leave Category</label>
                      <select
                        value={newLeave.leave_type}
                        onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                      >
                        <option value="Medical Leave">Medical Leave</option>
                        <option value="Family / Casual Leave">Family / Casual Leave</option>
                        <option value="Academic / Competition">Academic / Competition</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Number of Days</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newLeave.days_count}
                        onChange={(e) => setNewLeave({ ...newLeave, days_count: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Leave Start Date</label>
                      <input
                        type="date"
                        value={newLeave.start_date}
                        onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Leave End Date</label>
                      <input
                        type="date"
                        value={newLeave.end_date}
                        onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Detailed Reason for Absence</label>
                    <textarea
                      rows={4}
                      placeholder="State reason clearly (e.g. recovering from illness, family wedding, sports event)..."
                      value={newLeave.reason}
                      onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={leaveSubmitting || !newLeave.reason.trim()}
                    >
                      <Send size={16} />
                      <span>{leaveSubmitting ? 'Submitting to Teacher...' : 'Submit Leave Application'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowLeaveModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Printable Fee Slip Modal */}
        {selectedReceipt && (
          <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
            <div className="modal-content printable-slip-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Official Student Fee Slip</h3>
                <button className="modal-close" onClick={() => setSelectedReceipt(null)}>×</button>
              </div>

              <div className="official-fee-slip-view">
                <div className="slip-brand">
                  <h2>GREENWOOD HIGH SCHOOL</h2>
                  <p>Affiliated to Central Board of Education • Estd. 1998</p>
                  <span className="slip-tag">STUDENT COPY • TUITION RECEIPT</span>
                </div>

                <div className="slip-meta-grid">
                  <div>
                    <strong>Student Name:</strong> {studentData?.first_name} {studentData?.last_name}
                  </div>
                  <div>
                    <strong>Receipt No:</strong> {selectedReceipt.receipt_no || 'REC-2026-001'}
                  </div>
                  <div>
                    <strong>Roll Number:</strong> {studentData?.roll_number}
                  </div>
                  <div>
                    <strong>Date:</strong> {selectedReceipt.payment_date ? selectedReceipt.payment_date.split('T')[0] : '2026-09-18'}
                  </div>
                  <div>
                    <strong>Class & Section:</strong> {studentData?.classes?.class_name} - {studentData?.classes?.section}
                  </div>
                  <div>
                    <strong>Installment:</strong> #{selectedReceipt.installment_no || 1}
                  </div>
                </div>

                <table className="slip-breakdown-table">
                  <thead>
                    <tr>
                      <th>Fee Description</th>
                      <th>Payment Mode</th>
                      <th className="text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Semester Tuition & Academic Services</td>
                      <td>{selectedReceipt.payment_mode || 'Bank Transfer / Online'}</td>
                      <td className="text-right font-semibold">₹{Number(selectedReceipt.amount_paid || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Outstanding Balance to be Settled</td>
                      <td>Next Due Date: 2026-10-15</td>
                      <td className="text-right text-warning font-semibold">₹{Number(selectedReceipt.balance_due || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="slip-actions">
                  <button className="btn-primary" onClick={() => window.print()}>
                    <Printer size={16} />
                    <span>Print Slip</span>
                  </button>
                  <button className="btn-secondary" onClick={() => setSelectedReceipt(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Attendance Regularization Modal */}
        {showRegularizeModal && (
          <div 
            className="modal-overlay" 
            onClick={() => setShowRegularizeModal(false)}
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
              className="modal-content regularize-modal-box" 
              onClick={(e) => e.stopPropagation()}
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
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <CalendarCheck size={22} color="#0ea5e9" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Request Attendance Regularization</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>Submit dispute reconciliation to your appointed Class Teacher.</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowRegularizeModal(false)}>×</button>
              </div>

              {regSuccess ? (
                <div className="remark-success-box">
                  <CheckCircle2 size={40} color="#10b981" />
                  <h4>Request Submitted Successfully!</h4>
                  <p>{regSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleApplyRegularizationSubmit} className="review-leave-form">
                  {/* Target Reviewer Banner */}
                  <div className="class-teacher-banner" style={{ marginBottom: '16px' }}>
                    <div className="ct-avatar-box">
                      <User size={18} color="#0284c7" />
                    </div>
                    <div className="ct-info">
                      <strong style={{ color: '#0f172a' }}>Reviewing Authority: {teacherNameDisplay} (Class Teacher)</strong>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                        Routing dispute to {classNameDisplay} homeroom approval queue.
                      </p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Attendance Date *</label>
                      <input
                        type="date"
                        value={newRegularization.attendance_date}
                        onChange={(e) => setNewRegularization({ ...newRegularization, attendance_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Original Recorded Status *</label>
                      <select
                        value={newRegularization.original_status}
                        onChange={(e) => setNewRegularization({ ...newRegularization, original_status: e.target.value })}
                      >
                        <option value="Absent">Absent (Unexcused / Missed)</option>
                        <option value="Late">Late Entry</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label>Requested Adjusted Status *</label>
                      <select
                        value={newRegularization.requested_status}
                        onChange={(e) => setNewRegularization({ ...newRegularization, requested_status: e.target.value })}
                      >
                        <option value="Present">Present (Full Day Verified)</option>
                        <option value="On-Duty / Activity">On-Duty / Official Activity</option>
                        <option value="Medical Waiver">Medical Exemption Waiver</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Reason Category *</label>
                      <select
                        value={newRegularization.reason_category}
                        onChange={(e) => setNewRegularization({ ...newRegularization, reason_category: e.target.value })}
                      >
                        <option value="Biometric / Scanner Technical Issue">Biometric / Scanner Technical Issue</option>
                        <option value="Official School Activity / Olympiad">Official School Activity / Olympiad</option>
                        <option value="Medical Exemption">Medical Exemption</option>
                        <option value="School Bus / Transport Delay">School Bus / Transport Delay</option>
                        <option value="Family Emergency / Other">Family Emergency / Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '14px' }}>
                    <label>Detailed Explanation for Class Teacher *</label>
                    <textarea
                      rows={4}
                      placeholder="Provide specific details (e.g., Gate 2 biometric terminal glitch during morning entry queue, or attended state mathematics olympiad in Room 204 with permission)..."
                      value={newRegularization.reason}
                      onChange={(e) => setNewRegularization({ ...newRegularization, reason: e.target.value })}
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                      💡 Please be as accurate as possible. Your Class Teacher will review this against manual logs before making a decision.
                    </small>
                  </div>

                  <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={regSubmitting || !newRegularization.reason.trim()}
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
                    >
                      <Send size={16} />
                      <span>{regSubmitting ? 'Submitting to Teacher...' : 'Submit to Class Teacher'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowRegularizeModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: SUBJECT 10-ASSESSMENT MARKS HISTORY POPUP */}
        {/* ========================================================= */}
        {selectedHistoryModal && (
          <div className="modal-overlay" onClick={() => setSelectedHistoryModal(null)}>
            <div className="modal-content subject-history-popup" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <History size={22} color="#38bdf8" />
                  <div>
                    <h3>{selectedHistoryModal} • 10-Assessment Marks History</h3>
                    <p>
                      Student: <strong>{studentData?.first_name} {studentData?.last_name}</strong> ({studentData?.roll_number}) • Homeroom: {studentData?.classes?.class_name || 'Class 10'} - {studentData?.classes?.section || 'A'}
                    </p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedHistoryModal(null)}>×</button>
              </div>

              {/* Quick Subject Switcher inside Modal */}
              <div className="history-subject-pills" style={{ marginTop: '14px', marginBottom: '16px' }}>
                {availableSubjects.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    className={`history-subject-pill ${selectedHistoryModal === sub ? 'active' : ''}`}
                    onClick={() => setSelectedHistoryModal(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {renderSubject10TestHistory(selectedHistoryModal)}

              <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedHistoryModal(null)}
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Settings & Notification History Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentUser={{
            ...currentUser,
            name: `${studentData?.first_name || 'John'} ${studentData?.last_name || 'Doe'}`,
            role: 'Student',
            student_id: studentId,
            username: currentUser?.username || 'student_1'
          }}
          notifications={notifications}
          readNotificationIds={readNotificationIds}
          onToggleRead={handleToggleRead}
          onMarkAllRead={handleMarkAllRead}
          onMarkAllUnread={handleMarkAllUnread}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setShowSettingsModal(false);
          }}
          initialTab="notifications"
        />
      </div>
    );
  }
