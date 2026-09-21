import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { 
  CalendarCheck, 
  Clock, 
  Check, 
  X, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Edit,
  Sliders,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

export default function StudentGovernanceAdminView({ 
  students = [], 
  classes = [], 
  teachers = [], 
  onRefreshAll,
  initialTab = 'leaves'
}) {
  const [activeGovernanceTab, setActiveGovernanceTab] = useState(initialTab); // 'leaves' | 'regularizations'
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Sync tab if parent changes initialTab
  useEffect(() => {
    if (initialTab) {
      setActiveGovernanceTab(initialTab);
    }
  }, [initialTab]);

  // Review Modal states
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveDecision, setLeaveDecision] = useState('Approved');
  const [leaveRemarks, setLeaveRemarks] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [selectedReg, setSelectedReg] = useState(null);
  const [regDecision, setRegDecision] = useState('Approved');
  const [regRemarks, setRegRemarks] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    setLoading(true);
    setActionSuccessMsg('');
    try {
      const [lRes, rRes] = await Promise.all([
        api.getLeaves().catch(() => []),
        api.getAttendanceRegularizations().catch(() => [])
      ]);
      setLeaves(Array.isArray(lRes) ? lRes : []);
      setRegularizations(Array.isArray(rRes) ? rRes : []);
    } catch (err) {
      console.error('Error loading student governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Student info helper
  const getStudent = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getClassName = (classId, studentObj) => {
    if (studentObj?.classes) {
      if (typeof studentObj.classes === 'object') {
        const cName = studentObj.classes.class_name || '';
        const cSec = studentObj.classes.section ? ` - ${studentObj.classes.section}` : '';
        if (cName) return `${cName}${cSec}`;
      }
      return String(studentObj.classes);
    }
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.class_name} - ${cls.section}` : (classId ? `Class #${classId}` : 'Standard');
  };

  // Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (statusFilter !== 'ALL' && l.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const st = getStudent(l.student_id) || l.students;
        const name = st ? `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase() : '';
        const roll = (st?.roll_number || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        if (!name.includes(q) && !roll.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
  }, [leaves, statusFilter, searchQuery, students]);

  // Filtered Regularizations
  const filteredRegs = useMemo(() => {
    return regularizations.filter(r => {
      if (statusFilter !== 'ALL' && r.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const st = getStudent(r.student_id) || r.students;
        const name = st ? `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase() : '';
        const roll = (st?.roll_number || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        if (!name.includes(q) && !roll.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
  }, [regularizations, statusFilter, searchQuery, students]);

  // 1-Click Quick Decision for Leave
  const handleQuickLeaveDecision = async (leaveItem, decision) => {
    const remarkText = decision === 'Approved' ? 'Leave approved by Administrator' : 'Rejected by Administrator';
    try {
      await api.reviewLeave(leaveItem.id, {
        status: decision,
        teacher_remarks: remarkText,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      // If approved, mark attendance as Excused / On-Leave for student if date is today or known
      if (decision === 'Approved' && leaveItem.student_id && leaveItem.start_date) {
        api.markAttendance({
          student_id: leaveItem.student_id,
          date: leaveItem.start_date,
          status: 'Excused',
          remarks: `Approved Leave (${leaveItem.leave_type || 'Leave'})`
        }).catch(() => {});
      }

      setActionSuccessMsg(`✓ Leave application #${leaveItem.id} has been marked as ${decision.toUpperCase()}!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      await loadGovernanceData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error updating leave decision: ' + err.message);
    }
  };

  // 1-Click Quick Decision for Attendance Regularization
  const handleQuickRegDecision = async (regItem, decision) => {
    const remarkText = decision === 'Approved' ? 'Dispute regularized & approved by Administrator' : 'Dispute rejected by Administrator';
    try {
      await api.reviewAttendanceRegularization(regItem.id, {
        status: decision,
        teacher_remarks: remarkText,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      // If approved, update student attendance table to requested status
      if (decision === 'Approved' && regItem.student_id && regItem.attendance_date) {
        api.markAttendance({
          student_id: regItem.student_id,
          date: regItem.attendance_date,
          status: regItem.requested_status || 'Present',
          remarks: `Attendance Regularized by Admin: ${regItem.reason_category || 'Biometric dispute resolved'}`
        }).catch(() => {});
      }

      setActionSuccessMsg(`✓ Attendance dispute #${regItem.id} has been ${decision.toUpperCase()} and student attendance synchronized!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      await loadGovernanceData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error updating regularization decision: ' + err.message);
    }
  };

  // Detailed Modal Review Leave Submit
  const handleReviewLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    setSubmittingLeave(true);
    const remarkText = leaveRemarks.trim() || `Marked ${leaveDecision} by Administrator`;
    try {
      await api.reviewLeave(selectedLeave.id, {
        status: leaveDecision,
        teacher_remarks: remarkText,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (leaveDecision === 'Approved' && selectedLeave.student_id && selectedLeave.start_date) {
        api.markAttendance({
          student_id: selectedLeave.student_id,
          date: selectedLeave.start_date,
          status: 'Excused',
          remarks: `Approved Leave (${selectedLeave.leave_type || 'Leave'})`
        }).catch(() => {});
      }

      setActionSuccessMsg(`✓ Student leave application has been ${leaveDecision.toUpperCase()} and saved!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setSelectedLeave(null);
      setLeaveRemarks('');
      setLeaveDecision('Approved');
      await loadGovernanceData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error updating leave: ' + err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Detailed Modal Review Regularization Submit
  const handleReviewRegSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setSubmittingReg(true);
    const remarkText = regRemarks.trim() || `Marked ${regDecision} by Administrator`;
    try {
      await api.reviewAttendanceRegularization(selectedReg.id, {
        status: regDecision,
        teacher_remarks: remarkText,
        admin_remarks: remarkText,
        reviewed_at: new Date().toISOString()
      });

      if (regDecision === 'Approved' && selectedReg.student_id && selectedReg.attendance_date) {
        api.markAttendance({
          student_id: selectedReg.student_id,
          date: selectedReg.attendance_date,
          status: selectedReg.requested_status || 'Present',
          remarks: `Attendance Regularized by Admin: ${selectedReg.reason_category || 'Dispute resolved'}`
        }).catch(() => {});
      }

      setActionSuccessMsg(`✓ Attendance regularization has been ${regDecision.toUpperCase()} and student attendance synchronized!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setSelectedReg(null);
      setRegRemarks('');
      setRegDecision('Approved');
      await loadGovernanceData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      alert('Error updating regularization: ' + err.message);
    } finally {
      setSubmittingReg(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const pendingRegs = regularizations.filter(r => r.status === 'Pending').length;

  return (
    <div className="student-governance-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="card-table-wrapper" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <ShieldCheck size={22} color="#0284c7" />
              <span>Student Leave & Attendance Regularization Desk (Master Admin Governance)</span>
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Institutional desk for Administrators to review student leave requests, medical certificates, and attendance discrepancy dispute claims.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              onClick={loadGovernanceData} 
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${activeGovernanceTab === 'leaves' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveGovernanceTab('leaves'); setStatusFilter('ALL'); }}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              borderRadius: '8px',
              background: activeGovernanceTab === 'leaves' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'var(--bg-input)',
              color: activeGovernanceTab === 'leaves' ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border-color)'
            }}
          >
            <CalendarCheck size={16} />
            <span>Student Leave Requests</span>
            {pendingLeaves > 0 && (
              <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                {pendingLeaves} Pending
              </span>
            )}
          </button>

          <button
            className={`btn-secondary ${activeGovernanceTab === 'regularizations' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveGovernanceTab('regularizations'); setStatusFilter('ALL'); }}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              borderRadius: '8px',
              background: activeGovernanceTab === 'regularizations' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'var(--bg-input)',
              color: activeGovernanceTab === 'regularizations' ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Clock size={16} />
            <span>Student Attendance Regularizations</span>
            {pendingRegs > 0 && (
              <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                {pendingRegs} Pending
              </span>
            )}
          </button>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
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
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="card-table-wrapper">
        {/* Table Toolbar */}
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-input-box" style={{ minWidth: '260px' }}>
            <Search className="search-icon" size={15} />
            <input 
              type="text"
              placeholder="Search student name, roll no, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills-bar" style={{ margin: 0 }}>
            <button 
              className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Records ({activeGovernanceTab === 'leaves' ? leaves.length : regularizations.length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Pending')}
              style={{ color: statusFilter === 'Pending' ? 'white' : '#f59e0b' }}
            >
              Pending ({activeGovernanceTab === 'leaves' ? pendingLeaves : pendingRegs})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'Approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Approved')}
              style={{ color: statusFilter === 'Approved' ? 'white' : '#059669' }}
            >
              Approved ({activeGovernanceTab === 'leaves' ? leaves.filter(l => l.status === 'Approved').length : regularizations.filter(r => r.status === 'Approved').length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'Rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Rejected')}
              style={{ color: statusFilter === 'Rejected' ? 'white' : '#dc2626' }}
            >
              Rejected ({activeGovernanceTab === 'leaves' ? leaves.filter(l => l.status === 'Rejected').length : regularizations.filter(r => r.status === 'Rejected').length})
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: STUDENT LEAVE REQUESTS */}
        {/* ========================================================= */}
        {activeGovernanceTab === 'leaves' && (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '980px' }}>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Roll No</th>
                  <th>Student Name</th>
                  <th>Class / Section</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'center' }}>Days</th>
                  <th>Reason / Medical Note</th>
                  <th style={{ textAlign: 'center' }}>Decision Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px', width: '240px' }}>Admin Action & Rights</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((l, idx) => {
                  const st = getStudent(l.student_id) || l.students;
                  const classNameStr = st?.class_id ? getClassName(st.class_id) : 'Standard';
                  const isPending = l.status === 'Pending';

                  return (
                    <tr key={l.id || idx}>
                      <td>
                        <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '12px' }}>
                          {st?.roll_number || `STU-${l.student_id}`}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {st ? `${st.first_name} ${st.last_name}` : `Student #${l.student_id}`}
                        </div>
                      </td>
                      <td>
                        <span className="roster-class-tag" style={{ fontSize: '11.5px' }}>
                          {classNameStr}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          {l.leave_type || 'Sick Leave'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                          {l.start_date} to {l.end_date}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                        {l.days_count || 1}
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {l.reason}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${l.status === 'Approved' ? 'badge-success' : (l.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}`} style={{ fontWeight: 700 }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '160px' }}>
                        {l.admin_remarks || l.teacher_remarks || '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleQuickLeaveDecision(l, 'Approved')}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '11.5px',
                                  background: '#059669',
                                  borderColor: '#059669',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Quick Approve Leave Application"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleQuickLeaveDecision(l, 'Rejected')}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '11.5px',
                                  color: '#dc2626',
                                  borderColor: '#fca5a5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Quick Reject Leave Application"
                              >
                                <X size={13} /> Reject
                              </button>
                              <button
                                type="button"
                                className="action-btn edit"
                                onClick={() => {
                                  setSelectedLeave(l);
                                  setLeaveDecision('Approved');
                                  setLeaveRemarks(l.admin_remarks || '');
                                }}
                                style={{ padding: '5px 7px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}
                                title="Review with Custom Remarks"
                              >
                                <Sliders size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setSelectedLeave(l);
                                setLeaveDecision(l.status === 'Rejected' ? 'Rejected' : 'Approved');
                                setLeaveRemarks(l.admin_remarks || '');
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Edit Administrative Decision"
                            >
                              <Edit size={13} /> Edit Decision
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No student leave applications found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: STUDENT ATTENDANCE REGULARIZATIONS */}
        {/* ========================================================= */}
        {activeGovernanceTab === 'regularizations' && (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '1080px' }}>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Roll No</th>
                  <th>Student Name</th>
                  <th>Class / Section</th>
                  <th>Dispute Date</th>
                  <th>Original Status</th>
                  <th>Requested Status</th>
                  <th>Dispute Category</th>
                  <th>Student Explanation</th>
                  <th style={{ textAlign: 'center' }}>Decision Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px', width: '240px' }}>Admin Action & Rights</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((r, idx) => {
                  const st = getStudent(r.student_id) || r.students;
                  const classNameStr = st?.class_id ? getClassName(st.class_id) : 'Standard';
                  const isPending = r.status === 'Pending';

                  return (
                    <tr key={r.id || idx}>
                      <td>
                        <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '12px' }}>
                          {st?.roll_number || `STU-${r.student_id}`}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {st ? `${st.first_name} ${st.last_name}` : `Student #${r.student_id}`}
                        </div>
                      </td>
                      <td>
                        <span className="roster-class-tag" style={{ fontSize: '11.5px' }}>
                          {classNameStr}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.attendance_date}</td>
                      <td><span className="badge badge-warning">{r.original_status}</span></td>
                      <td><span className="badge badge-success" style={{ fontWeight: 700 }}>{r.requested_status}</span></td>
                      <td>
                        <span style={{
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(2, 132, 199, 0.2)'
                        }}>
                          {r.reason_category}
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.reason}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${r.status === 'Approved' ? 'badge-success' : (r.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}`} style={{ fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '160px' }}>{r.admin_remarks || r.teacher_remarks || '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleQuickRegDecision(r, 'Approved')}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '11.5px',
                                  background: '#059669',
                                  borderColor: '#059669',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Approve & Synchronize Attendance to Present"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleQuickRegDecision(r, 'Rejected')}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '11.5px',
                                  color: '#dc2626',
                                  borderColor: '#fca5a5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Reject Attendance Regularization"
                              >
                                <X size={13} /> Reject
                              </button>
                              <button
                                type="button"
                                className="action-btn edit"
                                onClick={() => {
                                  setSelectedReg(r);
                                  setRegDecision('Approved');
                                  setRegRemarks(r.admin_remarks || '');
                                }}
                                style={{ padding: '5px 7px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}
                                title="Review with Custom Remarks"
                              >
                                <Sliders size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setSelectedReg(r);
                                setRegDecision(r.status === 'Rejected' ? 'Rejected' : 'Approved');
                                setRegRemarks(r.admin_remarks || '');
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Edit Administrative Decision"
                            >
                              <Edit size={13} /> Edit Decision
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRegs.length === 0 && (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No student attendance regularizations found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: REVIEW STUDENT LEAVE */}
      {/* ========================================================= */}
      {selectedLeave && (
        <div className="modal-overlay" onClick={() => setSelectedLeave(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '17px', margin: 0 }}>Review Student Leave Application</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Student: {((getStudent(selectedLeave.student_id) || selectedLeave.students)?.first_name || '')} {((getStudent(selectedLeave.student_id) || selectedLeave.students)?.last_name || '')} ({selectedLeave.start_date} to {selectedLeave.end_date})
                </p>
              </div>
              <button className="action-btn" onClick={() => setSelectedLeave(null)}>✕</button>
            </div>

            <form onSubmit={handleReviewLeaveSubmit}>
              <div className="modal-body form-grid" style={{ padding: '20px' }}>
                <div className="form-group full-width" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Student Stated Reason:</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic' }}>"{selectedLeave.reason}"</div>
                </div>

                <div className="form-group full-width">
                  <label>Administrative Decision *</label>
                  <select
                    value={leaveDecision}
                    onChange={e => setLeaveDecision(e.target.value)}
                  >
                    <option value="Approved">✓ Approve Leave Application</option>
                    <option value="Rejected">✕ Reject Leave Application</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Administrator Remarks / Justification</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter official remarks or conditions..."
                    value={leaveRemarks}
                    onChange={e => setLeaveRemarks(e.target.value)}
                    style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedLeave(null)} disabled={submittingLeave}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submittingLeave} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={15} />
                  <span>{submittingLeave ? 'Submitting...' : 'Save Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEW ATTENDANCE REGULARIZATION */}
      {/* ========================================================= */}
      {selectedReg && (
        <div className="modal-overlay" onClick={() => setSelectedReg(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '17px', margin: 0 }}>Review Attendance Regularization Dispute</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Student: {((getStudent(selectedReg.student_id) || selectedReg.students)?.first_name || '')} {((getStudent(selectedReg.student_id) || selectedReg.students)?.last_name || '')} (Date: {selectedReg.attendance_date})
                </p>
              </div>
              <button className="action-btn" onClick={() => setSelectedReg(null)}>✕</button>
            </div>

            <form onSubmit={handleReviewRegSubmit}>
              <div className="modal-body form-grid" style={{ padding: '20px' }}>
                <div className="form-group full-width" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Original: <strong>{selectedReg.original_status}</strong></span>
                    <span>Requested: <strong style={{ color: '#059669' }}>{selectedReg.requested_status}</strong></span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', marginTop: '6px' }}>"{selectedReg.reason}"</div>
                </div>

                <div className="form-group full-width">
                  <label>Administrative Decision *</label>
                  <select
                    value={regDecision}
                    onChange={e => setRegDecision(e.target.value)}
                  >
                    <option value="Approved">✓ Approve & Regularize Attendance</option>
                    <option value="Rejected">✕ Reject Regularization Claim</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Administrator Remarks</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter official remarks..."
                    value={regRemarks}
                    onChange={e => setRegRemarks(e.target.value)}
                    style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedReg(null)} disabled={submittingReg}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submittingReg} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={15} />
                  <span>{submittingReg ? 'Submitting...' : 'Save Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
