import React, { useState } from 'react';
import { DOCTOR_COLORS, escapeHtml } from '../ApiService';

export default function DoctorDirectory({ doctors, appointments, onOpenModal }) {
  const [docFilter, setDocFilter] = useState('all');
  
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const todayNameFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  const filtered = docFilter === 'available'
    ? doctors.filter(d => d.slots.includes(today))
    : doctors;

  const availableTodayCount = doctors.filter(d => d.slots.includes(today)).length;

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <p className="text-muted text-sm">
          {doctors.length} doctors on staff &middot; {availableTodayCount} available today ({today})
        </p>
        <div className="filter-tabs">
          <button 
            className={`btn btn-sm ${docFilter === 'all' ? 'btn-primary' : ''}`} 
            onClick={() => setDocFilter('all')}
          >
            All Doctors
          </button>
          <button 
            className={`btn btn-sm ${docFilter === 'available' ? 'btn-primary' : ''}`} 
            onClick={() => setDocFilter('available')}
          >
            Available Today
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏥</div>
          <div className="empty-title">No doctors available today</div>
          <div className="empty-desc">No doctors are scheduled for {todayNameFull}.</div>
          <div className="empty-action">
            <button className="btn btn-sm" onClick={() => setDocFilter('all')}>
              Show All Doctors
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(d => {
            const c = DOCTOR_COLORS[d.color] || DOCTOR_COLORS.teal;
            const apptCount = appointments.filter(a => a.doctorId === d.id && a.status !== 'Cancelled').length;
            
            return (
              <div key={d.id} className="doc-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="doc-avatar" style={{ backgroundColor: c.bg, color: c.color }}>
                    {d.initials}
                  </div>
                  <div>
                    <div className="doc-name">{escapeHtml(d.name)}</div>
                    <div className="doc-spec">{escapeHtml(d.spec)}</div>
                  </div>
                </div>
                <div className="doc-meta">
                  <span className="tag tag-teal">{escapeHtml(d.exp)} exp</span>
                  <span className="tag tag-blue">★ {escapeHtml(d.rating)}</span>
                  <span className="tag tag-purple">{apptCount} appt{apptCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="avail-line">
                  <span className="avail-dot"></span>
                  {escapeHtml(d.slots.join(', '))}
                </div>
                <button 
                  className="btn btn-sm" 
                  style={{ marginTop: '4px' }} 
                  onClick={() => onOpenModal('bookAppt', d.id)}
                >
                  Book Appointment
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
