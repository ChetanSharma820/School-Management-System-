import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, MapPin, HeartPulse, ShieldCheck, Check, X } from 'lucide-react';

export default function EditStudentModal({ student, classes, onClose, onSave }) {
  const [formData, setFormData] = useState({
    roll_number: student.roll_number || '',
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    email: student.email || '',
    phone: student.phone || '',
    dob: student.dob || '',
    class_id: student.class_id || (classes.length > 0 ? classes[0].id : ''),
    father_name: student.father_name || '',
    mother_name: student.mother_name || '',
    parent_phone: student.parent_phone || '',
    address: student.address || '',
    blood_group: student.blood_group || 'O+',
    gender: student.gender || 'Male',
    aadhaar_number: student.aadhaar_number || '',
    emergency_contact: student.emergency_contact || ''
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
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Edit Student Record</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Admin Master Governance: Update Institutional & Guardian Information
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
            {/* Primary Academic Details */}
            <div className="form-group">
              <label>Roll Number *</label>
              <input 
                type="text" 
                required 
                value={formData.roll_number}
                onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Class & Section *</label>
              <select 
                value={formData.class_id}
                onChange={e => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                ))}
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
              <label>Student Email *</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input 
                type="date" 
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select 
                value={formData.blood_group}
                onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label>Aadhaar / National ID</label>
              <input 
                type="text" 
                placeholder="XXXX-XXXX-XXXX"
                value={formData.aadhaar_number}
                onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })}
              />
            </div>

            {/* Guardian & Parent Information */}
            <div className="form-group">
              <label>Father's Full Name</label>
              <input 
                type="text" 
                value={formData.father_name}
                onChange={e => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Mother's Full Name</label>
              <input 
                type="text" 
                value={formData.mother_name}
                onChange={e => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Parent Primary Phone</label>
              <input 
                type="text" 
                value={formData.parent_phone}
                onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact No.</label>
              <input 
                type="text" 
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Residential Postal Address</label>
              <textarea 
                rows={2}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Update Student Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
