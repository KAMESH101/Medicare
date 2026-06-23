import React from 'react';
import { ROLE_PERMISSIONS, initials, escapeHtml } from '../ApiService';

// SVG Icons
const iconHome = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 15V9h4v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const iconPatients = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="4" r="2.5" />
    <path d="M1 13c0-2.5 2.2-4 5-4s5 1.5 5 4" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 9c1.8.2 3 1.2 3 3" strokeLinecap="round" />
  </svg>
);
const iconDoctors = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M11 11v3m-1.5-1.5h3" strokeLinecap="round" />
  </svg>
);
const iconCalendar = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="12" rx="1.5" />
    <path d="M5 2v2M11 2v2M2 7h12" />
  </svg>
);
const iconDashboard = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="5" height="6" rx="1" />
    <rect x="9" y="2" width="5" height="3" rx="1" />
    <rect x="9" y="7" width="5" height="7" rx="1" />
    <rect x="2" y="10" width="5" height="4" rx="1" />
  </svg>
);
const iconLogout = () => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({ page, user, patientsCount, pendingApptsCount, onNavigate, onLogout, sidebarOpen, onCloseSidebar }) {
  if (!user) return null;

  const allNav = [
    { id: 'home',         label: 'Home',         icon: iconHome() },
    { id: 'patients',     label: 'Patients',      icon: iconPatients(), count: patientsCount },
    { id: 'doctors',      label: 'Doctors',       icon: iconDoctors() },
    { id: 'appointments', label: 'Appointments',  icon: iconCalendar(), count: pendingApptsCount },
    { id: 'dashboard',    label: 'Dashboard',     icon: iconDashboard() },
    { id: 'calendar',     label: 'Calendar',      icon: iconCalendar() },
  ];

  // Filter navigation links to only those allowed for current user role
  const allowedPages = ROLE_PERMISSIONS[user.role] || [];
  const navItems = allNav.filter(item => allowedPages.includes(item.id));

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const roleBadgeClass = `role-badge-${user.role}`;

  return (
    <>
      <div 
        className="sidebar-backdrop" 
        style={{ display: sidebarOpen ? 'block' : 'none' }} 
        onClick={onCloseSidebar}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-cross">&#x271A;</div>
            <div className="logo-text">MediCare+</div>
          </div>
          <div className="logo-sub">{escapeHtml(roleLabel)} Panel</div>
        </div>

        <nav aria-label="Main navigation">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                onCloseSidebar();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onNavigate(item.id); onCloseSidebar(); } }}
              aria-current={page === item.id ? 'page' : 'false'}
            >
              {item.icon}
              {escapeHtml(item.label)}
              {item.count !== undefined && item.count !== '' && item.count !== 0 && (
                <span className="nav-count">{item.count}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="nav-divider" />
        <div className="nav-section-label">System</div>
        <div 
          className="nav-item" 
          onClick={onLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLogout(); }}
        >
          {iconLogout()} Logout
        </div>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="avatar">{escapeHtml(initials(user.name))}</div>
            <div>
              <div className="user-name">{escapeHtml(user.name)}</div>
              <span className={`role-badge ${roleBadgeClass}`}>{escapeHtml(roleLabel)}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
