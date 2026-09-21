import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Bell, 
  User, 
  Sliders, 
  Search, 
  CheckCheck, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Clock, 
  CalendarCheck, 
  Award, 
  MessageSquare, 
  CreditCard, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  Layers,
  Sparkles,
  Check,
  Eye,
  AlertTriangle,
  RefreshCw,
  Users,
  UserCheck,
  BookOpen,
  ArrowRight,
  UserPlus
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  notifications = [],
  readNotificationIds = new Set(),
  onToggleRead,
  onMarkAllRead,
  onMarkAllUnread,
  onClearHistory,
  onNavigateTab,
  initialTab = 'notifications',
  onResetSystem,
  systemStats = {}
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'leave' | 'attendance' | 'academic' | 'finance' | 'admin'

  // Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // System Factory Reset State
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);

  const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin';

  // Sync active tab when modal opens or initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'notifications');
      setResetConfirmText('');
      setResetSuccess(false);
      setResetError(null);
    }
  }, [isOpen, initialTab]);

  // Enforce Light Mode on DOM Mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.setItem('educore_theme', 'light');
    } catch {}
  }, []);

  const isIdRead = (id) => {
    if (!readNotificationIds) return false;
    if (readNotificationIds instanceof Set) return readNotificationIds.has(id);
    if (Array.isArray(readNotificationIds)) return readNotificationIds.includes(id);
    if (typeof readNotificationIds === 'object') return Boolean(readNotificationIds[id]);
    return false;
  };

  // Filtered & Sorted Notification History
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const isRead = isIdRead(n.id);
      
      // Status Filter
      if (statusFilter === 'UNREAD' && isRead) return false;
      if (statusFilter === 'READ' && !isRead) return false;

      // Category Filter
      if (categoryFilter !== 'ALL') {
        const cat = (n.category || '').toLowerCase();
        if (categoryFilter === 'leave' && !cat.includes('leave')) return false;
        if (categoryFilter === 'attendance' && !cat.includes('attendance') && !cat.includes('reg')) return false;
        if (categoryFilter === 'academic' && !cat.includes('remark') && !cat.includes('grade')) return false;
        if (categoryFilter === 'finance' && !cat.includes('salary') && !cat.includes('fee')) return false;
        if (categoryFilter === 'admin' && !cat.includes('admin') && !cat.includes('my-') && !cat.includes('teacher-')) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const title = (n.title || '').toLowerCase();
        const msg = (n.message || '').toLowerCase();
        const time = (n.timestamp || '').toLowerCase();
        const cat = (n.category || '').toLowerCase();
        return title.includes(q) || msg.includes(q) || time.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [notifications, readNotificationIds, statusFilter, categoryFilter, searchTerm]);

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !isIdRead(n.id)).length;
  const readCount = notifications.filter(n => isIdRead(n.id)).length;

  const formatNotifTime = (ts) => {
    if (!ts) return 'Recent';
    if (typeof ts === 'string' && (ts.includes('T') || ts.includes('-') || ts.includes(':'))) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) + ' • ' + d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch {}
    }
    return ts;
  };

  const getCategoryIcon = (category = '', status = '') => {
    const c = category.toLowerCase();
    if (c.includes('leave')) return <CalendarCheck size={18} color="#2563eb" />;
    if (c.includes('reg') || c.includes('attendance')) return <Clock size={18} color="#059669" />;
    if (c.includes('remark')) return <MessageSquare size={18} color="#7c3aed" />;
    if (c.includes('grade')) return <Award size={18} color="#d97706" />;
    if (c.includes('salary')) return <DollarSign size={18} color="#16a34a" />;
    if (c.includes('fee')) return <CreditCard size={18} color="#0284c7" />;
    if (c.includes('homeroom') || c.includes('subject')) return <Layers size={18} color="#2563eb" />;
    return <Bell size={18} color="#475569" />;
  };

  const getCategoryBadgeClass = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('leave')) return 'notif-badge-leave';
    if (c.includes('reg') || c.includes('attendance')) return 'notif-badge-attendance';
    if (c.includes('remark')) return 'notif-badge-remark';
    if (c.includes('grade')) return 'notif-badge-grade';
    if (c.includes('salary')) return 'notif-badge-salary';
    if (c.includes('fee')) return 'notif-badge-finance';
    if (c.includes('homeroom') || c.includes('subject')) return 'notif-badge-academic';
    return 'notif-badge-default';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="settings-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Settings Header */}
        <div className="settings-modal-header">
          <div className="settings-header-title">
            <div className="settings-icon-bubble">
              <Sliders size={22} color="#2563eb" />
            </div>
            <div>
              <h3>Account Settings & Notification Center</h3>
              <p className="settings-header-sub">
                Logged in as <strong className="settings-user-highlight">{currentUser?.name || currentUser?.username || 'User'}</strong> • <span className="settings-role-tag">{currentUser?.role?.toUpperCase() || 'USER'}</span>
              </p>
            </div>
          </div>

          <div className="settings-header-right-actions">
            <button className="modal-close-btn" onClick={onClose} title="Close Settings">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Body with Sidebar Navigation */}
        <div className="settings-modal-body">
          {/* Settings Sidebar */}
          <div className="settings-sidebar">
            <button 
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <div className="nav-item-icon">
                <Bell size={18} />
              </div>
              <div className="nav-item-text">
                <span>Notification History</span>
                <small>{unreadCount} unread • {totalCount} total</small>
              </div>
              {unreadCount > 0 && (
                <span className="settings-unread-pill">{unreadCount}</span>
              )}
            </button>

            <button 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <div className="nav-item-icon">
                <User size={18} />
              </div>
              <div className="nav-item-text">
                <span>Profile & Identity</span>
                <small>Account details & roles</small>
              </div>
            </button>

            <button 
              className={`settings-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <div className="nav-item-icon">
                <Sliders size={18} />
              </div>
              <div className="nav-item-text">
                <span>Alert Preferences</span>
                <small>Notifications & sounds</small>
              </div>
            </button>

            {isAdmin && (
              <button 
                className={`settings-nav-item danger-tab ${activeTab === 'system-reset' ? 'active' : ''}`}
                onClick={() => setActiveTab('system-reset')}
                title="Wipe and recreate all system data"
              >
                <div className="nav-item-icon">
                  <RotateCcw size={18} />
                </div>
                <div className="nav-item-text">
                  <span style={{ color: '#dc2626' }}>System Factory Reset</span>
                  <small style={{ color: '#ef4444' }}>Wipe & recreate database</small>
                </div>
              </button>
            )}
          </div>

          {/* Settings Main Content Area */}
          <div className="settings-content-pane">

            {/* TAB 2: NOTIFICATION HISTORY */}
            {activeTab === 'notifications' && (
              <div className="settings-tab-content">
                <div className="settings-pane-header">
                  <div>
                    <h4>Notification & Alert History</h4>
                    <p>Audit log of all past alerts, decisions, and updates received across the portal.</p>
                  </div>
                  <div className="settings-bulk-actions">
                    {unreadCount > 0 && (
                      <button 
                        className="settings-action-btn primary"
                        onClick={onMarkAllRead}
                        title="Mark all notifications as read"
                      >
                        <CheckCheck size={15} />
                        <span>Mark All Read</span>
                      </button>
                    )}
                    {readCount > 0 && (
                      <button 
                        className="settings-action-btn secondary"
                        onClick={onMarkAllUnread}
                        title="Restore all to unread status"
                      >
                        <RotateCcw size={14} />
                        <span>Mark All Unread</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="settings-toolbar">
                  {/* Search Bar */}
                  <div className="settings-search-box">
                    <Search size={16} color="#64748b" />
                    <input 
                      type="text"
                      placeholder="Search alerts by title, remark, or date..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="search-clear-btn" 
                        onClick={() => setSearchTerm('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="settings-filter-pills">
                    <button 
                      className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('ALL')}
                    >
                      All ({totalCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${statusFilter === 'UNREAD' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('UNREAD')}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${statusFilter === 'READ' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('READ')}
                    >
                      Read / Archived ({readCount})
                    </button>
                  </div>
                </div>

                {/* Category Filter Badges */}
                <div className="settings-category-bar">
                  <span className="cat-bar-label">
                    <Filter size={13} />
                    <span>Filter:</span>
                  </span>
                  <button 
                    className={`cat-pill ${categoryFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('ALL')}
                  >
                    All Categories
                  </button>
                  <button 
                    className={`cat-pill ${categoryFilter === 'leave' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('leave')}
                  >
                    Leaves
                  </button>
                  <button 
                    className={`cat-pill ${categoryFilter === 'attendance' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('attendance')}
                  >
                    Attendance & Disputes
                  </button>
                  <button 
                    className={`cat-pill ${categoryFilter === 'academic' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('academic')}
                  >
                    Remarks & Grades
                  </button>
                  <button 
                    className={`cat-pill ${categoryFilter === 'finance' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('finance')}
                  >
                    Salaries & Fees
                  </button>
                </div>

                {/* Notification List Body */}
                <div className="settings-notif-scroll-area">
                  {filteredNotifications.length === 0 ? (
                    <div className="settings-empty-state">
                      <CheckCircle2 size={44} color="#10b981" />
                      <h5>No Notifications Found</h5>
                      <p>
                        {searchTerm 
                          ? `No notifications matched your search "${searchTerm}".`
                          : statusFilter === 'UNREAD' 
                            ? 'You have caught up with all active unread notifications!'
                            : 'No history records available under this filter.'}
                      </p>
                      {(searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                        <button 
                          className="btn-reset-filters"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setCategoryFilter('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredNotifications.map((notif, idx) => {
                      const isRead = isIdRead(notif.id);
                      return (
                        <div 
                          key={notif.id || idx}
                          className={`settings-notif-row ${isRead ? 'read' : 'unread'} ${compactView ? 'compact' : ''}`}
                          onClick={() => {
                            if (!isRead && onToggleRead) {
                              onToggleRead(notif.id);
                            }
                            if (notif.targetTab && onNavigateTab) {
                              onNavigateTab(notif.targetTab);
                            }
                          }}
                        >
                          <div className="notif-row-icon">
                            {getCategoryIcon(notif.category, notif.status)}
                          </div>

                          <div className="notif-row-main">
                            <div className="notif-row-header">
                              <span className="notif-row-title">{notif.title}</span>
                              <div className="notif-row-meta">
                                <span className={`notif-category-badge ${getCategoryBadgeClass(notif.category)}`}>
                                  {notif.category || 'System'}
                                </span>
                                <span className="notif-row-time">
                                  <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                  {formatNotifTime(notif.timestamp)}
                                </span>
                              </div>
                            </div>

                            <p className="notif-row-message">{notif.message}</p>

                            <div className="notif-row-footer">
                              {notif.targetTab && (
                                <span className="notif-nav-hint">
                                  <ExternalLink size={12} />
                                  <span>Navigate to {notif.targetTab}</span>
                                </span>
                              )}

                              <div className="notif-row-actions" onClick={e => e.stopPropagation()}>
                                <button 
                                  className={`toggle-read-status-btn ${isRead ? 'is-read' : 'is-unread'}`}
                                  onClick={() => onToggleRead && onToggleRead(notif.id)}
                                  title={isRead ? 'Mark as unread' : 'Mark as read'}
                                >
                                  {isRead ? (
                                    <>
                                      <RotateCcw size={12} />
                                      <span>Mark Unread</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={12} />
                                      <span>Mark Read</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE & IDENTITY */}
            {activeTab === 'profile' && (
              <div className="settings-tab-content">
                <div className="settings-pane-header">
                  <div>
                    <h4>Profile & Identity Information</h4>
                    <p>Overview of your institutional account and role access privileges.</p>
                  </div>
                </div>

                <div className="settings-profile-card">
                  <div className="profile-avatar-large">
                    <User size={40} color="#38bdf8" />
                  </div>
                  <div className="profile-main-meta">
                    <h3>{currentUser?.name || currentUser?.username || 'Institutional User'}</h3>
                    <p className="profile-role-badge">
                      <ShieldCheck size={15} color="#10b981" />
                      <span>Role: <strong>{currentUser?.role?.toUpperCase() || 'USER'}</strong></span>
                    </p>
                    <div className="profile-details-grid">
                      <div className="profile-detail-cell">
                        <span className="detail-label">Username</span>
                        <span className="detail-val">{currentUser?.username || 'admin'}</span>
                      </div>
                      <div className="profile-detail-cell">
                        <span className="detail-label">Account Status</span>
                        <span className="detail-val" style={{ color: '#10b981' }}>Active / Verified</span>
                      </div>
                      <div className="profile-detail-cell">
                        <span className="detail-label">ID Reference</span>
                        <span className="detail-val">
                          {currentUser?.teacher_id ? `TCH-${String(currentUser.teacher_id).padStart(3, '0')}` : currentUser?.student_id ? `STU-${String(currentUser.student_id).padStart(3, '0')}` : `ADM-001`}
                        </span>
                      </div>
                      <div className="profile-detail-cell">
                        <span className="detail-label">Session ID</span>
                        <span className="detail-val" style={{ fontFamily: 'monospace' }}>SEC-2026-GW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ALERT PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="settings-tab-content">
                <div className="settings-pane-header">
                  <div>
                    <h4>Alert Preferences & System Configuration</h4>
                    <p>Customize how and when you receive portal notifications and sound alerts.</p>
                  </div>
                </div>

                <div className="settings-pref-group">
                  <div className="pref-row">
                    <div>
                      <span className="pref-title">Instant Notification Badges</span>
                      <p className="pref-desc">Show pulse badges and unread counters on the top navigation bar.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={emailAlerts} 
                        onChange={e => setEmailAlerts(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="pref-row">
                    <div>
                      <span className="pref-title">Auto-Remove Read Notifications</span>
                      <p className="pref-desc">Automatically remove read alerts from the quick notification dropdown and archive them to History.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={autoMarkRead} 
                        onChange={e => setAutoMarkRead(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="pref-row">
                    <div>
                      <span className="pref-title">Compact Card Display</span>
                      <p className="pref-desc">Display tighter padding and condensed rows in notification history list.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={compactView} 
                        onChange={e => setCompactView(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="pref-row">
                    <div>
                      <span className="pref-title">Sound Alerts for Approval Updates</span>
                      <p className="pref-desc">Play an audible chime when an approval status changes in real-time.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={soundAlerts} 
                        onChange={e => setSoundAlerts(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SYSTEM FACTORY RESET (Admin Exclusive) */}
            {activeTab === 'system-reset' && isAdmin && (
              <div className="settings-tab-content">
                <div className="settings-pane-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ color: '#dc2626' }}>System Factory Reset & Master Wipe</h4>
                      <span style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid #fca5a5',
                        letterSpacing: '0.5px'
                      }}>
                        DANGER ZONE • IRREVERSIBLE
                      </span>
                    </div>
                    <p>Permanently purge all operational database records to return the system to a clean slate ready for fresh creation.</p>
                  </div>
                </div>

                {!resetSuccess ? (
                  <>
                    {/* Warning Banner */}
                    <div className="reset-warning-banner">
                      <div className="reset-warning-icon">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="reset-warning-text">
                        <h5>Permanent Relational Database Wipe</h5>
                        <p>
                          This action will permanently delete all entries in the database across <strong>14 relational tables</strong> (students, faculty members, classes, fee transactions, payroll slips, attendance logs, leave requests, dispute claims, grades, timetable, and remarks).
                        </p>
                      </div>
                    </div>

                    {/* Scope Inventory Breakdown */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                        Current Operational Inventory to be Cleared:
                      </span>
                      <div className="reset-stats-grid">
                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Students</span>
                            <Users size={14} color="#2563eb" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.studentsCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Faculty Members</span>
                            <UserCheck size={14} color="#7c3aed" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.teachersCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Class Cohorts</span>
                            <BookOpen size={14} color="#059669" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.classesCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Fee Receipts</span>
                            <CreditCard size={14} color="#0284c7" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.feesCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Salary Slips</span>
                            <DollarSign size={14} color="#16a34a" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.salariesCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Leave Applications</span>
                            <CalendarCheck size={14} color="#f59e0b" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.leavesCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Attendance Claims</span>
                            <Clock size={14} color="#ea580c" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.regularizationsCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card">
                          <div className="reset-stat-header">
                            <span>Timetable Slots</span>
                            <Layers size={14} color="#6366f1" />
                          </div>
                          <div className="reset-stat-val">{systemStats?.timetablesCount ?? 0}</div>
                        </div>

                        <div className="reset-stat-card preserved">
                          <div className="reset-stat-header">
                            <span>Master Admin</span>
                            <ShieldCheck size={14} color="#16a34a" />
                          </div>
                          <div className="reset-stat-val">PRESERVED (admin)</div>
                        </div>
                      </div>
                    </div>

                    {/* Error Banner */}
                    {resetError && (
                      <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} />
                        <span>{resetError}</span>
                      </div>
                    )}

                    {/* Text Confirmation Box */}
                    <div className="reset-confirm-box">
                      <label htmlFor="reset-confirm-input">
                        Confirmation Verification (Type <strong style={{ color: '#dc2626' }}>RESET</strong>):
                      </label>
                      <input 
                        id="reset-confirm-input"
                        type="text"
                        className="reset-confirm-input"
                        placeholder="Type RESET to unlock button"
                        value={resetConfirmText}
                        onChange={e => setResetConfirmText(e.target.value)}
                        disabled={isResetting}
                        autoComplete="off"
                      />
                      <small style={{ display: 'block', color: '#64748b', marginTop: '6px', fontSize: '12px' }}>
                        💡 Type the word <strong>RESET</strong> in uppercase or lowercase to activate the master wipe button.
                      </small>
                    </div>

                    {/* Danger Action Button */}
                    <button 
                      className="btn-danger-execute"
                      disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                      onClick={async () => {
                        if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
                        setIsResetting(true);
                        setResetError(null);
                        try {
                          if (onResetSystem) {
                            await onResetSystem();
                          }
                          setResetSuccess(true);
                          setResetConfirmText('');
                        } catch (err) {
                          setResetError(err?.message || 'Error occurred while resetting system.');
                        } finally {
                          setIsResetting(false);
                        }
                      }}
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw size={18} className="spinning" />
                          <span>Wiping Entire System & Cleaning Tables...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          <span>Execute Complete System Factory Reset</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* Success View After Reset */
                  <div className="reset-success-box">
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <CheckCircle2 size={36} />
                    </div>
                    <h4>System Successfully Reset!</h4>
                    <p>
                      All students, faculty members, class cohorts, fee collections, payroll slips, and attendance records have been cleanly wiped from the database. The system is clean and ready for fresh setup.
                    </p>

                    <div className="reset-next-actions">
                      <button 
                        className="reset-action-pill"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('class-groups');
                          onClose();
                        }}
                      >
                        <Layers size={14} />
                        <span>Create Class Groups</span>
                      </button>
                      <button 
                        className="reset-action-pill"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('students');
                          onClose();
                        }}
                      >
                        <UserPlus size={14} />
                        <span>Add Students</span>
                      </button>
                      <button 
                        className="reset-action-pill"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('teachers');
                          onClose();
                        }}
                      >
                        <UserCheck size={14} />
                        <span>Add Faculty</span>
                      </button>
                      <button 
                        className="reset-action-pill"
                        style={{ background: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}
                        onClick={onClose}
                      >
                        <Check size={14} />
                        <span>Done & Close</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
