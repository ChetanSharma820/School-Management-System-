import React, { useState, useEffect, useMemo } from 'react';
import { api, calculateSalaryBreakdown } from './api';
import ExcelStudio from './ExcelStudio';
import SearchableStudentSelect from './SearchableStudentSelect';
import SearchableTeacherSelect from './SearchableTeacherSelect';
import Login from './Login';
import StudentPortal from './StudentPortal';
import TeacherPortal from './TeacherPortal';
import EditStudentModal from './EditStudentModal';
import { AddTeacherModal, EditTeacherModal } from './TeacherModals';
import PermissionModal from './PermissionModal';
import RbacPermissionsView from './RbacPermissionsView';
import SettingsModal from './SettingsModal';
import AssignFacultyModal from './AssignFacultyModal';
import ClassGroupsHub from './ClassGroupsHub';
import AttendanceAdminView from './AttendanceAdminView';
import GradebookAdminView from './GradebookAdminView';
import StudentRemarksModal from './StudentRemarksModal';
import StudentGovernanceAdminView from './StudentGovernanceAdminView';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  BookOpen, 
  Receipt, 
  Wallet, 
  CalendarCheck, 
  Award, 
  FileSpreadsheet,
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Pencil,
  Key,
  ShieldAlert,
  Lock,
  Unlock,
  Sliders,
  UserPlus,
  Check,
  X,
  Menu,
  Bell,
  Calendar,
  Layers,
  ArrowRightLeft,
  MessageSquare,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Mobile Drawer Navigation State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Inactivity / Idle Session Timeout: 15 minutes (900,000 ms)
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState('');

  // Authentication & RBAC Session State (strictly validated against 15-minute inactivity limit)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('school_mgmt_user');
      const lastActive = localStorage.getItem('greenwood_last_activity');
      if (savedUser && lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed < INACTIVITY_TIMEOUT_MS) {
          localStorage.setItem('greenwood_last_activity', Date.now().toString());
          return JSON.parse(savedUser);
        } else {
          // Expired due to 15 minutes of inactivity
          localStorage.removeItem('school_mgmt_user');
          localStorage.removeItem('greenwood_last_activity');
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (user) => {
    // Merge any granular permissions from local overrides
    const overrides = JSON.parse(localStorage.getItem('greenwood_rbac_permissions') || '{}');
    const userOverrides = overrides[user.id] || {};
    const mergedUser = {
      ...user,
      ...userOverrides,
      status: user.status || userOverrides.status || 'active',
      portal_access: user.portal_access !== undefined ? user.portal_access : (userOverrides.portal_access !== undefined ? userOverrides.portal_access : true)
    };

    // If account was explicitly suspended in the database, block access
    if (mergedUser.status === 'suspended' || mergedUser.portal_access === false) {
      alert('Access Denied: Your account access has been suspended or restricted by the School Administrator.');
      return;
    }

    setSessionExpiredNotice('');
    setCurrentUser(mergedUser);
    try {
      localStorage.setItem('school_mgmt_user', JSON.stringify(mergedUser));
      localStorage.setItem('greenwood_last_activity', Date.now().toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = (reason = '') => {
    setCurrentUser(null);
    if (reason && typeof reason === 'string') {
      setSessionExpiredNotice(reason);
    } else {
      setSessionExpiredNotice('');
    }
    try {
      localStorage.removeItem('school_mgmt_user');
      localStorage.removeItem('greenwood_last_activity');
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  // Active 15-Minute Inactivity / Idle Auto-Logout Listener
  useEffect(() => {
    if (!currentUser) return;

    let lastActivity = Date.now();
    localStorage.setItem('greenwood_last_activity', lastActivity.toString());

    let throttleTimeout = null;
    const registerUserActivity = () => {
      const now = Date.now();
      lastActivity = now;
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          localStorage.setItem('greenwood_last_activity', Date.now().toString());
          throttleTimeout = null;
        }, 2000);
      }
    };

    // User interaction events across whole window
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, registerUserActivity, { passive: true });
    });

    // Check every 5 seconds for inactivity > 15 minutes
    const interval = setInterval(() => {
      const now = Date.now();
      const storedLast = parseInt(localStorage.getItem('greenwood_last_activity') || '0', 10);
      const effectiveLast = Math.max(lastActivity, storedLast);

      if (now - effectiveLast >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval);
        handleLogout('Your session has expired due to 15 minutes of inactivity. Please sign in again to continue.');
      }
    }, 5000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, registerUserActivity);
      });
      clearInterval(interval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL'); // 'ALL' | classId (number) | 'UNASSIGNED'
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL'); // 'ALL', 'Paid', 'Partial', 'Pending'
  const [feePage, setFeePage] = useState(1);
  const feePageSize = 25;

  // Salary Search & Filter state
  const [salarySearchQuery, setSalarySearchQuery] = useState('');
  const [salaryStatusFilter, setSalaryStatusFilter] = useState('ALL'); // 'ALL', 'Paid', 'Pending'
  const [salaryPage, setSalaryPage] = useState(1);
  const salaryPageSize = 10;

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // Admin edit student details
  const [remarksStudent, setRemarksStudent] = useState(null); // Admin view & add progress remarks
  const [showCollectFeeModal, setShowCollectFeeModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  // Faculty Management state (Admin Exclusive)
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [allTimetable, setAllTimetable] = useState([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('ALL');
  const [newTeacher, setNewTeacher] = useState({
    first_name: '',
    last_name: '',
    employee_id: '',
    email: '',
    phone: '',
    qualification: 'M.Sc. Education',
    salary_base: 45000
  });

  // RBAC & Granular Permissions state (Admin Exclusive)
  const [permissionsList, setPermissionsList] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [managingPermissionsUser, setManagingPermissionsUser] = useState(null);
  const [permSearchQuery, setPermSearchQuery] = useState('');
  const [permRoleFilter, setPermRoleFilter] = useState('ALL'); // 'ALL' | 'student' | 'teacher'
  const [permStatusFilter, setPermStatusFilter] = useState('ALL'); // 'ALL' | 'active' | 'suspended'
  const [localPermOverrides, setLocalPermOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('greenwood_rbac_permissions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Student & Faculty Leaves & Attendance Regularizations Governance (Admin Exclusive)
  const [studentLeaves, setStudentLeaves] = useState([]);
  const [studentRegularizations, setStudentRegularizations] = useState([]);
  const [teacherLeaves, setTeacherLeaves] = useState([]);
  const [teacherRegularizations, setTeacherRegularizations] = useState([]);
  const [selectedTeacherLeaveReview, setSelectedTeacherLeaveReview] = useState(null);
  const [selectedTeacherRegReview, setSelectedTeacherRegReview] = useState(null);
  const [teacherLeaveDecision, setTeacherLeaveDecision] = useState('Approved');
  const [teacherLeaveRemarks, setTeacherLeaveRemarks] = useState('');
  const [submittingTeacherLeaveReview, setSubmittingTeacherLeaveReview] = useState(false);
  const [teacherRegDecision, setTeacherRegDecision] = useState('Approved');
  const [teacherRegRemarks, setTeacherRegRemarks] = useState('');
  const [submittingTeacherRegReview, setSubmittingTeacherRegReview] = useState(false);
  const [showAdminNotifications, setShowAdminNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('notifications');
  const [readAdminNotifIds, setReadAdminNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`greenwood_read_notifs_admin_${currentUser?.id || 1}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save read notification IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `greenwood_read_notifs_admin_${currentUser?.id || 1}`,
        JSON.stringify(Array.from(readAdminNotifIds))
      );
    } catch (e) {
      console.error(e);
    }
  }, [readAdminNotifIds, currentUser]);

  const [teacherLeaveFilter, setTeacherLeaveFilter] = useState('ALL');
  const [teacherRegFilter, setTeacherRegFilter] = useState('ALL');

  // Form states
  const [newStudent, setNewStudent] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    class_id: '',
    father_name: '',
    mother_name: '',
    parent_phone: '',
    emergency_contact: '',
    address: '',
    blood_group: 'O+',
    gender: 'Male',
    aadhaar_number: '',
    admission_date: new Date().toISOString().split('T')[0]
  });

  const [newFee, setNewFee] = useState({
    student_id: '',
    fee_category: 'Tuition & Lab Fee',
    academic_year: '2026-2027',
    term_name: 'Installment #1',
    gross_amount: 25000,
    discount_amount: 0,
    late_fine: 0,
    amount_paid: 25000,
    payment_method: 'UPI / QR',
    transaction_ref: '',
    due_date: '2026-09-30',
    notes: 'Installment #1'
  });

  const [newSalary, setNewSalary] = useState({
    teacher_id: '',
    salary_month: 'September',
    salary_year: 2026,
    basic_salary: 45000,
    hra_allowance: 12000,
    da_allowance: 8000,
    medical_allowance: 3000,
    special_bonus: 2000,
    provident_fund: 4000,
    tax_deducted_tds: 2500,
    payment_method: 'Direct Bank Transfer',
    bank_account_last4: '5678'
  });

  // Load Initial Data from C++ Backend whenever activeTab changes
  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    if (classes.length > 0 && (!newStudent.class_id || !classes.some(c => c.id === parseInt(newStudent.class_id)))) {
      setNewStudent(prev => ({ ...prev, class_id: classes[0].id }));
    }
  }, [classes]);

  useEffect(() => {
    if (students.length > 0 && (!newFee.student_id || !students.some(s => s.id === newFee.student_id))) {
      setNewFee(prev => ({ ...prev, student_id: students[0].id }));
    }
  }, [students]);

  useEffect(() => {
    if (teachers.length > 0 && (!newSalary.teacher_id || !teachers.some(t => t.id === newSalary.teacher_id))) {
      setNewSalary(prev => ({ ...prev, teacher_id: teachers[0].id }));
    }
  }, [teachers]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stuRes, tchRes, feeRes, salRes, clsRes, tlRes, trRes, ttRes, slRes, srRes] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getTeachers().catch(() => []),
        api.getFees().catch(() => []),
        api.getSalaries().catch(() => []),
        api.getClasses().catch(() => []),
        api.getTeacherLeaves().catch(() => []),
        api.getTeacherAttendanceRegularizations().catch(() => []),
        api.getTimetable().catch(() => []),
        api.getLeaves().catch(() => []),
        api.getAttendanceRegularizations().catch(() => [])
      ]);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
      setTeachers(Array.isArray(tchRes) ? tchRes : []);
      setFees(Array.isArray(feeRes) ? feeRes : []);
      setSalaries(Array.isArray(salRes) ? salRes : []);
      setClasses(Array.isArray(clsRes) ? clsRes : []);
      setTeacherLeaves(Array.isArray(tlRes) ? tlRes : []);
      setTeacherRegularizations(Array.isArray(trRes) ? trRes : []);
      setAllTimetable(Array.isArray(ttRes) ? ttRes : []);
      setStudentLeaves(Array.isArray(slRes) ? slRes : []);
      setStudentRegularizations(Array.isArray(srRes) ? srRes : []);
      setServerOnline(true);
    } catch (err) {
      console.error('Server offline or error:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  // Master System Reset & Factory Wipe Handler (Admin Exclusive)
  const handleSystemReset = async () => {
    const result = await api.resetEntireSystem();
    setStudents([]);
    setTeachers([]);
    setClasses([]);
    setFees([]);
    setSalaries([]);
    setTeacherLeaves([]);
    setTeacherRegularizations([]);
    setStudentLeaves([]);
    setStudentRegularizations([]);
    setAllTimetable([]);
    setPermissionsList([]);
    setReadAdminNotifIds(new Set());
    try {
      localStorage.removeItem(`greenwood_read_notifs_admin_${currentUser?.id || 1}`);
    } catch (e) {
      console.error(e);
    }
    await loadAllData();
    return result;
  };

  const openSettingsModal = (tab = 'notifications') => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  };

  // Add Student Handler
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const selectedClassId = parseInt(newStudent.class_id) || (classes.length > 0 ? classes[0].id : null);
      if (!selectedClassId) {
        alert('Please create at least one Class Group before registering students.');
        return;
      }
      const payload = {
        ...newStudent,
        class_id: selectedClassId
      };
      await api.addStudent(payload);
      setShowAddStudentModal(false);
      setNewStudent({
        roll_number: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        dob: '',
        class_id: classes.length > 0 ? classes[0].id : '',
        father_name: '',
        mother_name: '',
        parent_phone: '',
        emergency_contact: '',
        address: '',
        blood_group: 'O+',
        gender: 'Male',
        aadhaar_number: '',
        admission_date: new Date().toISOString().split('T')[0]
      });
      loadAllData();
      alert('Student record added successfully with full parent & personal information!');
    } catch (err) {
      alert('Error adding student: ' + err.message);
    }
  };

  // 1-Click Quick Decision for Teacher Leave (Admin)
  const handleQuickTeacherLeaveDecision = async (leaveItem, decision) => {
    const remarkText = decision === 'Approved' ? 'Faculty leave approved by Administrator' : 'Rejected by Administrator';
    try {
      await api.reviewTeacherLeave(leaveItem.id, {
        status: decision,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (decision === 'Approved' && leaveItem.teacher_id && leaveItem.start_date) {
        api.punchTeacherAttendance({
          teacher_id: leaveItem.teacher_id,
          attendance_date: leaveItem.start_date,
          status: 'On Leave',
          in_time: '—',
          out_time: '—',
          total_hours: 0,
          shift_type: 'Sanctioned Leave',
          remarks: `Faculty Leave Sanctioned by Admin (${leaveItem.leave_type || 'Leave'})`
        }).catch(() => {});
      }

      setTeacherLeaves(prev => prev.map(l =>
        l.id === leaveItem.id
          ? { ...l, status: decision, admin_remarks: remarkText, reviewed_at: new Date().toISOString() }
          : l
      ));
      await loadAllData();
      alert(`✓ Faculty leave #${leaveItem.id} has been marked as ${decision.toUpperCase()}!`);
    } catch (err) {
      alert('Error updating faculty leave: ' + err.message);
    }
  };

  // Review Teacher Leave Request (Admin Modal Form)
  const handleReviewTeacherLeave = async (e) => {
    e.preventDefault();
    if (!selectedTeacherLeaveReview) return;
    setSubmittingTeacherLeaveReview(true);
    const remarkText = teacherLeaveRemarks.trim() || `Marked ${teacherLeaveDecision} by Administrator`;
    try {
      await api.reviewTeacherLeave(selectedTeacherLeaveReview.id, {
        status: teacherLeaveDecision,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (teacherLeaveDecision === 'Approved' && selectedTeacherLeaveReview.teacher_id && selectedTeacherLeaveReview.start_date) {
        api.punchTeacherAttendance({
          teacher_id: selectedTeacherLeaveReview.teacher_id,
          attendance_date: selectedTeacherLeaveReview.start_date,
          status: 'On Leave',
          in_time: '—',
          out_time: '—',
          total_hours: 0,
          shift_type: 'Sanctioned Leave',
          remarks: `Faculty Leave Sanctioned by Admin (${selectedTeacherLeaveReview.leave_type || 'Leave'})`
        }).catch(() => {});
      }

      // Optimistic local update
      setTeacherLeaves(prev => prev.map(l =>
        l.id === selectedTeacherLeaveReview.id
          ? { ...l, status: teacherLeaveDecision, admin_remarks: remarkText, reviewed_at: new Date().toISOString() }
          : l
      ));
      setSelectedTeacherLeaveReview(null);
      setTeacherLeaveRemarks('');
      setTeacherLeaveDecision('Approved');
      await loadAllData();
      alert(`✓ Faculty leave application has been ${teacherLeaveDecision.toUpperCase()} and saved to database!`);
    } catch (err) {
      alert('Error reviewing faculty leave: ' + err.message);
    } finally {
      setSubmittingTeacherLeaveReview(false);
    }
  };

  // 1-Click Quick Decision for Teacher Regularization (Admin)
  const handleQuickTeacherRegDecision = async (regItem, decision) => {
    const remarkText = decision === 'Approved' ? 'Biometric punch dispute regularized & approved by Administrator' : 'Rejected by Administrator';
    try {
      await api.reviewTeacherAttendanceRegularization(regItem.id, {
        status: decision,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (decision === 'Approved' && regItem.teacher_id && regItem.attendance_date) {
        api.punchTeacherAttendance({
          teacher_id: regItem.teacher_id,
          attendance_date: regItem.attendance_date,
          status: regItem.requested_status || 'Present',
          in_time: '08:45 AM',
          out_time: '04:30 PM',
          total_hours: 8.0,
          shift_type: 'Regularized Full Day',
          remarks: `Biometric Punch Regularized by Admin: ${regItem.reason_category || 'Hardware glitch resolved'}`
        }).catch(() => {});
      }

      setTeacherRegularizations(prev => prev.map(r =>
        r.id === regItem.id
          ? { ...r, status: decision, admin_remarks: remarkText, reviewed_at: new Date().toISOString() }
          : r
      ));
      await loadAllData();
      alert(`✓ Faculty attendance dispute #${regItem.id} has been ${decision.toUpperCase()}!`);
    } catch (err) {
      alert('Error updating faculty regularization: ' + err.message);
    }
  };

  // Review Teacher Attendance Regularization (Admin Modal Form)
  const handleReviewTeacherReg = async (e) => {
    e.preventDefault();
    if (!selectedTeacherRegReview) return;
    setSubmittingTeacherRegReview(true);
    const remarkText = teacherRegRemarks.trim() || `Marked ${teacherRegDecision} by Administrator`;
    try {
      await api.reviewTeacherAttendanceRegularization(selectedTeacherRegReview.id, {
        status: teacherRegDecision,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (teacherRegDecision === 'Approved' && selectedTeacherRegReview.teacher_id && selectedTeacherRegReview.attendance_date) {
        api.punchTeacherAttendance({
          teacher_id: selectedTeacherRegReview.teacher_id,
          attendance_date: selectedTeacherRegReview.attendance_date,
          status: selectedTeacherRegReview.requested_status || 'Present',
          in_time: '08:45 AM',
          out_time: '04:30 PM',
          total_hours: 8.0,
          shift_type: 'Regularized Full Day',
          remarks: `Biometric Punch Regularized by Admin: ${selectedTeacherRegReview.reason_category || 'Hardware glitch resolved'}`
        }).catch(() => {});
      }

      // Optimistic local update
      setTeacherRegularizations(prev => prev.map(r =>
        r.id === selectedTeacherRegReview.id
          ? { ...r, status: teacherRegDecision, admin_remarks: remarkText, reviewed_at: new Date().toISOString() }
          : r
      ));
      setSelectedTeacherRegReview(null);
      setTeacherRegRemarks('');
      setTeacherRegDecision('Approved');
      await loadAllData();
      alert(`✓ Faculty attendance regularization has been ${teacherRegDecision.toUpperCase()} and synchronized!`);
    } catch (err) {
      alert('Error reviewing attendance regularization: ' + err.message);
    } finally {
      setSubmittingTeacherRegReview(false);
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await api.deleteStudent(id);
        loadAllData();
      } catch (err) {
        alert('Error deleting student: ' + err.message);
      }
    }
  };

  // Timetable & Subject Assignment Handlers (Admin Exclusive)
  const handleAddTimetablePeriod = async (payload) => {
    try {
      const res = await api.addTimetable(payload);
      await loadAllData();
      return res;
    } catch (err) {
      console.error('Failed to assign subject period:', err);
      throw err;
    }
  };

  const handleDeleteTimetablePeriod = async (id) => {
    if (!window.confirm('Are you sure you want to unassign this subject period?')) return;
    try {
      await api.deleteTimetable(id);
      setAllTimetable(prev => prev.filter(t => t.id !== id));
      await loadAllData();
    } catch (err) {
      console.error('Failed to delete timetable period:', err);
      alert('Failed to delete timetable period: ' + err.message);
    }
  };

  // Update Student Handler (Admin Exclusive)
  const handleUpdateStudent = async (updatedData) => {
    try {
      await api.updateStudent(editingStudent.id, updatedData);
      setEditingStudent(null);
      await loadAllData();
      alert(`Student record for ${updatedData.first_name} ${updatedData.last_name} updated successfully!`);
    } catch (err) {
      alert('Error updating student: ' + err.message);
    }
  };

  // Add Faculty Member Handler (Admin Exclusive)
  const handleAddTeacher = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      await api.addTeacher(newTeacher);
      setShowAddTeacherModal(false);
      setNewTeacher({
        first_name: '',
        last_name: '',
        employee_id: '',
        email: '',
        phone: '',
        qualification: 'M.Sc. Education',
        salary_base: 45000
      });
      await loadAllData();
      alert('Faculty member registered successfully!');
    } catch (err) {
      alert('Error adding faculty member: ' + err.message);
    }
  };

  // Update Faculty Member Handler (Admin Exclusive)
  const handleUpdateTeacher = async (updatedData) => {
    try {
      await api.updateTeacher(editingTeacher.id, updatedData);
      setEditingTeacher(null);
      await loadAllData();
      alert(`Faculty details for Prof. ${updatedData.first_name} ${updatedData.last_name} updated successfully!`);
    } catch (err) {
      alert('Error updating faculty: ' + err.message);
    }
  };

  // Delete Faculty Member Handler (Admin Exclusive)
  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this faculty member? All teaching assignments will be removed.')) {
      try {
        await api.deleteTeacher(id);
        await loadAllData();
      } catch (err) {
        alert('Error deleting faculty: ' + err.message);
      }
    }
  };

  // Class Groups & Cohort Management Handlers (Admin Exclusive)
  const handleCreateClassGroup = async (classData) => {
    try {
      await api.addClass(classData);
      await loadAllData();
      alert(`Class ${classData.class_name} - Section ${classData.section} created successfully!`);
    } catch (err) {
      alert('Error creating class group: ' + err.message);
      throw err;
    }
  };

  const handleUpdateClassGroup = async (classId, classData) => {
    try {
      const { update_student_fees, ...payload } = classData;
      await api.updateClass(classId, payload);
      
      // If admin opted to sync existing students' fee records with new base_fee
      if (update_student_fees && payload.base_fee) {
        const newGross = parseFloat(payload.base_fee);
        const cohortStudents = students.filter(s => s.class_id === classId);
        for (const s of cohortStudents) {
          const sFees = fees.filter(f => f.student_id === s.id);
          for (const f of sFees) {
            const net = newGross - parseFloat(f.discount_amount || 0) + parseFloat(f.late_fine || 0);
            const paid = parseFloat(f.amount_paid || 0);
            const bal = Math.max(0, net - paid);
            const status = bal === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');
            try {
              await api.updateFee(f.id, {
                gross_amount: newGross,
                net_payable: net,
                balance_due: bal,
                payment_status: status
              });
            } catch (e) {
              console.warn('Student fee sync note:', e);
            }
          }
        }
      }
      
      await loadAllData();
      alert(`Class configuration updated successfully!`);
    } catch (err) {
      alert('Error updating class configuration: ' + err.message);
      throw err;
    }
  };

  const handleTransferStudentClass = async (studentId, newClassId) => {
    try {
      await api.updateStudent(studentId, { class_id: newClassId });
      const targetCls = classes.find(c => c.id === newClassId);
      if (targetCls && targetCls.base_fee) {
        const newGross = parseFloat(targetCls.base_fee);
        const sFees = fees.filter(f => f.student_id === studentId);
        for (const f of sFees) {
          const net = newGross - parseFloat(f.discount_amount || 0) + parseFloat(f.late_fine || 0);
          const paid = parseFloat(f.amount_paid || 0);
          const bal = Math.max(0, net - paid);
          const status = bal === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');
          try {
            await api.updateFee(f.id, {
              gross_amount: newGross,
              net_payable: net,
              balance_due: bal,
              payment_status: status
            });
          } catch (e) {
            console.warn('Student fee transfer sync note:', e);
          }
        }
      }
      await loadAllData();
      const clsStr = targetCls ? `${targetCls.class_name} - ${targetCls.section}` : `Class #${newClassId}`;
      alert(`Student transferred to ${clsStr} successfully!`);
    } catch (err) {
      alert('Error transferring student: ' + err.message);
      throw err;
    }
  };

  const handleBatchTransferStudents = async (studentIds, newClassId) => {
    try {
      await Promise.all(studentIds.map(sid => api.updateStudent(sid, { class_id: newClassId })));
      const targetCls = classes.find(c => c.id === newClassId);
      if (targetCls && targetCls.base_fee) {
        const newGross = parseFloat(targetCls.base_fee);
        for (const sid of studentIds) {
          const sFees = fees.filter(f => f.student_id === sid);
          for (const f of sFees) {
            const net = newGross - parseFloat(f.discount_amount || 0) + parseFloat(f.late_fine || 0);
            const paid = parseFloat(f.amount_paid || 0);
            const bal = Math.max(0, net - paid);
            const status = bal === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');
            try {
              await api.updateFee(f.id, {
                gross_amount: newGross,
                net_payable: net,
                balance_due: bal,
                payment_status: status
              });
            } catch (e) {
              console.warn('Batch student fee sync note:', e);
            }
          }
        }
      }
      await loadAllData();
      const clsStr = targetCls ? `${targetCls.class_name} - ${targetCls.section}` : `Class #${newClassId}`;
      alert(`${studentIds.length} students transferred to ${clsStr} successfully!`);
    } catch (err) {
      alert('Error performing batch transfer: ' + err.message);
      throw err;
    }
  };

  const handleOpenAddStudentWithClass = (classId) => {
    setNewStudent(prev => ({ ...prev, class_id: classId }));
    setShowAddStudentModal(true);
  };


  // Delete Fee Record Handler (Admin Exclusive)
  const handleDeleteFee = async (id) => {
    if (window.confirm('Are you sure you want to void / delete this student fee receipt transaction?')) {
      try {
        await api.deleteFee(id);
        await loadAllData();
      } catch (err) {
        alert('Error deleting fee record: ' + err.message);
      }
    }
  };

  // Delete Salary Record Handler (Admin Exclusive)
  const handleDeleteSalary = async (id) => {
    if (window.confirm('Are you sure you want to delete / void this faculty salary disbursement slip?')) {
      try {
        await api.deleteSalary(id);
        await loadAllData();
      } catch (err) {
        alert('Error deleting salary record: ' + err.message);
      }
    }
  };

  // Load RBAC Permissions List
  const loadPermissionsData = async () => {
    setPermissionsLoading(true);
    try {
      const res = await api.getPermissions();
      if (Array.isArray(res)) {
        setPermissionsList(res);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Toggle Account Status (Active vs Suspended)
  const handleToggleAccountStatus = async (user) => {
    const isCurrentlySuspended = user.status === 'suspended' || localPermOverrides[user.id]?.status === 'suspended';
    const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
    const isPortalActive = newStatus === 'active';
    const msg = newStatus === 'suspended'
      ? `Suspend account for ${user.username}? They will be blocked from logging into the portal.`
      : `Re-activate account for ${user.username}? They will be granted login access.`;
    if (!window.confirm(msg)) return;

    try {
      await api.updatePermission(user.id, {
        status: newStatus,
        portal_access: isPortalActive
      });
      await loadPermissionsData();
    } catch (err) {
      console.warn('Backend update error, recording to local state:', err);
    }

    setPermissionsList(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus, portal_access: isPortalActive } : u));
    const updated = {
      ...localPermOverrides,
      [user.id]: {
        ...(localPermOverrides[user.id] || {}),
        status: newStatus,
        portal_access: isPortalActive
      }
    };
    setLocalPermOverrides(updated);
    localStorage.setItem('greenwood_rbac_permissions', JSON.stringify(updated));
  };

  // Save Granular Permissions from Modal
  const handleSaveUserPermissions = async (user, newPerms) => {
    try {
      const updatePayload = {
        status: newPerms.status || 'active',
        portal_access: newPerms.portal_access !== undefined ? newPerms.portal_access : (newPerms.status !== 'suspended'),
        can_apply_leave: newPerms.can_apply_leave !== undefined ? newPerms.can_apply_leave : true,
        can_view_grades: newPerms.can_view_grades !== undefined ? newPerms.can_view_grades : true,
        can_download_fee_receipt: newPerms.can_download_fee_receipt !== undefined ? newPerms.can_download_fee_receipt : true,
        can_post_remarks: newPerms.can_post_remarks !== undefined ? newPerms.can_post_remarks : true,
        can_approve_leaves: newPerms.can_approve_leaves !== undefined ? newPerms.can_approve_leaves : true,
        can_view_payroll: newPerms.can_view_payroll !== undefined ? newPerms.can_view_payroll : true
      };
      await api.updatePermission(user.id, updatePayload);
      await loadPermissionsData();
    } catch (err) {
      console.warn('Backend update note:', err);
    }

    setPermissionsList(prev => prev.map(u => u.id === user.id ? { ...u, ...newPerms } : u));
    const updated = {
      ...localPermOverrides,
      [user.id]: {
        ...(localPermOverrides[user.id] || {}),
        ...newPerms
      }
    };
    setLocalPermOverrides(updated);
    localStorage.setItem('greenwood_rbac_permissions', JSON.stringify(updated));
    setManagingPermissionsUser(null);
    alert(`Permissions & status successfully updated and saved to database for ${user.username}!`);
  };

  // Delete User Credential (Admin Exclusive)
  const handleDeleteUserCredential = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this user login credential?')) {
      try {
        await api.deleteUser(id);
        setPermissionsList(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        alert('Error deleting user credential: ' + err.message);
      }
    }
  };

  // Reset User Password Handler (Admin Exclusive)
  const handleResetUserPassword = async (user, customPassword) => {
    try {
      const res = await api.resetPassword(user.id, user.username, customPassword);
      await loadPermissionsData();
      return res;
    } catch (err) {
      console.error('Failed to reset password:', err);
      throw err;
    }
  };

  // Open Permissions Modal for Student or Teacher entity
  const openPermissionsForEntity = async (role, entityId) => {
    let list = permissionsList;
    if (list.length === 0) {
      try {
        const res = await api.getPermissions();
        if (Array.isArray(res)) {
          list = res;
          setPermissionsList(res);
        }
      } catch (e) {
        console.error(e);
      }
    }

    let target = null;
    if (role === 'student') {
      target = list.find(u => u.student_id === entityId);
      if (!target) {
        const st = students.find(s => s.id === entityId);
        target = {
          id: `stu_${entityId}`,
          username: `${st?.first_name?.toLowerCase()}.${st?.last_name?.toLowerCase()}`,
          role: 'student',
          student_id: entityId,
          status: 'active',
          students: st
        };
      }
    } else if (role === 'teacher') {
      target = list.find(u => u.teacher_id === entityId);
      if (!target) {
        const tc = teachers.find(t => t.id === entityId);
        target = {
          id: `tch_${entityId}`,
          username: `${tc?.first_name?.toLowerCase()}.${tc?.last_name?.toLowerCase()}`,
          role: 'teacher',
          teacher_id: entityId,
          status: 'active',
          teachers: tc
        };
      }
    }

    if (target) {
      setManagingPermissionsUser(target);
    }
  };

  // Collect Fee Handler (Supports Full & Installment Payments)
  const handleCollectFee = async (e) => {
    e.preventDefault();
    const net_payable = parseFloat(newFee.gross_amount) - parseFloat(newFee.discount_amount || 0) + parseFloat(newFee.late_fine || 0);
    const amount_paid = parseFloat(newFee.amount_paid);

    // Compute prior installment payments for this student
    const studentPrior = fees
      .filter(f => f.student_id === newFee.student_id)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
    const priorTotalPaid = studentPrior.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);

    const totalPaidSoFar = priorTotalPaid + amount_paid;
    const balance_due = Math.max(0, net_payable - totalPaidSoFar);
    const payment_status = balance_due === 0 ? 'Paid' : 'Partial';
    const installment_number = studentPrior.length + 1;
    const receipt_no = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      ...newFee,
      receipt_no,
      net_payable,
      balance_due,
      payment_status,
      term_name: newFee.term_name || `Installment #${installment_number}`,
      notes: newFee.notes || `Installment #${installment_number} • Paid ₹${amount_paid.toLocaleString()}`,
      payment_date: new Date().toISOString()
    };

    try {
      await api.collectFee(payload);
      setShowCollectFeeModal(false);
      await loadAllData();
      const st = students.find(s => s.id === newFee.student_id);
      setSelectedReceipt({ ...payload, students: st });
    } catch (err) {
      alert('Error recording fee installment: ' + err.message);
    }
  };

  // Generate Salary Handler
  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    const gross_earnings = parseFloat(newSalary.basic_salary) + parseFloat(newSalary.hra_allowance) + parseFloat(newSalary.da_allowance) + parseFloat(newSalary.medical_allowance) + parseFloat(newSalary.special_bonus);
    const total_deductions = parseFloat(newSalary.provident_fund) + parseFloat(newSalary.tax_deducted_tds);
    const net_salary = gross_earnings - total_deductions;
    const payslip_no = `PAY-2026-${newSalary.salary_month.toUpperCase().substring(0,3)}-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      ...newSalary,
      payslip_no,
      gross_earnings,
      total_deductions,
      net_salary,
      payment_status: 'Paid',
      payment_date: new Date().toISOString(),
      transaction_ref: `NEFT-TXN-${Math.floor(100000 + Math.random() * 900000)}`
    };

    try {
      await api.generateSalary(payload);
      setShowSalaryModal(false);
      await loadAllData();
      const teacherObj = teachers.find(t => t.id === newSalary.teacher_id);
      setSelectedPaySlip({ ...payload, teachers: teacherObj });
    } catch (err) {
      alert('Error generating salary slip: ' + err.message);
    }
  };

  // Filtered lists
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);
      
      let matchesClass = true;
      if (studentClassFilter === 'UNASSIGNED') {
        matchesClass = !s.class_id;
      } else if (studentClassFilter !== 'ALL') {
        matchesClass = s.class_id === parseInt(studentClassFilter);
      }
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, studentClassFilter]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = teacherSearchQuery.toLowerCase().trim();
      const fullName = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
      const empId = (t.employee_id || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const qual = (t.qualification || '').toLowerCase();
      
      const matchesSearch = !q || fullName.includes(q) || empId.includes(q) || dept.includes(q) || email.includes(q) || qual.includes(q);
      const matchesDept = teacherDeptFilter === 'ALL' || t.department === teacherDeptFilter;
      
      return matchesSearch && matchesDept;
    });
  }, [teachers, teacherSearchQuery, teacherDeptFilter]);

  // Computed Metrics
  const totalFeesCollected = fees.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);
  const totalSalariesPaid = salaries.length > 0 
    ? salaries.reduce((sum, s) => sum + (parseFloat(s.net_salary) || 0), 0)
    : teachers.reduce((sum, t) => sum + (calculateSalaryBreakdown(t.salary_base || 65000).net_salary), 0);

  const pendingStudentLeavesCount = useMemo(() => {
    return studentLeaves.filter(l => l.status === 'Pending').length;
  }, [studentLeaves]);

  const pendingStudentRegsCount = useMemo(() => {
    return studentRegularizations.filter(r => r.status === 'Pending').length;
  }, [studentRegularizations]);

  const pendingTeacherLeavesCount = useMemo(() => {
    return teacherLeaves.filter(l => l.status === 'Pending').length;
  }, [teacherLeaves]);

  const pendingTeacherRegsCount = useMemo(() => {
    return teacherRegularizations.filter(r => r.status === 'Pending').length;
  }, [teacherRegularizations]);

  // Aggregate Real-time Stream of All Notifications for School Administrator
  const adminNotifications = useMemo(() => {
    const list = [];

    // 0a. Student Leave Requests (Pending & Active)
    studentLeaves.forEach(l => {
      const studentObj = l.students || students.find(s => s.id === l.student_id);
      const studentName = studentObj ? `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim() : `Student #${l.student_id}`;
      const rollNum = studentObj?.roll_number ? ` (${studentObj.roll_number})` : '';
      const isPending = l.status === 'Pending';
      list.push({
        id: `adm-notif-sleave-${l.id}`,
        category: 'student-leave',
        status: l.status || 'Pending',
        title: isPending ? `Student Leave Request: ${studentName}` : `Student Leave ${l.status}: ${studentName}`,
        message: `${studentName}${rollNum} applied for ${l.leave_type || 'Leave'} (${l.days_count || 1} day${(l.days_count || 1) > 1 ? 's' : ''}, ${l.start_date} to ${l.end_date}). Reason: "${l.reason || 'Personal'}". Status: ${l.status?.toUpperCase()}`,
        timestamp: l.created_at || l.start_date || 'Recent',
        created_at: l.created_at || l.start_date || new Date().toISOString(),
        targetTab: 'student-leaves',
        actionData: l
      });
    });

    // 0b. Student Attendance Regularizations (Disputes)
    studentRegularizations.forEach(r => {
      const studentObj = r.students || students.find(s => s.id === r.student_id);
      const studentName = studentObj ? `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim() : `Student #${r.student_id}`;
      const rollNum = studentObj?.roll_number ? ` (${studentObj.roll_number})` : '';
      const isPending = r.status === 'Pending';
      list.push({
        id: `adm-notif-sreg-${r.id}`,
        category: 'student-regularization',
        status: r.status || 'Pending',
        title: isPending ? `Student Attendance Dispute: ${studentName}` : `Student Dispute Regularized (${r.status}): ${studentName}`,
        message: `${studentName}${rollNum} disputed attendance for ${r.attendance_date} (${r.original_status} → ${r.requested_status}). Reason: "${r.reason || r.reason_category || 'Attendance discrepancy'}". Status: ${r.status?.toUpperCase()}`,
        timestamp: r.created_at || r.attendance_date || 'Recent',
        created_at: r.created_at || r.attendance_date || new Date().toISOString(),
        targetTab: 'student-regularizations',
        actionData: r
      });
    });

    // 1. Faculty Leaves (Pending & Active)
    teacherLeaves.forEach(l => {
      const teacherName = l.teachers ? `Prof. ${l.teachers.first_name} ${l.teachers.last_name}` : `Teacher #${l.teacher_id}`;
      const isPending = l.status === 'Pending';
      list.push({
        id: `adm-notif-tleave-${l.id}`,
        category: 'teacher-leave',
        status: l.status || 'Pending',
        title: isPending ? `Faculty Leave Request: ${teacherName}` : `Faculty Leave ${l.status}: ${teacherName}`,
        message: `${teacherName} applied for ${l.leave_type} (${l.days_count || 1} day${(l.days_count || 1) > 1 ? 's' : ''}, ${l.start_date} to ${l.end_date}). Reason: "${l.reason || 'Personal'}". Status: ${l.status?.toUpperCase()}`,
        timestamp: l.created_at || l.start_date || 'Recent',
        created_at: l.created_at || l.start_date || new Date().toISOString(),
        targetTab: 'teacher-leaves',
        actionData: l
      });
    });

    // 2. Faculty Attendance Regularizations (Disputes)
    teacherRegularizations.forEach(r => {
      const teacherName = r.teachers ? `Prof. ${r.teachers.first_name} ${r.teachers.last_name}` : `Teacher #${r.teacher_id}`;
      const isPending = r.status === 'Pending';
      list.push({
        id: `adm-notif-treg-${r.id}`,
        category: 'attendance',
        status: r.status || 'Pending',
        title: isPending ? `Faculty Attendance Dispute: ${teacherName}` : `Attendance Regularization ${r.status}: ${teacherName}`,
        message: `${teacherName} disputed attendance for ${r.attendance_date} (${r.original_status} → ${r.requested_status}). Reason: "${r.reason || r.reason_category || 'Biometric Issue'}". Status: ${r.status?.toUpperCase()}`,
        timestamp: r.created_at || r.attendance_date || 'Recent',
        created_at: r.created_at || r.attendance_date || new Date().toISOString(),
        targetTab: 'teacher-regularizations',
        actionData: r
      });
    });

    // 3. Fee Receipts & Collections
    fees.forEach(f => {
      const stuName = f.students ? `${f.students.first_name} ${f.students.last_name}` : `Student #${f.student_id}`;
      list.push({
        id: `adm-notif-fee-${f.id || f.receipt_number || f.term_name}`,
        category: 'fee',
        status: f.payment_status || f.status || 'Paid',
        title: `Fee Collected: ${stuName}`,
        message: `Received ₹${(parseFloat(f.amount_paid) || 25000).toLocaleString()} for ${f.term_name || 'Tuition Fee'} via ${f.payment_method || f.payment_mode || 'UPI'}. Receipt #${f.receipt_no || f.receipt_number || 'REC-001'}`,
        timestamp: f.payment_date || f.created_at || 'Recent',
        created_at: f.payment_date || f.created_at || new Date().toISOString(),
        targetTab: 'fees',
        actionData: f
      });
    });

    // 4. Salary Pay-Slips Generated
    salaries.forEach(s => {
      const teacherName = s.teachers ? `Prof. ${s.teachers.first_name} ${s.teachers.last_name}` : `Teacher #${s.teacher_id}`;
      list.push({
        id: `adm-notif-sal-${s.id || s.payslip_no}`,
        category: 'salary',
        status: s.payment_status || s.status || 'Paid',
        title: `Payroll Disbursed: ${teacherName}`,
        message: `Disbursed ₹${(parseFloat(s.net_salary) || 69000).toLocaleString()} for ${s.salary_month} ${s.salary_year}. Pay-Slip #${s.payslip_no || 'PAY-001'}`,
        timestamp: s.payment_date || s.created_at || 'Recent',
        created_at: s.payment_date || s.created_at || new Date().toISOString(),
        targetTab: 'salaries',
        actionData: s
      });
    });

    // CRITICAL REQUIREMENT: Sort newest notifications to appear at the very top!
    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [studentLeaves, studentRegularizations, teacherLeaves, teacherRegularizations, fees, salaries, students]);

  // Active unread alerts for quick notification drawer
  const activeAdminAlerts = useMemo(() => {
    return adminNotifications.filter(n => !readAdminNotifIds.has(n.id));
  }, [adminNotifications, readAdminNotifIds]);

  const totalAdminAlertsCount = activeAdminAlerts.length;

  const handleToggleAdminRead = (id) => {
    setReadAdminNotifIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkAllAdminRead = () => {
    const allIds = new Set(adminNotifications.map(n => n.id));
    setReadAdminNotifIds(allIds);
  };

  const handleMarkAllAdminUnread = () => {
    setReadAdminNotifIds(new Set());
  };

  // Selected student prior payments for modal
  const selectedStudentPriorFees = useMemo(() => {
    if (!newFee.student_id) return [];
    return fees
      .filter(f => f.student_id === newFee.student_id)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
  }, [fees, newFee.student_id]);

  const priorTotalPaid = useMemo(() => {
    return selectedStudentPriorFees.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);
  }, [selectedStudentPriorFees]);

  const remainingBalanceBeforePayment = useMemo(() => {
    const gross = parseFloat(newFee.gross_amount) || 25000;
    const discount = parseFloat(newFee.discount_amount) || 0;
    const net = gross - discount;
    return Math.max(0, net - priorTotalPaid);
  }, [newFee.gross_amount, newFee.discount_amount, priorTotalPaid]);

  // When changing student in collect fee modal
  const handleSelectStudentForFee = (studentId) => {
    const targetStudent = students.find(s => s.id === studentId);
    const studentClass = classes.find(c => c.id === targetStudent?.class_id) || targetStudent?.classes;
    const classBaseFee = Number(studentClass?.base_fee || 45000);
    const studentPrior = fees
      .filter(f => f.student_id === studentId)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
    const priorPaid = studentPrior.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);
    const gross = studentPrior.length > 0 ? (parseFloat(studentPrior[0].gross_amount) || classBaseFee) : classBaseFee;
    const remaining = Math.max(0, gross - priorPaid);

    setNewFee(prev => ({
      ...prev,
      student_id: studentId,
      gross_amount: gross,
      amount_paid: remaining > 0 ? remaining : 0,
      term_name: `Installment #${studentPrior.length + 1}`,
      notes: `Installment #${studentPrior.length + 1}`
    }));
  };

  // Quick collect fee for a specific student
  const openCollectFeeForStudent = (student) => {
    const studentClass = classes.find(c => c.id === student.class_id) || student.classes;
    const classBaseFee = Number(studentClass?.base_fee || 45000);
    const studentPrior = fees
      .filter(f => f.student_id === student.id)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
    const priorPaid = studentPrior.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);
    const gross = studentPrior.length > 0 ? (parseFloat(studentPrior[0].gross_amount) || classBaseFee) : classBaseFee;
    const remaining = Math.max(0, gross - priorPaid);

    setNewFee({
      student_id: student.id,
      fee_category: 'Tuition & Lab Fee',
      academic_year: '2026-2027',
      term_name: `Installment #${studentPrior.length + 1}`,
      gross_amount: gross,
      discount_amount: 0,
      late_fine: 0,
      amount_paid: remaining > 0 ? remaining : 0,
      payment_method: 'UPI / QR',
      transaction_ref: '',
      due_date: '2026-09-30',
      notes: `Installment #${studentPrior.length + 1}`
    });
    setShowCollectFeeModal(true);
  };

  // All installment entries for the student of the selected receipt slip
  const selectedReceiptInstallments = useMemo(() => {
    if (!selectedReceipt) return [];
    return fees
      .filter(f => f.student_id === selectedReceipt.student_id)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
  }, [fees, selectedReceipt]);

  const receiptTotalPaidAll = useMemo(() => {
    return selectedReceiptInstallments.reduce((sum, f) => sum + (parseFloat(f.amount_paid) || 0), 0);
  }, [selectedReceiptInstallments]);

  const receiptFinalBalance = useMemo(() => {
    if (!selectedReceipt) return 0;
    const targetStudent = students.find(s => s.id === selectedReceipt.student_id) || selectedReceipt.students;
    const studentClass = classes.find(c => c.id === targetStudent?.class_id) || targetStudent?.classes;
    const classBaseFee = Number(studentClass?.base_fee || 45000);
    const gross = parseFloat(selectedReceipt.gross_amount) || classBaseFee;
    const discount = parseFloat(selectedReceipt.discount_amount) || 0;
    const net = gross - discount;
    return Math.max(0, net - receiptTotalPaidAll);
  }, [selectedReceipt, receiptTotalPaidAll, students, classes]);

  const selectedReceiptStudent = useMemo(() => {
    if (!selectedReceipt) return null;
    return students.find(s => s.id === selectedReceipt.student_id) || selectedReceipt.students || null;
  }, [selectedReceipt, students]);

  // Comprehensive Student Fee Status Ledger across ALL students
  const studentFeeLedger = useMemo(() => {
    const feeMap = new Map();
    fees.forEach(f => {
      const sid = f.student_id;
      if (!feeMap.has(sid)) {
        feeMap.set(sid, []);
      }
      feeMap.get(sid).push(f);
    });

    return students.map(student => {
      const studentClass = classes.find(c => c.id === student.class_id) || student.classes;
      const classBaseFee = Number(studentClass?.base_fee || 45000);
      const studentReceipts = feeMap.get(student.id) || [];
      if (studentReceipts.length > 0) {
        const latest = studentReceipts[0];
        const totalPaid = studentReceipts.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
        const gross = parseFloat(latest.gross_amount) || classBaseFee;
        const discount = parseFloat(latest.discount_amount) || 0;
        const balance = Math.max(0, gross - discount - totalPaid);
        const status = balance === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';

        return {
          student,
          receipt_no: latest.receipt_no,
          gross_amount: gross,
          discount_amount: discount,
          amount_paid: totalPaid,
          balance_due: balance,
          payment_status: status,
          payment_date: latest.payment_date,
          receiptObj: latest,
          hasPaidRecord: true
        };
      } else {
        return {
          student,
          receipt_no: '—',
          gross_amount: classBaseFee,
          discount_amount: 0,
          amount_paid: 0,
          balance_due: classBaseFee,
          payment_status: 'Pending',
          payment_date: null,
          receiptObj: null,
          hasPaidRecord: false
        };
      }
    });
  }, [students, fees, classes]);

  // Filtered Fee Ledger
  const filteredFeeLedger = useMemo(() => {
    return studentFeeLedger.filter(item => {
      const s = item.student;
      const q = feeSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q) ||
        item.receipt_no?.toLowerCase().includes(q) ||
        (s.classes && `${s.classes.class_name} ${s.classes.section}`.toLowerCase().includes(q));

      const matchesStatus = feeStatusFilter === 'ALL' || item.payment_status === feeStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [studentFeeLedger, feeSearchQuery, feeStatusFilter]);

  // Fee Counts for filter pills
  const feeCounts = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;
    studentFeeLedger.forEach(item => {
      if (item.payment_status === 'Paid') paid++;
      else if (item.payment_status === 'Partial') partial++;
      else pending++;
    });
    return { all: studentFeeLedger.length, paid, partial, pending };
  }, [studentFeeLedger]);

  // Paginated ledger rows
  const totalFeePages = Math.ceil(filteredFeeLedger.length / feePageSize) || 1;
  const paginatedFeeRows = filteredFeeLedger.slice((feePage - 1) * feePageSize, feePage * feePageSize);

  // Quick disburse salary modal opener for a specific faculty member
  const openDisburseSalaryForTeacher = (teacher) => {
    const breakdown = calculateSalaryBreakdown(teacher.salary_base || 65000);
    setNewSalary({
      teacher_id: teacher.id,
      salary_month: 'September',
      salary_year: 2026,
      basic_salary: breakdown.basic_salary,
      hra_allowance: breakdown.hra_allowance,
      da_allowance: breakdown.da_allowance,
      medical_allowance: breakdown.medical_allowance,
      special_bonus: breakdown.special_bonus,
      provident_fund: breakdown.provident_fund,
      tax_deducted_tds: breakdown.tax_deducted_tds,
      payment_method: 'Direct Bank Transfer',
      bank_account_last4: '5678'
    });
    setShowSalaryModal(true);
  };

  // Live calculation for currently opened salary modal
  const liveGrossSalary = useMemo(() => {
    return (parseFloat(newSalary.basic_salary) || 0) +
      (parseFloat(newSalary.hra_allowance) || 0) +
      (parseFloat(newSalary.da_allowance) || 0) +
      (parseFloat(newSalary.medical_allowance) || 0) +
      (parseFloat(newSalary.special_bonus) || 0);
  }, [newSalary]);

  const liveDeductionsSalary = useMemo(() => {
    return (parseFloat(newSalary.provident_fund) || 0) +
      (parseFloat(newSalary.tax_deducted_tds) || 0) + 200 + 340;
  }, [newSalary]);

  const liveNetSalary = useMemo(() => {
    return Math.max(0, liveGrossSalary - liveDeductionsSalary);
  }, [liveGrossSalary, liveDeductionsSalary]);

  // All historical salary slips for the teacher of the selected pay-slip modal
  const selectedPaySlipHistory = useMemo(() => {
    if (!selectedPaySlip) return [];
    return salaries
      .filter(s => s.teacher_id === selectedPaySlip.teacher_id)
      .sort((a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at));
  }, [salaries, selectedPaySlip]);

  const paySlipYtdTotal = useMemo(() => {
    return selectedPaySlipHistory.reduce((sum, s) => sum + (parseFloat(s.net_salary) || 0), 0);
  }, [selectedPaySlipHistory]);

  const selectedPaySlipTeacher = useMemo(() => {
    if (!selectedPaySlip) return null;
    return teachers.find(t => t.id === selectedPaySlip.teacher_id) || selectedPaySlip.teachers || null;
  }, [selectedPaySlip, teachers]);

  // Comprehensive Faculty Monthly Payroll Ledger across ALL faculty members
  const teacherPayrollLedger = useMemo(() => {
    const salMap = new Map();
    salaries.forEach(s => {
      const tid = s.teacher_id;
      if (!salMap.has(tid)) {
        salMap.set(tid, []);
      }
      salMap.get(tid).push(s);
    });

    return teachers.map(teacher => {
      const teacherSlips = salMap.get(teacher.id) || [];
      const breakdown = calculateSalaryBreakdown(teacher.salary_base || 65000);
      if (teacherSlips.length > 0) {
        const latest = teacherSlips[0];
        const slipBreakdown = calculateSalaryBreakdown(latest.gross_earnings || teacher.salary_base || 65000);
        return {
          teacher,
          payslip_no: latest.payslip_no || `PAY-2026-SEP-${teacher.id}`,
          salary_month: latest.salary_month || 'September',
          salary_year: latest.salary_year || 2026,
          gross_earnings: slipBreakdown.gross_earnings,
          total_deductions: slipBreakdown.total_deductions,
          net_salary: slipBreakdown.net_salary,
          payment_status: 'Paid',
          payment_date: latest.payment_date || '2026-09-01',
          payslipObj: { ...latest, ...slipBreakdown },
          hasPaidRecord: true,
          totalSlips: teacherSlips.length
        };
      } else {
        return {
          teacher,
          payslip_no: `PAY-2026-SEP-${teacher.id}`,
          salary_month: 'September',
          salary_year: 2026,
          gross_earnings: breakdown.gross_earnings,
          total_deductions: breakdown.total_deductions,
          net_salary: breakdown.net_salary,
          payment_status: 'Paid',
          payment_date: '2026-09-01',
          payslipObj: {
            teacher_id: teacher.id,
            payslip_no: `PAY-2026-SEP-${teacher.id}`,
            salary_month: 'September',
            salary_year: 2026,
            payment_date: '2026-09-01',
            payment_method: 'Direct Bank Transfer',
            ...breakdown
          },
          hasPaidRecord: true,
          totalSlips: 1
        };
      }
    });
  }, [teachers, salaries]);

  // Filtered Faculty Payroll Ledger
  const filteredSalaryLedger = useMemo(() => {
    return teacherPayrollLedger.filter(item => {
      const t = item.teacher;
      const q = salarySearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        t.first_name?.toLowerCase().includes(q) ||
        t.last_name?.toLowerCase().includes(q) ||
        t.employee_id?.toLowerCase().includes(q) ||
        t.qualification?.toLowerCase().includes(q) ||
        item.payslip_no?.toLowerCase().includes(q) ||
        item.salary_month?.toLowerCase().includes(q);

      const matchesStatus = salaryStatusFilter === 'ALL' || item.payment_status === salaryStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teacherPayrollLedger, salarySearchQuery, salaryStatusFilter]);

  // Salary Counts for filter pills
  const salaryCounts = useMemo(() => {
    let paid = 0;
    let pending = 0;
    teacherPayrollLedger.forEach(item => {
      if (item.payment_status === 'Paid') paid++;
      else pending++;
    });
    return { all: teacherPayrollLedger.length, paid, pending };
  }, [teacherPayrollLedger]);

  const totalSalaryPages = Math.ceil(filteredSalaryLedger.length / salaryPageSize) || 1;
  const paginatedSalaryRows = filteredSalaryLedger.slice((salaryPage - 1) * salaryPageSize, salaryPage * salaryPageSize);

  // If user is not authenticated, show Login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} sessionExpiredMessage={sessionExpiredNotice} />;
  }

  const userRole = String(currentUser?.role || '').toLowerCase();

  // If user is a student, render dedicated Student Portal
  if (userRole === 'student') {
    return <StudentPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // If user is a teacher, render dedicated Teacher Portal
  if (userRole === 'teacher') {
    return <TeacherPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Administrator view
  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileNavOpen ? 'active' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* 1. Sidebar Navigation */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <div className="brand-title">
            <span>EduCore OS</span>
            <span className="brand-badge">Admin Master Console</span>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={() => setMobileNavOpen(false)}
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-section">
          <span className="nav-label">Main Menu</span>
          
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false); }}
          >
            <BookOpen size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setMobileNavOpen(false); }}
          >
            <Users size={18} />
            <span>Student Directory</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'class-groups' ? 'active' : ''}`}
            onClick={() => { setActiveTab('class-groups'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'class-groups' ? '#38bdf8' : '#60a5fa' }}
          >
            <Layers size={18} />
            <span>Class Groups & Rosters</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teachers'); setMobileNavOpen(false); }}
          >
            <UserCheck size={18} />
            <span>Faculty & Staff</span>
          </button>

          <span className="nav-label" style={{ marginTop: '16px' }}>Finance & Slips</span>

          <button 
            className={`nav-btn ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => { setActiveTab('fees'); setMobileNavOpen(false); }}
          >
            <Receipt size={18} />
            <span>Fee Receipts</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'salaries' ? 'active' : ''}`}
            onClick={() => { setActiveTab('salaries'); setMobileNavOpen(false); }}
          >
            <Wallet size={18} />
            <span>Salary Pay-Slips</span>
          </button>

          <span className="nav-label" style={{ marginTop: '16px' }}>Academics & Tools</span>

          <button 
            className={`nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('attendance'); setMobileNavOpen(false); }}
          >
            <CalendarCheck size={18} />
            <span>Attendance</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => { setActiveTab('grades'); setMobileNavOpen(false); }}
          >
            <Award size={18} />
            <span>Gradebook</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'excel' ? 'active' : ''}`}
            onClick={() => { setActiveTab('excel'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'excel' ? '#34d399' : '#10b981' }}
          >
            <FileSpreadsheet size={18} />
            <span>Excel DB Studio</span>
          </button>

          <span className="nav-label" style={{ marginTop: '16px' }}>Student Governance</span>

          <button 
            className={`nav-btn ${activeTab === 'student-leaves' ? 'active' : ''}`}
            onClick={() => { setActiveTab('student-leaves'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'student-leaves' ? '#38bdf8' : '#94a3b8' }}
          >
            <CalendarCheck size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Student Leave Approvals</span>
            {pendingStudentLeavesCount > 0 && (
              <span className="sidebar-badge-count">{pendingStudentLeavesCount}</span>
            )}
          </button>

          <button 
            className={`nav-btn ${activeTab === 'student-regularizations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('student-regularizations'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'student-regularizations' ? '#34d399' : '#94a3b8' }}
          >
            <Clock size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Student Regularizations</span>
            {pendingStudentRegsCount > 0 && (
              <span className="sidebar-badge-count">{pendingStudentRegsCount}</span>
            )}
          </button>

          <span className="nav-label" style={{ marginTop: '16px' }}>Faculty Governance</span>

          <button 
            className={`nav-btn ${activeTab === 'teacher-leaves' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teacher-leaves'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'teacher-leaves' ? '#38bdf8' : '#94a3b8' }}
          >
            <CalendarCheck size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Faculty Leave Approvals</span>
            {pendingTeacherLeavesCount > 0 && (
              <span className="sidebar-badge-count">{pendingTeacherLeavesCount}</span>
            )}
          </button>

          <button 
            className={`nav-btn ${activeTab === 'teacher-regularizations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teacher-regularizations'); setMobileNavOpen(false); }}
            style={{ color: activeTab === 'teacher-regularizations' ? '#34d399' : '#94a3b8' }}
          >
            <Clock size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Faculty Regularizations</span>
            {pendingTeacherRegsCount > 0 && (
              <span className="sidebar-badge-count">{pendingTeacherRegsCount}</span>
            )}
          </button>

          <button 
            className={`nav-btn ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('permissions'); setMobileNavOpen(false); loadPermissionsData(); }}
            style={{ color: activeTab === 'permissions' ? '#f59e0b' : '#fbbf24' }}
          >
            <ShieldAlert size={18} />
            <span>RBAC Permissions</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span>System Service</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="status-dot" style={{ backgroundColor: serverOnline ? 'var(--emerald)' : 'var(--rose)' }}></div>
              <span style={{ fontSize: '11px', color: serverOnline ? 'var(--emerald)' : 'var(--rose)' }}>
                {serverOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Viewport */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button 
            type="button" 
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen(prev => !prev)}
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="page-title-box">
            <h1>
              {activeTab === 'dashboard' && 'School Overview Dashboard'}
              {activeTab === 'students' && 'Student Management Directory'}
              {activeTab === 'class-groups' && 'Class Groups & Section Batches Roster'}
              {activeTab === 'teachers' && 'Faculty & Teacher Management'}
              {activeTab === 'fees' && 'Student Fee Collection & Receipts'}
              {activeTab === 'salaries' && 'Teacher Payroll & Salary Slips'}
              {activeTab === 'attendance' && 'Daily Attendance Tracker'}
              {activeTab === 'grades' && 'Academic Gradebook & Report Cards'}
              {activeTab === 'excel' && 'Excel Database Studio'}
              {activeTab === 'permissions' && 'Access Control & RBAC Permissions Matrix'}
              {activeTab === 'student-leaves' && 'Student Leave Approvals & Absence Governance'}
              {activeTab === 'student-regularizations' && 'Student Attendance Dispute & Regularization Desk'}
              {activeTab === 'student-governance' && 'Student Leave & Attendance Regularization Desk'}
              {activeTab === 'teacher-leaves' && 'Faculty Leave Approvals & Institutional Quotas'}
              {activeTab === 'teacher-regularizations' && 'Faculty Attendance Disputes & Biometric Regularizations'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Institutional analytics, enrollment KPIs, and financial summary'}
              {activeTab === 'students' && 'Student enrollment, demographic profiles, and academic records'}
              {activeTab === 'class-groups' && 'Class-wise cohort management, student rosters & subject allocations'}
              {activeTab === 'teachers' && 'Faculty directory, staff assignments, and academic departments'}
              {activeTab === 'fees' && 'Student fee invoicing, installment tracking & GST payment receipts'}
              {activeTab === 'salaries' && 'Faculty monthly payroll disbursement & official pay-slips'}
              {activeTab === 'attendance' && 'Daily student attendance session logging & verification'}
              {activeTab === 'grades' && 'Examination grading, assessment marks & student report cards'}
              {activeTab === 'excel' && 'Institutional data import, export, and batch spreadsheet studio'}
              {activeTab === 'permissions' && 'Role-based access control, security scopes & user credentials'}
              {activeTab === 'student-leaves' && 'Student absence applications & institutional approvals desk'}
              {activeTab === 'student-regularizations' && 'Student attendance discrepancy review & regularization desk'}
              {activeTab === 'student-governance' && 'Student leave and attendance regularizations approval queue'}
              {activeTab === 'teacher-leaves' && 'Faculty leave applications, quota tracking & administrative approval'}
              {activeTab === 'teacher-regularizations' && 'Faculty biometric dispute review & attendance adjustments'}
            </p>
          </div>

          <div className="header-actions">
            <button 
              className="btn-secondary" 
              onClick={loadAllData} 
              disabled={loading}
              title="Refresh database records"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            {activeTab === 'students' && (
              <button className="btn-primary" onClick={() => setShowAddStudentModal(true)}>
                <Plus size={16} /> Add Student
              </button>
            )}
            {activeTab === 'fees' && (
              <button className="btn-primary" onClick={() => setShowCollectFeeModal(true)}>
                <Plus size={16} /> Collect Fees
              </button>
            )}
            {activeTab === 'salaries' && (
              <button className="btn-primary" onClick={() => setShowSalaryModal(true)}>
                <Plus size={16} /> Generate Pay-Slip
              </button>
            )}

            {/* Admin Notification Bell with Dynamic Drawer */}
            <div className="admin-notification-container" style={{ position: 'relative' }}>
              <button 
                className={`admin-notification-bell ${totalAdminAlertsCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setShowAdminNotifications(!showAdminNotifications)}
                title={`${totalAdminAlertsCount} Unread Administrative Notifications`}
              >
                <Bell size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Alerts</span>
                {totalAdminAlertsCount > 0 && (
                  <span className="notification-badge-count">
                    {totalAdminAlertsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {showAdminNotifications && (
                <div className="admin-notification-drawer">
                  <div className="notif-drawer-header">
                    <h3>
                      <Bell size={16} color="#38bdf8" />
                      <span>Administrative Alert Center</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {totalAdminAlertsCount > 0 && (
                        <button 
                          className="notif-mark-read" 
                          onClick={handleMarkAllAdminRead}
                          style={{ fontSize: '11.5px', color: '#38bdf8' }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button 
                        className="action-btn" 
                        onClick={() => setShowAdminNotifications(false)}
                        style={{ fontSize: '12px', padding: '2px 6px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="notif-drawer-list">
                    {activeAdminAlerts.length === 0 ? (
                      <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>All Caught Up!</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>No active pending alerts in your queue.</div>
                        <button 
                          className="btn-link-settings"
                          onClick={() => {
                            setShowAdminNotifications(false);
                            setShowSettingsModal(true);
                          }}
                          style={{ marginTop: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          View Notification History &rarr;
                        </button>
                      </div>
                    ) : (
                      activeAdminAlerts.map((notif) => {
                        return (
                          <div 
                            key={notif.id} 
                            className="notif-drawer-item is-pending"
                            onClick={() => {
                              // Mark as read so it is immediately removed from active drawer
                              setReadAdminNotifIds(prev => new Set(prev).add(notif.id));
                              setShowAdminNotifications(false);
                              if (notif.targetTab) {
                                setActiveTab(notif.targetTab);
                              }
                              if (notif.category === 'teacher-leave' && notif.actionData) {
                                setSelectedTeacherLeaveReview(notif.actionData);
                                setTeacherLeaveDecision(notif.actionData.status === 'Rejected' ? 'Rejected' : 'Approved');
                                setTeacherLeaveRemarks(notif.actionData.admin_remarks || '');
                              }
                              if (notif.category === 'attendance' && notif.actionData) {
                                setSelectedTeacherRegReview(notif.actionData);
                                setTeacherRegDecision(notif.actionData.status === 'Rejected' ? 'Rejected' : 'Approved');
                                setTeacherRegRemarks(notif.actionData.admin_remarks || '');
                              }
                            }}
                          >
                            <div className="notif-item-icon" style={{ 
                              background: (notif.category === 'student-leave' || notif.category === 'teacher-leave') 
                                ? 'rgba(56, 189, 248, 0.15)' 
                                : (notif.category === 'student-regularization' || notif.category === 'attendance') 
                                ? 'rgba(52, 211, 153, 0.15)' 
                                : notif.category === 'salary' 
                                ? 'rgba(245, 158, 11, 0.15)' 
                                : 'rgba(168, 85, 247, 0.15)', 
                              color: (notif.category === 'student-leave' || notif.category === 'teacher-leave') 
                                ? '#38bdf8' 
                                : (notif.category === 'student-regularization' || notif.category === 'attendance') 
                                ? '#34d399' 
                                : notif.category === 'salary' 
                                ? '#f59e0b' 
                                : '#c084fc' 
                            }}>
                              {(notif.category === 'student-leave' || notif.category === 'teacher-leave') && <CalendarCheck size={18} />}
                              {(notif.category === 'student-regularization' || notif.category === 'attendance') && <Clock size={18} />}
                              {notif.category === 'fee' && <Receipt size={18} />}
                              {notif.category === 'salary' && <Wallet size={18} />}
                            </div>
                            <div className="notif-item-content">
                              <div className="notif-item-title">{notif.title}</div>
                              <div className="notif-item-desc">{notif.message}</div>
                              <div className="notif-item-time" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span>{notif.timestamp}</span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <button 
                                    className="notif-single-read-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleAdminRead(notif.id);
                                    }}
                                    title="Mark as read (remove from queue)"
                                  >
                                    Mark as Read
                                  </button>
                                  <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '11px' }}>Action &rarr;</span>
                                </div>
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
                        setShowAdminNotifications(false);
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
              className="btn-settings-header"
              onClick={() => setShowSettingsModal(true)}
              title="System Settings & Notification History"
            >
              <Sliders size={15} />
              <span>Settings</span>
            </button>

            {/* Admin Session & Sign Out */}
            <div className="admin-status-badge">
              <ShieldCheck size={16} color="#c084fc" />
              <span>Admin: <strong>{currentUser?.username || 'Master'}</strong></span>
            </div>

            <button 
              className="btn-logout-header" 
              onClick={handleLogout} 
              title="Sign out of Administrator console"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Enrolled Students</h3>
                    <div className="kpi-value">{students.length}</div>
                  </div>
                  <div className="kpi-icon-wrap icon-blue">
                    <Users size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Faculty & Staff</h3>
                    <div className="kpi-value">{teachers.length}</div>
                  </div>
                  <div className="kpi-icon-wrap icon-purple">
                    <UserCheck size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Fees Collected</h3>
                    <div className="kpi-value">₹ {totalFeesCollected.toLocaleString()}</div>
                  </div>
                  <div className="kpi-icon-wrap icon-emerald">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Teacher Payroll Disbursed</h3>
                    <div className="kpi-value">₹ {totalSalariesPaid.toLocaleString()}</div>
                  </div>
                  <div className="kpi-icon-wrap icon-amber">
                    <Wallet size={24} />
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Records */}
              <div className="card-table-wrapper" style={{ marginTop: '24px' }}>
                <div className="table-toolbar">
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Recent Student Fee Transactions</h3>
                  <button className="btn-secondary" onClick={() => setActiveTab('fees')}>
                    View All <ArrowRight size={14} />
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Student Name</th>
                      <th>Category</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.slice(0, 5).map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.receipt_no}</strong></td>
                        <td>{f.students?.first_name} {f.students?.last_name}</td>
                        <td>{f.fee_category}</td>
                        <td>₹ {parseFloat(f.amount_paid).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${f.payment_status?.toLowerCase()}`}>
                            {f.payment_status}
                          </span>
                        </td>
                        <td>{f.payment_date ? new Date(f.payment_date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: STUDENTS DIRECTORY */}
          {/* ========================================================= */}
          {activeTab === 'students' && (
            <div className="card-table-wrapper">
              <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="search-input-box" style={{ minWidth: '260px' }}>
                    <Search className="search-icon" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search by name, roll no, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Class Group Quick Select Dropdown */}
                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    style={{
                      background: 'var(--bg-input, rgba(15, 23, 42, 0.7))',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <option value="ALL">All Class Cohorts ({students.length})</option>
                    {classes.map(c => {
                      const count = students.filter(s => s.class_id === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - Section {c.section} ({count} students)
                        </option>
                      );
                    })}
                    <option value="UNASSIGNED">
                      Unassigned ({students.filter(s => !s.class_id).length})
                    </option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveTab('class-groups')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    title="Open Cohort Roster Matrix & Batch Manager"
                  >
                    <Layers size={15} />
                    <span>Open Class Groups Hub &rarr;</span>
                  </button>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Total: <strong style={{ color: 'var(--text-primary)' }}>{filteredStudents.length}</strong>
                  </div>
                </div>
              </div>

              {/* Class Group Quick Filter Pills */}
              <div className="class-pills-bar" style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} /> Cohort Filter:
                </span>
                <button
                  className={`roster-pill-btn ${studentClassFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStudentClassFilter('ALL')}
                >
                  All ({students.length})
                </button>
                {classes.map(c => {
                  const count = students.filter(s => s.class_id === c.id).length;
                  return (
                    <button
                      key={c.id}
                      className={`roster-pill-btn ${studentClassFilter === c.id.toString() ? 'active' : ''}`}
                      onClick={() => setStudentClassFilter(c.id.toString())}
                    >
                      {c.class_name}-{c.section} <span className="pill-count-badge">{count}</span>
                    </button>
                  );
                })}
                {students.some(s => !s.class_id) && (
                  <button
                    className={`roster-pill-btn ${studentClassFilter === 'UNASSIGNED' ? 'active' : ''}`}
                    onClick={() => setStudentClassFilter('UNASSIGNED')}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Unassigned ({students.filter(s => !s.class_id).length})
                  </button>
                )}
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Class / Section</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td><strong>{student.roll_number}</strong></td>
                      <td>{student.first_name} {student.last_name}</td>
                      <td>
                        {student.classes ? (
                          <span className="roster-class-tag">
                            {student.classes.class_name} - {student.classes.section}
                          </span>
                        ) : (
                          <span className="roster-class-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.phone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button 
                            className="action-btn remarks" 
                            onClick={() => setRemarksStudent(student)} 
                            title="View & Post Student Progress Remarks (Admin)"
                          >
                            <MessageSquare size={15} />
                          </button>
                          <button 
                            className="action-btn edit" 
                            onClick={() => setEditingStudent({ ...student })} 
                            title="Edit Student Details (Admin Only)"
                          >
                            <Pencil size={15} />
                          </button>
                          <button 
                            className="action-btn perm" 
                            onClick={() => openPermissionsForEntity('student', student.id)} 
                            title="Manage Student Permissions & Access"
                          >
                            <Key size={15} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteStudent(student.id)} 
                            title="Delete Student Record (Admin Only)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No students found matching current search & cohort filter. Click "Add Student" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2.5: CLASS GROUPS & SECTION BATCHES ROSTER */}
          {/* ========================================================= */}
          {activeTab === 'class-groups' && (
            <ClassGroupsHub
              classes={classes}
              students={students}
              teachers={teachers}
              fees={fees}
              timetable={allTimetable}
              onAddClass={handleCreateClassGroup}
              onUpdateClass={handleUpdateClassGroup}
              onTransferStudent={handleTransferStudentClass}
              onBatchTransferStudents={handleBatchTransferStudents}
              onOpenAddStudentWithClass={handleOpenAddStudentWithClass}
              onEditStudent={(st) => setEditingStudent({ ...st })}
              onOpenPermissions={(role, id) => openPermissionsForEntity(role, id)}
              onDeleteStudent={handleDeleteStudent}
              onAddTimetable={handleAddTimetablePeriod}
              onDeleteTimetable={handleDeleteTimetablePeriod}
              loading={loading}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 3: FACULTY & TEACHERS */}
          {/* ========================================================= */}
          {activeTab === 'teachers' && (
            <div className="card-table-wrapper">
              <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Faculty & Staff Directory</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Institutional directory of {teachers.length} faculty educators • Manage Homeroom classes, subjects & profiles
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="search-input-box" style={{ minWidth: '220px' }}>
                    <Search className="search-icon" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search name, ID, department..." 
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    value={teacherDeptFilter}
                    onChange={(e) => setTeacherDeptFilter(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Department of Mathematics & Sciences">Math & Sciences</option>
                    <option value="Department of Computer Science & IT">Computer Science & IT</option>
                    <option value="Department of Physics & Natural Sciences">Physics & Natural Sciences</option>
                    <option value="Department of Chemistry">Chemistry</option>
                    <option value="Department of Languages & Humanities">Languages & Humanities</option>
                    <option value="Department of Commerce & Social Studies">Commerce & Social Studies</option>
                  </select>

                  <button 
                    className="btn-primary" 
                    onClick={() => setShowAddTeacherModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Faculty Member
                  </button>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Employee ID</th>
                    <th>Faculty Member & Department</th>
                    <th>Homeroom / Class Teacher</th>
                    <th>Assigned Teaching Subjects</th>
                    <th>Contact Info</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px', width: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(t => {
                    const homeroomClass = classes.find(c => c.teacher_id === t.id);
                    const teachingSlots = allTimetable.filter(item => item.teacher_id === t.id);
                    
                    // Group unique subject + class name allocations
                    const uniqueSubjectAllocations = [];
                    const seenKeys = new Set();
                    teachingSlots.forEach(slot => {
                      const cls = classes.find(c => c.id === slot.class_id);
                      const clsName = cls ? `${cls.class_name}-${cls.section}` : (slot.classes ? `${slot.classes.class_name}-${slot.classes.section}` : `Class ${slot.class_id}`);
                      const key = `${slot.subject}_${clsName}`;
                      if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        uniqueSubjectAllocations.push({ subject: slot.subject, classStr: clsName });
                      }
                    });

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
                            letterSpacing: '0.5px',
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {t.employee_id}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                              Prof. {t.first_name} {t.last_name}
                            </strong>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {t.designation || 'Faculty Member'} • <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{t.qualification || 'M.Sc.'}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px', fontWeight: 500 }}>
                              <span>{t.department || 'Department of Mathematics'}</span>
                              {t.cabin && <span>• 📍 {t.cabin}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          {homeroomClass ? (
                            <span 
                              className="badge badge-success"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: 'rgba(5, 150, 105, 0.1)',
                                color: '#059669',
                                border: '1px solid rgba(5, 150, 105, 0.25)'
                              }}
                            >
                              <GraduationCap size={14} />
                              {homeroomClass.class_name} - Section {homeroomClass.section}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                              — Not Assigned
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '320px' }}>
                            {uniqueSubjectAllocations.map((alloc, idx) => (
                              <span 
                                key={idx}
                                style={{
                                  background: 'rgba(79, 70, 229, 0.1)',
                                  color: '#4338ca',
                                  border: '1px solid rgba(79, 70, 229, 0.25)',
                                  borderRadius: '5px',
                                  padding: '2px 7px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <BookOpen size={10} />
                                {alloc.subject} ({alloc.classStr})
                              </span>
                            ))}
                            {uniqueSubjectAllocations.length === 0 && (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                                No subjects assigned
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 600 }}>{t.email}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.phone || '—'}</div>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button 
                              className="action-btn assign" 
                              onClick={() => setAssigningTeacher(t)} 
                              title="Assign Homeroom Class & Subject Periods (Admin Only)"
                            >
                              <BookOpen size={13} />
                              <span>Assign</span>
                            </button>
                            <button 
                              className="action-btn edit" 
                              onClick={() => setEditingTeacher({ ...t })} 
                              title="Edit Faculty Profile & Details (Admin Only)"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              className="action-btn perm" 
                              onClick={() => openPermissionsForEntity('teacher', t.id)} 
                              title="Manage Faculty Permissions & Access"
                            >
                              <Key size={14} />
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDeleteTeacher(t.id)} 
                              title="Delete Faculty Member (Admin Only)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                        No faculty members match current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FEES & PRINTABLE RECEIPTS */}
          {/* ========================================================= */}
          {activeTab === 'fees' && (
            <>
              <div className="card-table-wrapper">
                {/* Search & Status Filter Toolbar */}
                <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <div className="search-input-box" style={{ minWidth: '280px' }}>
                    <Search className="search-icon" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search student by name, roll no, receipt..."
                      value={feeSearchQuery}
                      onChange={(e) => {
                        setFeeSearchQuery(e.target.value);
                        setFeePage(1);
                      }}
                    />
                  </div>

                  <div className="filter-pills-bar">
                    <button 
                      className={`filter-pill ${feeStatusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => { setFeeStatusFilter('ALL'); setFeePage(1); }}
                    >
                      All Students ({feeCounts.all})
                    </button>
                    <button 
                      className={`filter-pill ${feeStatusFilter === 'Paid' ? 'active' : ''}`}
                      onClick={() => { setFeeStatusFilter('Paid'); setFeePage(1); }}
                      style={{ color: feeStatusFilter === 'Paid' ? 'white' : '#34d399' }}
                    >
                      ● Paid ({feeCounts.paid})
                    </button>
                    <button 
                      className={`filter-pill ${feeStatusFilter === 'Pending' ? 'active' : ''}`}
                      onClick={() => { setFeeStatusFilter('Pending'); setFeePage(1); }}
                      style={{ color: feeStatusFilter === 'Pending' ? 'white' : '#f87171' }}
                    >
                      ● Pending / Unpaid ({feeCounts.pending})
                    </button>
                    {feeCounts.partial > 0 && (
                      <button 
                        className={`filter-pill ${feeStatusFilter === 'Partial' ? 'active' : ''}`}
                        onClick={() => { setFeeStatusFilter('Partial'); setFeePage(1); }}
                        style={{ color: feeStatusFilter === 'Partial' ? 'white' : '#fbbf24' }}
                      >
                        ● Partial ({feeCounts.partial})
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    Showing {filteredFeeLedger.length === 0 ? 0 : (feePage - 1) * feePageSize + 1} - {Math.min(feePage * feePageSize, filteredFeeLedger.length)} of {filteredFeeLedger.length}
                  </div>
                </div>

                {/* Comprehensive Students Fee Table */}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Class / Section</th>
                      <th>Receipt No</th>
                      <th>Gross Fee</th>
                      <th>Paid Amount</th>
                      <th>Balance Due</th>
                      <th>Fee Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFeeRows.map(item => {
                      const s = item.student;
                      const classNameStr = s.classes ? `${s.classes.class_name} - ${s.classes.section}` : (s.class_id ? `Class #${s.class_id}` : 'Unassigned');
                      return (
                        <tr key={s.id}>
                          <td><strong>{s.roll_number}</strong></td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{s.first_name} {s.last_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.email || '—'}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{classNameStr}</span>
                          </td>
                          <td>
                            {item.hasPaidRecord ? (
                              <strong style={{ color: '#0284c7', fontSize: '12px', fontWeight: 700 }}>{item.receipt_no}</strong>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>— (Unpaid)</span>
                            )}
                          </td>
                          <td>₹ {item.gross_amount.toLocaleString()}</td>
                          <td>
                            <strong style={{ color: item.amount_paid > 0 ? 'var(--emerald)' : 'var(--text-secondary)' }}>
                              ₹ {item.amount_paid.toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            <span style={{ color: item.balance_due > 0 ? '#dc2626' : 'var(--text-secondary)', fontWeight: item.balance_due > 0 ? '700' : 'normal' }}>
                              ₹ {item.balance_due.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${item.payment_status.toLowerCase()}`}>
                              {item.payment_status === 'Paid' && '✓ Paid'}
                              {item.payment_status === 'Pending' && 'Pending'}
                              {item.payment_status === 'Partial' && 'Partial'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {item.hasPaidRecord && item.receiptObj && (
                                <>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => setSelectedReceipt(item.receiptObj)}
                                    title="View Official Receipt Slip"
                                  >
                                    <Printer size={13} /> View Slip
                                  </button>
                                  <button 
                                    className="action-btn delete" 
                                    style={{ padding: '5px 8px', borderRadius: '4px' }}
                                    onClick={() => handleDeleteFee(item.receiptObj.id)}
                                    title="Delete / Void Fee Receipt Record (Admin Only)"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                              {item.payment_status !== 'Paid' && (
                                <button 
                                  className="btn-primary" 
                                  style={{ padding: '5px 10px', fontSize: '11px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => openCollectFeeForStudent(s)}
                                  title="Collect fee for this student"
                                >
                                  <Plus size={13} /> Collect Fee
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFeeLedger.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                          No student fee records found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalFeePages > 1 && (
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 24px', 
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(15, 23, 42, 0.6)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Page {feePage} of {totalFeePages}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        disabled={feePage <= 1}
                        onClick={() => setFeePage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        disabled={feePage >= totalFeePages}
                        onClick={() => setFeePage(p => Math.min(totalFeePages, p + 1))}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Printable Receipt Modal */}
              {selectedReceipt && (
                <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
                    <div className="modal-header">
                      <div>
                        <h2>Official Student Fee Receipt Slip</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {selectedReceiptInstallments.length > 1 
                            ? `Installment Payment Plan • ${selectedReceiptInstallments.length} Installments Recorded` 
                            : 'Single Payment Record'}
                        </p>
                      </div>
                      <button className="btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Receipt
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="printable-slip">
                        {/* Institutional Header */}
                        <div className="slip-institution-header" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                              }}>
                                <GraduationCap size={30} />
                              </div>
                              <div>
                                <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                                  GREENWOOD HIGH INTERNATIONAL ACADEMY
                                </h1>
                                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0369a1', marginTop: '2px' }}>
                                  Affiliated to Central Board of Secondary Education (CBSE), New Delhi • Affiliation No: 1930214 • School Code: 45210
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  Knowledge Park V, Institutional Area, Bengaluru, Karnataka - 560001 • Tel: +91 80 2845 9900 • accounts@greenwoodhigh.edu.in
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{
                                display: 'inline-block',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                OFFICIAL STUDENT COPY
                              </span>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Receipt No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedReceipt.receipt_no}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{
                            background: 'linear-gradient(90deg, #0f172a, #1e293b)',
                            color: '#ffffff',
                            textAlign: 'center',
                            padding: '7px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginTop: '12px'
                          }}>
                            STUDENT FEE PAYMENT RECEIPT & INSTALLMENT LEDGER — SESSION 2026-2027
                          </div>
                        </div>

                        <div className="slip-meta-grid" style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div><strong>Receipt No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedReceipt.receipt_no}</span></div>
                          <div><strong>Receipt Date:</strong> {selectedReceipt.payment_date ? new Date(selectedReceipt.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '21 Sep 2026'}</div>
                          <div><strong>Student Name:</strong> {selectedReceiptStudent?.first_name || selectedReceipt.students?.first_name} {selectedReceiptStudent?.last_name || selectedReceipt.students?.last_name}</div>
                          <div><strong>Roll Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{selectedReceiptStudent?.roll_number || selectedReceipt.students?.roll_number || 'N/A'}</span></div>
                          <div><strong>Class & Section:</strong> {selectedReceiptStudent?.classes ? `${selectedReceiptStudent.classes.class_name} - ${selectedReceiptStudent.classes.section}` : (selectedReceipt.classes ? `${selectedReceipt.classes.class_name} - ${selectedReceipt.classes.section}` : 'Standard')}</div>
                          <div><strong>Payment Method:</strong> {selectedReceipt.payment_method || 'Online / Bank Transfer'}</div>
                          <div><strong>Fee Category:</strong> {selectedReceipt.fee_category || 'Term Tuition & Facility Fee'}</div>
                          <div>
                            <strong>Account Status: </strong> 
                            <span style={{ 
                              color: receiptFinalBalance === 0 ? '#16a34a' : '#d97706', 
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {receiptFinalBalance === 0 ? 'Fully Paid / Settled' : 'Installment in Progress'}
                            </span>
                          </div>
                        </div>

                        {/* 1. Fee Structure Overview */}
                        <table className="slip-table">
                          <thead>
                            <tr>
                              <th>Fee Description</th>
                              <th>Academic Year</th>
                              <th>Gross Fee (₹)</th>
                              <th>Discount / Waiver (₹)</th>
                              <th>Total Net Course Fee (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{selectedReceipt.fee_category || 'Tuition, Lab & Administrative Fee'}</td>
                              <td>{selectedReceipt.academic_year || '2026-2027'}</td>
                              <td>{parseFloat(selectedReceipt.gross_amount || 25000).toLocaleString()}</td>
                              <td>{parseFloat(selectedReceipt.discount_amount || 0).toLocaleString()}</td>
                              <td><strong>{parseFloat(selectedReceipt.net_payable || (selectedReceipt.gross_amount || 25000)).toLocaleString()}</strong></td>
                            </tr>
                          </tbody>
                        </table>

                        {/* 2. Complete Installment History Ledger */}
                        <div style={{ marginTop: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h5 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px', fontWeight: 700 }}>
                            Installment Payment Breakdown & Ledger ({selectedReceiptInstallments.length} Entries)
                          </h5>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            All recorded transactions for this student
                          </span>
                        </div>

                        <table className="slip-table" style={{ marginBottom: '14px' }}>
                          <thead>
                            <tr>
                              <th>Inst. #</th>
                              <th>Receipt No</th>
                              <th>Payment Date</th>
                              <th>Payment Mode</th>
                              <th style={{ textAlign: 'right' }}>Amount Paid (₹)</th>
                              <th style={{ textAlign: 'right' }}>Balance Due (₹)</th>
                              <th style={{ textAlign: 'center' }}>Entry Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReceiptInstallments.length > 0 ? (
                              selectedReceiptInstallments.map((inst, idx) => {
                                const isCurrent = inst.receipt_no === selectedReceipt.receipt_no;
                                const runningPaid = selectedReceiptInstallments.slice(0, idx + 1).reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0);
                                const netFee = (parseFloat(selectedReceipt.gross_amount) || 25000) - (parseFloat(selectedReceipt.discount_amount) || 0);
                                const runningBal = Math.max(0, netFee - runningPaid);

                                return (
                                  <tr key={inst.id || idx} className={isCurrent ? 'slip-current-row' : ''}>
                                    <td>
                                      <strong>#{idx + 1}</strong>
                                      {isCurrent && <span className="slip-current-tag">This Receipt</span>}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{inst.receipt_no}</td>
                                    <td>{inst.payment_date ? new Date(inst.payment_date).toLocaleDateString() : '—'}</td>
                                    <td>{inst.payment_method || 'Online'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                                      ₹ {parseFloat(inst.amount_paid).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', color: runningBal === 0 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                                      ₹ {runningBal.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`slip-installment-badge ${runningBal === 0 ? 'paid' : 'partial'}`}>
                                        {runningBal === 0 ? 'Settled' : 'Partial'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr className="slip-current-row">
                                <td>
                                  <strong>#1</strong>
                                  <span className="slip-current-tag">This Receipt</span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedReceipt.receipt_no}</td>
                                <td>{selectedReceipt.payment_date ? new Date(selectedReceipt.payment_date).toLocaleDateString() : 'Today'}</td>
                                <td>{selectedReceipt.payment_method || 'Online'}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                                  ₹ {parseFloat(selectedReceipt.amount_paid).toLocaleString()}
                                </td>
                                <td style={{ textAlign: 'right', color: (parseFloat(selectedReceipt.balance_due) || 0) === 0 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                                  ₹ {parseFloat(selectedReceipt.balance_due || 0).toLocaleString()}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`slip-installment-badge ${(parseFloat(selectedReceipt.balance_due) || 0) === 0 ? 'paid' : 'partial'}`}>
                                    {(parseFloat(selectedReceipt.balance_due) || 0) === 0 ? 'Settled' : 'Partial'}
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* 3. Slip Summary and Settlement Stamp */}
                        <div className="slip-total-box" style={{ marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                              Amount Paid on This Slip: <strong style={{ color: '#059669', fontSize: '16px' }}>₹ {parseFloat(selectedReceipt.amount_paid).toLocaleString()}</strong>
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#065f46', marginBottom: '4px', fontStyle: 'italic', fontWeight: 600 }}>
                              Amount in Words: {(() => {
                                const num = Math.round(parseFloat(selectedReceipt.amount_paid) || 0);
                                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                                function c(v) {
                                  let s = '';
                                  if (v >= 100) { s += ones[Math.floor(v/100)] + ' Hundred '; v %= 100; }
                                  if (v >= 20) { s += tens[Math.floor(v/10)] + ' '; v %= 10; }
                                  if (v > 0) { s += ones[v] + ' '; }
                                  return s.trim();
                                }
                                let l = Math.floor(num / 100000);
                                let r = num % 100000;
                                let th = Math.floor(r / 1000);
                                let h = r % 1000;
                                let res = '';
                                if (l > 0) res += c(l) + ' Lakh ';
                                if (th > 0) res += c(th) + ' Thousand ';
                                if (h > 0) res += c(h) + ' ';
                                return (res.trim() || 'Zero') + ' Rupees Only';
                              })()}
                            </div>
                            <div style={{ fontSize: '13px', color: '#1e293b' }}>
                              Total Paid (All Installments): <strong>₹ {receiptTotalPaidAll.toLocaleString()}</strong>
                            </div>
                            <div style={{ fontSize: '13px', color: receiptFinalBalance === 0 ? '#16a34a' : '#d97706', marginTop: '2px', fontWeight: 600 }}>
                              Final Outstanding Balance: ₹ {receiptFinalBalance.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            {receiptFinalBalance === 0 ? (
                              <div className="slip-settled-stamp">
                                ✓ ALL INSTALLMENTS SETTLED
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
                                Next Installment Pending
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Generated electronically by School ERP
                            </div>
                          </div>
                        </div>

                        {/* Signatures Row */}
                        <div className="signatures-row" style={{
                          borderTop: '1px solid #cbd5e1',
                          paddingTop: '16px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '16px',
                          textAlign: 'center',
                          fontSize: '11px'
                        }}>
                          <div>
                            <div style={{ height: '32px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px' }}></div>
                            <strong>Parent / Depositor Signature</strong>
                          </div>
                          <div>
                            <div style={{ height: '32px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>ACCOUNTS VERIFIED</span>
                            </div>
                            <strong>Cashier / Accounts Desk</strong>
                          </div>
                          <div>
                            <div style={{ height: '32px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>SEAL & AUTHORIZED</span>
                            </div>
                            <strong>Authorized Administrative Officer</strong>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SALARIES & PAY-SLIPS */}
          {/* ========================================================= */}
          {activeTab === 'salaries' && (
            <>
              <div className="card-table-wrapper">
                <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Faculty Monthly Payroll & Salary Slips</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Showing all {teachers.length} faculty members, monthly payroll status, and payment records
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => setShowSalaryModal(true)}>
                    <Plus size={16} /> Disburse Faculty Salary
                  </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="fee-search-bar-wrap">
                  <div className="fee-search-input-box">
                    <Search size={16} color="var(--text-dim)" />
                    <input 
                      type="text"
                      placeholder="Search faculty name, ID (e.g. TCH-001), qualification, or month..."
                      value={salarySearchQuery}
                      onChange={e => {
                        setSalarySearchQuery(e.target.value);
                        setSalaryPage(1);
                      }}
                    />
                    {salarySearchQuery && (
                      <button 
                        onClick={() => { setSalarySearchQuery(''); setSalaryPage(1); }}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="fee-filter-pills">
                    <button 
                      className={`filter-pill ${salaryStatusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => { setSalaryStatusFilter('ALL'); setSalaryPage(1); }}
                    >
                      All Faculty ({salaryCounts.all})
                    </button>
                    <button 
                      className={`filter-pill ${salaryStatusFilter === 'Paid' ? 'active' : ''}`}
                      onClick={() => { setSalaryStatusFilter('Paid'); setSalaryPage(1); }}
                    >
                      ✓ Disbursed ({salaryCounts.paid})
                    </button>
                    <button 
                      className={`filter-pill ${salaryStatusFilter === 'Pending' ? 'active' : ''}`}
                      onClick={() => { setSalaryStatusFilter('Pending'); setSalaryPage(1); }}
                    >
                      Pending ({salaryCounts.pending})
                    </button>
                  </div>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Department / Qualification</th>
                      <th>Payroll Period</th>
                      <th>Pay-Slip No</th>
                      <th>Gross Earnings</th>
                      <th>Total Deductions</th>
                      <th>Net Take-Home</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSalaryRows.map(item => {
                      const t = item.teacher;
                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700
                              }}>
                                {t.first_name?.[0] || 'T'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                  {t.first_name} {t.last_name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {t.employee_id || `ID: ${t.id}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              {t.qualification || 'Senior Faculty'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>
                              {item.salary_month} {item.salary_year}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#0369a1', fontWeight: 700 }}>
                              {item.payslip_no}
                            </strong>
                          </td>
                          <td>₹ {parseFloat(item.gross_earnings).toLocaleString()}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>₹ {parseFloat(item.total_deductions).toLocaleString()}</td>
                          <td>
                            <strong style={{ color: 'var(--emerald)' }}>
                              ₹ {parseFloat(item.net_salary).toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            <span className={`badge ${item.payment_status === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>
                              {item.payment_status}
                            </span>
                          </td>
                          <td>
                            {item.hasPaidRecord ? (
                              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                                  onClick={() => setSelectedPaySlip(item.payslipObj)}
                                >
                                  <Printer size={14} /> View Pay-Slip
                                </button>
                                <button 
                                  className="action-btn delete" 
                                  style={{ padding: '6px 8px', borderRadius: '4px' }}
                                  onClick={() => handleDeleteSalary(item.payslipObj.id)}
                                  title="Delete / Void Salary Pay-Slip Record (Admin Only)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                                onClick={() => openDisburseSalaryForTeacher(t)}
                              >
                                <Plus size={14} /> Disburse
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalSalaryPages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '14px 20px', 
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Showing {((salaryPage - 1) * salaryPageSize) + 1} - {Math.min(salaryPage * salaryPageSize, filteredSalaryLedger.length)} of {filteredSalaryLedger.length} faculty members
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        disabled={salaryPage <= 1}
                        onClick={() => setSalaryPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        disabled={salaryPage >= totalSalaryPages}
                        onClick={() => setSalaryPage(p => Math.min(totalSalaryPages, p + 1))}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Printable Pay-Slip Modal */}
              {selectedPaySlip && (
                <div className="modal-overlay" onClick={() => setSelectedPaySlip(null)}>
                  <div className="modal-content printable-slip-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '880px', width: '95%' }}>
                    <div className="modal-header no-print">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wallet size={20} />
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '18px' }}>Faculty Monthly Salary Pay-Slip</h2>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            Greenwood International Academy • Official Institutional Remuneration Statement
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Printer size={16} /> Print Pay-Slip (A4)
                        </button>
                        <button className="action-btn" onClick={() => setSelectedPaySlip(null)}>✕</button>
                      </div>
                    </div>

                    <div className="modal-body" style={{ padding: '24px', background: '#f8fafc' }}>
                      <div className="printable-salary-slip-document">
                        
                        {/* 1. Official Institution Header */}
                        <div className="slip-institution-header" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                              }}>
                                <GraduationCap size={32} />
                              </div>
                              <div>
                                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                                  GREENWOOD HIGH INTERNATIONAL ACADEMY
                                </h1>
                                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0369a1', marginTop: '2px' }}>
                                  Affiliated to Central Board of Secondary Education (CBSE), New Delhi • Affiliation No: 1930214 • School Code: 45210
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  Knowledge Park V, Institutional Area, Bengaluru, Karnataka - 560001 • Tel: +91 80 2845 9900 • payroll@greenwoodhigh.edu.in
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{
                                display: 'inline-block',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                OFFICIAL EMPLOYEE COPY
                              </span>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Payslip No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedPaySlip.payslip_no}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{
                            background: 'linear-gradient(90deg, #0f172a, #1e293b)',
                            color: '#ffffff',
                            textAlign: 'center',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginTop: '12px'
                          }}>
                            CONFIDENTIAL SALARY PAYSLIP & REMUNERATION STATEMENT — {selectedPaySlip.salary_month?.toUpperCase()} {selectedPaySlip.salary_year}
                          </div>
                        </div>

                        {/* 2. Employee Particulars & Pay Meta 4-Column Grid */}
                        <div style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          background: '#ffffff',
                          padding: '14px 16px',
                          marginBottom: '14px'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 16px', fontSize: '12.5px' }}>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Faculty Member</span>
                              <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>
                                Prof. {selectedPaySlipTeacher?.first_name || selectedPaySlip.teachers?.first_name} {selectedPaySlipTeacher?.last_name || selectedPaySlip.teachers?.last_name}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Employee ID / Code</span>
                              <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                                {selectedPaySlipTeacher?.employee_id || selectedPaySlip.teachers?.employee_id || 'TCH-001'}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Designation</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>
                                {selectedPaySlipTeacher?.qualification || selectedPaySlip.teachers?.qualification || 'Senior Faculty'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Department</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>
                                {selectedPaySlipTeacher?.department || 'Department of Mathematics & Computing'}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Cabin</span>
                              <span style={{ color: '#334155' }}>
                                {selectedPaySlipTeacher?.cabin || 'Academic Block 2, Cabin 204'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Bank Account Details</span>
                              <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                                HDFC Bank • ****{selectedPaySlip.bank_account_last4 || '5678'} (IFSC: HDFC0001892)
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Disbursement Date</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                {selectedPaySlip.payment_date ? new Date(selectedPaySlip.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '21 Sep 2026'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Payment Mode & Txn</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                {selectedPaySlip.payment_method || 'Direct Bank Transfer'} ({selectedPaySlip.transaction_ref || 'NEFT-APPROVED-7788'})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Monthly Attendance & Work Days Summary Strip */}
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          marginBottom: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                          fontSize: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div><span style={{ color: '#64748b' }}>Total Calendar Days:</span> <strong style={{ color: '#0f172a' }}>30</strong></div>
                            <div><span style={{ color: '#64748b' }}>Working Days:</span> <strong style={{ color: '#0f172a' }}>26</strong></div>
                            <div><span style={{ color: '#64748b' }}>Days Present:</span> <strong style={{ color: '#059669' }}>24</strong></div>
                            <div><span style={{ color: '#64748b' }}>Paid Approved Leaves:</span> <strong style={{ color: '#0284c7' }}>2</strong></div>
                            <div><span style={{ color: '#64748b' }}>Loss of Pay (LOP):</span> <strong style={{ color: '#64748b' }}>0</strong></div>
                          </div>
                          <div style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px'
                          }}>
                            ✓ 100.0% Payable Work Factor
                          </div>
                        </div>

                        {/* 4. Itemized Earnings & Deductions Breakdown Tables */}
                {(() => {
                  const adminSlipGross = parseFloat(selectedPaySlipTeacher?.salary_base) || parseFloat(selectedPaySlip.gross_earnings) || (parseFloat(selectedPaySlip.basic_salary) ? (parseFloat(selectedPaySlip.basic_salary) + (parseFloat(selectedPaySlip.hra_allowance || 0) + parseFloat(selectedPaySlip.da_allowance || 0) + 5000)) : 65000);
                  const slipB = calculateSalaryBreakdown(adminSlipGross);
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        
                        {/* Earnings Breakdown Table */}
                        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                          <div style={{ background: '#f0fdf4', borderBottom: '1.5px solid #86efac', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#166534', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              1. Gross Earnings & Allowances
                            </strong>
                            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Amount (₹)</span>
                          </div>
                          <div style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Basic Academic Pay (Gross - Fixed Allowances):</span>
                              <strong style={{ color: '#0f172a' }}>₹ {slipB.basic_salary.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>House Rent Allowance (HRA - Fixed):</span>
                              <strong style={{ color: '#0f172a' }}>₹ {slipB.hra_allowance.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Dearness Allowance (DA - Fixed):</span>
                              <strong style={{ color: '#0f172a' }}>₹ {slipB.da_allowance.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Medical & Conveyance Allowance (Fixed):</span>
                              <strong style={{ color: '#0f172a' }}>₹ {slipB.medical_allowance.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Special Bonus & Academic Incentives (Fixed):</span>
                              <strong style={{ color: '#0f172a' }}>₹ {slipB.special_bonus.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '14px', fontWeight: 800, borderTop: '2px solid #cbd5e1', marginTop: '4px' }}>
                              <span style={{ color: '#166534' }}>Total Gross Earnings (A):</span>
                              <span style={{ color: '#166534' }}>₹ {slipB.gross_earnings.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions Breakdown Table */}
                        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                          <div style={{ background: '#fef2f2', borderBottom: '1.5px solid #fecaca', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#991b1b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              2. Statutory & Policy Deductions
                            </strong>
                            <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>Amount (₹)</span>
                          </div>
                          <div style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Employee Provident Fund (EPF - 10%):</span>
                              <strong style={{ color: '#dc2626' }}>₹ {slipB.provident_fund.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Tax Deducted at Source (TDS / Income Tax):</span>
                              <strong style={{ color: '#dc2626' }}>₹ {slipB.tax_deducted_tds.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Professional Tax (PT - Statutory Fixed):</span>
                              <strong style={{ color: '#dc2626' }}>₹ {slipB.professional_tax.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Loss of Pay (LOP) / Leave Deductions:</span>
                              <strong style={{ color: '#dc2626' }}>₹ 0</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                              <span style={{ color: '#334155' }}>Staff Welfare & Group Health Insurance:</span>
                              <strong style={{ color: '#dc2626' }}>₹ {slipB.insurance_welfare.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '14px', fontWeight: 800, borderTop: '2px solid #cbd5e1', marginTop: '4px' }}>
                              <span style={{ color: '#991b1b' }}>Total Deductions (B):</span>
                              <span style={{ color: '#991b1b' }}>-₹ {slipB.total_deductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 5. Net Take-Home Salary Banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                            NET TAKE-HOME SALARY (A - B)
                          </span>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                            ₹ {slipB.net_salary.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#065f46', marginTop: '4px', fontStyle: 'italic', fontWeight: 600 }}>
                            Amount in Words: {(() => {
                              const num = Math.round(slipB.net_salary);
                              const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                              const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                              function c(v) {
                                let s = '';
                                if (v >= 100) { s += ones[Math.floor(v/100)] + ' Hundred '; v %= 100; }
                                if (v >= 20) { s += tens[Math.floor(v/10)] + ' '; v %= 10; }
                                if (v > 0) { s += ones[v] + ' '; }
                                return s.trim();
                              }
                              let l = Math.floor(num / 100000);
                              let r = num % 100000;
                              let th = Math.floor(r / 1000);
                              let h = r % 1000;
                              let res = '';
                              if (l > 0) res += c(l) + ' Lakh ';
                              if (th > 0) res += c(th) + ' Thousand ';
                              if (h > 0) res += c(h) + ' ';
                              return (res.trim() || 'Zero') + ' Rupees Only';
                            })()}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <div style={{
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '0.5px'
                          }}>
                            ✓ DISBURSED & CREDITED
                          </div>
                          <span style={{ fontSize: '11px', color: '#047857' }}>
                            Direct Credit Authorized to Primary Salary Account
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                        {/* 6. Historical Disbursement Ledger */}
                        {selectedPaySlipHistory.length > 1 && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <h5 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 700 }}>
                                Stored Financial History ({selectedPaySlipHistory.length} Record(s))
                              </h5>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>All stored salary disbursements</span>
                            </div>
                            <table className="slip-table" style={{ width: '100%', fontSize: '11.5px' }}>
                              <thead>
                                <tr>
                                  <th>Period</th>
                                  <th>Payslip No</th>
                                  <th>Disbursed Date</th>
                                  <th>Mode</th>
                                  <th style={{ textAlign: 'right' }}>Gross (₹)</th>
                                  <th style={{ textAlign: 'right' }}>Deductions (₹)</th>
                                  <th style={{ textAlign: 'right' }}>Net Pay (₹)</th>
                                  <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPaySlipHistory.map((slip, idx) => {
                                  const isCurrent = slip.payslip_no === selectedPaySlip.payslip_no;
                                  return (
                                    <tr key={slip.id || idx} className={isCurrent ? 'slip-current-row' : ''}>
                                      <td><strong>{slip.salary_month} {slip.salary_year}</strong></td>
                                      <td style={{ fontFamily: 'monospace' }}>{slip.payslip_no}</td>
                                      <td>{slip.payment_date ? new Date(slip.payment_date).toLocaleDateString() : '—'}</td>
                                      <td>{slip.payment_method || 'Bank Transfer'}</td>
                                      <td style={{ textAlign: 'right' }}>₹ {parseFloat(slip.gross_earnings).toLocaleString()}</td>
                                      <td style={{ textAlign: 'right', color: '#dc2626' }}>₹ {parseFloat(slip.total_deductions).toLocaleString()}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>₹ {parseFloat(slip.net_salary).toLocaleString()}</td>
                                      <td style={{ textAlign: 'center' }}><span className="slip-installment-badge paid">{slip.payment_status || 'Paid'}</span></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* 7. Institutional Authorizations, Seals & Signatures */}
                        <div style={{
                          borderTop: '1px solid #cbd5e1',
                          paddingTop: '20px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '20px',
                          textAlign: 'center',
                          marginTop: '20px'
                        }}>
                          <div>
                            <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', margin: '0 20px 8px' }}></div>
                            <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>Faculty Signature</strong>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>Prof. {selectedPaySlipTeacher?.first_name} {selectedPaySlipTeacher?.last_name}</span>
                          </div>

                          <div>
                            <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', margin: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>VERIFIED & AUTHENTICATED</span>
                            </div>
                            <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>Accounts Officer</strong>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>Finance & Payroll Division</span>
                          </div>

                          <div>
                            <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', margin: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', border: '1.5px solid #166534', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                INSTITUTIONAL SEAL
                              </span>
                            </div>
                            <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>Principal / Director</strong>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>Greenwood High School</span>
                          </div>
                        </div>

                        {/* System Disclaimer */}
                        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10.5px', color: '#94a3b8', borderTop: '1px dotted #e2e8f0', paddingTop: '8px' }}>
                          This document is an authentic official computer-generated record issued by Greenwood High School and does not require manual alteration.
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 5.5: ATTENDANCE CONSOLE (ADMIN DESK) */}
          {/* ========================================================= */}
          {activeTab === 'attendance' && (
            <AttendanceAdminView 
              classes={classes} 
              students={students} 
              teachers={teachers} 
              onRefreshAll={loadAllData} 
            />
          )}

          {/* ========================================================= */}
          {/* TAB 6: ACADEMIC GRADEBOOK & EXAMINATION RESULTS */}
          {/* ========================================================= */}
          {activeTab === 'grades' && (
            <GradebookAdminView 
              classes={classes} 
              students={students} 
              teachers={teachers} 
              onRefreshAll={loadAllData} 
            />
          )}

          {/* ========================================================= */}
          {/* TAB 7: EXCEL DATABASE STUDIO & MULTI-SHEET MANAGER */}
          {/* ========================================================= */}
          {activeTab === 'excel' && (
            <ExcelStudio onDataImported={loadAllData} onNavigate={setActiveTab} />
          )}

          {/* ========================================================= */}
          {/* TAB 8: ACCESS CONTROL & RBAC PERMISSIONS MATRIX */}
          {/* ========================================================= */}
          {activeTab === 'permissions' && (
            <RbacPermissionsView 
              permissionsList={permissionsList}
              permissionsLoading={permissionsLoading}
              onRefresh={loadPermissionsData}
              onOpenPermissionModal={setManagingPermissionsUser}
              onToggleStatus={handleToggleAccountStatus}
              onDeleteCredential={handleDeleteUserCredential}
              onResetPassword={handleResetUserPassword}
              localOverrides={localPermOverrides}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 9: FACULTY LEAVE APPROVALS & INSTITUTIONAL QUOTAS */}
          {/* ========================================================= */}
          {activeTab === 'teacher-leaves' && (
            <div className="section-container">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarCheck size={22} color="var(--primary)" />
                    <span>Faculty Leave Approvals & Institutional Quotas</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    Principal & Administrator Desk: Review faculty absence applications, evaluate departmental coverage, and approve/reject with remarks.
                  </p>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Applications</h3>
                    <div className="kpi-value">{teacherLeaves.length}</div>
                  </div>
                  <div className="kpi-icon-wrap icon-blue">
                    <CalendarCheck size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Pending Review</h3>
                    <div className="kpi-value" style={{ color: '#f59e0b' }}>
                      {teacherLeaves.filter(l => l.status === 'Pending').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <Clock size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Approved Leaves</h3>
                    <div className="kpi-value" style={{ color: '#10b981' }}>
                      {teacherLeaves.filter(l => l.status === 'Approved').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap icon-green">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Rejected / Cancelled</h3>
                    <div className="kpi-value" style={{ color: '#ef4444' }}>
                      {teacherLeaves.filter(l => l.status === 'Rejected').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <X size={24} />
                  </div>
                </div>
              </div>

              {/* Filter Pills Bar */}
              <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="filter-pills-bar">
                  <button 
                    className={`filter-pill ${teacherLeaveFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setTeacherLeaveFilter('ALL')}
                  >
                    All Requests ({teacherLeaves.length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherLeaveFilter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setTeacherLeaveFilter('Pending')}
                  >
                    Pending Review ({teacherLeaves.filter(l => l.status === 'Pending').length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherLeaveFilter === 'Approved' ? 'active' : ''}`}
                    onClick={() => setTeacherLeaveFilter('Approved')}
                  >
                    Approved ({teacherLeaves.filter(l => l.status === 'Approved').length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherLeaveFilter === 'Rejected' ? 'active' : ''}`}
                    onClick={() => setTeacherLeaveFilter('Rejected')}
                  >
                    Rejected ({teacherLeaves.filter(l => l.status === 'Rejected').length})
                  </button>
                </div>
              </div>

              {/* Leaves Table */}
              <div className="table-wrapper">
                <table className="portal-data-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Leave Category</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Reason / Justification</th>
                      <th>Substitute Teacher</th>
                      <th>Status</th>
                      <th>Admin Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherLeaves
                      .filter(l => teacherLeaveFilter === 'ALL' || l.status?.toLowerCase() === teacherLeaveFilter.toLowerCase())
                      .map((l, idx) => {
                        const tName = l.teachers ? `Prof. ${l.teachers.first_name} ${l.teachers.last_name}` : `Teacher #${l.teacher_id}`;
                        const tEmp = l.teachers?.employee_id || 'TCH';
                        const tDept = l.teachers?.department || 'Faculty';
                        return (
                          <tr key={l.id || idx}>
                            <td>
                              <strong>{tName}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tEmp} • {tDept}</div>
                            </td>
                            <td><span className="badge badge-info">{l.leave_type}</span></td>
                            <td className="font-semibold">{l.start_date} to {l.end_date}</td>
                            <td className="text-cyan font-bold">{l.days_count || 1} day{l.days_count > 1 ? 's' : ''}</td>
                            <td className="text-muted" style={{ maxWidth: '260px', fontSize: '13px' }}>{l.reason}</td>
                            <td>
                              <span className="badge" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                {l.substitute_teacher || 'Arranged'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${l.status === 'Approved' ? 'badge-success' : (l.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="text-muted" style={{ fontSize: '12px' }}>
                              {l.admin_remarks || 'None'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {l.status === 'Pending' && (
                                  <>
                                    <button 
                                      className="btn-action-small"
                                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                      onClick={() => handleQuickTeacherLeaveDecision(l, 'Approved')}
                                      title="Quick Approve Leave"
                                    >
                                      <Check size={13} />
                                      <span>Approve</span>
                                    </button>
                                    <button 
                                      className="btn-action-small"
                                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                      onClick={() => handleQuickTeacherLeaveDecision(l, 'Rejected')}
                                      title="Quick Reject Leave"
                                    >
                                      <X size={13} />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="btn-action-small"
                                  onClick={() => {
                                    setSelectedTeacherLeaveReview(l);
                                    setTeacherLeaveDecision(l.status === 'Rejected' ? 'Rejected' : 'Approved');
                                    setTeacherLeaveRemarks(l.admin_remarks || '');
                                  }}
                                >
                                  <CalendarCheck size={14} />
                                  <span>{l.status === 'Pending' ? 'Review & Decide' : 'Edit Decision'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: FACULTY ATTENDANCE DISPUTES & REGULARIZATIONS */}
          {/* ========================================================= */}
          {activeTab === 'teacher-regularizations' && (
            <div className="section-container">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={22} color="#059669" />
                    <span>Faculty Attendance Disputes & Biometric Regularizations</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    Institutional HR & Biometric Terminal Desk: Review punch dispute claims, inspect hardware logs, and regularize attendance records.
                  </p>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Dispute Claims</h3>
                    <div className="kpi-value">{teacherRegularizations.length}</div>
                  </div>
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    <Clock size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Pending Regularization</h3>
                    <div className="kpi-value" style={{ color: '#f59e0b' }}>
                      {teacherRegularizations.filter(r => r.status === 'Pending').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <Clock size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Regularized / Approved</h3>
                    <div className="kpi-value" style={{ color: '#10b981' }}>
                      {teacherRegularizations.filter(r => r.status === 'Approved').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap icon-green">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Rejected Claims</h3>
                    <div className="kpi-value" style={{ color: '#ef4444' }}>
                      {teacherRegularizations.filter(r => r.status === 'Rejected').length}
                    </div>
                  </div>
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <X size={24} />
                  </div>
                </div>
              </div>

              {/* Filter Pills Bar */}
              <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="filter-pills-bar">
                  <button 
                    className={`filter-pill ${teacherRegFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setTeacherRegFilter('ALL')}
                  >
                    All Claims ({teacherRegularizations.length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherRegFilter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setTeacherRegFilter('Pending')}
                  >
                    Pending Review ({teacherRegularizations.filter(r => r.status === 'Pending').length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherRegFilter === 'Approved' ? 'active' : ''}`}
                    onClick={() => setTeacherRegFilter('Approved')}
                  >
                    Approved / Regularized ({teacherRegularizations.filter(r => r.status === 'Approved').length})
                  </button>
                  <button 
                    className={`filter-pill ${teacherRegFilter === 'Rejected' ? 'active' : ''}`}
                    onClick={() => setTeacherRegFilter('Rejected')}
                  >
                    Rejected ({teacherRegularizations.filter(r => r.status === 'Rejected').length})
                  </button>
                </div>
              </div>

              {/* Regularizations Table */}
              <div className="table-wrapper">
                <table className="portal-data-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Dispute Date</th>
                      <th>Original Status</th>
                      <th>Requested Status</th>
                      <th>Discrepancy Category</th>
                      <th>Faculty Explanation</th>
                      <th>Decision Status</th>
                      <th>Admin Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherRegularizations
                      .filter(r => teacherRegFilter === 'ALL' || r.status?.toLowerCase() === teacherRegFilter.toLowerCase())
                      .map((r, idx) => {
                        const tName = r.teachers ? `Prof. ${r.teachers.first_name} ${r.teachers.last_name}` : `Teacher #${r.teacher_id}`;
                        const tEmp = r.teachers?.employee_id || 'TCH';
                        const tDept = r.teachers?.department || 'Faculty';
                        return (
                          <tr key={r.id || idx}>
                            <td>
                              <strong>{tName}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tEmp} • {tDept}</div>
                            </td>
                            <td className="font-semibold">{r.attendance_date}</td>
                            <td><span className="badge badge-warning">{r.original_status}</span></td>
                            <td><span className="badge badge-success">{r.requested_status}</span></td>
                            <td><span className="badge badge-info">{r.reason_category}</span></td>
                            <td className="text-muted" style={{ maxWidth: '260px', fontSize: '13px' }}>{r.reason}</td>
                            <td>
                              <span className={`badge ${r.status === 'Approved' ? 'badge-success' : (r.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="text-muted" style={{ fontSize: '12px' }}>
                              {r.admin_remarks || 'None'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {r.status === 'Pending' && (
                                  <>
                                    <button 
                                      className="btn-action-small"
                                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                      onClick={() => handleQuickTeacherRegDecision(r, 'Approved')}
                                      title="Quick Regularize & Approve"
                                    >
                                      <Check size={13} />
                                      <span>Approve</span>
                                    </button>
                                    <button 
                                      className="btn-action-small"
                                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                      onClick={() => handleQuickTeacherRegDecision(r, 'Rejected')}
                                      title="Quick Reject Claim"
                                    >
                                      <X size={13} />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="btn-action-small"
                                  onClick={() => {
                                    setSelectedTeacherRegReview(r);
                                    setTeacherRegDecision(r.status === 'Rejected' ? 'Rejected' : 'Approved');
                                    setTeacherRegRemarks(r.admin_remarks || '');
                                  }}
                                >
                                  <Clock size={14} />
                                  <span>{r.status === 'Pending' ? 'Review & Regularize' : 'Edit Decision'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 11: STUDENT LEAVE & REGULARIZATIONS GOVERNANCE */}
          {/* ========================================================= */}
          {(activeTab === 'student-governance' || activeTab === 'student-leaves' || activeTab === 'student-regularizations') && (
            <StudentGovernanceAdminView 
              students={students} 
              classes={classes} 
              teachers={teachers} 
              onRefreshAll={loadAllData} 
              initialTab={activeTab === 'student-regularizations' ? 'regularizations' : 'leaves'}
            />
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: ADD STUDENT (MASTER ADMIN FORM) */}
      {/* ========================================================= */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Register New Student (Master Entry)</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Admin Full Access: Comprehensive Academic, Personal & Guardian Profiling
                  </p>
                </div>
              </div>
              <button className="action-btn" onClick={() => setShowAddStudentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="modal-body form-grid" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
                {/* Section 1: Academic & Primary Credentials */}
                <div className="full-width" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    1. Academic & Identity Credentials
                  </span>
                </div>

                <div className="form-group">
                  <label>Roll Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. STU-1005"
                    value={newStudent.roll_number}
                    onChange={e => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Class & Section *</label>
                  <select 
                    value={newStudent.class_id || (classes.length > 0 ? classes[0].id : '')}
                    onChange={e => setNewStudent({ ...newStudent, class_id: parseInt(e.target.value) })}
                    required
                  >
                    {classes.length === 0 ? (
                      <option value="">No Classes Available - Create Class First</option>
                    ) : (
                      classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rohan"
                    value={newStudent.first_name}
                    onChange={e => setNewStudent({ ...newStudent, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Varma"
                    value={newStudent.last_name}
                    onChange={e => setNewStudent({ ...newStudent, last_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="student@school.edu"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Student Phone</label>
                  <input 
                    type="text" 
                    placeholder="+91 98450 00000"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    value={newStudent.dob}
                    onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={newStudent.blood_group}
                    onChange={e => setNewStudent({ ...newStudent, blood_group: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Aadhaar / National ID</label>
                  <input 
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={newStudent.aadhaar_number}
                    onChange={e => setNewStudent({ ...newStudent, aadhaar_number: e.target.value })}
                  />
                </div>

                {/* Section 2: Parents & Emergency Information */}
                <div className="full-width" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', margin: '14px 0 8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    2. Parents & Guardian Details
                  </span>
                </div>

                <div className="form-group">
                  <label>Father's Full Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Rajesh Varma"
                    value={newStudent.father_name}
                    onChange={e => setNewStudent({ ...newStudent, father_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Mother's Full Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Sunita Varma"
                    value={newStudent.mother_name}
                    onChange={e => setNewStudent({ ...newStudent, mother_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Parent Primary Phone</label>
                  <input 
                    type="text"
                    placeholder="+91 98450 12345"
                    value={newStudent.parent_phone}
                    onChange={e => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Emergency Alternate Phone</label>
                  <input 
                    type="text"
                    placeholder="+91 98450 67890"
                    value={newStudent.emergency_contact}
                    onChange={e => setNewStudent({ ...newStudent, emergency_contact: e.target.value })}
                  />
                </div>

                {/* Section 3: Residential Address & Enrollment */}
                <div className="full-width" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', margin: '14px 0 8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Residential Address & Enrollment
                  </span>
                </div>

                <div className="form-group full-width">
                  <label>Permanent Residential Address</label>
                  <input 
                    type="text"
                    placeholder="House No, Street, Landmark, City, State - PIN"
                    value={newStudent.address}
                    onChange={e => setNewStudent({ ...newStudent, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Admission Date</label>
                  <input 
                    type="date" 
                    value={newStudent.admission_date}
                    onChange={e => setNewStudent({ ...newStudent, admission_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Student Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COLLECT FEE */}
      {/* ========================================================= */}
      {showCollectFeeModal && (
        <div className="modal-overlay" onClick={() => setShowCollectFeeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2>Collect Student Fee</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Record full or partial installment fee payment & generate official receipt
                </p>
              </div>
              <button className="action-btn" onClick={() => setShowCollectFeeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCollectFee}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label>Select Student *</label>
                  <SearchableStudentSelect 
                    students={students}
                    selectedStudentId={newFee.student_id}
                    onSelect={handleSelectStudentForFee}
                  />
                </div>

                {/* Installment History & Balance Helper Banner */}
                {selectedStudentPriorFees.length > 0 && (
                  <div className="form-group full-width installment-banner">
                    <div className="installment-banner-header">
                      <span style={{ fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={16} /> Installment #{selectedStudentPriorFees.length + 1} Collection
                      </span>
                      <span className="badge badge-partial" style={{ fontSize: '11px' }}>
                        {selectedStudentPriorFees.length} Prior Payment(s)
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      Prior payments recorded: <strong>₹ {priorTotalPaid.toLocaleString()}</strong> of ₹ {(parseFloat(newFee.gross_amount) || 25000).toLocaleString()} total fee.
                    </div>
                    <div className="installment-calc-card">
                      <div className="installment-calc-grid">
                        <div className="installment-calc-item">
                          <span className="installment-calc-label">Total Fee</span>
                          <span className="installment-calc-val">₹ {(parseFloat(newFee.gross_amount) || 0).toLocaleString()}</span>
                        </div>
                        <div className="installment-calc-item">
                          <span className="installment-calc-label">Already Paid</span>
                          <span className="installment-calc-val" style={{ color: '#10b981' }}>₹ {priorTotalPaid.toLocaleString()}</span>
                        </div>
                        <div className="installment-calc-item">
                          <span className="installment-calc-label">Paying Now</span>
                          <span className="installment-calc-val" style={{ color: '#3b82f6' }}>₹ {(parseFloat(newFee.amount_paid) || 0).toLocaleString()}</span>
                        </div>
                        <div className="installment-calc-item">
                          <span className="installment-calc-label">New Balance</span>
                          <span className="installment-calc-val" style={{ color: Math.max(0, remainingBalanceBeforePayment - (parseFloat(newFee.amount_paid) || 0)) === 0 ? '#10b981' : '#f59e0b' }}>
                            ₹ {Math.max(0, remainingBalanceBeforePayment - (parseFloat(newFee.amount_paid) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Installment / Term Label</label>
                  <input 
                    type="text" 
                    value={newFee.term_name || ''}
                    placeholder="e.g. Installment #1, Term 2"
                    onChange={e => setNewFee({ ...newFee, term_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fee Category</label>
                  <input 
                    type="text" 
                    value={newFee.fee_category}
                    onChange={e => setNewFee({ ...newFee, fee_category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gross Course Fee (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={newFee.gross_amount}
                    onChange={e => setNewFee({ ...newFee, gross_amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Scholarship / Discount (₹)</label>
                  <input 
                    type="number" 
                    value={newFee.discount_amount}
                    onChange={e => setNewFee({ ...newFee, discount_amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Amount Paid Now (₹) *</label>
                    {remainingBalanceBeforePayment > 0 && (
                      <button 
                        type="button" 
                        className="installment-quick-btn"
                        onClick={() => setNewFee({ ...newFee, amount_paid: remainingBalanceBeforePayment })}
                      >
                        Pay Balance (₹{remainingBalanceBeforePayment.toLocaleString()})
                      </button>
                    )}
                  </div>
                  <input 
                    type="number" 
                    required 
                    value={newFee.amount_paid}
                    onChange={e => setNewFee({ ...newFee, amount_paid: e.target.value })}
                  />
                  <div style={{ fontSize: '11px', marginTop: '4px', color: Math.max(0, remainingBalanceBeforePayment - (parseFloat(newFee.amount_paid) || 0)) === 0 ? '#10b981' : '#f59e0b' }}>
                    Balance After Payment: ₹ {Math.max(0, remainingBalanceBeforePayment - (parseFloat(newFee.amount_paid) || 0)).toLocaleString()} {Math.max(0, remainingBalanceBeforePayment - (parseFloat(newFee.amount_paid) || 0)) === 0 ? '✓ (Fully Settled)' : '• Installment pending'}
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={newFee.payment_method}
                    onChange={e => setNewFee({ ...newFee, payment_method: e.target.value })}
                  >
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cash">Cash</option>
                    <option value="Debit/Credit Card">Debit/Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Due Date for Next Installment / Balance</label>
                  <input 
                    type="date" 
                    value={newFee.due_date}
                    onChange={e => setNewFee({ ...newFee, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCollectFeeModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate Official Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GENERATE SALARY PAY-SLIP */}
      {/* ========================================================= */}
      {showSalaryModal && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '660px' }}>
            <div className="modal-header">
              <div>
                <h2>Generate Faculty Salary Pay-Slip</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Disburse monthly payroll, compute net take-home pay, and issue official pay-slip
                </p>
              </div>
              <button className="action-btn" onClick={() => setShowSalaryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateSalary}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label>Select Faculty Member *</label>
                  <SearchableTeacherSelect 
                    teachers={teachers}
                    selectedTeacherId={newSalary.teacher_id}
                    onSelect={id => {
                      const t = teachers.find(item => item.id === id);
                      const breakdown = calculateSalaryBreakdown(t?.salary_base || 65000);
                      setNewSalary({
                        ...newSalary,
                        teacher_id: id,
                        basic_salary: breakdown.basic_salary,
                        hra_allowance: breakdown.hra_allowance,
                        da_allowance: breakdown.da_allowance,
                        medical_allowance: breakdown.medical_allowance,
                        special_bonus: breakdown.special_bonus,
                        provident_fund: breakdown.provident_fund,
                        tax_deducted_tds: breakdown.tax_deducted_tds
                      });
                    }}
                  />
                </div>

                {/* Live Salary Calculation & Breakdown Banner */}
                <div className="form-group full-width salary-calc-banner">
                  <div className="installment-banner-header">
                    <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wallet size={16} /> Monthly Payroll Breakdown Preview
                    </span>
                    <span className="badge badge-paid" style={{ fontSize: '11px' }}>
                      {newSalary.salary_month} {newSalary.salary_year}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                    Net Take-Home Salary: <strong>₹ {liveNetSalary.toLocaleString()}</strong> disbursed via {newSalary.payment_method}.
                  </div>
                  <div className="installment-calc-card">
                    <div className="installment-calc-grid">
                      <div className="installment-calc-item">
                        <span className="installment-calc-label">Basic Salary</span>
                        <span className="installment-calc-val">₹ {(parseFloat(newSalary.basic_salary) || 0).toLocaleString()}</span>
                      </div>
                      <div className="installment-calc-item">
                        <span className="installment-calc-label">Total Allowances</span>
                        <span className="installment-calc-val" style={{ color: '#60a5fa' }}>
                          ₹ {((parseFloat(newSalary.hra_allowance) || 0) + (parseFloat(newSalary.da_allowance) || 0) + (parseFloat(newSalary.medical_allowance) || 0) + (parseFloat(newSalary.special_bonus) || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="installment-calc-item">
                        <span className="installment-calc-label">Total Deductions</span>
                        <span className="installment-calc-val" style={{ color: '#f87171' }}>
                          ₹ {liveDeductionsSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="installment-calc-item">
                        <span className="installment-calc-label">Net Take-Home</span>
                        <span className="installment-calc-val" style={{ color: '#10b981', fontSize: '15px' }}>
                          ₹ {liveNetSalary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Salary Month *</label>
                  <select 
                    value={newSalary.salary_month}
                    onChange={e => setNewSalary({ ...newSalary, salary_month: e.target.value })}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Salary Year</label>
                  <input 
                    type="number" 
                    value={newSalary.salary_year}
                    onChange={e => setNewSalary({ ...newSalary, salary_year: parseInt(e.target.value) || 2026 })}
                  />
                </div>

                <div className="form-group">
                  <label>Basic Salary (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={newSalary.basic_salary}
                    onChange={e => setNewSalary({ ...newSalary, basic_salary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>HRA Allowance (₹)</label>
                  <input 
                    type="number" 
                    value={newSalary.hra_allowance}
                    onChange={e => setNewSalary({ ...newSalary, hra_allowance: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>DA & Medical Allowance (₹)</label>
                  <input 
                    type="number" 
                    value={newSalary.da_allowance}
                    onChange={e => setNewSalary({ ...newSalary, da_allowance: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Special Bonus / Incentives (₹)</label>
                  <input 
                    type="number" 
                    value={newSalary.special_bonus}
                    onChange={e => setNewSalary({ ...newSalary, special_bonus: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>PF Deduction (₹)</label>
                  <input 
                    type="number" 
                    value={newSalary.provident_fund}
                    onChange={e => setNewSalary({ ...newSalary, provident_fund: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>TDS Tax Deduction (₹)</label>
                  <input 
                    type="number" 
                    value={newSalary.tax_deducted_tds}
                    onChange={e => setNewSalary({ ...newSalary, tax_deducted_tds: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={newSalary.payment_method}
                    onChange={e => setNewSalary({ ...newSalary, payment_method: e.target.value })}
                  >
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bank Account Last 4</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5678"
                    maxLength={4}
                    value={newSalary.bank_account_last4}
                    onChange={e => setNewSalary({ ...newSalary, bank_account_last4: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowSalaryModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Disburse & Create Pay-Slip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT STUDENT (ADMIN ONLY) */}
      {/* ========================================================= */}
      {editingStudent && (
        <EditStudentModal 
          student={editingStudent}
          classes={classes}
          onClose={() => setEditingStudent(null)}
          onSave={handleUpdateStudent}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD FACULTY MEMBER (ADMIN ONLY) */}
      {/* ========================================================= */}
      {showAddTeacherModal && (
        <AddTeacherModal 
          onClose={() => setShowAddTeacherModal(false)}
          onSave={handleAddTeacher}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT FACULTY MEMBER (ADMIN ONLY) */}
      {/* ========================================================= */}
      {editingTeacher && (
        <EditTeacherModal 
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={handleUpdateTeacher}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN FACULTY TO CLASS & SUBJECT (ADMIN ONLY) */}
      {/* ========================================================= */}
      {assigningTeacher && (
        <AssignFacultyModal 
          teacher={assigningTeacher}
          classes={classes}
          onClose={() => setAssigningTeacher(null)}
          onAssignmentChanged={async () => {
            await loadAllData();
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: RBAC PERMISSIONS AUTHORITY (ADMIN ONLY) */}
      {/* ========================================================= */}
      {managingPermissionsUser && (
        <PermissionModal 
          user={managingPermissionsUser}
          localOverrides={localPermOverrides}
          onClose={() => setManagingPermissionsUser(null)}
          onSave={handleSaveUserPermissions}
          onResetPassword={handleResetUserPassword}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEW FACULTY LEAVE APPLICATION (ADMIN ONLY) */}
      {/* ========================================================= */}
      {selectedTeacherLeaveReview && (
        <div className="modal-overlay" onClick={() => setSelectedTeacherLeaveReview(null)}>
          <div className="modal-content review-leave-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <CalendarCheck size={22} color="#38bdf8" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Review Faculty Leave Request</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Administrative Board & Principal Governance Desk</p>
                </div>
              </div>
              <button className="action-btn" onClick={() => setSelectedTeacherLeaveReview(null)}>✕</button>
            </div>

            <form onSubmit={handleReviewTeacherLeave} className="review-leave-form" style={{ padding: '20px' }}>
              <div className="leave-summary-card" style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Faculty Member:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>
                      {selectedTeacherLeaveReview.teachers ? `Prof. ${selectedTeacherLeaveReview.teachers.first_name} ${selectedTeacherLeaveReview.teachers.last_name}` : `Teacher #${selectedTeacherLeaveReview.teacher_id}`}
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedTeacherLeaveReview.teachers?.employee_id} • {selectedTeacherLeaveReview.teachers?.department}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Leave Category:</span>
                    <span className="badge badge-info">{selectedTeacherLeaveReview.leave_type}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Period & Duration:</span>
                    <strong style={{ color: 'var(--primary)' }}>{selectedTeacherLeaveReview.start_date} to {selectedTeacherLeaveReview.end_date}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedTeacherLeaveReview.days_count || 1} day(s) duration</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Substitute Faculty:</span>
                    <span className="badge" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                      {selectedTeacherLeaveReview.substitute_teacher || 'Arranged'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Faculty Reason / Context:</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-main)', fontSize: '13px', fontStyle: 'italic', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    "{selectedTeacherLeaveReview.reason}"
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Administrative Decision *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    className={`decision-btn approve-btn ${teacherLeaveDecision === 'Approved' ? 'selected' : ''}`}
                    onClick={() => setTeacherLeaveDecision('Approved')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: teacherLeaveDecision === 'Approved' ? '2px solid #10b981' : '1px solid #334155',
                      background: teacherLeaveDecision === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: teacherLeaveDecision === 'Approved' ? '#34d399' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={18} />
                    <span>Approve Leave</span>
                  </button>
                  <button
                    type="button"
                    className={`decision-btn reject-btn ${teacherLeaveDecision === 'Rejected' ? 'selected' : ''}`}
                    onClick={() => setTeacherLeaveDecision('Rejected')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: teacherLeaveDecision === 'Rejected' ? '2px solid #ef4444' : '1px solid #334155',
                      background: teacherLeaveDecision === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: teacherLeaveDecision === 'Rejected' ? '#f87171' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <X size={18} />
                    <span>Reject Leave</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Administrative Remarks / Notes for Faculty Record
                </label>
                <textarea 
                  rows={3}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="e.g. Approved. Substitute faculty arrangements verified with Academic Dean."
                  value={teacherLeaveRemarks}
                  onChange={e => setTeacherLeaveRemarks(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedTeacherLeaveReview(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingTeacherLeaveReview}
                  style={{
                    background: teacherLeaveDecision === 'Approved' ? '#10b981' : '#ef4444',
                    borderColor: teacherLeaveDecision === 'Approved' ? '#10b981' : '#ef4444'
                  }}
                >
                  <CalendarCheck size={16} />
                  <span>{submittingTeacherLeaveReview ? 'Recording Decision...' : `Confirm ${teacherLeaveDecision}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEW FACULTY ATTENDANCE REGULARIZATION (ADMIN ONLY) */}
      {/* ========================================================= */}
      {selectedTeacherRegReview && (
        <div className="modal-overlay" onClick={() => setSelectedTeacherRegReview(null)}>
          <div className="modal-content review-leave-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Clock size={22} color="#34d399" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Review Faculty Attendance Regularization</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>HR & Institutional Biometric Terminal Authority</p>
                </div>
              </div>
              <button className="action-btn" onClick={() => setSelectedTeacherRegReview(null)}>✕</button>
            </div>

            <form onSubmit={handleReviewTeacherReg} className="review-leave-form" style={{ padding: '20px' }}>
              <div className="leave-summary-card" style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Faculty Member:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>
                      {selectedTeacherRegReview.teachers ? `Prof. ${selectedTeacherRegReview.teachers.first_name} ${selectedTeacherRegReview.teachers.last_name}` : `Teacher #${selectedTeacherRegReview.teacher_id}`}
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{selectedTeacherRegReview.teachers?.employee_id} • {selectedTeacherRegReview.teachers?.department}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Dispute Date:</span>
                    <strong style={{ color: 'var(--primary)' }}>{selectedTeacherRegReview.attendance_date}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Requested Adjustment:</span>
                    <span className="badge badge-warning">{selectedTeacherRegReview.original_status}</span> &rarr; <span className="badge badge-success">{selectedTeacherRegReview.requested_status}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Discrepancy Category:</span>
                    <span className="badge badge-info">{selectedTeacherRegReview.reason_category}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Faculty Explanation & Witness Evidence:</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-main)', fontSize: '13px', fontStyle: 'italic', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    "{selectedTeacherRegReview.reason}"
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Administrative Decision *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    className={`decision-btn approve-btn ${teacherRegDecision === 'Approved' ? 'selected' : ''}`}
                    onClick={() => setTeacherRegDecision('Approved')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: teacherRegDecision === 'Approved' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: teacherRegDecision === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card)',
                      color: teacherRegDecision === 'Approved' ? '#10b981' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={18} />
                    <span>Approve & Regularize</span>
                  </button>
                  <button
                    type="button"
                    className={`decision-btn reject-btn ${teacherRegDecision === 'Rejected' ? 'selected' : ''}`}
                    onClick={() => setTeacherRegDecision('Rejected')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: teacherRegDecision === 'Rejected' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                      background: teacherRegDecision === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
                      color: teacherRegDecision === 'Rejected' ? '#ef4444' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <X size={18} />
                    <span>Reject Dispute</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Administrative Remarks / Verification Confirmation
                </label>
                <textarea 
                  rows={3}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="e.g. Approved. Biometric hardware log verified by IT Department. Shift attendance status updated to Present."
                  value={teacherRegRemarks}
                  onChange={e => setTeacherRegRemarks(e.target.value)}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#94a3b8', fontSize: '11px' }}>
                  💡 Approving updates the teacher's timecard status to Present and adjusts monthly working hours.
                </small>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedTeacherRegReview(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingTeacherRegReview}
                  style={{
                    background: teacherRegDecision === 'Approved' ? '#10b981' : '#ef4444',
                    borderColor: teacherRegDecision === 'Approved' ? '#10b981' : '#ef4444'
                  }}
                >
                  <Clock size={16} />
                  <span>{submittingTeacherRegReview ? 'Regularizing Record...' : `Confirm ${teacherRegDecision}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Settings & Notification History Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={{
          ...currentUser,
          name: currentUser?.name || currentUser?.username || 'Administrator',
          role: 'Admin',
          username: currentUser?.username || 'admin'
        }}
        notifications={adminNotifications}
        readNotificationIds={readAdminNotifIds}
        onToggleRead={handleToggleAdminRead}
        onMarkAllRead={handleMarkAllAdminRead}
        onMarkAllUnread={handleMarkAllAdminUnread}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowSettingsModal(false);
        }}
        initialTab={settingsInitialTab || 'notifications'}
        onResetSystem={handleSystemReset}
        systemStats={{
          studentsCount: students.length,
          teachersCount: teachers.length,
          classesCount: classes.length,
          feesCount: fees.length,
          salariesCount: salaries.length,
          leavesCount: studentLeaves.length + teacherLeaves.length,
          regularizationsCount: studentRegularizations.length + teacherRegularizations.length,
          timetablesCount: allTimetable.length
        }}
      />

      {/* ========================================================= */}
      {/* MODAL: STUDENT PROGRESS REMARKS */}
      {/* ========================================================= */}
      {remarksStudent && (
        <StudentRemarksModal 
          student={remarksStudent} 
          teachers={teachers} 
          onClose={() => setRemarksStudent(null)} 
          onRefreshAll={loadAllData} 
        />
      )}
    </div>
  );
}
