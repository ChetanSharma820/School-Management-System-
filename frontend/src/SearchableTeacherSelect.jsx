import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, UserCheck, Check, X, ChevronDown, Award } from 'lucide-react';

export default function SearchableTeacherSelect({ teachers = [], selectedTeacherId, onSelect }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

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

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) {
      return teachers.slice(0, 50);
    }
    const q = search.toLowerCase().trim();
    return teachers.filter(t => 
      t.first_name?.toLowerCase().includes(q) ||
      t.last_name?.toLowerCase().includes(q) ||
      t.employee_id?.toLowerCase().includes(q) ||
      t.qualification?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [teachers, search]);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className="searchable-select-input-wrap">
        <Search className="search-icon-left" size={15} />
        <input 
          type="text"
          className="searchable-select-input"
          placeholder={selectedTeacher ? `Search to change: ${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.employee_id || 'TCH'})...` : "Type faculty name, Employee ID (e.g. TCH-001) or Department..."}
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
            <span>Matches: <strong>{filteredTeachers.length}</strong> (of {teachers.length} faculty members)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to select</span>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredTeachers.map(t => {
              const isSelected = t.id === selectedTeacherId;
              return (
                <div 
                  key={t.id} 
                  className={`searchable-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(t.id);
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
                      {t.first_name?.[0] || 'T'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                        {t.first_name} {t.last_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {t.qualification || 'Faculty'} • {t.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      background: 'rgba(59, 130, 246, 0.15)', 
                      color: 'var(--primary)', 
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {t.employee_id || `ID: ${t.id}`}
                    </span>
                    {isSelected && <Check size={14} color="var(--primary)" />}
                  </div>
                </div>
              );
            })}

            {filteredTeachers.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No faculty members match "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTeacher && (
        <div className="selected-student-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="#10b981" />
            <div>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                {selectedTeacher.first_name} {selectedTeacher.last_name}
              </span>
              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                ({selectedTeacher.employee_id || 'ID: ' + selectedTeacher.id}) • {selectedTeacher.qualification || 'Faculty'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="action-btn"
            style={{ fontSize: '11px', color: 'var(--primary)', padding: '2px 8px', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px' }}
            onClick={() => setIsOpen(true)}
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
