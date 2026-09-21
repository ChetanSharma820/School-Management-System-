import React, { useState, useEffect } from 'react';
import { Layers, Check, X, UserCheck, Plus, Sparkles, Building, BookOpen, AlertCircle, DollarSign, CreditCard, Trash2, Clock, Calendar } from 'lucide-react';

export function AddClassGroupModal({ isOpen, onClose, onSave, teachers = [] }) {
  const [formData, setFormData] = useState({
    class_name: 'Grade 10',
    section: 'A',
    teacher_id: '',
    base_fee: 45000
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_name.trim() || !formData.section.trim()) {
      setError('Please provide both Class/Grade Name and Section.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        class_name: formData.class_name.trim(),
        section: formData.section.trim().toUpperCase(),
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
        base_fee: parseFloat(formData.base_fee) || 45000
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create class group');
    } finally {
      setSaving(false);
    }
  };

  const gradePresets = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11 - Science', 'Grade 11 - Commerce', 'Grade 11 - Arts',
    'Grade 12 - Science', 'Grade 12 - Commerce', 'Grade 12 - Arts',
    'Kindergarten - KG1', 'Kindergarten - KG2'
  ];

  const sectionPresets = ['A', 'B', 'C', 'D', 'E', 'Alpha', 'Beta', 'Omega'];
  const feePresets = [
    { label: '₹40,000 (Middle / Gr 9)', val: 40000 },
    { label: '₹45,000 (Secondary / Gr 10)', val: 45000 },
    { label: '₹52,000 (Sr Sec Gr 11)', val: 52000 },
    { label: '₹58,000 (Sr Sec Gr 12)', val: 58000 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Create New Class Group / Batch
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Establish a new grade cohort, section, fee structure, and faculty allocation
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid" style={{ padding: '20px', gap: '16px' }}>
            {error && (
              <div className="full-width" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Class / Grade Name */}
            <div className="form-group full-width">
              <label>Grade / Cohort Name *</label>
              <input 
                type="text"
                list="grade-presets-list"
                required
                placeholder="e.g. Grade 10 or Grade 11 - Science"
                value={formData.class_name}
                onChange={e => setFormData({ ...formData, class_name: e.target.value })}
              />
              <datalist id="grade-presets-list">
                {gradePresets.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>

            {/* Quick Grade Selection Chips */}
            <div className="form-group full-width" style={{ marginTop: '-6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Pick:</span>
                {['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 - Sci', 'Grade 12 - Sci'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      const name = g.includes('Sci') ? g.replace('Sci', 'Science') : g;
                      let fee = 45000;
                      if (g.includes('9')) fee = 40000;
                      else if (g.includes('10')) fee = 45000;
                      else if (g.includes('11')) fee = 52000;
                      else if (g.includes('12')) fee = 58000;
                      setFormData({ ...formData, class_name: name, base_fee: fee });
                    }}
                    style={{
                      background: formData.class_name.startsWith(g.slice(0, 7)) ? 'rgba(37, 99, 235, 0.18)' : 'var(--bg-card)',
                      color: formData.class_name.startsWith(g.slice(0, 7)) ? 'var(--primary)' : 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Identifier */}
            <div className="form-group">
              <label>Section / Batch Code *</label>
              <input 
                type="text"
                required
                placeholder="e.g. A, B, C or Alpha"
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value })}
              />
            </div>

            {/* Quick Section Chips */}
            <div className="form-group">
              <label>Quick Section:</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                {sectionPresets.slice(0, 5).map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setFormData({ ...formData, section: sec })}
                    style={{
                      background: formData.section === sec ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card)',
                      color: formData.section === sec ? '#10b981' : 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Tuition Fee for this Grade/Section */}
            <div className="form-group full-width" style={{ background: 'rgba(2, 132, 199, 0.06)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 700, margin: 0 }}>
                  <DollarSign size={15} /> Standard Academic Annual Tuition Fee (INR) *
                </label>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>
                  ₹{Number(formData.base_fee || 0).toLocaleString()}
                </span>
              </div>
              <input 
                type="number"
                min="0"
                step="500"
                required
                placeholder="e.g. 45000"
                value={formData.base_fee}
                onChange={e => setFormData({ ...formData, base_fee: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {feePresets.map(f => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, base_fee: f.val })}
                    style={{
                      background: Number(formData.base_fee) === f.val ? 'rgba(5, 150, 105, 0.15)' : '#f1f5f9',
                      color: Number(formData.base_fee) === f.val ? '#059669' : 'var(--text-secondary)',
                      border: `1px solid ${Number(formData.base_fee) === f.val ? 'rgba(5, 150, 105, 0.35)' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                💡 Enrolled students assigned to this class group will automatically have their fee structure and balance determined by this rate.
              </small>
            </div>

            {/* Homeroom / Class Teacher Appointment */}
            <div className="form-group full-width">
              <label>Assign Homeroom / Class Teacher (Optional)</label>
              <select
                value={formData.teacher_id}
                onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
              >
                <option value="">-- No Class Teacher Assigned Yet --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    Prof. {t.first_name} {t.last_name} ({t.employee_id}) • {t.department || 'Faculty'}
                  </option>
                ))}
              </select>
              <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                💡 The assigned Class Teacher evaluates leave applications and daily attendance regularizations for this cohort.
              </small>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{saving ? 'Creating Group...' : 'Create Class Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditClassGroupModal({ isOpen, onClose, onSave, classObj, teachers = [] }) {
  const [formData, setFormData] = useState({
    class_name: classObj?.class_name || '',
    section: classObj?.section || '',
    teacher_id: classObj?.teacher_id ? String(classObj.teacher_id) : '',
    base_fee: classObj?.base_fee || 45000,
    update_student_fees: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !classObj) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_name.trim() || !formData.section.trim()) {
      setError('Please provide both Class/Grade Name and Section.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        class_name: formData.class_name.trim(),
        section: formData.section.trim().toUpperCase(),
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
        base_fee: parseFloat(formData.base_fee) || 45000,
        update_student_fees: formData.update_student_fees
      };
      await onSave(classObj.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update class group');
    } finally {
      setSaving(false);
    }
  };

  const feePresets = [
    { label: '₹40,000 (Middle / Gr 9)', val: 40000 },
    { label: '₹45,000 (Secondary / Gr 10)', val: 45000 },
    { label: '₹52,000 (Sr Sec Gr 11)', val: 52000 },
    { label: '₹58,000 (Sr Sec Gr 12)', val: 58000 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Configure Class Group #{classObj.id}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Update Grade name, Section batch, Tuition Fee rate, or reassign Homeroom Teacher
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid" style={{ padding: '20px', gap: '16px' }}>
            {error && (
              <div className="full-width" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Grade / Cohort Name *</label>
              <input 
                type="text"
                required
                value={formData.class_name}
                onChange={e => setFormData({ ...formData, class_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Section Code *</label>
              <input 
                type="text"
                required
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value })}
              />
            </div>

            {/* Standard Tuition Fee for this Grade/Section */}
            <div className="form-group full-width" style={{ background: 'rgba(5, 150, 105, 0.06)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, margin: 0 }}>
                  <DollarSign size={15} /> Standard Academic Annual Tuition Fee (INR) *
                </label>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>
                  ₹{Number(formData.base_fee || 0).toLocaleString()}
                </span>
              </div>
              <input 
                type="number"
                min="0"
                step="500"
                required
                placeholder="e.g. 45000"
                value={formData.base_fee}
                onChange={e => setFormData({ ...formData, base_fee: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {feePresets.map(f => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, base_fee: f.val })}
                    style={{
                      background: Number(formData.base_fee) === f.val ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      color: Number(formData.base_fee) === f.val ? '#34d399' : '#94a3b8',
                      border: `1px solid ${Number(formData.base_fee) === f.val ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={formData.update_student_fees}
                  onChange={e => setFormData({ ...formData, update_student_fees: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>Sync & update tuition fees for all currently enrolled students in this cohort</span>
              </label>
            </div>

            <div className="form-group full-width">
              <label>Homeroom / Class Teacher</label>
              <select
                value={formData.teacher_id}
                onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
              >
                <option value="">-- No Class Teacher Assigned --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    Prof. {t.first_name} {t.last_name} ({t.employee_id}) • {t.department || 'Faculty'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{saving ? 'Updating...' : 'Save Class Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickTransferStudentModal({ isOpen, onClose, onTransfer, student, classes = [] }) {
  const [targetClassId, setTargetClassId] = useState(classes[0]?.id ? String(classes[0].id) : '');
  const [transferring, setTransferring] = useState(false);

  if (!isOpen || !student) return null;

  const currentClass = classes.find(c => c.id === student.class_id);
  const currentClassStr = currentClass ? `${currentClass.class_name} - Section ${currentClass.section}` : 'Unassigned';

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!targetClassId) return;
    setTransferring(true);
    try {
      await onTransfer(student.id, parseInt(targetClassId));
      onClose();
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Transfer / Reassign Class
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Move student to a new Grade cohort or Section
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleTransferSubmit}>
          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {student.first_name} {student.last_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Roll: <strong style={{ color: 'var(--primary)' }}>{student.roll_number}</strong> • Current: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{currentClassStr}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Select Target Class Group & Section *</label>
              <select
                value={targetClassId}
                onChange={e => setTargetClassId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                required
              >
                {classes.map(c => {
                  const isCurrent = c.id === student.class_id;
                  return (
                    <option key={c.id} value={c.id} disabled={isCurrent}>
                      {c.class_name} - Section {c.section} {isCurrent ? '(Current Class)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={transferring}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={transferring || !targetClassId}>
              <Check size={15} />
              <span>{transferring ? 'Transferring...' : 'Confirm Class Move'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ManageClassSubjectsModal({
  isOpen,
  onClose,
  classObj,
  teachers = [],
  timetable = [],
  onAddTimetable,
  onDeleteTimetable
}) {
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    teacher_id: teachers.length > 0 ? String(teachers[0].id) : '',
    day_of_week: 'Monday',
    start_time: '09:00 AM',
    end_time: '10:00 AM',
    room_number: classObj?.room_number || 'Room 102'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && classObj) {
      setFormData(prev => ({
        ...prev,
        teacher_id: prev.teacher_id || (teachers.length > 0 ? String(teachers[0].id) : ''),
        room_number: prev.room_number || classObj.room_number || 'Room 101'
      }));
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, classObj, teachers]);

  if (!isOpen || !classObj) return null;

  const classTimetable = timetable.filter(t => t.class_id === classObj.id);

  const subjectPresets = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science & IT',
    'English Literature',
    'Social Sciences & Civics',
    'History & Geography',
    'Economics & Commerce',
    'Hindi Literature',
    'Environmental Studies',
    'Physical Education & Sports'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setError('Please provide a subject name.');
      return;
    }
    if (!formData.teacher_id) {
      setError('Please appoint a faculty subject teacher.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const payload = {
        class_id: classObj.id,
        teacher_id: parseInt(formData.teacher_id),
        subject: formData.subject.trim(),
        day_of_week: formData.day_of_week || 'Monday',
        start_time: formData.start_time || '09:00 AM',
        end_time: formData.end_time || '10:00 AM',
        room_number: formData.room_number.trim() || 'Room 101'
      };

      if (onAddTimetable) {
        await onAddTimetable(payload);
      }
      const appointedTeacher = teachers.find(t => t.id === parseInt(formData.teacher_id));
      setSuccessMsg(`Assigned "${payload.subject}" to Prof. ${appointedTeacher?.first_name || ''} ${appointedTeacher?.last_name || ''}! Teacher notified.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to assign subject period');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '840px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Class Curriculum & Subject Teachers
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Assign subjects & faculty periods for <strong style={{ color: 'var(--primary)' }}>{classObj.class_name} - Section {classObj.section}</strong>
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Form to Assign New Subject */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--primary)" />
              <span>Assign New Subject & Faculty Period</span>
            </h4>

            <form onSubmit={handleAddSubject}>
              <div className="form-grid" style={{ gap: '14px' }}>
                {/* Subject Name */}
                <div className="form-group">
                  <label>Subject Curriculum Name *</label>
                  <input
                    type="text"
                    list="class-subject-presets"
                    required
                    placeholder="e.g. Mathematics or Computer Science"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                  <datalist id="class-subject-presets">
                    {subjectPresets.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>

                {/* Assigned Teacher */}
                <div className="form-group">
                  <label>Appoint Subject Teacher *</label>
                  <select
                    value={formData.teacher_id}
                    onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Faculty Member --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        Prof. {t.first_name} {t.last_name} ({t.employee_id}) • {t.department || 'Faculty'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week */}
                <div className="form-group">
                  <label>Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                  >
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="Mon - Fri">Monday to Friday (Daily)</option>
                  </select>
                </div>

                {/* Lecture Timing */}
                <div className="form-group">
                  <label>Period Time Slot</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Start e.g. 09:00 AM"
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>–</span>
                    <input
                      type="text"
                      placeholder="End e.g. 10:00 AM"
                      value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                {/* Room Number */}
                <div className="form-group">
                  <label>Classroom / Lab Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102, Science Lab 2"
                    value={formData.room_number}
                    onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                    style={{ width: '100%', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Check size={16} />
                    <span>{saving ? 'Assigning...' : 'Assign Subject Period'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Currently Assigned Subjects Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Active Assigned Subjects & Faculty Routine ({classTimetable.length})
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Visible in Student & Teacher Timetable
              </span>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Subject Curriculum</th>
                    <th>Appointed Teacher</th>
                    <th>Schedule Period</th>
                    <th>Classroom</th>
                    <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classTimetable.map(slot => {
                    const teacher = slot.teachers || teachers.find(t => t.id === slot.teacher_id);
                    return (
                      <tr key={slot.id}>
                        <td>
                          <strong style={{ color: 'var(--text-main)', fontSize: '13.5px' }}>{slot.subject}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {teacher?.first_name?.[0] || 'T'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                                {teacher ? `Prof. ${teacher.first_name} ${teacher.last_name}` : 'Unassigned'}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {teacher?.employee_id || 'TCH'} • {teacher?.department || 'Faculty'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>
                            {slot.day_of_week} • {slot.start_time} - {slot.end_time}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📍 {slot.room_number || 'Room 101'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="action-btn delete"
                            onClick={() => onDeleteTimetable(slot.id)}
                            title="Unassign this subject period"
                            style={{ padding: '5px 8px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {classTimetable.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        <BookOpen size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                        <div>No subject periods assigned to this class group yet.</div>
                        <div style={{ fontSize: '11.5px', marginTop: '2px' }}>Use the form above to assign subjects to faculty educators.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}

