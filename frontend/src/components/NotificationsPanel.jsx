import React from 'react';
import { formatDate, todayISO, escapeHtml } from '../ApiService';

export default function NotificationsPanel({ appointments, onClose }) {
  const tToday = todayISO();
  const getCutoffDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };
  const tCutoff = getCutoffDate();

  const upcomingItems = appointments
    .filter(a => a.status !== 'Cancelled' && a.date >= tToday && a.date <= tCutoff)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const todayCount = appointments.filter(a => a.date === tToday && a.status !== 'Cancelled').length;

  return (
    <div className="notif-panel" id="notif-panel">
      <div className="notif-header">
        🔔 Notifications
        <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
          {todayCount} today
        </span>
        <button className="close-btn" onClick={onClose} style={{ marginLeft: '8px' }} aria-label="Close notifications">
          ✕
        </button>
      </div>
      <div className="notif-body">
        {upcomingItems.length === 0 ? (
          <div className="notif-empty">No upcoming appointments this week 🎉</div>
        ) : (
          upcomingItems.map(a => {
            const isToday = a.date === tToday;
            const badgeClass = isToday ? 'badge-red' : a.status === 'Confirmed' ? 'badge-green' : 'badge-amber';
            const dotColor = isToday ? 'var(--red)' : a.status === 'Confirmed' ? 'var(--green)' : 'var(--amber)';

            return (
              <div key={a.id} className="notif-item">
                <div className="notif-dot" style={{ backgroundColor: dotColor }} />
                <div className="notif-content">
                  <div className="notif-name">{escapeHtml(a.patientName)}</div>
                  <div className="notif-meta">
                    {escapeHtml(a.doctorName)}
                    <br />
                    {formatDate(a.date)} at {a.time}
                  </div>
                </div>
                <span className={`badge ${badgeClass}`}>
                  {isToday ? 'Today' : a.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
