import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  User, 
  UserCheck, 
  BookOpen, 
  GraduationCap,
  CalendarCheck,
  Award,
  Receipt,
  Wallet,
  MessageSquarePlus,
  Info
} from 'lucide-react';

export default function PermissionModal({ user, onClose, onSave, localOverrides = {} }) {
  const currentOverrides = localOverrides[user.id] || {};

  // Status: active vs suspended
  const [status, setStatus] = useState(
    currentOverrides.status || user.status || 'active'
  );

  // Master Portal Access
  const [portalAccess, setPortalAccess] = useState(
    currentOverrides.portal_access !== undefined ? currentOverrides.portal_access : (user.portal_access !== false && status !== 'suspended')
  );

  // Student Permissions
  const [canApplyLeave, setCanApplyLeave] = useState(
    currentOverrides.can_apply_leave !== undefined ? currentOverrides.can_apply_leave : (user.can_apply_leave !== false)
  );
  const [canViewGrades, setCanViewGrades] = useState(
    currentOverrides.can_view_grades !== undefined ? currentOverrides.can_view_grades : (user.can_view_grades !== false)
  );
  const [canDownloadFeeReceipt, setCanDownloadFeeReceipt] = useState(
    currentOverrides.can_download_fee_receipt !== undefined ? currentOverrides.can_download_fee_receipt : (user.can_download_fee_receipt !== false)
  );

  // Teacher Permissions
  const [canPostRemarks, setCanPostRemarks] = useState(
    currentOverrides.can_post_remarks !== undefined ? currentOverrides.can_post_remarks : (user.can_post_remarks !== false)
  );
  const [canApproveLeaves, setCanApproveLeaves] = useState(
    currentOverrides.can_approve_leaves !== undefined ? currentOverrides.can_approve_leaves : (user.can_approve_leaves !== false)
  );
  const [canViewPayroll, setCanViewPayroll] = useState(
    currentOverrides.can_view_payroll !== undefined ? currentOverrides.can_view_payroll : (user.can_view_payroll !== false)
  );

  const [submitting, setSubmitting] = useState(false);

  const isStudent = user.role === 'student';
  const isTeacher = user.role === 'teacher';

  const handleStatusToggle = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'suspended') {
      setPortalAccess(false);
    } else {
      setPortalAccess(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        status,
        portal_access: portalAccess && status !== 'suspended',
      };

      if (isStudent) {
        payload.can_apply_leave = canApplyLeave;
        payload.can_view_grades = canViewGrades;
        payload.can_download_fee_receipt = canDownloadFeeReceipt;
      }

      if (isTeacher) {
        payload.can_post_remarks = canPostRemarks;
        payload.can_approve_leaves = canApproveLeaves;
        payload.can_view_payroll = canViewPayroll;
      }

      await onSave(user, payload);
    } catch (err) {
      alert('Failed to save permissions: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = isStudent 
    ? (user.students ? `${user.students.first_name} ${user.students.last_name}` : user.username)
    : (user.teachers ? `${user.teachers.first_name} ${user.teachers.last_name}` : user.username);

  const identifier = isStudent
    ? (user.students?.roll_number ? `Roll: ${user.students.roll_number}` : `Student ID: ${user.student_id || user.id}`)
    : (user.teachers?.employee_id ? `Emp ID: ${user.teachers.employee_id}` : `Teacher ID: ${user.teacher_id || user.id}`);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content permission-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: isStudent ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isStudent ? '#38bdf8' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isStudent ? <GraduationCap size={20} /> : <UserCheck size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>RBAC Permission Authority</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Administrator Access Governance & Privilege Assignment
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ fontSize: '16px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            
            {/* User Target Card */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Username: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>@{user.username}</span> • {identifier}
                </div>
              </div>
              <span className={`badge ${isStudent ? 'badge-info' : 'badge-paid'}`} style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                {user.role} Role
              </span>
            </div>

            {/* Account Status Switch */}
            <div style={{
              background: status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${status === 'suspended' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '10px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: status === 'suspended' ? '#f87171' : '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {status === 'suspended' ? <Lock size={16} /> : <Unlock size={16} />}
                    Account Status: {status.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {status === 'suspended' 
                      ? 'User is blocked from logging into the portal by Administrator.' 
                      : 'User is authenticated and allowed to log in.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleStatusToggle('active')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: status === 'active' ? '#10b981' : 'rgba(51, 65, 85, 0.5)',
                      color: status === 'active' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusToggle('suspended')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: status === 'suspended' ? '#ef4444' : 'rgba(51, 65, 85, 0.5)',
                      color: status === 'suspended' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    Suspended
                  </button>
                </div>
              </div>
            </div>

            {/* Granular Permission Toggles Section */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={15} color="#38bdf8" />
                <span>Granular Feature Permissions ({isStudent ? 'Student Specific' : 'Faculty Specific'})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* 1. Portal Login Access */}
                <div className="perm-toggle-row">
                  <div className="perm-toggle-info">
                    <div className="perm-toggle-title">
                      <ShieldCheck size={16} color={portalAccess ? '#10b981' : '#64748b'} />
                      <span>Web Portal Authentication</span>
                    </div>
                    <div className="perm-toggle-desc">Permit logging in to {user.role} dashboard and services</div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={portalAccess && status !== 'suspended'}
                      disabled={status === 'suspended'}
                      onChange={e => setPortalAccess(e.target.checked)} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* If Student */}
                {isStudent && (
                  <>
                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <CalendarCheck size={16} color={canApplyLeave ? '#38bdf8' : '#64748b'} />
                          <span>Submit Leave Applications</span>
                        </div>
                        <div className="perm-toggle-desc">Allows student to request casual/medical leaves for teacher review</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canApplyLeave} 
                          onChange={e => setCanApplyLeave(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <Award size={16} color={canViewGrades ? '#a855f7' : '#64748b'} />
                          <span>View Examination Gradebook</span>
                        </div>
                        <div className="perm-toggle-desc">Allows student to inspect subject scorecards and term report cards</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canViewGrades} 
                          onChange={e => setCanViewGrades(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <Receipt size={16} color={canDownloadFeeReceipt ? '#10b981' : '#64748b'} />
                          <span>View & Download Fee Receipts</span>
                        </div>
                        <div className="perm-toggle-desc">Enables printing official fee installment slips and payment vouchers</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canDownloadFeeReceipt} 
                          onChange={e => setCanDownloadFeeReceipt(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </>
                )}

                {/* If Teacher */}
                {isTeacher && (
                  <>
                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <MessageSquarePlus size={16} color={canPostRemarks ? '#38bdf8' : '#64748b'} />
                          <span>Submit Student Academic Remarks</span>
                        </div>
                        <div className="perm-toggle-desc">Grants teacher ability to enter progress feedback and evaluations</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canPostRemarks} 
                          onChange={e => setCanPostRemarks(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <CalendarCheck size={16} color={canApproveLeaves ? '#10b981' : '#64748b'} />
                          <span>Review & Approve Student Leaves</span>
                        </div>
                        <div className="perm-toggle-desc">Allows faculty member to evaluate and decide student absence requests</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canApproveLeaves} 
                          onChange={e => setCanApproveLeaves(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="perm-toggle-row">
                      <div className="perm-toggle-info">
                        <div className="perm-toggle-title">
                          <Wallet size={16} color={canViewPayroll ? '#f59e0b' : '#64748b'} />
                          <span>Access Faculty Payroll & Slips</span>
                        </div>
                        <div className="perm-toggle-desc">Enables viewing personal compensation ledger and downloading pay-slips</div>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={canViewPayroll} 
                          onChange={e => setCanViewPayroll(e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </>
                )}

              </div>
            </div>

            <div style={{ background: 'rgba(51, 65, 85, 0.4)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#38bdf8" />
              <span>Permission updates are enforced instantly in live sessions and prevent restricted portal actions.</span>
            </div>

          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{submitting ? 'Applying Permissions...' : 'Save & Enforce Permissions'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
