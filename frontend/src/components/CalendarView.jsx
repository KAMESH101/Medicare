import React, { useState } from 'react';
import { MONTH_NAMES, formatDate, todayISO, escapeHtml } from '../ApiService';

export default function CalendarView({ appointments, onOpenModal }) {
  const today = todayISO();
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarDay, setCalendarDay] = useState(today);

  // Month navigation helpers
  const handlePrev = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setCalendarDay(null);
  };

  const handleNext = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setCalendarDay(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    setCalendarDay(today);
  };

  // Monthly grid details
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const apptMap = {};
  appointments
    .filter(a => a.status !== 'Cancelled')
    .forEach(a => {
      if (!apptMap[a.date]) apptMap[a.date] = [];
      apptMap[a.date].push(a);
    });

  const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render days
  const cells = [];
  
  // Fill leading empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell cal-empty" />);
  }

  // Fill month days
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayAppointments = apptMap[iso] || [];
    const isToday = iso === today;
    const isSelected = iso === calendarDay;

    cells.push(
      <div
        key={`day-${d}`}
        className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''} ${dayAppointments.length ? 'cal-has-appts' : ''}`}
        onClick={() => setCalendarDay(calendarDay === iso ? null : iso)}
        role="button"
        tabIndex={0}
      >
        <span className="cal-num">{d}</span>
        {dayAppointments.length > 0 && (
          <div className="cal-dots">
            {dayAppointments.slice(0, 3).map((_, idx) => (
              <span key={idx} className="cal-dot" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selectedDayAppointments = calendarDay ? (apptMap[calendarDay] || []) : [];

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
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </div>
            <div className="card-sub">Click a date to see appointments</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" onClick={handlePrev}>← Prev</button>
            <button className="btn btn-sm" onClick={handleToday}>Today</button>
            <button className="btn btn-sm" onClick={handleNext}>Next →</button>
          </div>
        </div>
        <div className="cal-grid">
          {headers.map(h => (
            <div key={h} className="cal-head">{h}</div>
          ))}
          {cells}
        </div>
      </div>

      {calendarDay && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Appointments on {formatDate(calendarDay)}</div>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenModal('bookAppt')}>
              + Book
            </button>
          </div>
          {selectedDayAppointments.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No appointments on this date</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayAppointments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{escapeHtml(a.patientName)}</td>
                      <td className="text-sm">{escapeHtml(a.doctorName)}</td>
                      <td>{a.time}</td>
                      <td>
                        <span className="tag tag-blue">{escapeHtml(a.type)}</span>
                      </td>
                      <td>{statusBadge(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
