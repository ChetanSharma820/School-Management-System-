import React, { useState, useEffect } from 'react';
import { api } from './api';
import { 
  MessageSquare, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  User, 
  Calendar, 
  BookOpen, 
  Award, 
  AlertCircle,
  Tag
} from 'lucide-react';

export default function StudentRemarksModal({ student, teachers, onClose, onRefreshAll }) {
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newRemark, setNewRemark] = useState({
    subject: 'Academic Progress & Mastery',
    custom_subject: '',
    teacher_id: teachers[0]?.id || 1,
    remark: '',
    category_tag: 'Commendation'
  });

  const standardCategories = [
    'Academic Progress & Mastery',
    'Mathematics & Analytical Skills',
    'Sciences & Lab Inquiry',
    'Languages & Creative Writing',
    'Classroom Engagement & Participation',
    'Behaviour, Discipline & Ethics',
    'Leadership & Extracurricular Activities',
    'Attendance & Punctuality Notice',
    'Pastoral Care & Guardian Feedback',
    'Other (Custom Topic)'
  ];

  useEffect(() => {
    if (student?.id) {
      loadStudentRemarks(student.id);
    }
  }, [student]);

  const loadStudentRemarks = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.getRemarks(studentId);
      setRemarks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching remarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.remark.trim()) return;

    const effectiveSubject = newRemark.subject === 'Other (Custom Topic)'
      ? (newRemark.custom_subject.trim() || 'General Feedback')
      : newRemark.subject;

    setSubmitting(true);
    try {
      await api.addRemark({
        student_id: student.id,
        teacher_id: parseInt(newRemark.teacher_id) || (teachers[0]?.id || 1),
        subject: effectiveSubject,
        remark: newRemark.remark.trim(),
        created_at: new Date().toISOString()
      });

      setNewRemark({
        subject: 'Academic Progress & Mastery',
        custom_subject: '',
        teacher_id: teachers[0]?.id || 1,
        remark: '',
        category_tag: 'Commendation'
      });
      setShowAddForm(false);
      await loadStudentRemarks(student.id);
      if (onRefreshAll) onRefreshAll();
      alert('✓ Progress remark recorded and saved to student profile!');
    } catch (err) {
      alert('Error adding remark: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTeacherName = (tId) => {
    const t = teachers.find(item => item.id === tId);
    return t ? `Prof. ${t.first_name} ${t.last_name} (${t.department || 'Faculty'})` : 'Academic Administration Desk';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Student Progress Remarks & Pastoral Notes</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {student.first_name} {student.last_name} ({student.roll_number}) • Official Institutional Feedback Log
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Historical Remarks ({remarks.length})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => loadStudentRemarks(student.id)}
                disabled={loading}
                style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} className={loading ? 'spinning' : ''} />
                <span>{loading ? '...' : 'Refresh'}</span>
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: showAddForm ? 'var(--bg-input)' : 'linear-gradient(135deg, #0284c7, #0369a1)', color: showAddForm ? 'var(--text-main)' : '#fff' }}
              >
                {showAddForm ? <X size={14} /> : <Plus size={14} />}
                <span>{showAddForm ? 'Cancel Entry' : 'Post New Remark'}</span>
              </button>
            </div>
          </div>

          {/* Add Remark Form */}
          {showAddForm && (
            <form onSubmit={handleSaveRemark} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> Record New Progress Remark / Pastoral Observation
              </h4>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Evaluating Faculty / Author *</label>
                  <select
                    value={newRemark.teacher_id}
                    onChange={e => setNewRemark({ ...newRemark, teacher_id: e.target.value })}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        Prof. {t.first_name} {t.last_name} ({t.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject / Evaluation Focus *</label>
                  <select
                    value={newRemark.subject}
                    onChange={e => setNewRemark({ ...newRemark, subject: e.target.value })}
                  >
                    {standardCategories.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {newRemark.subject === 'Other (Custom Topic)' && (
                  <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                    <label>Custom Topic Title *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Science Olympiad Mentorship"
                      value={newRemark.custom_subject}
                      onChange={e => setNewRemark({ ...newRemark, custom_subject: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                  <label>Qualitative Progress Remark & Observations *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Enter comprehensive constructive academic progress, behavioral notes, or commendations..."
                    value={newRemark.remark}
                    onChange={e => setNewRemark({ ...newRemark, remark: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} />
                  <span>{submitting ? 'Saving...' : 'Submit Remark'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Remarks Timeline / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {remarks.map((r, idx) => {
              const authorName = r.teachers ? `Prof. ${r.teachers.first_name} ${r.teachers.last_name}` : getTeacherName(r.teacher_id);
              const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';

              return (
                <div key={r.id || idx} style={{
                  padding: '14px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: '#0284c7',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        border: '1px solid rgba(2, 132, 199, 0.25)'
                      }}>
                        {r.subject}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      📅 {dateStr}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    "{r.remark}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <User size={12} />
                    <span>Evaluated by: <strong style={{ color: 'var(--text-main)' }}>{authorName}</strong></span>
                  </div>
                </div>
              );
            })}

            {remarks.length === 0 && !showAddForm && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} color="#0284c7" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Remarks Recorded Yet</div>
                <p style={{ fontSize: '12.5px', margin: '4px 0 14px' }}>Click "Post New Remark" above to log the first progress remark for this student.</p>
                <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: '6px 14px', fontSize: '12px' }}>
                  <Plus size={14} /> Post Progress Remark
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
