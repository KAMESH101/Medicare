import React, { useState, useEffect } from 'react';
import { 
  ApiService, 
  Storage, 
  STORAGE_KEYS, 
  ROLE_PERMISSIONS, 
  DOCTORS,
  SEED_PATIENTS,
  SEED_APPOINTMENTS,
  MAX_LOGIN_ATTEMPTS,
  API_BASE_URL,
  todayISO,
  escapeHtml,
  initials,
  formatDate
} from './ApiService';

import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import ModalManager from './components/ModalManager';
import NotificationsPanel from './components/NotificationsPanel';

// Pages
import Dashboard from './components/Dashboard';
import PatientRegistry from './components/PatientRegistry';
import DoctorDirectory from './components/DoctorDirectory';
import AppointmentManager from './components/AppointmentManager';
import CalendarView from './components/CalendarView';

export default function App() {
  // ── Session & Auth State ──
  const [currentUser, setCurrentUser] = useState(() => Storage.get(STORAGE_KEYS.USER, null));
  const [page, setPage] = useState(() => {
    const storedToken = Storage.get(STORAGE_KEYS.TOKEN, null);
    const storedUser = Storage.get(STORAGE_KEYS.USER, null);
    return (storedToken && storedUser) ? 'home' : 'login';
  });
  const [loginErr, setLoginErr] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  // ── Domain Data State ──
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // ── Layout Toggles ──
  const [theme, setTheme] = useState('light');
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Modals, Dialogs, Toasts ──
  const [modal, setModal] = useState(null); // 'addPatient', 'editPatient', 'bookAppt', 'editAppt'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [prefDoc, setPrefDoc] = useState(null);

  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [loading, setLoading] = useState(() => {
    const storedToken = Storage.get(STORAGE_KEYS.TOKEN, null);
    const storedUser = Storage.get(STORAGE_KEYS.USER, null);
    return !!(storedToken && storedUser);
  });

  // ── TOAST MANAGER ──
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleDismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ── PROMISE-BASED CONFIRMATION DIALOG ──
  const askConfirm = (config) => {
    return new Promise(resolve => {
      setConfirmConfig({
        ...config,
        resolve: (answer) => {
          resolve(answer);
          setConfirmConfig(null);
        }
      });
    });
  };

  // ── THEME INITIALIZATION ──
  useEffect(() => {
    const storedTheme = Storage.get(STORAGE_KEYS.THEME, 'light');
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    Storage.set(STORAGE_KEYS.THEME, nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // ── HEALTH CHECK & SESSION RESTORE ──
  useEffect(() => {
    const initApp = async () => {
      const storedToken = Storage.get(STORAGE_KEYS.TOKEN, null);
      const storedUser = Storage.get(STORAGE_KEYS.USER, null);
      const hasSession = !!(storedToken && storedUser);

      let isOnline = false;
      try {
        await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        ApiService.setLocalMode(false);
        isOnline = true;
      } catch {
        ApiService.setLocalMode(true);
        console.info('MediCare+ running in offline mode (no backend detected)');
      }

      if (!isOnline) {
        initLocalState();
        setLoading(false);
        return;
      }

      if (hasSession) {
        try {
          const [pList, aList] = await Promise.all([
            ApiService.fetchPatients(),
            ApiService.fetchAppointments()
          ]);
          setPatients(pList);
          setAppointments(aList);
        } catch (e) {
          console.error('Session restore failed:', e);
          handleLogout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const initLocalState = () => {
    const localPatients = Storage.get(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
    const localAppts = Storage.get(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
    setPatients(localPatients);
    setAppointments(localAppts);
  };

  // ── AUTH OPERATIONS ──
  const handleLogin = async (username, password) => {
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLoginErr('Too many failed attempts. Please refresh the page.');
      return;
    }

    if (!ApiService.isLocalMode()) {
      try {
        const result = await ApiService.login(username, password);
        Storage.set(STORAGE_KEYS.TOKEN, result.access_token);
        Storage.set(STORAGE_KEYS.USER, result.user);
        
        setCurrentUser(result.user);
        setPage('home');
        setLoginErr('');
        setLoginAttempts(0);
        setLoading(true);
        
        // Load operational records
        const [pList, aList] = await Promise.all([
          ApiService.fetchPatients(),
          ApiService.fetchAppointments()
        ]);
        setPatients(pList);
        setAppointments(aList);
        return;
      } catch (e) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('Backend server connection lost — falling back to offline storage');
          ApiService.setLocalMode(true);
          initLocalState();
          // Fall through to offline authentication
        } else {
          setLoginAttempts(prev => prev + 1);
          setLoginErr(e.message || 'Invalid username or password.');
          return;
        }
      }
    }

    // Local / Offline authentication fallback
    const matched = USERS_OFFLINE_DB().find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (matched) {
      setCurrentUser(matched);
      setPage('home');
      setLoginErr('');
      setLoginAttempts(0);
      initLocalState();
    } else {
      setLoginAttempts(prev => prev + 1);
      setLoginErr('Invalid username or password.');
    }
  };

  const USERS_OFFLINE_DB = () => [
    { id: 'u1', username: 'admin',     password: 'admin123', role: 'admin',        name: 'Administrator',       doctorId: null },
    { id: 'u2', username: 'dr.anitha', password: 'doc123',   role: 'doctor',       name: 'Dr. Anitha Krishnan', doctorId: 1    },
    { id: 'u3', username: 'dr.suresh', password: 'doc456',   role: 'doctor',       name: 'Dr. Suresh Patel',    doctorId: 2    },
    { id: 'u4', username: 'riya',      password: 'rec123',   role: 'receptionist', name: 'Riya Sharma',         doctorId: null },
  ];

  const handleLogout = () => {
    Storage.set(STORAGE_KEYS.TOKEN, null);
    Storage.set(STORAGE_KEYS.USER, null);
    setCurrentUser(null);
    setPage('login');
    setLoginErr('');
    setLoginAttempts(0);
    setPatients([]);
    setAppointments([]);
    setNotifOpen(false);
  };

  // ── NAVIGATION GUARD ──
  const handleNavigate = (targetPage) => {
    const allowedPages = ROLE_PERMISSIONS[currentUser?.role] || [];
    if (!allowedPages.includes(targetPage)) {
      addToast(`Access denied. Your role (${currentUser?.role}) cannot view this page.`, 'error');
      return;
    }
    setPage(targetPage);
    setModal(null);
    setSelectedPatientId(null);
    setSelectedApptId(null);
    setPrefDoc(null);
  };

  // ── MODAL OPERATORS ──
  const handleOpenModal = (type, id = null) => {
    setModal(type);
    if (type === 'editPatient') {
      setSelectedPatientId(id);
    } else if (type === 'editAppt') {
      setSelectedApptId(id);
    } else if (type === 'bookAppt') {
      setPrefDoc(id); // id maps to doctorId if booked from doctor directory card
    }
  };

  const handleCloseModal = () => {
    setModal(null);
    setSelectedPatientId(null);
    setSelectedApptId(null);
    setPrefDoc(null);
  };

  // ── CRITICAL RELOAD OPERATOR ──
  const reloadData = async () => {
    if (ApiService.isLocalMode()) return;
    try {
      const [pList, aList] = await Promise.all([
        ApiService.fetchPatients(),
        ApiService.fetchAppointments()
      ]);
      setPatients(pList);
      setAppointments(aList);
    } catch {
      addToast('Error refreshing data from server', 'error');
    }
  };

  // ── CRUD OPERATIONS: PATIENT ──
  const handleSavePatient = async (patientData, editingId) => {
    try {
      if (editingId !== null) {
        const result = await ApiService.updatePatient(editingId, patientData, setPatients);
        addToast('Patient updated successfully', 'success');
        if (!ApiService.isLocalMode()) {
          setPatients(prev => prev.map(p => p.id === editingId ? result : p));
        }
      } else {
        const result = await ApiService.createPatient(patientData, setPatients);
        addToast('Patient registered successfully', 'success');
        if (!ApiService.isLocalMode()) {
          setPatients(prev => [...prev, result]);
        }
      }
      await reloadData();
    } catch (e) {
      addToast(e.message || 'Operation failed. Please check inputs.', 'error');
      throw e;
    }
  };

  const handleDeletePatient = async (id) => {
    const patientObj = patients.find(p => p.id === id);
    if (!patientObj) return;

    const countAppts = appointments.filter(a => a.patientId === id).length;
    const confirmed = await askConfirm({
      title: 'Delete Patient?',
      message: `Permanently delete "${patientObj.name}"${countAppts > 0 ? ` and their ${countAppts} appointment${countAppts > 1 ? 's' : ''}` : ''}? This cannot be undone.`,
      confirmText: 'Delete',
      icon: '🗑️',
      danger: true
    });

    if (!confirmed) return;

    try {
      await ApiService.deletePatient(id, setPatients, setAppointments);
      addToast('Patient deleted successfully', 'success');
      
      // Local state adjustment for instant response
      setPatients(prev => prev.filter(p => p.id !== id));
      setAppointments(prev => prev.filter(a => a.patientId !== id));

      await reloadData();
    } catch (e) {
      addToast(e.message || 'Failed to delete patient', 'error');
    }
  };

  // ── CRUD OPERATIONS: APPOINTMENT ──
  const handleSaveAppt = async (apptData, editingId) => {
    try {
      if (editingId !== null) {
        const result = await ApiService.updateAppointment(editingId, apptData, setAppointments);
        addToast('Appointment updated successfully', 'success');
        if (!ApiService.isLocalMode()) {
          setAppointments(prev => prev.map(a => a.id === editingId ? result : a));
        }
      } else {
        const result = await ApiService.createAppointment(apptData, setAppointments);
        addToast('Appointment booked successfully', 'success');
        if (!ApiService.isLocalMode()) {
          setAppointments(prev => [...prev, result]);
        }
      }
      await reloadData();
    } catch (e) {
      addToast(e.message || 'Booking conflict or invalid availability', 'error');
      throw e;
    }
  };

  const handleCancelAppointment = async (id) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    const confirmed = await askConfirm({
      title: 'Cancel Appointment?',
      message: `Cancel appointment for ${appt.patientName} on ${formatDate(appt.date)} at ${appt.time}?`,
      confirmText: 'Cancel Appointment',
      icon: '📅',
      danger: true
    });

    if (!confirmed) return;

    try {
      const result = await ApiService.cancelAppointment(id, setAppointments);
      addToast('Appointment cancelled', 'success');
      
      // Instant UI update
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
      
      await reloadData();
    } catch (e) {
      addToast(e.message || 'Failed to cancel appointment', 'error');
    }
  };

  // ── EXPORT CSV LOGIC ──
  const handleExportPatients = () => {
    const headers = ['ID', 'Name', 'Age', 'Gender', 'Blood', 'Phone', 'Email', 'Address', 'Condition', 'Status', 'Joined'];
    const rows = patients.map(p => [
      p.id, `"${p.name}"`, p.age, p.gender, p.blood, p.phone, p.email || '', `"${p.address || ''}"`, `"${p.condition}"`, p.status, p.joined
    ].join(','));
    downloadCSV([headers.join(','), ...rows].join('\n'), 'patients.csv');
    addToast('Patients exported to CSV', 'success');
  };

  const handleExportAppointments = () => {
    const headers = ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Notes'];
    const rows = appointments.map(a => [
      a.id, `"${a.patientName}"`, `"${a.doctorName}"`, a.date, a.time, a.type, a.status, `"${a.notes || ''}"`
    ].join(','));
    downloadCSV([headers.join(','), ...rows].join('\n'), 'appointments.csv');
    addToast('Appointments exported to CSV', 'success');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  };

  // ── ROUTER SWITCH ──
  const renderPage = () => {
    switch (page) {
      case 'home':
        return renderHomeView();
      case 'patients':
        return (
          <PatientRegistry 
            patients={patients} 
            user={currentUser} 
            onOpenModal={handleOpenModal} 
            onDeletePatient={handleDeletePatient}
            onExportPatients={handleExportPatients}
          />
        );
      case 'doctors':
        return (
          <DoctorDirectory 
            doctors={DOCTORS} 
            appointments={appointments} 
            onOpenModal={handleOpenModal} 
          />
        );
      case 'appointments':
        return (
          <AppointmentManager 
            appointments={appointments} 
            user={currentUser} 
            onOpenModal={handleOpenModal} 
            onCancelAppointment={handleCancelAppointment}
            onExportAppointments={handleExportAppointments}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            patients={patients} 
            appointments={appointments} 
            doctors={DOCTORS} 
            onNavigate={handleNavigate}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            appointments={appointments} 
            onOpenModal={handleOpenModal}
          />
        );
      default:
        return null;
    }
  };

  // ── PAGE SKELETON LOADER ──
  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
      <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {Array(4).fill(0).map((_, idx) => (
          <div key={idx} className="skeleton" style={{ height: '90px', borderRadius: '8px' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
      </div>
    </div>
  );

  // ── HOME VIEW GENERATOR ──
  const renderHomeView = () => {
    const isDoctor = currentUser?.role === 'doctor';
    
    // Scoped visibility
    const visibleAppts = isDoctor
      ? appointments.filter(a => a.doctorId === currentUser.doctorId)
      : appointments;

    const tToday = todayISO();
    const upcoming = visibleAppts
      .filter(a => a.date >= tToday && a.status !== 'Cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const recent = [...patients]
      .sort((a, b) => b.id - a.id)
      .slice(0, 4);

    const subLines = {
      admin: 'Manage patients, schedule appointments and monitor healthcare delivery efficiently.',
      doctor: 'View your scheduled appointments and assigned patient records.',
      receptionist: 'Register new patients and book appointments quickly.',
    };
    const heroSub = subLines[currentUser?.role] || subLines.admin;

    const statusBadge = (s) => {
      const map = {
        Confirmed: 'badge-green',
        Pending: 'badge-amber',
        Cancelled: 'badge-red',
      };
      return <span className={`badge ${map[s] || ''}`}>{escapeHtml(s)}</span>;
    };

    return (
      <div style={{ animation: 'fadeIn 0.25s ease' }}>
        <div className="hero">
          <div className="hero-bg-circle"></div>
          <div className="hero-bg-circle"></div>
          <div className="hero-content">
            <div className="hero-title">Welcome back,<br />{escapeHtml(currentUser?.name)}</div>
            <div className="hero-sub">{heroSub}</div>
            {currentUser?.role === 'admin' && (
              <button className="hero-btn" onClick={() => handleNavigate('dashboard')}>
                View Dashboard &rarr;
              </button>
            )}
          </div>
        </div>

        <div className="quick-actions">
          {!isDoctor && (
            <div className="qa-card" onClick={() => handleOpenModal('addPatient')}>
              <div className="qa-icon" style={{ background: 'var(--teal-light)' }}>&#xFF0B;</div>
              <div className="qa-label">Register Patient</div>
              <div className="qa-desc">Add new patient record</div>
            </div>
          )}
          {!isDoctor && (
            <div className="qa-card" onClick={() => handleOpenModal('bookAppt')}>
              <div className="qa-icon" style={{ background: 'var(--blue-light)' }}>&#x1F4C5;</div>
              <div className="qa-label">Book Appointment</div>
              <div className="qa-desc">Schedule a visit</div>
            </div>
          )}
          <div className="qa-card" onClick={() => handleNavigate('patients')}>
            <div className="qa-icon" style={{ background: 'var(--amber-light)' }}>&#x1F465;</div>
            <div className="qa-label">View Patients</div>
            <div className="qa-desc">{patients.length} registered</div>
          </div>
          {ROLE_PERMISSIONS[currentUser?.role]?.includes('doctors') && (
            <div className="qa-card" onClick={() => handleNavigate('doctors')}>
              <div className="qa-icon" style={{ background: 'var(--purple-light)' }}>&#x1FA7A;</div>
              <div className="qa-label">Doctors</div>
              <div className="qa-desc">{DOCTORS.length} on staff</div>
            </div>
          )}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{isDoctor ? 'My Upcoming Appointments' : 'Upcoming Appointments'}</div>
                <div className="card-sub">Scheduled, not cancelled</div>
              </div>
              <button className="btn btn-sm" onClick={() => handleNavigate('appointments')}>View all</button>
            </div>
            {upcoming.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">&#x1F4C5;</div>
                <div className="empty-title">No upcoming appointments</div>
              </div>
            ) : (
              upcoming.slice(0, 4).map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-dot" style={{ background: a.status === 'Confirmed' ? 'var(--green)' : 'var(--amber)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="activity-text truncate">{escapeHtml(a.patientName)} &mdash; {escapeHtml(a.doctorName)}</div>
                    <div className="activity-time">{formatDate(a.date)} at {a.time} &middot; {escapeHtml(a.type)}</div>
                  </div>
                  <div>{statusBadge(a.status)}</div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Patients</div>
                <div className="card-sub">Latest registrations</div>
              </div>
              <button className="btn btn-sm" onClick={() => handleNavigate('patients')}>View all</button>
            </div>
            {recent.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">&#x1F464;</div>
                <div className="empty-title">No patients yet</div>
              </div>
            ) : (
              recent.map(p => (
                <div key={p.id} className="activity-item">
                  <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px', flexShrink: 0 }}>
                    {initials(p.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="activity-text font-medium truncate">{escapeHtml(p.name)}</div>
                    <div className="activity-time">{escapeHtml(p.condition)} &middot; {p.age} yrs &middot; {escapeHtml(p.blood)}</div>
                  </div>
                  {p.status === 'Active' ? (
                    <span className="badge badge-green">Active</span>
                  ) : (
                    <span className="badge badge-amber">Inactive</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── CORE RENDER SHELL ──
  if (page === 'login') {
    return (
      <Login 
        onLogin={handleLogin} 
        errorMsg={loginErr} 
        loginAttempts={loginAttempts} 
      />
    );
  }

  const activeUser = currentUser;
  const pendingCount = visibleAppointmentsCount(appointments, activeUser);
  const notifCount = appointments.filter(a => a.date === todayISO() && a.status !== 'Cancelled').length;

  function visibleAppointmentsCount(appts, user) {
    if (!user) return 0;
    const items = user.role === 'doctor'
      ? appts.filter(a => a.doctorId === user.doctorId)
      : appts;
    return items.filter(a => a.status === 'Pending').length || 0;
  }

  const editPatientObj = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;
  const editApptObj = selectedApptId ? appointments.find(a => a.id === selectedApptId) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar 
        page={page} 
        user={activeUser}
        patientsCount={patients.length}
        pendingApptsCount={pendingCount}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar 
          page={page} 
          theme={theme}
          notifCount={notifCount}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onToggleTheme={handleToggleTheme}
          onToggleNotif={() => setNotifOpen(prev => !prev)}
        />
        
        <main className="page-content" id="page-content">
          {loading ? renderSkeleton() : renderPage()}
        </main>
      </div>

      <ModalManager
        modal={modal}
        patients={patients}
        doctors={DOCTORS}
        appointments={appointments}
        editPatient={editPatientObj}
        editAppt={editApptObj}
        prefDoc={prefDoc}
        onSavePatient={handleSavePatient}
        onSaveAppt={handleSaveAppt}
        onClose={handleCloseModal}
      />

      {notifOpen && (
        <NotificationsPanel 
          appointments={appointments} 
          onClose={() => setNotifOpen(false)} 
        />
      )}

      {confirmConfig && (
        <ConfirmDialog 
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          icon={confirmConfig.icon}
          danger={confirmConfig.danger}
          onAnswer={confirmConfig.resolve}
        />
      )}

      {/* Dynamic React Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            onDismiss={handleDismissToast}
          />
        ))}
      </div>
    </div>
  );
}
