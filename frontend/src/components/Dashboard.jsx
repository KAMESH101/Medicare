import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { DOCTOR_COLORS, escapeHtml } from '../ApiService';

export default function Dashboard({ patients, appointments, doctors, onNavigate }) {
  const apptCanvasRef = useRef(null);
  const docCanvasRef = useRef(null);
  
  const apptChartInst = useRef(null);
  const docChartInst = useRef(null);

  const active = patients.filter(p => p.status === 'Active').length;
  const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
  const pending = appointments.filter(a => a.status === 'Pending').length;
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

  const conditionMap = {};
  patients.forEach(p => { conditionMap[p.condition] = (conditionMap[p.condition] || 0) + 1; });

  const genderMap = { Male: 0, Female: 0, Other: 0 };
  patients.forEach(p => { genderMap[p.gender] = (genderMap[p.gender] || 0) + 1; });

  const bloodMap = {};
  patients.forEach(p => { bloodMap[p.blood] = (bloodMap[p.blood] || 0) + 1; });

  const totalAppts = appointments.length || 1;
  const totalPats = patients.length || 1;

  useEffect(() => {
    // 1. Appointments per day this week
    if (apptCanvasRef.current) {
      const labels = [];
      const counts = [];
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        labels.push(weekdays[d.getDay()]);
        const iso = d.toISOString().slice(0, 10);
        counts.push(appointments.filter(a => a.date === iso && a.status !== 'Cancelled').length);
      }

      if (apptChartInst.current) {
        apptChartInst.current.destroy();
      }

      apptChartInst.current = new Chart(apptCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Appointments',
            data: counts,
            backgroundColor: 'rgba(29,158,117,0.75)',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // 2. Doctor workload doughnut chart
    if (docCanvasRef.current) {
      const labels = doctors.map(d => d.name.replace('Dr. ', ''));
      const data = doctors.map(d => appointments.filter(a => a.doctorId === d.id && a.status !== 'Cancelled').length);
      const colors = ['#1D9E75', '#378ADD', '#BA7517', '#E24B4A', '#639922', '#5B4FCF'];

      if (docChartInst.current) {
        docChartInst.current.destroy();
      }

      docChartInst.current = new Chart(docCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
        }
      });
    }

    return () => {
      if (apptChartInst.current) apptChartInst.current.destroy();
      if (docChartInst.current) docChartInst.current.destroy();
    };
  }, [appointments, doctors]);

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-accent': 'var(--teal)' }}>
          <div className="stat-label">Total Patients</div>
          <div className="stat-value">{patients.length}</div>
          <div className="stat-change">↑ {active} active records</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--green)' }}>
          <div className="stat-label">Active Patients</div>
          <div className="stat-value">{active}</div>
          <div className="stat-change">↑ {Math.round(active / totalPats * 100)}% active rate</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--blue)' }}>
          <div className="stat-label">Total Appointments</div>
          <div className="stat-value">{appointments.length}</div>
          <div className="stat-change">↑ {confirmed} confirmed</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': pending > 2 ? 'var(--red)' : 'var(--amber)' }}>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{pending}</div>
          <div className={`stat-change ${pending > 2 ? 'down' : ''}`}>Awaiting confirmation</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Appointment Status</div>
          </div>
          {[
            { status: 'Confirmed', color: 'var(--teal)', count: confirmed },
            { status: 'Pending', color: 'var(--amber)', count: pending },
            { status: 'Cancelled', color: 'var(--red)', count: cancelled },
          ].map(({ status, color, count }) => {
            const pct = Math.round(count / totalAppts * 100);
            return (
              <div key={status} className="progress-row">
                <div className="progress-label">
                  <span>{status}</span>
                  <span className="text-muted">{count} ({pct}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Conditions Distribution</div>
          </div>
          {Object.entries(conditionMap).length === 0 ? (
            <div className="text-muted text-sm">No patient data yet.</div>
          ) : (
            Object.entries(conditionMap).map(([condition, count]) => {
              const pct = Math.round(count / totalPats * 100);
              return (
                <div key={condition} className="progress-row">
                  <div className="progress-label">
                    <span>{escapeHtml(condition)}</span>
                    <span className="text-muted">{count} patient{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--teal)' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Doctor Utilization</div>
          </div>
          {doctors.map(d => {
            const c = DOCTOR_COLORS[d.color] || DOCTOR_COLORS.teal;
            const count = appointments.filter(a => a.doctorId === d.id && a.status !== 'Cancelled').length;
            return (
              <div key={d.id} className="activity-item">
                <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px', backgroundColor: c.bg, color: c.color, flexShrink: 0 }}>
                  {d.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="activity-text font-medium truncate">{escapeHtml(d.name)}</div>
                  <div className="activity-time">{escapeHtml(d.spec)}</div>
                </div>
                <span className="tag tag-teal">{count} appt{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Patient Demographics</div>
          </div>
          {Object.entries(genderMap)
            .filter(([, val]) => val > 0)
            .map(([gender, count]) => {
              const pct = Math.round(count / totalPats * 100);
              const color = gender === 'Female' ? 'var(--teal)' : gender === 'Male' ? 'var(--blue)' : 'var(--amber)';
              return (
                <div key={gender} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ minWidth: '56px', fontSize: '13px' }}>{escapeHtml(gender)}</span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '4px', transition: 'width 0.4s' }} />
                  </div>
                  <span className="text-xs text-muted" style={{ minWidth: '50px' }}>{count} ({pct}%)</span>
                </div>
              );
            })}

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-clr)' }}>
            <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>Blood Group Distribution</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(bloodMap).map(([bloodGroup, count]) => (
                <span key={bloodGroup} className="tag tag-red">{escapeHtml(bloodGroup)}: {count}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Appointments This Week</div>
          </div>
          <div className="chart-wrap">
            <canvas ref={apptCanvasRef}></canvas>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Doctor Workload</div>
          </div>
          <div className="chart-wrap">
            <canvas ref={docCanvasRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
