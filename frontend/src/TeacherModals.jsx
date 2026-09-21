import React, { useState } from 'react';
import { UserCheck, Check, X, UserPlus, Briefcase, Mail, Phone, Building, MapPin, Award, Clock, DollarSign } from 'lucide-react';
import { calculateSalaryBreakdown } from './api';

export function AddTeacherModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_id: `TCH-${Math.floor(100 + Math.random() * 900)}`,
    email: '',
    phone: '',
    qualification: 'M.Sc. Education, B.Ed.',
    department: 'Department of Mathematics & Sciences',
    designation: 'Senior Faculty',
    cabin: 'Cabin 204, Science Block',
    salary_base: 45000,
    emergency_contact: '',
    address: '',
    weekly_load: 18
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
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
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Register New Faculty Member</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Admin Master Governance: Comprehensive Faculty & Staff Record
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
            <div className="form-group">
              <label>Employee ID *</label>
              <input 
                type="text" 
                required 
                value={formData.employee_id}
                onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select 
                value={formData.department} 
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Department of Mathematics & Sciences">Department of Mathematics & Sciences</option>
                <option value="Department of Computer Science & IT">Department of Computer Science & IT</option>
                <option value="Department of Physics & Natural Sciences">Department of Physics & Natural Sciences</option>
                <option value="Department of Chemistry">Department of Chemistry</option>
                <option value="Department of Languages & Humanities">Department of Languages & Humanities</option>
                <option value="Department of Commerce & Social Studies">Department of Commerce & Social Studies</option>
              </select>
            </div>

            <div className="form-group">
              <label>First Name *</label>
              <input 
                type="text" 
                required 
                placeholder="First Name"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input 
                type="text" 
                required 
                placeholder="Last Name"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Designation / Title</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Faculty & Head of Department"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Academic Qualification</label>
              <input 
                type="text" 
                placeholder="e.g. M.Sc. Mathematics, Ph.D."
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Institutional Email Address *</label>
              <input 
                type="email" 
                required 
                placeholder="faculty@greenwood.edu"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Primary Phone Number</label>
              <input 
                type="text" 
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Faculty Cabin / Office Room</label>
              <input 
                type="text" 
                placeholder="e.g. Cabin 204, Science Block"
                value={formData.cabin}
                onChange={e => setFormData({ ...formData, cabin: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Monthly Salary Package (₹) *</label>
              <input 
                type="number" 
                value={formData.salary_base}
                onChange={e => setFormData({ ...formData, salary_base: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {(() => {
              const preview = calculateSalaryBreakdown(formData.salary_base || 0);
              return (
                <div className="form-group full-width" style={{ marginTop: '-4px', marginBottom: '8px' }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px 12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Gross Package</span>
                      <strong style={{ color: '#0284c7', fontSize: '13px' }}>₹{preview.gross_earnings.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Basic Pay (Gross - 25k)</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>₹{preview.basic_salary.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Fixed Allowances (HRA+DA)</span>
                      <strong style={{ color: '#10b981', fontSize: '13px' }}>+₹{preview.total_allowances.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Deductions (EPF/TDS/PT)</span>
                      <strong style={{ color: '#ef4444', fontSize: '13px' }}>-₹{preview.total_deductions.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Net Take-Home</span>
                      <strong style={{ color: '#059669', fontSize: '13.5px', fontWeight: 800 }}>₹{preview.net_salary.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="form-group">
              <label>Weekly Teaching Load (Periods)</label>
              <input 
                type="number" 
                value={formData.weekly_load}
                onChange={e => setFormData({ ...formData, weekly_load: parseInt(e.target.value) || 18 })}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input 
                type="text" 
                placeholder="+91 98450 99887 (Spouse / Relative)"
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Residential Address</label>
              <input 
                type="text" 
                placeholder="Residential address / city"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{saving ? 'Registering...' : 'Register Faculty Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditTeacherModal({ teacher, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: teacher.first_name || '',
    last_name: teacher.last_name || '',
    employee_id: teacher.employee_id || '',
    email: teacher.email || '',
    phone: teacher.phone || '',
    qualification: teacher.qualification || 'Senior Faculty',
    department: teacher.department || 'Department of Mathematics & Sciences',
    designation: teacher.designation || 'Senior Faculty',
    specialization: teacher.specialization || '',
    cabin: teacher.cabin || 'Cabin 204, Science Block',
    salary_base: teacher.salary_base || 45000,
    emergency_contact: teacher.emergency_contact || '',
    address: teacher.address || '',
    weekly_load: teacher.weekly_load || 18
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
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
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Edit Faculty Details</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Admin Master Governance: Modify Certified Faculty Record
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
            <div className="form-group">
              <label>Employee ID *</label>
              <input 
                type="text" 
                required 
                value={formData.employee_id}
                onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select 
                value={formData.department} 
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Department of Mathematics & Sciences">Department of Mathematics & Sciences</option>
                <option value="Department of Computer Science & IT">Department of Computer Science & IT</option>
                <option value="Department of Physics & Natural Sciences">Department of Physics & Natural Sciences</option>
                <option value="Department of Chemistry">Department of Chemistry</option>
                <option value="Department of Languages & Humanities">Department of Languages & Humanities</option>
                <option value="Department of Commerce & Social Studies">Department of Commerce & Social Studies</option>
              </select>
            </div>

            <div className="form-group">
              <label>First Name *</label>
              <input 
                type="text" 
                required 
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input 
                type="text" 
                required 
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Designation / Title</label>
              <input 
                type="text" 
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Academic Qualification</label>
              <input 
                type="text" 
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Academic Specialization / Key Subjects</label>
              <input 
                type="text" 
                placeholder="e.g. Advanced Calculus, Quantum Mechanics"
                value={formData.specialization}
                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Institutional Email *</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Primary Phone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Faculty Cabin</label>
              <input 
                type="text" 
                value={formData.cabin}
                onChange={e => setFormData({ ...formData, cabin: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Monthly Salary Package (₹) *</label>
              <input 
                type="number" 
                value={formData.salary_base}
                onChange={e => setFormData({ ...formData, salary_base: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {(() => {
              const preview = calculateSalaryBreakdown(formData.salary_base || 0);
              return (
                <div className="form-group full-width" style={{ marginTop: '-4px', marginBottom: '8px' }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px 12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Gross Package</span>
                      <strong style={{ color: '#0284c7', fontSize: '13px' }}>₹{preview.gross_earnings.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Basic Pay (Gross - 25k)</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>₹{preview.basic_salary.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Fixed Allowances (HRA+DA)</span>
                      <strong style={{ color: '#10b981', fontSize: '13px' }}>+₹{preview.total_allowances.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Deductions (EPF/TDS/PT)</span>
                      <strong style={{ color: '#ef4444', fontSize: '13px' }}>-₹{preview.total_deductions.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Net Take-Home</span>
                      <strong style={{ color: '#059669', fontSize: '13.5px', fontWeight: 800 }}>₹{preview.net_salary.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="form-group">
              <label>Weekly Teaching Load (Periods)</label>
              <input 
                type="number" 
                value={formData.weekly_load}
                onChange={e => setFormData({ ...formData, weekly_load: parseInt(e.target.value) || 18 })}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input 
                type="text" 
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Residential Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{saving ? 'Updating...' : 'Save Faculty Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
