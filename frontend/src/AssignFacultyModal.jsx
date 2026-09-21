import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Layers,
  UserCheck
} from 'lucide-react';
import { api } from './api';

export default function AssignFacultyModal({ 
  teacher, 
  classes = [], 
  onClose, 
  onAssignmentChanged 
}) {
  const [selectedHomeroomClassId, setSelectedHomeroomClassId] = useState('');
  const [savingHomeroom, setSavingHomeroom] = useState(false);
  const [homeroomSuccess, setHomeroomSuccess] = useState('');

  // Timetable & Subject Allocation State
  const [teacherTimetable, setTeacherTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);

  // New Subject Assignment Form State
  const [newSubjectForm, setNewSubjectForm] = useState({
    class_id: classes.length > 0 ? classes[0].id : 1,
    subject: 'Mathematics',
    day_of_week: 'Monday',
    start_time: '09:00 AM',
    end_time: '10:00 AM',
    room_number: 'Room 102'
  });
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectSuccess, setSubjectSuccess] = useState('');
  const [error, setError] = useState('');

  const subjectPresets = [
    'Mathematics',
    'Advanced Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Information Technology',
    'English Literature',
    'Social Sciences',
    'History & Civics',
    'Economics',
    'Environmental Science'
  ];

  // Find currently assigned homeroom class for this teacher
  useEffect(() => {
    const currentHomeroom = classes.find(c => c.teacher_id === teacher.id);
    if (currentHomeroom) {
      setSelectedHomeroomClassId(String(currentHomeroom.id));
    } else {
      setSelectedHomeroomClassId('');
    }
  }, [classes, teacher]);

  // Load Teacher's Timetable Allocations
  useEffect(() => {
    loadAllocations();
  }, [teacher.id]);

  const loadAllocations = async () => {
    setLoadingTimetable(true);
    try {
      const res = await api.getTimetable(null, teacher.id);
      if (Array.isArray(res)) {
        setTeacherTimetable(res);
      } else {
        setTeacherTimetable([]);
      }
    } catch (err) {
      console.error('Failed to load teacher timetable:', err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  // Save Homeroom / Class Teacher Assignment
  const handleSaveHomeroom = async (e) => {
    e.preventDefault();
    setSavingHomeroom(true);
    setHomeroomSuccess('');
    setError('');

    try {
      const newClassId = selectedHomeroomClassId ? parseInt(selectedHomeroomClassId) : null;
      const prevClass = classes.find(c => c.teacher_id === teacher.id);

      // If had previous homeroom class and changed, clear previous
      if (prevClass && prevClass.id !== newClassId) {
        await api.updateClass(prevClass.id, { teacher_id: null });
      }

      // If new class selected, set teacher_id
      if (newClassId) {
        await api.updateClass(newClassId, { teacher_id: teacher.id });
        const assignedClass = classes.find(c => c.id === newClassId);
        setHomeroomSuccess(`Successfully assigned Prof. ${teacher.first_name} ${teacher.last_name} as Class Teacher of ${assignedClass?.class_name} - ${assignedClass?.section}!`);
      } else {
        setHomeroomSuccess(`Removed Class Teacher assignment for Prof. ${teacher.first_name} ${teacher.last_name}.`);
      }

      if (onAssignmentChanged) {
        await onAssignmentChanged();
      }
    } catch (err) {
      setError('Failed to update Class Teacher assignment: ' + err.message);
    } finally {
      setSavingHomeroom(false);
    }
  };

  // Add New Subject Allocation
  const handleAddSubjectAssignment = async (e) => {
    e.preventDefault();
    if (!newSubjectForm.subject.trim()) {
      setError('Please specify a subject name.');
      return;
    }

    setAddingSubject(true);
    setSubjectSuccess('');
    setError('');

    try {
      const payload = {
        class_id: parseInt(newSubjectForm.class_id),
        teacher_id: teacher.id,
        subject: newSubjectForm.subject.trim(),
        day_of_week: newSubjectForm.day_of_week,
        start_time: newSubjectForm.start_time,
        end_time: newSubjectForm.end_time,
        room_number: newSubjectForm.room_number.trim() || 'Room 101'
      };

      await api.addTimetable(payload);
      setSubjectSuccess(`Assigned ${payload.subject} to ${classes.find(c => c.id === payload.class_id)?.class_name || 'Class'} successfully!`);
      await loadAllocations();
      if (onAssignmentChanged) {
        await onAssignmentChanged();
      }
    } catch (err) {
      setError('Failed to assign subject: ' + err.message);
    } finally {
      setAddingSubject(false);
    }
  };

  // Remove / Unassign Subject Period
  const handleDeleteAllocation = async (id) => {
    if (!window.confirm('Are you sure you want to unassign this subject lecture period?')) return;
    try {
      await api.deleteTimetable(id);
      setTeacherTimetable(prev => prev.filter(t => t.id !== id));
      if (onAssignmentChanged) {
        await onAssignmentChanged();
      }
    } catch (err) {
      alert('Error deleting allocation: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content assign-faculty-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(5, 150, 105, 0.15)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(5, 150, 105, 0.3)'
            }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Assign Faculty to Class & Subjects
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Educator: <strong style={{ color: 'var(--primary)' }}>Prof. {teacher.first_name} {teacher.last_name}</strong> ({teacher.employee_id}) • {teacher.department || 'Academic Faculty'}
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div className="login-error-box" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 1: HOMEROOM / CLASS TEACHER ASSIGNMENT */}
          {/* ========================================================= */}
          <div className="assignment-card-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                <UserCheck size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  1. Homeroom / Class Teacher Appointment
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  The designated Class Teacher has exclusive governance over student leave approvals and biometric attendance disputes for that class.
                </p>
              </div>
            </div>

            {homeroomSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} />
                <span>{homeroomSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveHomeroom} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Select Homeroom Class & Section:
                </label>
                <select 
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13.5px' }}
                  value={selectedHomeroomClassId}
                  onChange={e => setSelectedHomeroomClassId(e.target.value)}
                >
                  <option value="">-- None / Unassigned (Subject Teacher Only) --</option>
                  {classes.map(c => {
                    const isAssignedToOther = c.teacher_id && c.teacher_id !== teacher.id;
                    const isAssignedToCurrent = c.teacher_id === teacher.id;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.class_name} - Section {c.section} {isAssignedToCurrent ? '★ (Currently Assigned to this Teacher)' : isAssignedToOther ? `(Currently assigned to Teacher #${c.teacher_id})` : '(Available)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={savingHomeroom}
                style={{ height: '40px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>{savingHomeroom ? 'Saving...' : 'Update Class Teacher Role'}</span>
              </button>
            </form>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: SUBJECT & LECTURE ALLOCATIONS */}
          {/* ========================================================= */}
          <div className="assignment-card-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  2. Subject & Period Teaching Allocations
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Assign subjects and lecture periods taught by Prof. {teacher.first_name} across multiple grades and sections.
                </p>
              </div>
            </div>

            {/* Existing Subject Allocations List */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Current Teaching Roster ({teacherTimetable.length} periods assigned):
                </span>
              </div>

              {loadingTimetable ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Loading teaching allocations...
                </div>
              ) : teacherTimetable.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                  No subject lecture periods assigned yet. Use the form below to allocate subjects to classes.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
                  {teacherTimetable.map(item => {
                    const cName = item.classes ? `${item.classes.class_name} - ${item.classes.section}` : `Class #${item.class_id}`;
                    return (
                      <div 
                        key={item.id} 
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ color: 'var(--primary)', fontSize: '13.5px' }}>{item.subject}</strong>
                          <button 
                            onClick={() => handleDeleteAllocation(item.id)}
                            title="Unassign this lecture"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                          {cName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          <span>{item.day_of_week} • {item.start_time} - {item.end_time}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} />
                          <span>{item.room_number || 'Main Classroom'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Subject Allocation Form */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '16px', border: '1px dashed var(--border-color)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} />
                <span>Allocate New Subject Lecture</span>
              </h4>

              {subjectSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} />
                  <span>{subjectSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddSubjectAssignment}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Class *</label>
                    <select 
                      value={newSubjectForm.class_id}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, class_id: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subject Name *</label>
                    <input 
                      type="text"
                      list="subject-suggestions"
                      value={newSubjectForm.subject}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                    />
                    <datalist id="subject-suggestions">
                      {subjectPresets.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Day of Week</label>
                    <select 
                      value={newSubjectForm.day_of_week}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, day_of_week: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="All Weekdays">All Weekdays (Mon-Fri)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Period Timing</label>
                    <input 
                      type="text"
                      value={newSubjectForm.start_time}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, start_time: e.target.value })}
                      placeholder="e.g. 09:00 AM - 10:00 AM"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Room / Lab Location</label>
                    <input 
                      type="text"
                      value={newSubjectForm.room_number}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, room_number: e.target.value })}
                      placeholder="e.g. Room 102 or Science Lab"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Quick Subject Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Pick:</span>
                  {subjectPresets.slice(0, 6).map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setNewSubjectForm({ ...newSubjectForm, subject: sub })}
                      style={{
                        background: newSubjectForm.subject === sub ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.08)',
                        color: newSubjectForm.subject === sub ? '#10b981' : 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={addingSubject}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10b981', borderColor: '#10b981' }}
                  >
                    <Plus size={15} />
                    <span>{addingSubject ? 'Assigning Subject...' : 'Assign Subject & Lecture Period'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close & Return to Faculty Directory
          </button>
        </div>
      </div>
    </div>
  );
}
