import React, { useState } from 'react';
import { formatDate, escapeHtml } from '../ApiService';

export default function AppointmentManager({ appointments, user, onOpenModal, onCancelAppointment, onExportAppointments }) {
  const [apptFilter, setApptFilter] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isRec = user?.role === 'receptionist';

  // Role-based visibility check
  const visibleAppointments = isDoctor
    ? appointments.filter(a => a.doctorId === user.doctorId)
    : appointments;

  const statusOrder = { Confirmed: 0, Pending: 1, Cancelled: 2 };
  
  // Sort and filter appointments
  let list = [...visibleAppointments].sort((a, b) => {
    return (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
  });

  if (apptFilter !== 'all') {
    list = list.filter(a => a.status === apptFilter);
  }

  const counts = {
    all: visibleAppointments.length,
    Confirmed: visibleAppointments.filter(a => a.status === 'Confirmed').length,
    Pending: visibleAppointments.filter(a => a.status === 'Pending').length,
    Cancelled: visibleAppointments.filter(a => a.status === 'Cancelled').length,
  };

  const canBook = !isDoctor;
  const canModify = isAdmin; // edit & cancel restricted to admin

  const statusBadge = (status) => {
    const map = {
      Confirmed: 'badge-green',
      Pending: 'badge-amber',
      Cancelled: 'badge-red',
    };
    return <span className={`badge ${map[status] || ''}`}>{escapeHtml(status)}</span>;
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="search-bar">
        <div className="filter-tabs">
          {['all', 'Confirmed', 'Pending', 'Cancelled'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${apptFilter === f ? 'btn-primary' : ''}`}
              onClick={() => setApptFilter(f)}
            >
              {f === 'all' ? 'All' : f} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="ml-auto" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="result-count">
            {list.length} record{list.length !== 1 ? 's' : ''}
          </span>
          {canBook && (
            <button className="btn btn-primary" onClick={() => onOpenModal('bookAppt')}>
              + Book Appointment
            </button>
          )}
          {isAdmin && (
            <button className="btn" onClick={onExportAppointments} title="Export appointments to CSV">
              &darr; CSV
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#x1F4CB;</div>
            <div className="empty-title">
              {apptFilter === 'all' 
                ? (isDoctor ? 'No appointments assigned to you' : 'No appointments yet') 
                : `No ${apptFilter.toLowerCase()} appointments`}
            </div>
            <div className="empty-desc">
              {apptFilter !== 'all' 
                ? `No appointments with status "${apptFilter}".` 
                : (canBook ? 'Book the first appointment to get started.' : 'No appointments have been assigned yet.')}
            </div>
            {apptFilter === 'all' && canBook && (
              <div className="empty-action">
                <button className="btn btn-primary" onClick={() => onOpenModal('bookAppt')}>
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th>Status</th>
                  {canModify && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{escapeHtml(a.patientName)}</td>
                    <td className="text-sm">{escapeHtml(a.doctorName)}</td>
                    <td>
                      <div>{formatDate(a.date)}</div>
                      <div className="text-xs text-muted">{a.time}</div>
                    </td>
                    <td>
                      <span className="tag tag-blue">{escapeHtml(a.type)}</span>
                    </td>
                    <td className="text-xs text-muted" style={{ maxWidth: '130px' }} title={escapeHtml(a.notes || '')}>
                      {a.notes ? escapeHtml(a.notes.length > 30 ? a.notes.slice(0, 30) + '...' : a.notes) : '—'}
                    </td>
                    <td>{statusBadge(a.status)}</td>
                    {canModify && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {a.status !== 'Cancelled' ? (
                            <>
                              <button className="btn btn-sm" onClick={() => onOpenModal('editAppt', a.id)}>
                                Edit
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => onCancelAppointment(a.id)}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-muted">Cancelled</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
