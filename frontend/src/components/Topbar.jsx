import React from 'react';

export default function Topbar({ page, theme, notifCount, onToggleSidebar, onToggleTheme, onToggleNotif }) {
  const titles = {
    home: 'Home',
    patients: 'Patient Registry',
    doctors: 'Doctor Directory',
    appointments: 'Appointment Management',
    dashboard: 'Analytics Dashboard',
    calendar: 'Interactive Calendar',
  };

  const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const isDark = theme === 'dark';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="sidebar-toggle btn btn-ghost btn-icon" 
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="topbar-title">{titles[page] || ''}</span>
      </div>
      <div className="topbar-right">
        <div className="status-pill">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
        <span className="topbar-date">{now}</span>
        <button 
          className="theme-toggle-btn" 
          onClick={onToggleTheme}
          title="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <button 
          className="notif-btn" 
          onClick={onToggleNotif}
          title="Notifications"
        >
          🔔
          {notifCount > 0 && (
            <span className="notif-badge" id="notif-badge">
              {notifCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
