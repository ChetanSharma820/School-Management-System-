import React, { useState, useMemo } from 'react';
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
  Sparkles
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
  initialTab = 'notifications'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'leave' | 'attendance' | 'academic' | 'finance' | 'admin'

  // Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [autoMarkRead, setAutoMarkRead] = useState(true);

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

  const getCategoryIcon = (category = '', status = '') => {
    const c = category.toLowerCase();
    if (c.includes('leave')) return <CalendarCheck size={16} color="#38bdf8" />;
    if (c.includes('reg') || c.includes('attendance')) return <Clock size={16} color="#10b981" />;
    if (c.includes('remark')) return <MessageSquare size={16} color="#c084fc" />;
    if (c.includes('grade')) return <Award size={16} color="#f59e0b" />;
    if (c.includes('salary')) return <DollarSign size={16} color="#10b981" />;
    if (c.includes('fee')) return <CreditCard size={16} color="#38bdf8" />;
    return <Bell size={16} color="#94a3b8" />;
  };

  const getCategoryBadgeClass = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('leave')) return 'notif-badge-leave';
    if (c.includes('reg') || c.includes('attendance')) return 'notif-badge-attendance';
    if (c.includes('remark')) return 'notif-badge-remark';
    if (c.includes('grade')) return 'notif-badge-grade';
    if (c.includes('salary') || c.includes('fee')) return 'notif-badge-finance';
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
              <Sliders size={22} color="#38bdf8" />
            </div>
            <div>
              <h3>Account Settings & Notification Center</h3>
              <p className="settings-header-sub">
                Logged in as <strong style={{ color: '#f8fafc' }}>{currentUser?.name || currentUser?.username || 'User'}</strong> • <span className="settings-role-tag">{currentUser?.role?.toUpperCase() || 'USER'}</span>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Settings">
            <X size={20} />
          </button>
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
                <small>Notifications & display</small>
              </div>
            </button>
          </div>

          {/* Settings Main Content Area */}
          <div className="settings-content-pane">
            {/* TAB 1: NOTIFICATION HISTORY */}
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
                      Read ({readCount})
                    </button>
                  </div>

                  {/* Category Dropdown Filter */}
                  <div className="settings-category-select">
                    <Filter size={14} color="#94a3b8" />
                    <select 
                      value={categoryFilter} 
                      onChange={e => setCategoryFilter(e.target.value)}
                    >
                      <option value="ALL">All Categories</option>
                      <option value="leave">Leave Approvals</option>
                      <option value="attendance">Attendance Disputes</option>
                      <option value="academic">Remarks & Grades</option>
                      <option value="finance">Salaries & Fees</option>
                      <option value="admin">Governance & Approvals</option>
                    </select>
                  </div>
                </div>

                {/* Notification Items List */}
                <div className="settings-history-list">
                  {filteredNotifications.length === 0 ? (
                    <div className="settings-empty-state">
                      <CheckCircle2 size={40} color="#10b981" />
                      <h5>No Notifications Found</h5>
                      <p>
                        {searchTerm 
                          ? `No notifications matched "${searchTerm}". Try resetting your search filters.`
                          : statusFilter === 'UNREAD'
                          ? 'All notifications have been marked as read! Toggle "All" or "Read" to review historical records.'
                          : 'You currently have no notification history recorded.'}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => {
                      const isRead = isIdRead(notif.id);
                      return (
                        <div 
                          key={notif.id} 
                          className={`history-card ${isRead ? 'is-read' : 'is-unread'}`}
                        >
                          <div className="history-card-header">
                            <div className="history-icon-bubble">
                              {getCategoryIcon(notif.category, notif.status)}
                            </div>
                            <div className="history-title-group">
                              <div className="history-title-row">
                                <span className="history-title">{notif.title}</span>
                                <span className={`history-category-badge ${getCategoryBadgeClass(notif.category)}`}>
                                  {notif.category || 'Notification'}
                                </span>
                                {isRead ? (
                                  <span className="history-status-tag read">Read</span>
                                ) : (
                                  <span className="history-status-tag unread">New / Active</span>
                                )}
                              </div>
                              <span className="history-timestamp">
                                <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {notif.timestamp || 'Recent'}
                              </span>
                            </div>
                          </div>

                          <div className="history-card-body">
                            <p className="history-message">{notif.message}</p>
                          </div>

                          <div className="history-card-actions">
                            <button 
                              className={`history-action-toggle ${isRead ? 'to-unread' : 'to-read'}`}
                              onClick={() => onToggleRead(notif.id)}
                              title={isRead ? 'Mark as unread (restores to active notification dropdown)' : 'Mark as read (removes from active dropdown)'}
                            >
                              {isRead ? (
                                <>
                                  <RotateCcw size={13} />
                                  <span>Mark as Unread</span>
                                </>
                              ) : (
                                <>
                                  <CheckCheck size={13} />
                                  <span>Mark as Read</span>
                                </>
                              )}
                            </button>

                            {notif.targetTab && onNavigateTab && (
                              <button 
                                className="history-action-jump"
                                onClick={() => {
                                  onNavigateTab(notif.targetTab, notif.actionData);
                                  onClose();
                                }}
                              >
                                <span>Jump to {notif.targetTab.replace('-', ' ').toUpperCase()}</span>
                                <ExternalLink size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE & IDENTITY */}
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

            {/* TAB 3: ALERT PREFERENCES */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
