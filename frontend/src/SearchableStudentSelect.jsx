import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, UserCheck, Check, X, ChevronDown } from 'lucide-react';

export default function SearchableStudentSelect({ students = [], selectedStudentId, onSelect }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) {
      return students.slice(0, 60);
    }
    const q = search.toLowerCase().trim();
    return students.filter(s => 
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      (s.classes && `${s.classes.class_name} ${s.classes.section}`.toLowerCase().includes(q))
    ).slice(0, 60);
  }, [students, search]);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className="searchable-select-input-wrap">
        <Search className="search-icon-left" size={15} />
        <input 
          type="text"
          className="searchable-select-input"
          placeholder={selectedStudent ? `Search to change: ${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.roll_number})...` : "Type student name or roll number (e.g. STU-1040)..."}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {search ? (
          <button 
            type="button" 
            onClick={() => { setSearch(''); setIsOpen(false); }}
            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <div 
            onClick={() => setIsOpen(!isOpen)}
            style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: '#64748b' }}
          >
            <ChevronDown size={15} />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-header-bar">
            <span>Matches: <strong>{filteredStudents.length}</strong> (of {students.length} total students)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to select</span>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredStudents.map(s => {
              const isSelected = s.id === selectedStudentId;
              const classNameStr = s.classes ? `${s.classes.class_name} - ${s.classes.section}` : (s.class_id ? `Class #${s.class_id}` : 'Unassigned');
              return (
                <div 
                  key={s.id} 
                  className={`searchable-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(s.id);
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: isSelected ? 'var(--primary)' : 'rgba(59, 130, 246, 0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      color: isSelected ? '#ffffff' : 'var(--primary)'
                    }}>
                      {s.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: isSelected ? '700' : '500' }}>
                        {s.first_name} {s.last_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {classNameStr} • {s.email || 'No email'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-paid" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {s.roll_number}
                    </span>
                    {isSelected && <Check size={14} color="var(--emerald)" />}
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
                No students found matching <strong>"{search}"</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="selected-student-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #059669, #10b981)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white'
            }}>
              <UserCheck size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                {selectedStudent.first_name} {selectedStudent.last_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Roll: <strong style={{ color: '#0284c7' }}>{selectedStudent.roll_number}</strong>
                {selectedStudent.classes && ` • ${selectedStudent.classes.class_name} - ${selectedStudent.classes.section}`}
                {selectedStudent.phone && ` • 📞 ${selectedStudent.phone}`}
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Search size={12} />
            <span>{isOpen ? 'Close' : 'Change'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
