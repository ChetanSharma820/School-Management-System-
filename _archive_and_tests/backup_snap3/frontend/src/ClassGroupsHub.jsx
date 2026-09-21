import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Users, 
  UserCheck, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowRightLeft, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  BookOpen, 
  Clock, 
  Key, 
  ShieldCheck, 
  FileSpreadsheet,
  Sliders,
  Filter,
  UserPlus
} from 'lucide-react';
import { AddClassGroupModal, EditClassGroupModal, QuickTransferStudentModal, ManageClassSubjectsModal } from './ClassGroupModals';

export default function ClassGroupsHub({
  classes = [],
  students = [],
  teachers = [],
  fees = [],
  timetable = [],
  onAddClass,
  onUpdateClass,
  onTransferStudent,
  onBatchTransferStudents,
  onOpenAddStudentWithClass,
  onEditStudent,
  onOpenPermissions,
  onDeleteStudent,
  onAddTimetable,
  onDeleteTimetable,
  loading = false
}) {
  // Active Selected Class ID: 'ALL' | classId (number) | 'UNASSIGNED'
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return classes.length > 0 ? classes[0].id : 'ALL';
  });

  // Local Search & Filter State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'DUE' | 'MALE' | 'FEMALE'

  // Batch Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [batchTargetClassId, setBatchTargetClassId] = useState('');
  const [batchMoving, setBatchMoving] = useState(false);

  // Modals State
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClassObj, setEditingClassObj] = useState(null);
  const [managingSubjectsClassObj, setManagingSubjectsClassObj] = useState(null);
  const [transferringStudent, setTransferringStudent] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Calculate Class Metrics
  const classStats = useMemo(() => {
    const map = {};
    
    // Initialize class map
    classes.forEach(c => {
      map[c.id] = {
        classObj: c,
        enrolledCount: 0,
        boysCount: 0,
        girlsCount: 0,
        paidCount: 0,
        dueCount: 0,
        studentsList: []
      };
    });

    let unassignedList = [];

    // Map students into classes
    students.forEach(s => {
      const cid = s.class_id;
      // Fee calculation for student
      const studentFee = fees.find(f => f.student_id === s.id);
      const isPaid = studentFee && (studentFee.payment_status === 'Paid' || (studentFee.amount_paid >= studentFee.gross_amount && studentFee.gross_amount > 0));

      if (cid && map[cid]) {
        map[cid].enrolledCount++;
        if (s.gender?.toLowerCase() === 'female') map[cid].girlsCount++;
        else map[cid].boysCount++;

        if (isPaid) map[cid].paidCount++;
        else map[cid].dueCount++;

        map[cid].studentsList.push(s);
      } else {
        unassignedList.push(s);
      }
    });

    return { classMap: map, unassignedList };
  }, [classes, students, fees]);

  // Selected Class details
  const activeClassData = useMemo(() => {
    if (selectedClassId === 'UNASSIGNED') {
      return {
        id: 'UNASSIGNED',
        class_name: 'Unassigned Students',
        section: 'N/A',
        teacher_id: null,
        enrolledCount: classStats.unassignedList.length,
        studentsList: classStats.unassignedList
      };
    }
    if (selectedClassId === 'ALL') {
      return {
        id: 'ALL',
        class_name: 'All Classes Combined',
        section: 'Institutional Master',
        teacher_id: null,
        enrolledCount: students.length,
        studentsList: students
      };
    }
    const cData = classStats.classMap[selectedClassId];
    if (cData) {
      return {
        ...cData.classObj,
        enrolledCount: cData.enrolledCount,
        boysCount: cData.boysCount,
        girlsCount: cData.girlsCount,
        paidCount: cData.paidCount,
        dueCount: cData.dueCount,
        studentsList: cData.studentsList
      };
    }
    return null;
  }, [selectedClassId, classStats, students]);

  // Filtered Students for the active selected class
  const filteredRosterStudents = useMemo(() => {
    if (!activeClassData) return [];
    let list = activeClassData.studentsList || [];

    // Search query
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter(s => 
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      );
    }

    // Status / Gender Filter
    if (rosterFilter === 'MALE') {
      list = list.filter(s => s.gender?.toLowerCase() === 'male');
    } else if (rosterFilter === 'FEMALE') {
      list = list.filter(s => s.gender?.toLowerCase() === 'female');
    } else if (rosterFilter === 'PAID') {
      list = list.filter(s => {
        const sf = fees.find(f => f.student_id === s.id);
        return sf && (sf.payment_status === 'Paid' || sf.amount_paid >= sf.gross_amount);
      });
    } else if (rosterFilter === 'DUE') {
      list = list.filter(s => {
        const sf = fees.find(f => f.student_id === s.id);
        return !sf || sf.payment_status !== 'Paid';
      });
    }

    return list;
  }, [activeClassData, rosterSearch, rosterFilter, fees]);

  // Batch Selection Handlers
  const handleToggleStudentSelect = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedStudentIds.size === filteredRosterStudents.length && filteredRosterStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredRosterStudents.map(s => s.id)));
    }
  };

  const handleExecuteBatchTransfer = async () => {
    if (!batchTargetClassId || selectedStudentIds.size === 0) return;
    setBatchMoving(true);
    try {
      await onBatchTransferStudents(Array.from(selectedStudentIds), parseInt(batchTargetClassId));
      setSelectedStudentIds(new Set());
      setBatchTargetClassId('');
    } finally {
      setBatchMoving(false);
    }
  };

  return (
    <div className="class-groups-hub-container">
      {/* 1. Header Overview & Summary Bar */}
      <div className="class-hub-overview-banner">
        <div className="hub-header-left">
          <div className="hub-badge-icon">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="hub-title">Class Groups & Section Batches Roster</h2>
            <p className="hub-subtitle">
              Class-wise cohort management • {classes.length} Classes & Sections • {students.length} Total Enrolled Students
            </p>
          </div>
        </div>

        <div className="hub-header-right">
          <button 
            className="btn-primary create-class-btn"
            onClick={() => setShowAddClassModal(true)}
          >
            <Plus size={16} />
            <span>Create New Class Group</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Class Groups Matrix */}
      <div className="class-groups-grid-wrapper">
        <div className="class-groups-grid-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
              Select Class Group Cohort:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              className={`class-cohort-pill ${selectedClassId === 'ALL' ? 'active' : ''}`}
              onClick={() => { setSelectedClassId('ALL'); setSelectedStudentIds(new Set()); }}
            >
              All Combined ({students.length})
            </button>
            {classStats.unassignedList.length > 0 && (
              <button 
                className={`class-cohort-pill unassigned ${selectedClassId === 'UNASSIGNED' ? 'active' : ''}`}
                onClick={() => { setSelectedClassId('UNASSIGNED'); setSelectedStudentIds(new Set()); }}
              >
                ⚠️ Unassigned ({classStats.unassignedList.length})
              </button>
            )}
          </div>
        </div>

        <div className="class-groups-cards-matrix">
          {classes.map(c => {
            const stats = classStats.classMap[c.id] || { enrolledCount: 0, boysCount: 0, girlsCount: 0, paidCount: 0 };
            const teacher = c.teachers || teachers.find(t => t.id === c.teacher_id);
            const isSelected = selectedClassId === c.id;
            const classSubjectPeriods = timetable.filter(t => t.class_id === c.id);

            return (
              <div 
                key={c.id} 
                className={`class-group-card ${isSelected ? 'selected' : ''}`}
                onClick={() => { setSelectedClassId(c.id); setSelectedStudentIds(new Set()); }}
              >
                <div className="class-card-top">
                  <div className="class-grade-badge">
                    <span className="grade-name">{c.class_name}</span>
                    <span className="section-pill">Sec {c.section}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button 
                      className="class-card-settings-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingSubjectsClassObj(c);
                      }}
                      title="Assign Subjects & Period Routine"
                      style={{ color: '#38bdf8' }}
                    >
                      <BookOpen size={13} />
                    </button>
                    <button 
                      className="class-card-settings-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClassObj(c);
                      }}
                      title="Configure Class & Homeroom Teacher"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                <div className="class-card-teacher-row">
                  <div className="teacher-avatar-mini">
                    {teacher?.first_name?.[0] || 'T'}
                  </div>
                  <div className="teacher-meta-mini">
                    <small>Class Teacher</small>
                    <strong>{teacher ? `Prof. ${teacher.first_name} ${teacher.last_name}` : 'Not Appointed'}</strong>
                  </div>
                </div>

                <div className="class-card-metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="card-mini-stat">
                    <span className="mini-stat-val">{stats.enrolledCount}</span>
                    <span className="mini-stat-lbl">Students</span>
                  </div>
                  <div className="card-mini-stat">
                    <span className="mini-stat-val" style={{ color: '#10b981' }}>₹{((c.base_fee || 45000) / 1000).toFixed(0)}k</span>
                    <span className="mini-stat-lbl">Tuition</span>
                  </div>
                  <div className="card-mini-stat">
                    <span className="mini-stat-val">{stats.boysCount}B • {stats.girlsCount}G</span>
                    <span className="mini-stat-lbl">Gender</span>
                  </div>
                  <div className="card-mini-stat">
                    <span className="mini-stat-val" style={{ color: '#38bdf8' }}>{classSubjectPeriods.length}</span>
                    <span className="mini-stat-lbl">Subjects</span>
                  </div>
                </div>

                <div className="class-card-footer-action">
                  <span>{isSelected ? '● Viewing Active Roster' : 'Click to View Students →'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Focused Enrolled Student Roster Section */}
      <div className="class-roster-section-container card-table-wrapper">
        <div className="class-roster-header">
          <div className="roster-title-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {activeClassData?.class_name} {activeClassData?.section !== 'N/A' && activeClassData?.section !== 'Institutional Master' ? `- Section ${activeClassData?.section}` : ''}
              </h3>
              <span className="roster-count-badge">
                {filteredRosterStudents.length} Students
              </span>
              {typeof selectedClassId === 'number' && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ₹{(activeClassData?.base_fee || 45000).toLocaleString()} / yr Base Fee
                </span>
              )}
            </div>
            {activeClassData?.teachers && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Homeroom Educator: <strong style={{ color: 'var(--primary)' }}>Prof. {activeClassData.teachers.first_name} {activeClassData.teachers.last_name}</strong> ({activeClassData.teachers.employee_id})
              </p>
            )}
          </div>

          <div className="roster-header-actions">
            {typeof selectedClassId === 'number' && (
              <>
                <button
                  className="btn-secondary manage-class-subjects-btn"
                  onClick={() => setManagingSubjectsClassObj(activeClassData)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  title="Assign Subjects & Appoint Subject Teachers for this Class Group"
                >
                  <BookOpen size={15} />
                  <span>Assign Subjects ({timetable.filter(t => t.class_id === selectedClassId).length})</span>
                </button>

                <button 
                  className="btn-primary add-student-class-btn"
                  onClick={() => onOpenAddStudentWithClass(selectedClassId)}
                  title="Add student directly into this class"
                >
                  <UserPlus size={15} />
                  <span>Add Student to {activeClassData?.section}</span>
                </button>
              </>
            )}

            <button 
              className="btn-secondary print-roster-btn"
              onClick={() => window.print()}
              title="Print formatted class register"
            >
              <Printer size={15} />
              <span>Print Roster</span>
            </button>
          </div>
        </div>

        {/* Real-time Search & Filter Bar */}
        <div className="table-toolbar roster-toolbar">
          <div className="search-input-box" style={{ minWidth: '260px' }}>
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search student by name, roll no, phone..."
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
            />
            {rosterSearch && (
              <button 
                className="search-clear-btn" 
                onClick={() => setRosterSearch('')}
                style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-pills-bar">
            <button 
              className={`filter-pill ${rosterFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setRosterFilter('ALL')}
            >
              All ({activeClassData?.studentsList?.length || 0})
            </button>
            <button 
              className={`filter-pill ${rosterFilter === 'PAID' ? 'active' : ''}`}
              onClick={() => setRosterFilter('PAID')}
              style={{ color: rosterFilter === 'PAID' ? 'white' : '#10b981' }}
            >
              ● Fees Paid
            </button>
            <button 
              className={`filter-pill ${rosterFilter === 'DUE' ? 'active' : ''}`}
              onClick={() => setRosterFilter('DUE')}
              style={{ color: rosterFilter === 'DUE' ? 'white' : '#ef4444' }}
            >
              ● Fees Due
            </button>
            <button 
              className={`filter-pill ${rosterFilter === 'MALE' ? 'active' : ''}`}
              onClick={() => setRosterFilter('MALE')}
            >
              Boys
            </button>
            <button 
              className={`filter-pill ${rosterFilter === 'FEMALE' ? 'active' : ''}`}
              onClick={() => setRosterFilter('FEMALE')}
            >
              Girls
            </button>
          </div>
        </div>

        {/* Floating Batch Transfer Action Toolbar */}
        {selectedStudentIds.size > 0 && (
          <div className="batch-transfer-floating-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="batch-selected-count">{selectedStudentIds.size} Selected</span>
              <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Move to another Class:</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={batchTargetClassId}
                onChange={e => setBatchTargetClassId(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', minWidth: '180px' }}
              >
                <option value="">-- Choose Target Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} - Section {c.section}
                  </option>
                ))}
              </select>

              <button 
                className="btn-primary" 
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                disabled={!batchTargetClassId || batchMoving}
                onClick={handleExecuteBatchTransfer}
              >
                <ArrowRightLeft size={14} />
                <span>{batchMoving ? 'Moving...' : 'Execute Batch Transfer'}</span>
              </button>

              <button 
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setSelectedStudentIds(new Set())}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Student Roster Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={selectedStudentIds.size === filteredRosterStudents.length && filteredRosterStudents.length > 0}
                  onChange={handleSelectAllVisible}
                  title="Select all in this view"
                />
              </th>
              <th style={{ width: '110px' }}>Roll No</th>
              <th>Student Name & Contact</th>
              <th>Gender & DOB</th>
              <th>Class Assigned</th>
              <th>Fee Status</th>
              <th style={{ textAlign: 'right', paddingRight: '20px' }}>Cohort Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRosterStudents.map((s, idx) => {
              const sf = fees.find(f => f.student_id === s.id);
              const feePaid = sf && (sf.payment_status === 'Paid' || sf.amount_paid >= sf.gross_amount);
              const isChecked = selectedStudentIds.has(s.id);
              const clsObj = classes.find(c => c.id === s.class_id);
              const classStr = clsObj ? `${clsObj.class_name} - ${clsObj.section}` : (s.classes ? `${s.classes.class_name} - ${s.classes.section}` : 'Unassigned');

              return (
                <tr key={s.id} className={isChecked ? 'row-selected' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggleStudentSelect(s.id)}
                    />
                  </td>
                  <td>
                    <span className="roster-roll-pill">
                      {s.roll_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="student-avatar-circle">
                        {s.first_name?.[0] || 'S'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {s.email || 'No email'} {s.phone ? `• 📞 ${s.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>{s.gender || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.dob || 'DOB N/A'}</div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '12px', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: 'var(--primary)', 
                      padding: '3px 8px', 
                      borderRadius: '6px',
                      fontWeight: 600,
                      border: '1px solid rgba(59, 130, 246, 0.25)'
                    }}>
                      {classStr}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span className={`badge ${feePaid ? 'badge-paid' : 'badge-pending'}`} style={{ width: 'fit-content' }}>
                        {feePaid ? '✓ Paid' : 'Pending Due'}
                      </span>
                      <span style={{ fontSize: '11px', color: feePaid ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {sf ? `₹${(sf.amount_paid || 0).toLocaleString()} / ₹${(sf.gross_amount || clsObj?.base_fee || 45000).toLocaleString()}` : `₹${(clsObj?.base_fee || 45000).toLocaleString()} Due`}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <button 
                        className="action-btn transfer"
                        onClick={() => setTransferringStudent(s)}
                        title="Quick Move / Transfer to Another Class"
                        style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '5px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <ArrowRightLeft size={13} />
                        <span>Move</span>
                      </button>

                      <button 
                        className="action-btn edit" 
                        onClick={() => onEditStudent(s)} 
                        title="Edit Student Record"
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                      >
                        <Pencil size={14} />
                      </button>

                      <button 
                        className="action-btn perm" 
                        onClick={() => onOpenPermissions('student', s.id)} 
                        title="Student Access Permissions"
                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                      >
                        <Key size={14} />
                      </button>

                      <button 
                        className="action-btn delete" 
                        onClick={() => onDeleteStudent(s.id)} 
                        title="Delete Student Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredRosterStudents.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>No students found in this cohort filter</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {rosterSearch ? `No matches for "${rosterSearch}"` : 'Click "Add Student" or use "Batch Transfer" to allocate students to this class.'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddClassGroupModal 
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onSave={onAddClass}
        teachers={teachers}
      />

      <EditClassGroupModal
        isOpen={Boolean(editingClassObj)}
        onClose={() => setEditingClassObj(null)}
        onSave={onUpdateClass}
        classObj={editingClassObj}
        teachers={teachers}
      />

      <ManageClassSubjectsModal
        isOpen={Boolean(managingSubjectsClassObj)}
        onClose={() => setManagingSubjectsClassObj(null)}
        classObj={managingSubjectsClassObj}
        teachers={teachers}
        timetable={timetable}
        onAddTimetable={onAddTimetable}
        onDeleteTimetable={onDeleteTimetable}
      />

      <QuickTransferStudentModal
        isOpen={Boolean(transferringStudent)}
        onClose={() => setTransferringStudent(null)}
        onTransfer={onTransferStudent}
        student={transferringStudent}
        classes={classes}
      />
    </div>
  );
}
