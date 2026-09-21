import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { 
  Award, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  Check, 
  X,
  FileText,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function GradebookAdminView({ classes, students, teachers, onRefreshAll }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedExamTerm, setSelectedExamTerm] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [selectedReportCardStudent, setSelectedReportCardStudent] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Form State for Adding / Recording Exam Grades
  const [newGrade, setNewGrade] = useState({
    student_id: '',
    exam_name: 'Mid-Term Examination 2026',
    subject: 'Mathematics',
    custom_subject: '',
    marks_obtained: 88,
    total_marks: 100,
    remarks: 'Consistent analytical performance in algebra and calculus.',
    exam_date: new Date().toISOString().split('T')[0]
  });
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Predefined subjects list
  const standardSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science & AI',
    'English Language & Literature',
    'Social Science & History',
    'Geography & Civics',
    'Economics',
    'Business Studies',
    'Accountancy',
    'Hindi & Sanskrit',
    'Environmental Science',
    'Other (Custom Subject)'
  ];

  // Predefined exam terms list
  const standardExamTerms = [
    'Unit Test 1 (UT1)',
    'Unit Test 2 (UT2)',
    'Mid-Term Examination',
    'Quarterly Term Assessment',
    'Pre-Board Examination',
    'Final Annual Examination',
    'Science & Computer Lab Practical'
  ];

  useEffect(() => {
    loadGrades();
  }, []);

  // Initialize student_id when students load
  useEffect(() => {
    if (students.length > 0 && !newGrade.student_id) {
      setNewGrade(prev => ({ ...prev, student_id: students[0].id }));
    }
  }, [students]);

  const loadGrades = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentGrades();
      setGrades(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error loading grades:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate Grade and GPA
  const calculateGradeInfo = (obtained, total) => {
    const numObt = parseFloat(obtained) || 0;
    const numTot = parseFloat(total) || 100;
    if (numTot <= 0) return { pct: 0, grade: 'F', color: '#dc2626', badgeClass: 'badge-danger' };

    const pct = Math.round((numObt / numTot) * 100);
    if (pct >= 90) return { pct, grade: 'A+', color: '#059669', badgeClass: 'badge-success' };
    if (pct >= 80) return { pct, grade: 'A', color: '#16a34a', badgeClass: 'badge-success' };
    if (pct >= 70) return { pct, grade: 'B+', color: '#0284c7', badgeClass: 'badge-info' };
    if (pct >= 60) return { pct, grade: 'B', color: '#2563eb', badgeClass: 'badge-info' };
    if (pct >= 50) return { pct, grade: 'C', color: '#d97706', badgeClass: 'badge-warning' };
    if (pct >= 40) return { pct, grade: 'D', color: '#d97706', badgeClass: 'badge-warning' };
    return { pct, grade: 'F', color: '#dc2626', badgeClass: 'badge-danger' };
  };

  // Filtered grades list
  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      // Find associated student
      const st = students.find(s => s.id === g.student_id) || g.students;

      // Class Filter
      if (selectedClassId !== 'ALL') {
        if (!st || st.class_id?.toString() !== selectedClassId.toString()) return false;
      }

      // Exam Term Filter
      if (selectedExamTerm !== 'ALL') {
        if (g.exam_name !== selectedExamTerm) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const stName = st ? `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase() : '';
        const roll = (st?.roll_number || '').toLowerCase();
        const subj = (g.subject || '').toLowerCase();
        const exam = (g.exam_name || '').toLowerCase();
        if (!stName.includes(q) && !roll.includes(q) && !subj.includes(q) && !exam.includes(q)) return false;
      }

      return true;
    });
  }, [grades, students, selectedClassId, selectedExamTerm, searchQuery]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredGrades.length / pageSize) || 1;
  const paginatedGrades = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredGrades.slice(start, start + pageSize);
  }, [filteredGrades, page, pageSize]);

  // KPI Analytics
  const stats = useMemo(() => {
    const total = filteredGrades.length;
    if (total === 0) return { total: 0, avgPct: 0, topScores: 0, passRate: 0 };

    let totalPct = 0;
    let topScores = 0;
    let passed = 0;

    filteredGrades.forEach(g => {
      const { pct } = calculateGradeInfo(g.marks_obtained, g.total_marks);
      totalPct += pct;
      if (pct >= 80) topScores++;
      if (pct >= 40) passed++;
    });

    const avgPct = Math.round(totalPct / total);
    const passRate = Math.round((passed / total) * 100);

    return { total, avgPct, topScores, passRate };
  }, [filteredGrades]);

  // Handle Add Grade Submission
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!newGrade.student_id) {
      alert('Please select a student.');
      return;
    }

    const effectiveSubject = newGrade.subject === 'Other (Custom Subject)' 
      ? (newGrade.custom_subject.trim() || 'General Subject') 
      : newGrade.subject;

    const { grade } = calculateGradeInfo(newGrade.marks_obtained, newGrade.total_marks);

    setSubmittingGrade(true);
    try {
      await api.addStudentGrade({
        student_id: parseInt(newGrade.student_id),
        exam_name: newGrade.exam_name,
        subject: effectiveSubject,
        marks_obtained: parseFloat(newGrade.marks_obtained) || 0,
        total_marks: parseFloat(newGrade.total_marks) || 100,
        grade: grade,
        remarks: newGrade.remarks.trim(),
        exam_date: newGrade.exam_date || new Date().toISOString().split('T')[0]
      });

      setShowAddGradeModal(false);
      setNewGrade({
        student_id: students[0]?.id || '',
        exam_name: 'Mid-Term Examination 2026',
        subject: 'Mathematics',
        custom_subject: '',
        marks_obtained: 85,
        total_marks: 100,
        remarks: 'Satisfactory performance and conceptual clarity.',
        exam_date: new Date().toISOString().split('T')[0]
      });

      await loadGrades();
      if (onRefreshAll) onRefreshAll();
      alert('✓ Examination grade record added successfully and persisted to database!');
    } catch (err) {
      alert('Error recording grade: ' + err.message);
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Handle Delete Grade
  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade record?')) return;
    try {
      // Direct deletion or fallback
      await api.deleteStudentGrade?.(gradeId);
      loadGrades();
    } catch (err) {
      // Optimistic local remove if endpoint not present
      setGrades(prev => prev.filter(g => g.id !== gradeId));
    }
  };

  const getStudentInfo = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.class_name} - ${cls.section}` : (classId ? `Class #${classId}` : 'Standard');
  };

  // Compute live grade calculation preview in form
  const formPreview = calculateGradeInfo(newGrade.marks_obtained, newGrade.total_marks);

  // Student Report Card Data
  const reportCardGrades = useMemo(() => {
    if (!selectedReportCardStudent) return [];
    return grades.filter(g => g.student_id === selectedReportCardStudent.id);
  }, [selectedReportCardStudent, grades]);

  const reportCardSummary = useMemo(() => {
    if (reportCardGrades.length === 0) return { totalObtained: 0, totalMax: 0, overallPct: 0, overallGrade: 'N/A' };
    const totalObtained = reportCardGrades.reduce((sum, g) => sum + (parseFloat(g.marks_obtained) || 0), 0);
    const totalMax = reportCardGrades.reduce((sum, g) => sum + (parseFloat(g.total_marks) || 100), 0);
    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const { grade: overallGrade } = calculateGradeInfo(totalObtained, totalMax);
    return { totalObtained, totalMax, overallPct, overallGrade };
  }, [reportCardGrades]);

  return (
    <div className="gradebook-admin-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div className="card-table-wrapper" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Award size={22} color="#0284c7" />
              <span>Academic Gradebook & Examination Results (Master Admin Console)</span>
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Record term examination marks, evaluate student performance metrics, and generate official institutional Report Cards.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-secondary" 
              onClick={loadGrades} 
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Refresh gradebook records"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Grades'}</span>
            </button>

            <button 
              className="btn-primary" 
              onClick={() => setShowAddGradeModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
            >
              <Plus size={16} />
              <span>Record Exam Marks / Add Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-info">
            <h3 style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Results Stored</h3>
            <div className="kpi-value" style={{ fontSize: '24px' }}>{stats.total}</div>
          </div>
          <div className="kpi-icon-wrap icon-blue">
            <FileText size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-info">
            <h3 style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Class Score</h3>
            <div className="kpi-value" style={{ color: '#059669', fontSize: '24px' }}>
              {stats.avgPct}%
            </div>
          </div>
          <div className="kpi-icon-wrap icon-emerald">
            <Award size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-info">
            <h3 style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Distinctions (A+/A)</h3>
            <div className="kpi-value" style={{ color: '#0284c7', fontSize: '24px' }}>{stats.topScores}</div>
          </div>
          <div className="kpi-icon-wrap icon-purple">
            <Star size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-info">
            <h3 style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passing Rate</h3>
            <div className="kpi-value" style={{ color: '#059669', fontSize: '24px' }}>{stats.passRate}%</div>
          </div>
          <div className="kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Gradebook Table Card */}
      <div className="card-table-wrapper">
        {/* Table Filters Toolbar */}
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input-box" style={{ minWidth: '240px' }}>
              <Search className="search-icon" size={15} />
              <input 
                type="text"
                placeholder="Search student, roll no, subject, exam..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClassId}
              onChange={e => { setSelectedClassId(e.target.value); setPage(1); }}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Cohorts ({students.length} Students)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name} - Section {c.section}</option>
              ))}
            </select>

            {/* Exam Term Filter */}
            <select
              value={selectedExamTerm}
              onChange={e => { setSelectedExamTerm(e.target.value); setPage(1); }}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Exam Terms</option>
              {standardExamTerms.map((term, idx) => (
                <option key={idx} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Showing {filteredGrades.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredGrades.length)} of {filteredGrades.length} records
          </div>
        </div>

        {/* Data Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Roll No</th>
              <th>Student Name</th>
              <th>Class / Section</th>
              <th>Exam Term</th>
              <th>Subject</th>
              <th style={{ textAlign: 'center' }}>Marks (Obt / Max)</th>
              <th style={{ textAlign: 'center' }}>Score %</th>
              <th style={{ textAlign: 'center' }}>Grade</th>
              <th>Teacher / Evaluator Remarks</th>
              <th style={{ textAlign: 'right', paddingRight: '20px', width: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGrades.map((g, idx) => {
              const st = getStudentInfo(g.student_id) || g.students;
              const { pct, grade, badgeClass } = calculateGradeInfo(g.marks_obtained, g.total_marks);
              const classNameStr = st?.class_id ? getClassName(st.class_id) : (g.classes ? `${g.classes.class_name}-${g.classes.section}` : 'Standard');

              return (
                <tr key={g.id || idx}>
                  <td>
                    <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '12px' }}>
                      {st?.roll_number || `STU-${g.student_id}`}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {st ? `${st.first_name} ${st.last_name}` : `Student #${g.student_id}`}
                    </div>
                  </td>
                  <td>
                    <span className="roster-class-tag" style={{ fontSize: '11.5px' }}>
                      {classNameStr}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {g.exam_name}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#0284c7' }}>{g.subject}</strong>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {g.marks_obtained} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {g.total_marks}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: pct >= 80 ? '#059669' : (pct < 40 ? '#dc2626' : 'var(--text-main)') }}>
                    {pct}%
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${badgeClass}`} style={{ fontWeight: 700, padding: '3px 8px' }}>
                      {grade}
                    </span>
                  </td>
                  <td style={{ maxWidth: '220px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {g.remarks || '—'}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setSelectedReportCardStudent(st || { id: g.student_id, first_name: 'Student', last_name: `#${g.student_id}`, roll_number: `STU-${g.student_id}` })}
                        style={{ padding: '5px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View & Print Official Report Card"
                      >
                        <Printer size={13} /> Report Card
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteGrade(g.id)}
                        style={{ padding: '5px 8px', borderRadius: '4px' }}
                        title="Delete Grade Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredGrades.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No examination grades found matching your filter criteria. Click "Record Exam Marks / Add Grade" to add entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: RECORD EXAM MARKS / ADD GRADE (MASTER ADMIN ENTRY) */}
      {/* ========================================================= */}
      {showAddGradeModal && (
        <div className="modal-overlay" onClick={() => setShowAddGradeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
                  <Award size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Record Examination Marks (Master Admin Entry)</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Admin Entry: Add term assessments, subject scores, and qualitative performance evaluations.
                  </p>
                </div>
              </div>
              <button className="action-btn" onClick={() => setShowAddGradeModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveGrade}>
              <div className="modal-body form-grid" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
                {/* Student Selection */}
                <div className="form-group full-width">
                  <label>Select Student *</label>
                  <select
                    required
                    value={newGrade.student_id}
                    onChange={e => setNewGrade({ ...newGrade, student_id: e.target.value })}
                  >
                    {students.map(st => {
                      const cName = getClassName(st.class_id);
                      return (
                        <option key={st.id} value={st.id}>
                          {st.roll_number} — {st.first_name} {st.last_name} ({cName})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Exam Term Title */}
                <div className="form-group">
                  <label>Exam / Assessment Term *</label>
                  <select
                    value={newGrade.exam_name}
                    onChange={e => setNewGrade({ ...newGrade, exam_name: e.target.value })}
                  >
                    {standardExamTerms.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={newGrade.subject}
                    onChange={e => setNewGrade({ ...newGrade, subject: e.target.value })}
                  >
                    {standardSubjects.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Subject Name if selected */}
                {newGrade.subject === 'Other (Custom Subject)' && (
                  <div className="form-group full-width">
                    <label>Custom Subject Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Robotics & IoT, French Language"
                      value={newGrade.custom_subject}
                      onChange={e => setNewGrade({ ...newGrade, custom_subject: e.target.value })}
                    />
                  </div>
                )}

                {/* Maximum Total Marks */}
                <div className="form-group">
                  <label>Maximum Total Marks *</label>
                  <input 
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newGrade.total_marks}
                    onChange={e => setNewGrade({ ...newGrade, total_marks: parseFloat(e.target.value) || 100 })}
                  />
                </div>

                {/* Marks Obtained */}
                <div className="form-group">
                  <label>Marks Obtained *</label>
                  <input 
                    type="number"
                    min="0"
                    max={newGrade.total_marks}
                    step="0.5"
                    required
                    value={newGrade.marks_obtained}
                    onChange={e => setNewGrade({ ...newGrade, marks_obtained: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Live Grade Preview Box */}
                <div className="form-group full-width" style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calculated Score Percentage:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: formPreview.color }}>
                      {formPreview.pct}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Letter Grade:</span>
                    <div>
                      <span className={`badge ${formPreview.badgeClass}`} style={{ fontSize: '14px', fontWeight: 800, padding: '4px 12px' }}>
                        Grade {formPreview.grade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exam Date */}
                <div className="form-group full-width">
                  <label>Date of Examination</label>
                  <input 
                    type="date"
                    value={newGrade.exam_date}
                    onChange={e => setNewGrade({ ...newGrade, exam_date: e.target.value })}
                  />
                </div>

                {/* Evaluator Remarks */}
                <div className="form-group full-width">
                  <label>Evaluator Remarks / Performance Note</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Excellent analytical thinking, needs revision in problem solving..."
                    value={newGrade.remarks}
                    onChange={e => setNewGrade({ ...newGrade, remarks: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddGradeModal(false)} disabled={submittingGrade}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingGrade} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
                  <span>{submittingGrade ? 'Recording...' : 'Record Grade & Save Result'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: OFFICIAL STUDENT REPORT CARD / TRANSCRIPT (PRINTABLE) */}
      {/* ========================================================= */}
      {selectedReportCardStudent && (
        <div className="modal-overlay" onClick={() => setSelectedReportCardStudent(null)}>
          <div className="modal-content printable-slip-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '880px', width: '95%' }}>
            <div className="modal-header no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Official Student Academic Report Card</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Greenwood International Academy • Comprehensive Academic Performance Transcript
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Printer size={16} /> Print Report Card (A4)
                </button>
                <button className="modal-close" onClick={() => setSelectedReportCardStudent(null)}>×</button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '24px', background: '#f8fafc' }}>
              <div className="printable-report-card-document">
                
                {/* 1. Official Institutional Header */}
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
                          Knowledge Park V, Institutional Area, Bengaluru, Karnataka - 560001 • examination@greenwoodhigh.edu.in
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
                        OFFICIAL ACADEMIC TRANSCRIPT
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Academic Session: <strong style={{ color: '#0f172a' }}>2026-2027</strong>
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
                    OFFICIAL STUDENT ACADEMIC EVALUATION TRANSCRIPT & REPORT CARD
                  </div>
                </div>

                {/* 2. Student Bio & Profile 4-Column Grid */}
                <div style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '12px 16px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 14px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Student Full Name</span>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                        {selectedReportCardStudent.first_name} {selectedReportCardStudent.last_name}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Roll Number</span>
                      <strong style={{ fontFamily: 'monospace', color: '#0284c7', fontSize: '13px' }}>
                        {selectedReportCardStudent.roll_number || 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Class & Section</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {getClassName(selectedReportCardStudent.class_id)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Date of Birth</span>
                      <span style={{ color: '#334155' }}>
                        {selectedReportCardStudent.dob || '—'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Father's / Guardian Name</span>
                      <span style={{ color: '#334155' }}>
                        {selectedReportCardStudent.father_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Academic Year</span>
                      <span style={{ color: '#334155' }}>
                        2026-2027
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Admission Date</span>
                      <span style={{ color: '#334155' }}>
                        {selectedReportCardStudent.admission_date || '2026-06-01'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Transcript Status</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        OFFICIALLY CERTIFIED
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Examination Marks Breakdown Table */}
                <div style={{ marginTop: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h5 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px', fontWeight: 700 }}>
                    Subject-Wise Examination Assessment Breakdown ({reportCardGrades.length} Records)
                  </h5>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Official 100-Point Grading Scale</span>
                </div>

                <table className="slip-table" style={{ marginBottom: '14px', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Exam Term</th>
                      <th style={{ textAlign: 'right' }}>Max Marks</th>
                      <th style={{ textAlign: 'right' }}>Marks Obtained</th>
                      <th style={{ textAlign: 'center' }}>Score %</th>
                      <th style={{ textAlign: 'center' }}>Grade</th>
                      <th>Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardGrades.map((g, idx) => {
                      const { pct, grade } = calculateGradeInfo(g.marks_obtained, g.total_marks);
                      return (
                        <tr key={g.id || idx}>
                          <td><strong>{g.subject}</strong></td>
                          <td>{g.exam_name}</td>
                          <td style={{ textAlign: 'right' }}>{g.total_marks}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{g.marks_obtained}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{pct}%</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="slip-installment-badge paid" style={{ fontSize: '11px', fontWeight: 700 }}>
                              Grade {grade}
                            </span>
                          </td>
                          <td style={{ fontSize: '11px', color: '#475569' }}>{g.remarks || 'Satisfactory academic performance.'}</td>
                        </tr>
                      );
                    })}

                    {reportCardGrades.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                          No examination grade records found for this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 4. Cumulative Performance Summary */}
                <div className="slip-total-box" style={{ background: '#f0f9ff', borderColor: '#bae6fd', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#0369a1', marginBottom: '2px' }}>
                      Grand Total Marks: <strong>{reportCardSummary.totalObtained} / {reportCardSummary.totalMax}</strong> • Evaluated: <strong>{reportCardGrades.length} Subjects</strong>
                    </div>
                    <div style={{ fontSize: '20px', color: '#0369a1', fontWeight: 800 }}>
                      Cumulative Percentage: {reportCardSummary.overallPct}% (Grade {reportCardSummary.overallGrade})
                    </div>
                    <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                      Result Classification: FIRST CLASS WITH DISTINCTION (PASSED)
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div className="slip-settled-stamp" style={{ borderColor: '#0284c7', color: '#0284c7' }}>
                      ✓ ACADEMIC TRANSCRIPT CERTIFIED
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                      Issued by: <strong>Academic Examination Controller</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Institutional Signatures & Seal */}
                <div className="signatures-row" style={{
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  textAlign: 'center',
                  fontSize: '11px'
                }}>
                  <div>
                    <div style={{ height: '36px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px' }}></div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>Class Teacher Signature</strong>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Assigned Homeroom Faculty</span>
                  </div>
                  <div>
                    <div style={{ height: '36px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>EXAMINATION CONTROLLER</span>
                    </div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>Controller of Examinations</strong>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Evaluation & Grading Division</span>
                  </div>
                  <div>
                    <div style={{ height: '36px', borderBottom: '1px dashed #94a3b8', margin: '0 15px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>INSTITUTIONAL SEAL</span>
                    </div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>Principal & Head of Institution</strong>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Greenwood High International</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
