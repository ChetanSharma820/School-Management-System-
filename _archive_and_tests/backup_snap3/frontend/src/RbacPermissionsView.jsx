import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  Unlock, 
  Search, 
  RefreshCw, 
  UserCheck, 
  GraduationCap, 
  Sliders, 
  Trash2, 
  Users, 
  CalendarCheck, 
  Award, 
  Receipt, 
  Wallet, 
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function RbacPermissionsView({
  permissionsList,
  permissionsLoading,
  onRefresh,
  onOpenPermissionModal,
  onToggleStatus,
  onDeleteCredential,
  localOverrides = {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL', 'student', 'teacher'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'active', 'suspended'

  // Computed combined list with localOverrides
  const mergedList = useMemo(() => {
    return permissionsList.map(u => {
      const overrides = localOverrides[u.id] || {};
      return {
        ...u,
        ...overrides,
        status: overrides.status || u.status || 'active',
        portal_access: overrides.portal_access !== undefined ? overrides.portal_access : (u.portal_access !== false && u.status !== 'suspended'),
        can_apply_leave: overrides.can_apply_leave !== undefined ? overrides.can_apply_leave : (u.can_apply_leave !== false),
        can_view_grades: overrides.can_view_grades !== undefined ? overrides.can_view_grades : (u.can_view_grades !== false),
        can_download_fee_receipt: overrides.can_download_fee_receipt !== undefined ? overrides.can_download_fee_receipt : (u.can_download_fee_receipt !== false),
        can_post_remarks: overrides.can_post_remarks !== undefined ? overrides.can_post_remarks : (u.can_post_remarks !== false),
        can_approve_leaves: overrides.can_approve_leaves !== undefined ? overrides.can_approve_leaves : (u.can_approve_leaves !== false),
        can_view_payroll: overrides.can_view_payroll !== undefined ? overrides.can_view_payroll : (u.can_view_payroll !== false)
      };
    });
  }, [permissionsList, localOverrides]);

  // Statistics
  const stats = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let studentCount = 0;
    let teacherCount = 0;

    mergedList.forEach(u => {
      if (u.status === 'suspended') suspended++;
      else active++;

      if (u.role === 'student') studentCount++;
      else if (u.role === 'teacher') teacherCount++;
    });

    return { total: mergedList.length, active, suspended, studentCount, teacherCount };
  }, [mergedList]);

  // Filtered rows
  const filteredList = useMemo(() => {
    return mergedList.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const stName = u.students ? `${u.students.first_name} ${u.students.last_name}` : '';
      const tcName = u.teachers ? `${u.teachers.first_name} ${u.teachers.last_name}` : '';
      const roll = u.students?.roll_number || '';
      const empId = u.teachers?.employee_id || '';

      const matchesSearch = !q ||
        u.username?.toLowerCase().includes(q) ||
        stName.toLowerCase().includes(q) ||
        tcName.toLowerCase().includes(q) ||
        roll.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [mergedList, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="rbac-view-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner Notice */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fef3c7' }}>
              Administrator RBAC & Permission Authority
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>
              Only school administrators hold full rights to update, delete institutional records, and add or revoke user capabilities for students and faculty.
            </p>
          </div>
        </div>

        <button 
          className="btn-secondary" 
          onClick={onRefresh} 
          disabled={permissionsLoading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={permissionsLoading ? 'spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '8px' }}>
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>TOTAL ACCOUNTS</h3>
            <div className="kpi-value">{stats.total}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Synchronized records</span>
          </div>
          <div className="kpi-icon-wrap icon-blue">
            <Users size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>ACTIVE ACCESS</h3>
            <div className="kpi-value" style={{ color: 'var(--emerald)' }}>{stats.active}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authorized users</span>
          </div>
          <div className="kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>SUSPENDED</h3>
            <div className="kpi-value" style={{ color: stats.suspended > 0 ? '#f87171' : 'var(--text-dim)' }}>{stats.suspended}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Access blocked</span>
          </div>
          <div className="kpi-icon-wrap icon-amber" style={{ background: stats.suspended > 0 ? 'rgba(239, 68, 68, 0.15)' : undefined, color: stats.suspended > 0 ? '#f87171' : undefined }}>
            <Lock size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>STUDENT ROLES</h3>
            <div className="kpi-value">{stats.studentCount}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enrolled students</span>
          </div>
          <div className="kpi-icon-wrap icon-blue" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>FACULTY ROLES</h3>
            <div className="kpi-value">{stats.teacherCount}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Educators & staff</span>
          </div>
          <div className="kpi-icon-wrap icon-purple">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-table-wrapper">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between' }}>
          
          {/* Search bar */}
          <div className="search-input-box" style={{ minWidth: '320px' }}>
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by username, full name, roll no, or emp ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Role Filter */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['ALL', 'student', 'teacher'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    background: roleFilter === role ? 'var(--primary)' : 'transparent',
                    color: roleFilter === role ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {role === 'ALL' ? 'All Roles' : role === 'student' ? 'Students' : 'Faculty'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['ALL', 'active', 'suspended'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    background: statusFilter === st ? (st === 'suspended' ? '#dc2626' : '#059669') : 'transparent',
                    color: statusFilter === st ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredList.length}</strong> of {mergedList.length}
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>User Identity</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Granular Permission Flags</th>
              <th style={{ textAlign: 'right', paddingRight: '20px' }}>Governance Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(user => {
              const isStudent = user.role === 'student';
              const isTeacher = user.role === 'teacher';
              const isSuspended = user.status === 'suspended';

              const fullName = isStudent
                ? (user.students ? `${user.students.first_name} ${user.students.last_name}` : 'Enrolled Student')
                : (user.teachers ? `${user.teachers.first_name} ${user.teachers.last_name}` : 'Faculty Member');

              const identifier = isStudent
                ? (user.students?.roll_number || `ID: ${user.student_id}`)
                : (user.teachers?.employee_id || `ID: ${user.teacher_id}`);

              return (
                <tr key={user.id} style={{ background: isSuspended ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isStudent ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isStudent ? '#38bdf8' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        {isStudent ? 'S' : 'F'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{fullName}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                            (@{user.username})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {identifier} • {user.email || 'No email registered'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${isStudent ? 'badge-info' : 'badge-paid'}`} style={{ textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${isSuspended ? 'badge-danger' : 'badge-success'}`}>
                        {isSuspended ? '✕ Suspended' : '✓ Active'}
                      </span>
                      <button
                        className="btn-secondary"
                        style={{
                          padding: '3px 8px',
                          fontSize: '10px',
                          color: isSuspended ? '#34d399' : '#f87171',
                          borderColor: isSuspended ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'
                        }}
                        onClick={() => onToggleStatus(user)}
                        title={isSuspended ? 'Reactivate account' : 'Suspend user account'}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      
                      {/* Web Login Access */}
                      <span 
                        className={`perm-chip ${user.portal_access && !isSuspended ? 'on' : 'off'}`}
                        title={user.portal_access ? 'Login Allowed' : 'Login Blocked'}
                      >
                        <ShieldCheck size={11} /> Login: {user.portal_access && !isSuspended ? 'Allowed' : 'Blocked'}
                      </span>

                      {/* Student Chips */}
                      {isStudent && (
                        <>
                          <span 
                            className={`perm-chip ${user.can_apply_leave ? 'on' : 'off'}`}
                            title={user.can_apply_leave ? 'Can apply for leave' : 'Leave application disabled'}
                          >
                            <CalendarCheck size={11} /> Leaves: {user.can_apply_leave ? 'Enabled' : 'Disabled'}
                          </span>
                          <span 
                            className={`perm-chip ${user.can_view_grades ? 'on' : 'off'}`}
                            title={user.can_view_grades ? 'Can view grades' : 'Grade viewing restricted'}
                          >
                            <Award size={11} /> Grades: {user.can_view_grades ? 'Enabled' : 'Restricted'}
                          </span>
                          <span 
                            className={`perm-chip ${user.can_download_fee_receipt ? 'on' : 'off'}`}
                            title={user.can_download_fee_receipt ? 'Can download receipts' : 'Receipt download locked'}
                          >
                            <Receipt size={11} /> Fee Slips: {user.can_download_fee_receipt ? 'Enabled' : 'Locked'}
                          </span>
                        </>
                      )}

                      {/* Teacher Chips */}
                      {isTeacher && (
                        <>
                          <span 
                            className={`perm-chip ${user.can_post_remarks ? 'on' : 'off'}`}
                            title={user.can_post_remarks ? 'Can submit remarks' : 'Remarks restricted'}
                          >
                            <MessageSquarePlus size={11} /> Remarks: {user.can_post_remarks ? 'Enabled' : 'Disabled'}
                          </span>
                          <span 
                            className={`perm-chip ${user.can_approve_leaves ? 'on' : 'off'}`}
                            title={user.can_approve_leaves ? 'Can review leaves' : 'Leave approvals restricted'}
                          >
                            <CalendarCheck size={11} /> Review Leaves: {user.can_approve_leaves ? 'Enabled' : 'Restricted'}
                          </span>
                          <span 
                            className={`perm-chip ${user.can_view_payroll ? 'on' : 'off'}`}
                            title={user.can_view_payroll ? 'Can access payroll' : 'Payroll statement locked'}
                          >
                            <Wallet size={11} /> Payroll: {user.can_view_payroll ? 'Enabled' : 'Locked'}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onOpenPermissionModal(user)}
                        title="Configure Granular RBAC Permissions"
                      >
                        <Sliders size={13} /> Configure
                      </button>
                      <button
                        className="action-btn delete"
                        style={{ padding: '5px 8px', borderRadius: '6px' }}
                        onClick={() => onDeleteCredential(user.id)}
                        title="Delete User Credentials (Admin Only)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredList.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  {permissionsLoading ? 'Loading credentials and permission matrix...' : 'No accounts match the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
