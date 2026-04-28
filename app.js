/* ============================================================
   MediCare+ — app.js
   Production-quality Patient Management System
   Architecture: Module pattern with a central state store
   ============================================================ */

'use strict';

/* ── CONSTANTS ── */
const API_BASE_URL = 'http://127.0.0.1:8000';

const STORAGE_KEYS = {
  THEME:  'medicare_theme',
  TOKEN:  'medicare_token',
  USER:   'medicare_user',
};

/* ── USERS (role-based auth) ── */
// NEW: Replace single CREDENTIALS with a multi-user USERS array
const USERS = [
  { id:'u1', username:'admin',     password:'admin123', role:'admin',        name:'Administrator',       doctorId: null },
  { id:'u2', username:'dr.anitha', password:'doc123',   role:'doctor',       name:'Dr. Anitha Krishnan', doctorId: 1    },
  { id:'u3', username:'dr.suresh', password:'doc456',   role:'doctor',       name:'Dr. Suresh Patel',    doctorId: 2    },
  { id:'u4', username:'riya',      password:'rec123',   role:'receptionist', name:'Riya Sharma',         doctorId: null },
];

// NEW: Defines which pages each role can navigate to
const ROLE_PERMISSIONS = {
  admin:        ['home','patients','doctors','appointments','dashboard','calendar'],
  doctor:       ['home','appointments','patients'],
  receptionist: ['home','patients','appointments'],
};
const MAX_LOGIN_ATTEMPTS = 5;

const BLOOD_GROUPS  = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENDERS       = ['Male','Female','Other'];
const VISIT_TYPES   = ['Consultation','Follow-up','Routine','Emergency','Lab Review'];
const APPT_STATUSES = ['Pending','Confirmed','Cancelled'];
const TIME_SLOTS    = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const MONTH_NAMES   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CONDITIONS    = ['Hypertension','Diabetes Type 2','Asthma','Migraine','Arthritis','Heart Disease','Obesity','Anxiety','General','Other'];

/* ── SEED DATA ── */
const SEED_PATIENTS = [
  {id:1, name:'Priya Nair',          age:34, gender:'Female', blood:'O+',  phone:'9876543210', email:'priya@email.com',  address:'Anna Nagar, Chennai',  condition:'Hypertension',   status:'Active',   joined:'2024-01-15'},
  {id:2, name:'Rajan Kumar',         age:58, gender:'Male',   blood:'A+',  phone:'9876543211', email:'rajan@email.com',  address:'T Nagar, Chennai',     condition:'Diabetes Type 2',status:'Active',   joined:'2024-02-20'},
  {id:3, name:'Meena Pillai',        age:42, gender:'Female', blood:'B-',  phone:'9876543212', email:'meena@email.com',  address:'Adyar, Chennai',       condition:'Asthma',         status:'Inactive', joined:'2024-03-05'},
  {id:4, name:'Arjun Sharma',        age:27, gender:'Male',   blood:'AB+', phone:'9876543213', email:'arjun@email.com',  address:'Velachery, Chennai',   condition:'Migraine',       status:'Active',   joined:'2024-04-10'},
];

const SEED_APPOINTMENTS = [
  {id:1, patientId:1, patientName:'Priya Nair',   doctorId:1, doctorName:'Dr. Anitha Krishnan',     date:'2026-05-12', time:'10:00', type:'Follow-up',    status:'Confirmed', notes:'BP check'},
  {id:2, patientId:2, patientName:'Rajan Kumar',  doctorId:2, doctorName:'Dr. Suresh Patel',        date:'2026-05-13', time:'14:30', type:'Consultation', status:'Pending',   notes:'Sugar level check'},
  {id:3, patientId:3, patientName:'Meena Pillai', doctorId:3, doctorName:'Dr. Kavya Reddy',         date:'2026-05-14', time:'11:00', type:'Routine',      status:'Confirmed', notes:'Breathing test'},
  {id:4, patientId:4, patientName:'Arjun Sharma', doctorId:1, doctorName:'Dr. Anitha Krishnan',     date:'2026-05-15', time:'09:30', type:'Consultation', status:'Cancelled', notes:'Migraine analysis'},
];

const DOCTORS = [
  {id:1, name:'Dr. Anitha Krishnan',    spec:'Neurologist',       exp:'12 yrs', rating:'4.9', slots:['Mon','Wed','Fri'],                  color:'teal',   initials:'AK'},
  {id:2, name:'Dr. Suresh Patel',       spec:'Endocrinologist',   exp:'8 yrs',  rating:'4.7', slots:['Tue','Thu'],                        color:'blue',   initials:'SP'},
  {id:3, name:'Dr. Kavya Reddy',        spec:'Pulmonologist',     exp:'15 yrs', rating:'4.8', slots:['Mon','Tue','Thu'],                  color:'amber',  initials:'KR'},
  {id:4, name:'Dr. Mohammed Farhan',    spec:'Cardiologist',      exp:'20 yrs', rating:'4.9', slots:['Wed','Fri'],                        color:'red',    initials:'MF'},
  {id:5, name:'Dr. Lakshmi Subramanian',spec:'General Physician', exp:'10 yrs', rating:'4.6', slots:['Mon','Tue','Wed','Thu','Fri'],      color:'green',  initials:'LS'},
  {id:6, name:'Dr. Venkat Rajan',       spec:'Orthopedic Surgeon',exp:'18 yrs', rating:'4.8', slots:['Mon','Thu','Fri'],                  color:'purple', initials:'VR'},
];

const DOCTOR_COLORS = {
  teal:   { bg:'#E1F5EE', color:'#085041' },
  blue:   { bg:'#E6F1FB', color:'#042C53' },
  amber:  { bg:'#FAEEDA', color:'#BA7517' },
  red:    { bg:'#FCEBEB', color:'#E24B4A' },
  green:  { bg:'#EAF3DE', color:'#639922' },
  purple: { bg:'#EEEDFE', color:'#5B4FCF' },
};

/* ============================================================
   PERSISTENCE MODULE
   Handles all localStorage read/write with error safety
   ============================================================ */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
};

/* ── API SERVICE (Real backend via FastAPI) ── */
const ApiService = {
  _token() { return Storage.get(STORAGE_KEYS.TOKEN, null); },
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },
  /** Convert snake_case API response keys to camelCase for frontend */
  _toCamel(obj) {
    if (Array.isArray(obj)) return obj.map(o => this._toCamel(o));
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      return out;
    }
    return obj;
  },
  /** Convert camelCase frontend keys to snake_case for API */
  _toSnake(obj) {
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k.replace(/[A-Z]/g, c => '_' + c.toLowerCase())] = v;
      }
      return out;
    }
    return obj;
  },
  async _fetch(url, options = {}) {
    const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers: this._headers() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    if (res.status === 204) return null;
    return res.json();
  },

  /* Auth */
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Invalid credentials');
    }
    return res.json();
  },

  /* Fetch lists */
  async fetchPatients() {
    const data = await this._fetch('/patients');
    return data.map(p => this._toCamel(p));
  },
  async fetchAppointments() {
    const data = await this._fetch('/appointments');
    return data.map(a => this._toCamel(a));
  },

  /* Patient CRUD */
  async createPatient(d) {
    const data = await this._fetch('/patients', { method: 'POST', body: JSON.stringify(d) });
    const p = this._toCamel(data);
    State.patients.push(p);
    return p;
  },
  async updatePatient(id, d) {
    const data = await this._fetch(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(d) });
    const p = this._toCamel(data);
    const i = State.patients.findIndex(pt => pt.id === id);
    if (i >= 0) State.patients[i] = p;
    return p;
  },
  async deletePatient(id) {
    await this._fetch(`/patients/${id}`, { method: 'DELETE' });
    State.patients = State.patients.filter(p => p.id !== id);
    State.appointments = State.appointments.filter(a => a.patientId !== id);
  },

  /* Appointment CRUD */
  async createAppointment(d) {
    const data = await this._fetch('/appointments', { method: 'POST', body: JSON.stringify(this._toSnake(d)) });
    const a = this._toCamel(data);
    State.appointments.push(a);
    return a;
  },
  async updateAppointment(id, d) {
    const data = await this._fetch(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(this._toSnake(d)) });
    const a = this._toCamel(data);
    const i = State.appointments.findIndex(ap => ap.id === id);
    if (i >= 0) State.appointments[i] = a;
    return a;
  },
  async cancelAppointment(id) {
    const data = await this._fetch(`/appointments/${id}`, { method: 'DELETE' });
    const a = this._toCamel(data);
    const i = State.appointments.findIndex(ap => ap.id === id);
    if (i >= 0) State.appointments[i] = a;
    return a;
  },
};

/* ── DARK MODE ── */
const DarkMode = {
  get()    { return Storage.get(STORAGE_KEYS.THEME, 'light'); },
  apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    Storage.set(STORAGE_KEYS.THEME, t);
    const b = document.getElementById('theme-toggle');
    if (b) b.textContent = t === 'dark' ? '☀️' : '🌙';
  },
  toggle() { this.apply(this.get() === 'dark' ? 'light' : 'dark'); },
  init()   { this.apply(this.get()); },
};

/* ── NOTIFICATIONS ── */
const Notifications = {
  _cut() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); },
  getUpcoming() {
    const t = todayISO();
    return State.appointments
      .filter(a => a.status !== 'Cancelled' && a.date >= t && a.date <= this._cut())
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  },
  getToday() { return State.appointments.filter(a => a.date === todayISO() && a.status !== 'Cancelled'); },
  count()    { return this.getToday().length; },
};

/* ── STATE ── */
const State = {
  page: 'login', currentUser: null, loginErr: '', loginAttempts: 0,
  get loggedIn() { return !!this.currentUser; },
  modal: null, editPatient: null, editAppt: null, prefDoc: null,
  search: '', docFilter: 'all', apptFilter: 'all', loading: false, saving: false,
  calendarYear: new Date().getFullYear(), calendarMonth: new Date().getMonth(), calendarDay: null,
  notifOpen: false, filtersOpen: false,
  filters: { gender: 'all', ageMin: '', ageMax: '', condition: 'all', status: 'all' },
  patients:     [],
  appointments: [],
  doctors:      DOCTORS,
};

/* ============================================================
   VALIDATION MODULE
   Pure functions; return { valid: bool, errors: {field: msg} }
   ============================================================ */
const Validate = {
  patient(fields, editingId = null) {
    const errors = {};

    if (!fields.name.trim())         errors.name      = 'Full name is required';
    else if (fields.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    const age = parseInt(fields.age);
    if (!fields.age)                 errors.age       = 'Age is required';
    else if (isNaN(age) || age < 0 || age > 130) errors.age = 'Enter a valid age (0–130)';

    if (!fields.phone.trim())        errors.phone     = 'Phone number is required';
    else if (!/^\d{10}$/.test(fields.phone.trim())) errors.phone = 'Phone must be exactly 10 digits';

    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
                                     errors.email     = 'Enter a valid email address';

    // Duplicate check (by name + phone, skip self when editing)
    const dup = State.patients.find(p =>
      p.id !== editingId &&
      p.name.toLowerCase() === fields.name.trim().toLowerCase() &&
      p.phone.trim() === fields.phone.trim()
    );
    if (dup) errors.name = 'A patient with this name and phone already exists';

    return { valid: Object.keys(errors).length === 0, errors };
  },

  appointment(fields) {
    const errors = {};

    if (!fields.patientId) errors.patientId = 'Please select a patient';
    if (!fields.doctorId)  errors.doctorId  = 'Please select a doctor';
    if (!fields.time)      errors.time      = 'Please select a time slot';

    if (!fields.date)      errors.date      = 'Please select a date';
    else {
      const today = new Date(); today.setHours(0,0,0,0);
      const chosen = new Date(fields.date);
      if (chosen < today)  errors.date      = 'Cannot book an appointment in the past';
    }

    // Doctor availability on that day-of-week
    if (fields.doctorId && fields.date) {
      const doc = State.doctors.find(d => d.id === parseInt(fields.doctorId));
      if (doc) {
        const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(fields.date).getDay()];
        if (!doc.slots.includes(dayName))
          errors.date = `${doc.name} is not available on ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(fields.date).getDay()]}`;
      }
    }

    // Duplicate slot check (same doctor + date + time, excluding the appt being edited)
    if (fields.doctorId && fields.date && fields.time) {
      const conflict = State.appointments.find(a =>
        a.id !== (State.editAppt?.id ?? -1) &&
        a.doctorId === parseInt(fields.doctorId) &&
        a.date === fields.date &&
        a.time === fields.time &&
        a.status !== 'Cancelled'
      );
      if (conflict) errors.time = `This slot is already booked for ${conflict.patientName}`;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },
};

/* ============================================================
   TOAST MODULE
   ============================================================ */
const Toast = {
  show(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.success}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;

    el.querySelector('.toast-close').addEventListener('click', () => Toast.dismiss(el));
    container.appendChild(el);

    const timer = setTimeout(() => Toast.dismiss(el), duration);
    el._timer = timer;
  },

  dismiss(el) {
    clearTimeout(el._timer);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 280);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error', 4500),
  info:    (msg) => Toast.show(msg, 'info'),
};

/* ============================================================
   CONFIRM DIALOG MODULE
   ============================================================ */
const Confirm = {
  _resolve: null,

  show({ title = 'Are you sure?', message = '', confirmText = 'Confirm', icon = '⚠️', danger = true }) {
    return new Promise(resolve => {
      this._resolve = resolve;
      document.getElementById('confirm-title').textContent   = title;
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-icon').textContent    = icon;

      const okBtn = document.getElementById('confirm-ok');
      okBtn.textContent = confirmText;
      okBtn.className   = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;

      document.getElementById('confirm-overlay').removeAttribute('hidden');
      okBtn.focus();
    });
  },

  _answer(result) {
    document.getElementById('confirm-overlay').setAttribute('hidden', '');
    if (this._resolve) { this._resolve(result); this._resolve = null; }
  },
};

/* ============================================================
   AUTH MODULE — NEW
   Centralised role/permission helpers; always reads from State.currentUser
   ============================================================ */
const Auth = {
  /** Returns the currently logged-in user object */
  user()  { return State.currentUser; },
  /** Returns the role string: 'admin' | 'doctor' | 'receptionist' */
  role()  { return State.currentUser?.role || ''; },

  isAdmin() { return this.role() === 'admin'; },
  isDoctor() { return this.role() === 'doctor'; },
  isRec()    { return this.role() === 'receptionist'; },

  /** True when the current role is allowed to visit the given page id */
  canAccess(page) {
    return (ROLE_PERMISSIONS[this.role()] || []).includes(page);
  },

  /**
   * Returns only the appointments the current user should see:
   * - Doctor → only their assigned appointments
   * - Admin / Receptionist → all appointments
   */
  visibleAppointments() {
    if (this.isDoctor()) {
      return State.appointments.filter(a => a.doctorId === State.currentUser.doctorId);
    }
    return State.appointments;
  },

  /**
   * Returns the CSS class for the role badge pill shown in the sidebar footer
   */
  roleBadgeClass() {
    const map = { admin:'role-badge-admin', doctor:'role-badge-doctor', receptionist:'role-badge-receptionist' };
    return map[this.role()] || '';
  },
};

/* ============================================================
   HTML HELPERS
   ============================================================ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('').slice(0,2);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function statusBadge(status) {
  const map = {
    Confirmed: 'badge-green',
    Active:    'badge-green',
    Pending:   'badge-amber',
    Inactive:  'badge-amber',
    Cancelled: 'badge-red',
  };
  return `<span class="badge ${map[status] || ''}">${escapeHtml(status)}</span>`;
}

function showFieldErrors(errors) {
  // Clear existing
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => el.classList.remove('error'));

  Object.entries(errors).forEach(([field, msg]) => {
    // Map validation key → DOM id
    const idMap = {
      name: 'f-name', age: 'f-age', phone: 'f-phone', email: 'f-email',
      patientId: 'a-patient', doctorId: 'a-doctor', date: 'a-date', time: 'a-time',
    };
    const id  = idMap[field];
    const el  = id ? document.getElementById(id) : null;
    if (!el) return;

    el.classList.add('error');
    const errEl = document.createElement('div');
    errEl.className   = 'field-error';
    errEl.textContent = msg;
    el.parentNode.appendChild(errEl);
    el.focus();
  });
}

/* ============================================================
   RENDER ENGINE
   All rendering is string-based HTML for simplicity
   ============================================================ */

/** Full page re-render */
function render() {
  const root = document.getElementById('app');

  if (!State.loggedIn) {
    root.innerHTML = renderLoginPage();
    attachLoginEvents();
    return;
  }

  root.innerHTML = `
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
    <aside class="sidebar" id="sidebar">
      ${renderSidebar()}
    </aside>
    <div class="main">
      <header class="topbar">
        ${renderTopbar()}
      </header>
      <main class="page-content" id="page-content">
        ${State.loading ? renderSkeleton() : renderPage()}
      </main>
    </div>
    ${State.modal ? renderModal() : ''}
    ${State.notifOpen ? renderNotifPanel() : ''}
  `;

  attachAppEvents();
  if (State.page === 'dashboard') setTimeout(initCharts, 80);
}

/** Re-render only the page content area (faster, no full DOM wipe) */
function renderContent() {
  const pc = document.getElementById('page-content');
  if (pc) {
    pc.innerHTML = State.loading ? renderSkeleton() : renderPage();
    pc.style.animation = 'none'; pc.offsetHeight; pc.style.animation = '';
  }
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();
  if (State.modal) {
    document.getElementById('app').insertAdjacentHTML('beforeend', renderModal());
    attachModalEvents();
  }
  const existingNotif = document.querySelector('.notif-panel');
  if (existingNotif) existingNotif.remove();
  if (State.notifOpen) {
    document.getElementById('app').insertAdjacentHTML('beforeend', renderNotifPanel());
    document.getElementById('notif-close')?.addEventListener('click', () => { State.notifOpen = false; renderContent(); });
  }
  updateSidebarCounts(); updateTopbar();
  if (State.page === 'dashboard') setTimeout(initCharts, 80);
}

// MODIFIED: Uses Auth.visibleAppointments() so doctor badge counts only their own pending
function updateSidebarCounts() {
  const pCount = document.getElementById('nav-patient-count');
  const aCount = document.getElementById('nav-appt-count');
  if (pCount) pCount.textContent = State.patients.length;
  if (aCount) aCount.textContent = Auth.visibleAppointments().filter(a => a.status === 'Pending').length || '';
  const nb = document.getElementById('notif-badge');
  if (nb) { const cnt = Notifications.count(); nb.textContent = cnt; nb.style.display = cnt ? 'flex' : 'none'; }
}

function updateTopbar() {
  const titles = {
    home: 'Home', patients: 'Patient Registry',
    doctors: 'Doctor Directory', appointments: 'Appointment Management',
    dashboard: 'Analytics Dashboard',
  };
  const tt = document.querySelector('.topbar-title');
  if (tt) tt.textContent = titles[State.page] || '';
}

/* ── LOGIN ── */
function renderLoginPage() {
  const locked = State.loginAttempts >= MAX_LOGIN_ATTEMPTS;
  return `
    <div class="login-page">
      <div class="login-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
          <div class="logo-cross" style="width:36px;height:36px;font-size:19px;">&#x271A;</div>
          <div class="login-logo">MediCare+</div>
        </div>
        <div class="login-sub">Patient Management System &mdash; Secure Portal</div>

        ${State.loginErr ? `<div class="login-err" role="alert">${escapeHtml(State.loginErr)}</div>` : ''}

        <div class="form-group">
          <label class="form-label" for="l-user">Username</label>
          <input class="form-input" id="l-user" type="text" placeholder="Enter username"
            autocomplete="username" ${locked ? 'disabled' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label" for="l-pass">Password</label>
          <div class="password-wrap">
            <input class="form-input" id="l-pass" type="password" placeholder="Enter password"
              autocomplete="current-password" ${locked ? 'disabled' : ''} />
            <button class="password-toggle" id="pass-toggle" type="button" aria-label="Toggle password visibility">&#x1F441;</button>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:0.25rem;" id="login-btn" ${locked ? 'disabled' : ''}>
          ${locked ? '&#x1F512; Account Locked' : 'Sign In &rarr;'}
        </button>

        ${State.loginAttempts > 0 && !locked
          ? `<p class="login-attempts">${MAX_LOGIN_ATTEMPTS - State.loginAttempts} attempt${MAX_LOGIN_ATTEMPTS - State.loginAttempts !== 1 ? 's' : ''} remaining</p>`
          : ''}

        <!-- NEW: Multi-role demo credentials hint -->
        <div class="login-hint">
          <div class="login-hint-title">Demo Credentials</div>
          <div class="login-cred-grid">
            <div class="login-cred-row">
              <span class="role-badge role-badge-admin">Admin</span>
              <code>admin</code> / <code>admin123</code>
            </div>
            <div class="login-cred-row">
              <span class="role-badge role-badge-doctor">Doctor</span>
              <code>dr.anitha</code> / <code>doc123</code>
            </div>
            <div class="login-cred-row">
              <span class="role-badge role-badge-receptionist">Receptionist</span>
              <code>riya</code> / <code>rec123</code>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── SIDEBAR ── */
// MODIFIED: Nav items filtered by Auth.canAccess(); footer shows real user name + role badge
function renderSidebar() {
  const allNav = [
    { id:'home',         label:'Home',         icon: iconHome() },
    { id:'patients',     label:'Patients',      icon: iconPatients(), count:'nav-patient-count', countVal: State.patients.length },
    { id:'doctors',      label:'Doctors',       icon: iconDoctors() },
    { id:'appointments', label:'Appointments',  icon: iconCalendar(), count:'nav-appt-count', countVal: Auth.visibleAppointments().filter(a=>a.status==='Pending').length || '' },
    { id:'dashboard',    label:'Dashboard',     icon: iconDashboard() },
  ];

  // Filter nav to only pages the current role can access
  const nav = allNav.filter(item => Auth.canAccess(item.id));

  const user = Auth.user();
  const userInitials = user ? initials(user.name) : 'U';
  const roleLabel = user ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : '';

  return `
    <div class="sidebar-logo">
      <div class="logo-mark">
        <div class="logo-cross">&#x271A;</div>
        <div class="logo-text">MediCare+</div>
      </div>
      <div class="logo-sub">${escapeHtml(roleLabel)} Panel</div>
    </div>
    <nav aria-label="Main navigation">
      <div class="nav-section-label">Navigation</div>
      ${nav.map(item => `
        <div class="nav-item ${State.page === item.id ? 'active' : ''}" data-nav="${item.id}" role="button" tabindex="0" aria-current="${State.page === item.id ? 'page' : 'false'}">
          ${item.icon}
          ${escapeHtml(item.label)}
          ${item.count ? `<span class="nav-count" id="${item.count}">${item.countVal || ''}</span>` : ''}
        </div>
      `).join('')}
    </nav>
    <div class="nav-divider"></div>
    <div class="nav-section-label">System</div>
    <div class="nav-item" id="logout-btn" role="button" tabindex="0">
      ${iconLogout()} Logout
    </div>
    <div class="sidebar-footer">
      <div class="user-badge">
        <div class="avatar">${escapeHtml(userInitials)}</div>
        <div>
          <div class="user-name">${escapeHtml(user?.name || 'User')}</div>
          <span class="role-badge ${Auth.roleBadgeClass()}">${escapeHtml(roleLabel)}</span>
        </div>
      </div>
    </div>`;
}

/* ── TOPBAR ── */
function renderTopbar() {
  const titles = {
    home:'Home', patients:'Patient Registry',
    doctors:'Doctor Directory', appointments:'Appointment Management',
    dashboard:'Analytics Dashboard',
  };
  const now = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const isDark = DarkMode.get() === 'dark';
  return `
    <div class="topbar-left">
      <button class="sidebar-toggle btn btn-ghost btn-icon" id="sidebar-toggle" aria-label="Toggle sidebar">☰</button>
      <span class="topbar-title">${titles[State.page] || ''}</span>
    </div>
    <div class="topbar-right">
      <div class="status-pill"><span class="status-dot"></span><span>System Online</span></div>
      <span class="topbar-date">${now}</span>
      <button class="theme-toggle-btn" id="theme-toggle" title="Toggle dark mode">${isDark ? '☀️' : '🌙'}</button>
      <button class="notif-btn" id="notif-btn" title="Notifications">
        🔔<span class="notif-badge" id="notif-badge" style="display:${Notifications.count()?'flex':'none'}">${Notifications.count()}</span>
      </button>
    </div>`;
}

/* ── PAGE ROUTER ── */
function renderPage() {
  switch (State.page) {
    case 'home':         return renderHome();
    case 'patients':     return renderPatients();
    case 'doctors':      return renderDoctors();
    case 'appointments': return renderAppointments();
    case 'dashboard':    return renderDashboard();
    case 'calendar':     return renderCalendar();
    default:             return '';
  }
}

/* ── SKELETON ── */
function renderSkeleton() {
  return `<div style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem;">
    <div class="skeleton" style="height:140px;border-radius:12px;"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${Array(4).fill(`<div class="skeleton" style="height:90px;border-radius:8px;"></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
      <div class="skeleton" style="height:200px;border-radius:12px;"></div>
      <div class="skeleton" style="height:200px;border-radius:12px;"></div>
    </div>
  </div>`;
}

/* ============================================================
   PAGE RENDERS
   ============================================================ */

/* ── HOME ── */
// MODIFIED: Dynamic welcome name, role-aware quick actions and upcoming filter
function renderHome() {
  // Doctors only see their own upcoming appointments
  const upcoming = Auth.visibleAppointments().filter(a => a.date >= todayISO() && a.status !== 'Cancelled');
  const recent   = [...State.patients].sort((a,b) => b.id - a.id).slice(0, 4);

  // Role-specific welcome sub-line
  const subLines = {
    admin:        'Manage patients, schedule appointments and monitor healthcare delivery efficiently.',
    doctor:       'View your scheduled appointments and assigned patient records.',
    receptionist: 'Register new patients and book appointments quickly.',
  };
  const heroSub = subLines[Auth.role()] || subLines.admin;

  return `
    <div class="hero">
      <div class="hero-bg-circle"></div>
      <div class="hero-bg-circle"></div>
      <div class="hero-content">
        <div class="hero-title">Welcome back,<br>${escapeHtml(Auth.user()?.name || 'User')}</div>
        <div class="hero-sub">${heroSub}</div>
        ${Auth.isAdmin() ? `<button class="hero-btn" data-nav="dashboard">View Dashboard &rarr;</button>` : ''}
      </div>
    </div>

    <div class="quick-actions">
      ${!Auth.isDoctor() ? `
      <div class="qa-card" data-action="addPatient">
        <div class="qa-icon" style="background:var(--teal-light)">&#xFF0B;</div>
        <div class="qa-label">Register Patient</div>
        <div class="qa-desc">Add new patient record</div>
      </div>` : ''}
      ${!Auth.isDoctor() ? `
      <div class="qa-card" data-action="bookAppt">
        <div class="qa-icon" style="background:var(--blue-light)">&#x1F4C5;</div>
        <div class="qa-label">Book Appointment</div>
        <div class="qa-desc">Schedule a visit</div>
      </div>` : ''}
      <div class="qa-card" data-nav="patients">
        <div class="qa-icon" style="background:var(--amber-light)">&#x1F465;</div>
        <div class="qa-label">View Patients</div>
        <div class="qa-desc">${State.patients.length} registered</div>
      </div>
      ${Auth.canAccess('doctors') ? `
      <div class="qa-card" data-nav="doctors">
        <div class="qa-icon" style="background:var(--purple-light)">&#x1FA7A;</div>
        <div class="qa-label">Doctors</div>
        <div class="qa-desc">${State.doctors.length} on staff</div>
      </div>` : ''}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${Auth.isDoctor() ? 'My Upcoming Appointments' : 'Upcoming Appointments'}</div>
            <div class="card-sub">Scheduled, not cancelled</div>
          </div>
          <button class="btn btn-sm" data-nav="appointments">View all</button>
        </div>
        ${upcoming.length === 0
          ? `<div class="empty"><div class="empty-icon">&#x1F4C5;</div><div class="empty-title">No upcoming appointments</div></div>`
          : upcoming.slice(0, 4).map(a => `
              <div class="activity-item">
                <div class="activity-dot" style="background:${a.status==='Confirmed'?'var(--green)':'var(--amber)'}"></div>
                <div style="flex:1;min-width:0;">
                  <div class="activity-text truncate">${escapeHtml(a.patientName)} &mdash; ${escapeHtml(a.doctorName)}</div>
                  <div class="activity-time">${formatDate(a.date)} at ${a.time} &middot; ${escapeHtml(a.type)}</div>
                </div>
                <div>${statusBadge(a.status)}</div>
              </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Recent Patients</div>
            <div class="card-sub">Latest registrations</div>
          </div>
          <button class="btn btn-sm" data-nav="patients">View all</button>
        </div>
        ${recent.length === 0
          ? `<div class="empty"><div class="empty-icon">&#x1F464;</div><div class="empty-title">No patients yet</div></div>`
          : recent.map(p => `
              <div class="activity-item">
                <div class="avatar" style="width:28px;height:28px;font-size:10px;flex-shrink:0;">${initials(p.name)}</div>
                <div style="flex:1;min-width:0;">
                  <div class="activity-text font-medium truncate">${escapeHtml(p.name)}</div>
                  <div class="activity-time">${escapeHtml(p.condition)} &middot; ${p.age} yrs &middot; ${escapeHtml(p.blood)}</div>
                </div>
                ${statusBadge(p.status)}
              </div>`).join('')}
      </div>
    </div>`;
}

/* ── PATIENTS ── */
// MODIFIED: Doctor = read-only (no add/edit/delete); Receptionist = add only (no delete)
function renderPatients() {
  const q = State.search.toLowerCase();
  const f = State.filters;
  const filtered = State.patients.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !p.condition.toLowerCase().includes(q) && !p.phone.includes(q)) return false;
    if (f.gender    !== 'all' && p.gender    !== f.gender)                  return false;
    if (f.status    !== 'all' && p.status    !== f.status)                  return false;
    if (f.condition !== 'all' && p.condition !== f.condition)               return false;
    if (f.ageMin && p.age < parseInt(f.ageMin))                             return false;
    if (f.ageMax && p.age > parseInt(f.ageMax))                             return false;
    return true;
  });

  // Role flags for conditional buttons
  const canAdd    = Auth.isAdmin() || Auth.isRec();
  const canEdit   = Auth.isAdmin();
  const canDelete = Auth.isAdmin();

  const filterPanel = State.filtersOpen ? `
    <div class="filter-panel card">
      <div class="filter-row">
        <div class="form-group mb-0">
          <label class="form-label">Gender</label>
          <select class="form-select" id="flt-gender">
            <option value="all" ${f.gender==='all'?'selected':''}>All Genders</option>
            ${GENDERS.map(g=>`<option ${f.gender===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Status</label>
          <select class="form-select" id="flt-status">
            <option value="all" ${f.status==='all'?'selected':''}>All Statuses</option>
            <option ${f.status==='Active'?'selected':''}>Active</option>
            <option ${f.status==='Inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Condition</label>
          <select class="form-select" id="flt-condition">
            <option value="all" ${f.condition==='all'?'selected':''}>All Conditions</option>
            ${CONDITIONS.map(c=>`<option ${f.condition===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Age Range</label>
          <div style="display:flex;gap:6px;">
            <input class="form-input" id="flt-age-min" type="number" min="0" max="130" placeholder="Min" value="${f.ageMin}" style="width:72px;">
            <input class="form-input" id="flt-age-max" type="number" min="0" max="130" placeholder="Max" value="${f.ageMax}" style="width:72px;">
          </div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" id="apply-filters">Apply Filters</button>
        <button class="btn btn-sm" id="clear-filters">Clear All</button>
      </div>
    </div>` : '';

  return `
    <div class="search-bar">
      <div class="search-wrap">
        <span class="search-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="6" cy="6" r="4"/><path d="M10 10l2.5 2.5"/>
          </svg>
        </span>
        <input class="form-input search-input" id="pat-search"
          placeholder="Search by name, condition, or phone&hellip;"
          value="${escapeHtml(State.search)}"
          aria-label="Search patients" />
      </div>
      <button class="btn ${State.filtersOpen?'btn-primary':''}" id="toggle-filters">&#x2699; Filters</button>
      ${canAdd ? `<button class="btn btn-primary" data-action="addPatient">+ Add Patient</button>` : ''}
      ${Auth.isAdmin() ? `<button class="btn" id="export-patients" title="Export patients to CSV">&darr; CSV</button>` : ''}
      <span class="result-count ml-auto">${filtered.length} patient${filtered.length !== 1 ? 's' : ''}</span>
    </div>
    ${filterPanel}

    <div class="card">
      ${filtered.length === 0 ? `
        <div class="empty">
          <div class="empty-icon">&#x1F50D;</div>
          <div class="empty-title">${State.search ? 'No results found' : 'No patients yet'}</div>
          <div class="empty-desc">${State.search ? `No patients match &ldquo;${escapeHtml(State.search)}&rdquo;. Try a different search term.` : 'Register your first patient to get started.'}</div>
          ${!State.search && canAdd ? `<div class="empty-action"><button class="btn btn-primary" data-action="addPatient">Register Patient</button></div>` : ''}
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Age / Gender</th><th>Contact</th>
                <th>Condition</th><th>Blood</th><th>Status</th>
                ${canEdit || canDelete ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:9px;">
                      <div class="avatar" style="width:30px;height:30px;font-size:10px;">${initials(p.name)}</div>
                      <div>
                        <div style="font-weight:500;">${escapeHtml(p.name)}</div>
                        <div class="text-xs text-muted">Joined ${formatDate(p.joined)}</div>
                      </div>
                    </div>
                  </td>
                  <td>${p.age} yrs / ${escapeHtml(p.gender)}</td>
                  <td>
                    <div>${escapeHtml(p.phone)}</div>
                    <div class="text-xs text-muted">${escapeHtml(p.email || '&mdash;')}</div>
                  </td>
                  <td><span class="tag tag-teal">${escapeHtml(p.condition)}</span></td>
                  <td><span class="tag tag-red">${escapeHtml(p.blood)}</span></td>
                  <td>${statusBadge(p.status)}</td>
                  ${canEdit || canDelete ? `
                  <td>
                    <div style="display:flex;gap:6px;">
                      ${canEdit   ? `<button class="btn btn-sm" data-edit-patient="${p.id}">Edit</button>` : ''}
                      ${canDelete ? `<button class="btn btn-sm btn-danger" data-delete-patient="${p.id}">Delete</button>` : ''}
                    </div>
                  </td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>`;
}

/* ── DOCTORS ── */
function renderDoctors() {
  const today    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const filtered = State.docFilter === 'available'
    ? State.doctors.filter(d => d.slots.includes(today))
    : State.doctors;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px;">
      <p class="text-muted text-sm">${State.doctors.length} doctors on staff · ${State.doctors.filter(d=>d.slots.includes(today)).length} available today (${today})</p>
      <div class="filter-tabs">
        <button class="btn btn-sm ${State.docFilter==='all'?'btn-primary':''}" data-doc-filter="all">All Doctors</button>
        <button class="btn btn-sm ${State.docFilter==='available'?'btn-primary':''}" data-doc-filter="available">Available Today</button>
      </div>
    </div>

    ${filtered.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">🏥</div>
        <div class="empty-title">No doctors available today</div>
        <div class="empty-desc">No doctors are scheduled for ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}.</div>
        <div class="empty-action"><button class="btn btn-sm" data-doc-filter="all">Show All Doctors</button></div>
      </div>
    ` : `
      <div class="grid-3">
        ${filtered.map(d => {
          const c         = DOCTOR_COLORS[d.color] || DOCTOR_COLORS.teal;
          const apptCount = State.appointments.filter(a => a.doctorId === d.id && a.status !== 'Cancelled').length;
          return `
            <div class="doc-card">
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="doc-avatar" style="background:${c.bg};color:${c.color};">${d.initials}</div>
                <div>
                  <div class="doc-name">${escapeHtml(d.name)}</div>
                  <div class="doc-spec">${escapeHtml(d.spec)}</div>
                </div>
              </div>
              <div class="doc-meta">
                <span class="tag tag-teal">${escapeHtml(d.exp)} exp</span>
                <span class="tag tag-blue">★ ${escapeHtml(d.rating)}</span>
                <span class="tag tag-purple">${apptCount} appt${apptCount !== 1 ? 's' : ''}</span>
              </div>
              <div class="avail-line">
                <span class="avail-dot"></span>
                ${escapeHtml(d.slots.join(', '))}
              </div>
              <button class="btn btn-sm" style="margin-top:4px;" data-book-doc="${d.id}">Book Appointment</button>
            </div>`;
        }).join('')}
      </div>
    `}`;
}

/* ── APPOINTMENTS ── */
// MODIFIED: Uses Auth.visibleAppointments() — doctors only see their own appointments
function renderAppointments() {
  const base        = Auth.visibleAppointments(); // filtered by role
  const statusOrder = { Confirmed:0, Pending:1, Cancelled:2 };
  let   list        = [...base].sort((a,b) => (statusOrder[a.status]||0)-(statusOrder[b.status]||0));

  if (State.apptFilter !== 'all')
    list = list.filter(a => a.status === State.apptFilter);

  const counts = {
    all:       base.length,
    Confirmed: base.filter(a=>a.status==='Confirmed').length,
    Pending:   base.filter(a=>a.status==='Pending').length,
    Cancelled: base.filter(a=>a.status==='Cancelled').length,
  };

  // Doctors view appointments read-only; admin & receptionist can book/edit/cancel
  const canBook   = !Auth.isDoctor();
  const canModify = Auth.isAdmin(); // edit & cancel restricted to admin

  return `
    <div class="search-bar">
      <div class="filter-tabs">
        ${['all','Confirmed','Pending','Cancelled'].map(f => `
          <button class="btn btn-sm ${State.apptFilter===f?'btn-primary':''}" data-appt-filter="${f}">
            ${f === 'all' ? 'All' : f} (${counts[f]})
          </button>
        `).join('')}
      </div>
      <div class="ml-auto" style="display:flex;align-items:center;gap:10px;">
        <span class="result-count">${list.length} record${list.length !== 1 ? 's' : ''}</span>
        ${canBook ? `<button class="btn btn-primary" data-action="bookAppt">+ Book Appointment</button>` : ''}
      </div>
    </div>

    <div class="card">
      ${list.length === 0 ? `
        <div class="empty">
          <div class="empty-icon">&#x1F4CB;</div>
          <div class="empty-title">${State.apptFilter === 'all' ? (Auth.isDoctor() ? 'No appointments assigned to you' : 'No appointments yet') : `No ${State.apptFilter.toLowerCase()} appointments`}</div>
          <div class="empty-desc">
            ${State.apptFilter !== 'all' ? `No appointments with status &ldquo;${State.apptFilter}&rdquo;.` : (canBook ? 'Book the first appointment to get started.' : 'No appointments have been assigned yet.')}
          </div>
          ${State.apptFilter === 'all' && canBook ? `<div class="empty-action"><button class="btn btn-primary" data-action="bookAppt">Book Appointment</button></div>` : ''}
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Doctor</th><th>Date &amp; Time</th>
                <th>Type</th><th>Notes</th><th>Status</th>
                ${canModify ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${list.map(a => `
                <tr>
                  <td style="font-weight:500;">${escapeHtml(a.patientName)}</td>
                  <td class="text-sm">${escapeHtml(a.doctorName)}</td>
                  <td>
                    <div>${formatDate(a.date)}</div>
                    <div class="text-xs text-muted">${a.time}</div>
                  </td>
                  <td><span class="tag tag-blue">${escapeHtml(a.type)}</span></td>
                  <td class="text-xs text-muted" style="max-width:130px;" title="${escapeHtml(a.notes||'')}">
                    ${a.notes ? escapeHtml(a.notes.length > 30 ? a.notes.slice(0,30)+'\u2026' : a.notes) : '&mdash;'}
                  </td>
                  <td>${statusBadge(a.status)}</td>
                  ${canModify ? `
                  <td>
                    <div style="display:flex;gap:6px;">
                      ${a.status !== 'Cancelled' ? `
                        <button class="btn btn-sm" data-edit-appt="${a.id}">Edit</button>
                        <button class="btn btn-sm btn-danger" data-cancel-appt="${a.id}">Cancel</button>
                      ` : `<span class="text-xs text-muted">Cancelled</span>`}
                    </div>
                  </td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>`;
}

/* ── DASHBOARD ── */
function renderDashboard() {
  const active    = State.patients.filter(p => p.status === 'Active').length;
  const confirmed = State.appointments.filter(a => a.status === 'Confirmed').length;
  const pending   = State.appointments.filter(a => a.status === 'Pending').length;
  const cancelled = State.appointments.filter(a => a.status === 'Cancelled').length;

  const conditionMap = {};
  State.patients.forEach(p => { conditionMap[p.condition] = (conditionMap[p.condition] || 0) + 1; });

  const genderMap = { Male:0, Female:0, Other:0 };
  State.patients.forEach(p => { genderMap[p.gender] = (genderMap[p.gender] || 0) + 1; });

  const bloodMap = {};
  State.patients.forEach(p => { bloodMap[p.blood] = (bloodMap[p.blood] || 0) + 1; });

  const totalAppts  = State.appointments.length || 1;
  const totalPats   = State.patients.length || 1;

  return `
    <div class="stats-grid">
      <div class="stat-card" style="--stat-accent:var(--teal)">
        <div class="stat-label">Total Patients</div>
        <div class="stat-value">${State.patients.length}</div>
        <div class="stat-change">↑ ${active} active records</div>
      </div>
      <div class="stat-card" style="--stat-accent:var(--green)">
        <div class="stat-label">Active Patients</div>
        <div class="stat-value">${active}</div>
        <div class="stat-change">↑ ${Math.round(active/totalPats*100)}% active rate</div>
      </div>
      <div class="stat-card" style="--stat-accent:var(--blue)">
        <div class="stat-label">Total Appointments</div>
        <div class="stat-value">${State.appointments.length}</div>
        <div class="stat-change">↑ ${confirmed} confirmed</div>
      </div>
      <div class="stat-card" style="--stat-accent:${pending > 2 ? 'var(--red)' : 'var(--amber)'}">
        <div class="stat-label">Pending Review</div>
        <div class="stat-value">${pending}</div>
        <div class="stat-change ${pending > 2 ? 'down' : ''}">Awaiting confirmation</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:1.25rem;">
      <div class="card">
        <div class="card-header"><div class="card-title">Appointment Status</div></div>
        ${[['Confirmed','var(--teal)',confirmed],['Pending','var(--amber)',pending],['Cancelled','var(--red)',cancelled]].map(([s,clr,cnt]) => {
          const pct = Math.round(cnt / totalAppts * 100);
          return `<div class="progress-row">
            <div class="progress-label">
              <span>${s}</span>
              <span class="text-muted">${cnt} (${pct}%)</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${clr};"></div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Conditions Distribution</div></div>
        ${Object.entries(conditionMap).length === 0
          ? `<div class="text-muted text-sm">No patient data yet.</div>`
          : Object.entries(conditionMap).map(([c,n]) => {
              const pct = Math.round(n / totalPats * 100);
              return `<div class="progress-row">
                <div class="progress-label">
                  <span>${escapeHtml(c)}</span>
                  <span class="text-muted">${n} patient${n>1?'s':''}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%;background:var(--teal);"></div>
                </div>
              </div>`;
            }).join('')}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Doctor Utilization</div></div>
        ${State.doctors.map(d => {
          const c    = DOCTOR_COLORS[d.color] || DOCTOR_COLORS.teal;
          const cnt  = State.appointments.filter(a => a.doctorId === d.id && a.status !== 'Cancelled').length;
          return `<div class="activity-item">
            <div class="avatar" style="width:28px;height:28px;font-size:10px;background:${c.bg};color:${c.color};flex-shrink:0;">${d.initials}</div>
            <div style="flex:1;min-width:0;">
              <div class="activity-text font-medium truncate">${escapeHtml(d.name)}</div>
              <div class="activity-time">${escapeHtml(d.spec)}</div>
            </div>
            <span class="tag tag-teal">${cnt} appt${cnt!==1?'s':''}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Patient Demographics</div></div>
        ${Object.entries(genderMap).filter(([,v])=>v>0).map(([g,n]) => {
          const pct  = Math.round(n / totalPats * 100);
          const clr  = g === 'Female' ? 'var(--teal)' : g === 'Male' ? 'var(--blue)' : 'var(--amber)';
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="min-width:56px;font-size:13px;">${escapeHtml(g)}</span>
            <div style="flex:1;height:8px;background:var(--bg-subtle);border-radius:4px;">
              <div style="height:100%;width:${pct}%;background:${clr};border-radius:4px;transition:width 0.4s;"></div>
            </div>
            <span class="text-xs text-muted" style="min-width:50px;">${n} (${pct}%)</span>
          </div>`;
        }).join('')}

        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-clr);">
          <div class="text-xs text-muted" style="margin-bottom:8px;">Blood Group Distribution</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${Object.entries(bloodMap).map(([b,n]) =>
              `<span class="tag tag-red">${escapeHtml(b)}: ${n}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header"><div class="card-title">Appointments This Week</div></div>
        <div class="chart-wrap"><canvas id="chart-appts"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Doctor Workload</div></div>
        <div class="chart-wrap"><canvas id="chart-doctors"></canvas></div>
      </div>
    </div>`;
}

/* ── CALENDAR PAGE ── */
function renderCalendar() {
  const { calendarYear: yr, calendarMonth: mo, calendarDay: sel } = State;
  const first = new Date(yr, mo, 1).getDay();
  const days  = new Date(yr, mo + 1, 0).getDate();
  const today = todayISO();
  const apptMap = {};
  State.appointments.filter(a => a.status !== 'Cancelled').forEach(a => {
    if (!apptMap[a.date]) apptMap[a.date] = [];
    apptMap[a.date].push(a);
  });
  const heads = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-head">${d}</div>`).join('');
  let cells = '';
  for (let i = 0; i < first; i++) cells += '<div class="cal-cell cal-empty"></div>';
  for (let d = 1; d <= days; d++) {
    const iso = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ap  = apptMap[iso] || [];
    cells += `<div class="cal-cell ${iso===today?'cal-today':''} ${iso===sel?'cal-selected':''} ${ap.length?'cal-has-appts':''}" data-cal-day="${iso}">
      <span class="cal-num">${d}</span>
      ${ap.length ? `<div class="cal-dots">${ap.slice(0,3).map(()=>'<span class="cal-dot"></span>').join('')}</div>` : ''}
    </div>`;
  }
  const dayAppts = sel ? (apptMap[sel] || []) : [];
  return `
    <div class="card" style="margin-bottom:1.25rem;">
      <div class="card-header">
        <div><div class="card-title">${MONTH_NAMES[mo]} ${yr}</div><div class="card-sub">Click a date to see appointments</div></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="cal-prev">← Prev</button>
          <button class="btn btn-sm" id="cal-today-btn">Today</button>
          <button class="btn btn-sm" id="cal-next">Next →</button>
        </div>
      </div>
      <div class="cal-grid">${heads}${cells}</div>
    </div>
    ${sel ? `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Appointments on ${formatDate(sel)}</div>
        <button class="btn btn-sm btn-primary" data-action="bookAppt">+ Book</button>
      </div>
      ${dayAppts.length === 0
        ? '<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">No appointments on this date</div></div>'
        : `<div class="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
           <tbody>${dayAppts.map(a=>`<tr>
             <td style="font-weight:500;">${escapeHtml(a.patientName)}</td>
             <td class="text-sm">${escapeHtml(a.doctorName)}</td>
             <td>${a.time}</td>
             <td><span class="tag tag-blue">${escapeHtml(a.type)}</span></td>
             <td>${statusBadge(a.status)}</td>
           </tr>`).join('')}</tbody></table></div>`}
    </div>` : ''}`;
}

/* ── NOTIFICATION PANEL ── */
function renderNotifPanel() {
  const items = Notifications.getUpcoming();
  const today = todayISO();
  return `
    <div class="notif-panel" id="notif-panel">
      <div class="notif-header">
        🔔 Notifications
        <span class="badge badge-red" style="margin-left:auto;">${Notifications.count()} today</span>
        <button class="close-btn" id="notif-close" style="margin-left:8px;">✕</button>
      </div>
      <div class="notif-body">
        ${items.length === 0
          ? '<div class="notif-empty">No upcoming appointments this week 🎉</div>'
          : items.map(a => `
            <div class="notif-item">
              <div class="notif-dot" style="background:${a.date===today?'var(--red)':a.status==='Confirmed'?'var(--green)':'var(--amber)'}"></div>
              <div class="notif-content">
                <div class="notif-name">${escapeHtml(a.patientName)}</div>
                <div class="notif-meta">${escapeHtml(a.doctorName)}<br>${formatDate(a.date)} at ${a.time}</div>
              </div>
              <span class="badge ${a.date===today?'badge-red':a.status==='Confirmed'?'badge-green':'badge-amber'}">${a.date===today?'Today':a.status}</span>
            </div>`).join('')}
      </div>
    </div>`;
}

/* ============================================================
   MODAL RENDERS
   ============================================================ */
function renderModal() {
  const m = State.modal;
  if (m === 'addPatient' || m === 'editPatient') return renderPatientModal();
  if (m === 'bookAppt'   || m === 'editAppt')   return renderApptModal();
  return '';
}

function renderPatientModal() {
  const p     = State.editPatient;
  const title = p ? 'Edit Patient' : 'Register New Patient';

  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <span class="modal-title" id="modal-title">${title}</span>
          <button class="close-btn" id="modal-close" aria-label="Close dialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-name">Full Name <span class="required">*</span></label>
              <input class="form-input" id="f-name" type="text" value="${escapeHtml(p?.name||'')}" placeholder="Patient's full name" autocomplete="off" />
            </div>
            <div class="form-group">
              <label class="form-label" for="f-age">Age <span class="required">*</span></label>
              <input class="form-input" id="f-age" type="number" min="0" max="130" value="${p?.age||''}" placeholder="Age in years" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-gender">Gender</label>
              <select class="form-select" id="f-gender">
                ${GENDERS.map(g => `<option ${p?.gender===g?'selected':''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-blood">Blood Group</label>
              <select class="form-select" id="f-blood">
                ${BLOOD_GROUPS.map(b => `<option ${p?.blood===b?'selected':''}>${b}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-phone">Phone <span class="required">*</span></label>
              <input class="form-input" id="f-phone" type="tel" value="${escapeHtml(p?.phone||'')}" placeholder="10-digit number" maxlength="10" />
            </div>
            <div class="form-group">
              <label class="form-label" for="f-email">Email</label>
              <input class="form-input" id="f-email" type="email" value="${escapeHtml(p?.email||'')}" placeholder="email@example.com" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-address">Address</label>
            <input class="form-input" id="f-address" value="${escapeHtml(p?.address||'')}" placeholder="Street, City" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-condition">Condition / Diagnosis</label>
              <input class="form-input" id="f-condition" value="${escapeHtml(p?.condition||'')}" placeholder="e.g. Hypertension" />
            </div>
            <div class="form-group">
              <label class="form-label" for="f-status">Status</label>
              <select class="form-select" id="f-status">
                ${['Active','Inactive'].map(s => `<option ${p?.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">${p ? 'Save Changes' : 'Register Patient'}</button>
        </div>
      </div>
    </div>`;
}

function renderApptModal() {
  const a      = State.editAppt;
  const title  = a ? 'Edit Appointment' : 'Book Appointment';
  const today  = todayISO();

  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <span class="modal-title" id="modal-title">${title}</span>
          <button class="close-btn" id="modal-close" aria-label="Close dialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="a-patient">Patient <span class="required">*</span></label>
            <select class="form-select" id="a-patient">
              <option value="">Select patient…</option>
              ${State.patients.map(p => `<option value="${p.id}" ${a?.patientId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-doctor">Doctor <span class="required">*</span></label>
            <select class="form-select" id="a-doctor">
              <option value="">Select doctor…</option>
              ${State.doctors.map(d => `<option value="${d.id}" ${(a?.doctorId===d.id||State.prefDoc===d.id)?'selected':''}>${escapeHtml(d.name)} — ${escapeHtml(d.spec)}</option>`).join('')}
            </select>
          </div>
          <div id="doc-avail-hint" style="font-size:12px;color:var(--text-muted);margin:-6px 0 10px;"></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-date">Date <span class="required">*</span></label>
              <input class="form-input" id="a-date" type="date" min="${today}" value="${a?.date||today}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="a-time">Time <span class="required">*</span></label>
              <select class="form-select" id="a-time">
                ${TIME_SLOTS.map(t => `<option ${a?.time===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-type">Visit Type</label>
              <select class="form-select" id="a-type">
                ${VISIT_TYPES.map(t => `<option ${a?.type===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="a-status">Status</label>
              <select class="form-select" id="a-status">
                ${['Pending','Confirmed'].map(s => `<option ${a?.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group mb-0">
            <label class="form-label" for="a-notes">Notes</label>
            <textarea class="form-input" id="a-notes" placeholder="Any specific notes or symptoms…">${escapeHtml(a?.notes||'')}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">${a ? 'Save Changes' : 'Book Appointment'}</button>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   ACTIONS (Business Logic)
   ============================================================ */

// Authenticates against the FastAPI backend; stores JWT token and user info
async function doLogin() {
  const username = (document.getElementById('l-user')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('l-pass')?.value || '');

  if (State.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    State.loginErr = 'Too many failed attempts. Please refresh the page.';
    render(); return;
  }

  try {
    const result = await ApiService.login(username, password);

    // Persist JWT and user info
    Storage.set(STORAGE_KEYS.TOKEN, result.access_token);
    Storage.set(STORAGE_KEYS.USER,  result.user);

    State.currentUser  = result.user;
    State.loginErr     = '';
    State.loginAttempts = 0;
    State.page         = 'home';
    State.loading      = true;
    render();

    // Fetch real data from backend
    await loadAppData();
    State.loading = false;
    renderContent();
  } catch (e) {
    State.loginAttempts++;
    State.loginErr = e.message || 'Invalid username or password.';
    render();
  }
}

function doLogout() {
  Storage.set(STORAGE_KEYS.TOKEN, null);
  Storage.set(STORAGE_KEYS.USER,  null);
  State.currentUser  = null;
  State.patients     = [];
  State.appointments = [];
  State.page         = 'login';
  State.loginErr     = '';
  State.loginAttempts = 0;
  render();
}

/** Fetches patients and appointments from the backend API */
async function loadAppData() {
  const [patients, appointments] = await Promise.all([
    ApiService.fetchPatients(),
    ApiService.fetchAppointments(),
  ]);
  State.patients     = patients;
  State.appointments = appointments;
}

// MODIFIED: Access guard — blocks navigation to pages the current role cannot access
function navigateTo(page) {
  if (!Auth.canAccess(page)) {
    Toast.error(`Access denied. Your role (${Auth.role()}) cannot view this page.`);
    return;
  }
  State.page        = page;
  State.search      = '';
  State.modal       = null;
  State.editPatient = null;
  State.editAppt    = null;
  render();
}

function openModal(type, id = null) {
  State.modal       = type;
  State.editPatient = null;
  State.editAppt    = null;
  State.prefDoc     = id;

  if (type === 'editPatient') State.editPatient = State.patients.find(p => p.id === id) || null;
  if (type === 'editAppt')    State.editAppt    = State.appointments.find(a => a.id === id) || null;
  if (type === 'bookAppt')    State.prefDoc     = id; // id = doctor id if pre-selected

  renderContent();
}

function closeModal() {
  State.modal       = null;
  State.editPatient = null;
  State.editAppt    = null;
  State.prefDoc     = null;
  renderContent();
}

/* Patient CRUD */
async function savePatient() {
  const fields = {
    name:      document.getElementById('f-name')?.value || '',
    age:       document.getElementById('f-age')?.value  || '',
    gender:    document.getElementById('f-gender')?.value,
    blood:     document.getElementById('f-blood')?.value,
    phone:     document.getElementById('f-phone')?.value || '',
    email:     document.getElementById('f-email')?.value || '',
    address:   document.getElementById('f-address')?.value || '',
    condition: document.getElementById('f-condition')?.value || 'General',
    status:    document.getElementById('f-status')?.value || 'Active',
  };
  const editingId = State.editPatient?.id ?? null;
  const { valid, errors } = Validate.patient(fields, editingId);
  if (!valid) { showFieldErrors(errors); return; }
  const patientData = {
    ...fields,
    name:  fields.name.trim(), phone: fields.phone.trim(),
    email: fields.email.trim(), age: parseInt(fields.age),
  };
  const btn = document.getElementById('modal-save');
  if (btn) btn.classList.add('saving');
  try {
    if (editingId !== null) {
      await ApiService.updatePatient(editingId, patientData);
      Toast.success('Patient updated successfully');
    } else {
      await ApiService.createPatient(patientData);
      Toast.success('Patient registered successfully');
    }
    closeModal();
  } catch(e) {
    Toast.error('Something went wrong. Please try again.');
    if (btn) btn.classList.remove('saving');
  }
}

async function deletePatient(id) {
  const patient = State.patients.find(p => p.id === id);
  if (!patient) return;
  const apptCount = State.appointments.filter(a => a.patientId === id).length;
  const confirmed = await Confirm.show({
    title: 'Delete Patient?',
    message: `Permanently delete "${patient.name}"${apptCount > 0 ? ` and their ${apptCount} appointment${apptCount>1?'s':''}` : ''}? This cannot be undone.`,
    confirmText: 'Delete', icon: '🗑️', danger: true,
  });
  if (!confirmed) return;
  await ApiService.deletePatient(id);
  Toast.success('Patient deleted');
  renderContent();
}

/* Appointment CRUD */
async function saveAppt() {
  const fields = {
    patientId: document.getElementById('a-patient')?.value,
    doctorId:  document.getElementById('a-doctor')?.value,
    date:      document.getElementById('a-date')?.value,
    time:      document.getElementById('a-time')?.value,
    type:      document.getElementById('a-type')?.value,
    status:    document.getElementById('a-status')?.value,
    notes:     document.getElementById('a-notes')?.value || '',
  };
  const { valid, errors } = Validate.appointment(fields);
  if (!valid) { showFieldErrors(errors); return; }
  const patient  = State.patients.find(p => p.id === parseInt(fields.patientId));
  const doctor   = State.doctors.find(d  => d.id === parseInt(fields.doctorId));
  const apptData = {
    patientId: parseInt(fields.patientId), patientName: patient.name,
    doctorId:  parseInt(fields.doctorId),  doctorName:  doctor.name,
    date: fields.date, time: fields.time, type: fields.type,
    status: fields.status, notes: fields.notes,
  };
  const btn = document.getElementById('modal-save');
  if (btn) btn.classList.add('saving');
  try {
    if (State.editAppt) {
      await ApiService.updateAppointment(State.editAppt.id, apptData);
      Toast.success('Appointment updated successfully');
    } else {
      await ApiService.createAppointment(apptData);
      Toast.success('Appointment booked successfully');
    }
    closeModal();
  } catch(e) {
    Toast.error('Something went wrong. Please try again.');
    if (btn) btn.classList.remove('saving');
  }
}

async function cancelAppt(id) {
  const appt = State.appointments.find(a => a.id === id);
  if (!appt) return;
  const confirmed = await Confirm.show({
    title: 'Cancel Appointment?',
    message: `Cancel appointment for ${appt.patientName} on ${formatDate(appt.date)} at ${appt.time}?`,
    confirmText: 'Cancel Appointment', icon: '📅', danger: true,
  });
  if (!confirmed) return;
  await ApiService.cancelAppointment(id);
  Toast.success('Appointment cancelled');
  renderContent();
}

/* ── EXPORT FUNCTIONS ── */
function exportPatientsCSV() {
  const headers = ['ID','Name','Age','Gender','Blood','Phone','Email','Address','Condition','Status','Joined'];
  const rows = State.patients.map(p => [
    p.id, `"${p.name}"`, p.age, p.gender, p.blood, p.phone, p.email||'', `"${p.address||''}"`, `"${p.condition}"`, p.status, p.joined
  ].join(','));
  downloadCSV([headers.join(','), ...rows].join('\n'), 'patients.csv');
  Toast.success('Patients exported to CSV');
}

function exportAppointmentsCSV() {
  const headers = ['ID','Patient','Doctor','Date','Time','Type','Status','Notes'];
  const rows = State.appointments.map(a => [
    a.id, `"${a.patientName}"`, `"${a.doctorName}"`, a.date, a.time, a.type, a.status, `"${a.notes||''}"`,
  ].join(','));
  downloadCSV([headers.join(','), ...rows].join('\n'), 'appointments.csv');
  Toast.success('Appointments exported to CSV');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

/* ============================================================
   EVENT BINDING
   All events use data-* attributes on containers (delegation)
   ============================================================ */
function attachLoginEvents() {
  document.getElementById('login-btn')?.addEventListener('click', doLogin);
  document.getElementById('l-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('l-user')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('l-pass')?.focus(); });

  // Password visibility toggle
  document.getElementById('pass-toggle')?.addEventListener('click', () => {
    const inp = document.getElementById('l-pass');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // Auto-focus username
  document.getElementById('l-user')?.focus();
}

function attachAppEvents() {
  // Sidebar navigation — remove first to prevent duplicate listeners on re-login
  document.removeEventListener('click', handleDelegatedClick);
  document.removeEventListener('keydown', handleKeyNav);
  document.addEventListener('click', handleDelegatedClick);
  document.addEventListener('keydown', handleKeyNav);

  // Sidebar mobile toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

  // Live search in patient page
  document.getElementById('pat-search')?.addEventListener('input', e => {
    State.search = e.target.value;
    renderContent();
  });
}

/** Single delegated click handler for the entire app shell */
function handleDelegatedClick(e) {
  // data-* attribute delegation
  const el = e.target.closest('[data-nav],[data-action],[data-doc-filter],[data-appt-filter],[data-edit-patient],[data-delete-patient],[data-book-doc],[data-edit-appt],[data-cancel-appt],[data-cal-day],#logout-btn');
  if (el) {
    if (el.dataset.nav)            navigateTo(el.dataset.nav);
    if (el.dataset.action === 'addPatient') openModal('addPatient');
    if (el.dataset.action === 'bookAppt')   openModal('bookAppt');
    if (el.dataset.docFilter)    { State.docFilter  = el.dataset.docFilter;  renderContent(); }
    if (el.dataset.apptFilter)   { State.apptFilter = el.dataset.apptFilter; renderContent(); }
    if (el.dataset.editPatient)  openModal('editPatient', parseInt(el.dataset.editPatient));
    if (el.dataset.deletePatient) deletePatient(parseInt(el.dataset.deletePatient));
    if (el.dataset.bookDoc)      openModal('bookAppt', parseInt(el.dataset.bookDoc));
    if (el.dataset.editAppt)     openModal('editAppt', parseInt(el.dataset.editAppt));
    if (el.dataset.cancelAppt)   cancelAppt(parseInt(el.dataset.cancelAppt));
    if (el.dataset.calDay) {
      State.calendarDay = State.calendarDay === el.dataset.calDay ? null : el.dataset.calDay;
      renderContent();
    }
    if (el.id === 'logout-btn') doLogout();
    return;
  }
  // ID-based delegation for dynamic buttons inside page content
  const btn = e.target.closest('button');
  if (!btn) return;
  switch (btn.id) {
    case 'theme-toggle':    DarkMode.toggle(); break;
    case 'notif-btn':       State.notifOpen = !State.notifOpen; renderContent(); break;
    case 'notif-close':     State.notifOpen = false; renderContent(); break;
    case 'toggle-filters':  State.filtersOpen = !State.filtersOpen; renderContent(); break;
    case 'apply-filters':
      State.filters.gender    = document.getElementById('flt-gender')?.value    || 'all';
      State.filters.status    = document.getElementById('flt-status')?.value    || 'all';
      State.filters.condition = document.getElementById('flt-condition')?.value || 'all';
      State.filters.ageMin    = document.getElementById('flt-age-min')?.value   || '';
      State.filters.ageMax    = document.getElementById('flt-age-max')?.value   || '';
      renderContent(); break;
    case 'clear-filters':
      State.filters = { gender:'all', ageMin:'', ageMax:'', condition:'all', status:'all' };
      renderContent(); break;
    case 'export-patients': exportPatientsCSV(); break;
    case 'export-appts':    exportAppointmentsCSV(); break;
    case 'cal-prev':
      State.calendarMonth--;
      if (State.calendarMonth < 0) { State.calendarMonth = 11; State.calendarYear--; }
      State.calendarDay = null; renderContent(); break;
    case 'cal-next':
      State.calendarMonth++;
      if (State.calendarMonth > 11) { State.calendarMonth = 0; State.calendarYear++; }
      State.calendarDay = null; renderContent(); break;
    case 'cal-today-btn':
      State.calendarYear = new Date().getFullYear();
      State.calendarMonth = new Date().getMonth();
      State.calendarDay = todayISO();
      renderContent(); break;
  }
}

function handleKeyNav(e) {
  if (e.key === 'Escape' && State.modal) closeModal();
}

function attachModalEvents() {
  document.getElementById('modal-close')?.addEventListener('click',  closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-save')?.addEventListener('click', () => {
    const m = State.modal;
    if (m === 'addPatient' || m === 'editPatient') savePatient();
    if (m === 'bookAppt'   || m === 'editAppt')   saveAppt();
  });

  // Close on backdrop click
  document.getElementById('modal-backdrop')?.addEventListener('click', e => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  // Doctor availability hint
  const docSelect = document.getElementById('a-doctor');
  docSelect?.addEventListener('change', updateDocAvailHint);
  updateDocAvailHint();

  // First focusable field
  document.querySelector('.modal .form-input, .modal .form-select')?.focus();
}

function updateDocAvailHint() {
  const hint  = document.getElementById('doc-avail-hint');
  if (!hint) return;
  const docId = parseInt(document.getElementById('a-doctor')?.value);
  const doc   = State.doctors.find(d => d.id === docId);
  hint.textContent = doc ? `Available: ${doc.slots.join(', ')}` : '';
}

/* ── CHART INITIALISATION (Chart.js) ── */
function initCharts() {
  if (typeof Chart === 'undefined') return;
  // Bar chart: appointments per day this week
  const apptCanvas = document.getElementById('chart-appts');
  if (apptCanvas) {
    const labels = [], counts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      labels.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]);
      const iso = d.toISOString().slice(0,10);
      counts.push(State.appointments.filter(a => a.date === iso && a.status !== 'Cancelled').length);
    }
    if (window._chartAppts) window._chartAppts.destroy();
    window._chartAppts = new Chart(apptCanvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Appointments', data: counts, backgroundColor: 'rgba(29,158,117,0.75)', borderRadius: 6 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}} }
    });
  }
  // Doughnut: doctor workload
  const docCanvas = document.getElementById('chart-doctors');
  if (docCanvas) {
    const labels = State.doctors.map(d => d.name.replace('Dr. ',''));
    const data   = State.doctors.map(d => State.appointments.filter(a => a.doctorId===d.id && a.status!=='Cancelled').length);
    const colors = ['#1D9E75','#378ADD','#BA7517','#E24B4A','#639922','#5B4FCF'];
    if (window._chartDoctors) window._chartDoctors.destroy();
    window._chartDoctors = new Chart(docCanvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{font:{size:11}}}} }
    });
  }
}

/* ── SIDEBAR MOBILE ── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  sb?.classList.toggle('open');
  if (bd) bd.style.display = sb?.classList.contains('open') ? 'block' : 'none';
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  sb?.classList.remove('open');
  if (bd) bd.style.display = 'none';
}

/* ============================================================
   SVG ICONS (inline, theme-aware)
   ============================================================ */
function iconHome() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 15V9h4v6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function iconPatients() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="4" r="2.5"/><path d="M1 13c0-2.5 2.2-4 5-4s5 1.5 5 4"/><circle cx="12" cy="5" r="2"/><path d="M12 9c1.8.2 3 1.2 3 3" stroke-linecap="round"/></svg>`;
}
function iconDoctors() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/><path d="M11 11v3m-1.5-1.5h3" stroke-linecap="round"/></svg>`;
}
function iconCalendar() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="12" rx="1.5"/><path d="M5 2v2M11 2v2M2 7h12"/></svg>`;
}
function iconDashboard() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="6" rx="1"/><rect x="9" y="2" width="5" height="3" rx="1"/><rect x="9" y="7" width="5" height="7" rx="1"/><rect x="2" y="10" width="5" height="4" rx="1"/></svg>`;
}
function iconCalView() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="12" rx="1.5"/><path d="M5 2v2M11 2v2M2 7h12"/><path d="M5 10h2M9 10h2M5 13h2" stroke-linecap="round"/></svg>`;
}
function iconLogout() {
  return `<svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  DarkMode.init();
  document.getElementById('confirm-ok')?.addEventListener('click',     () => Confirm._answer(true));
  document.getElementById('confirm-cancel')?.addEventListener('click', () => Confirm._answer(false));
  document.getElementById('confirm-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'confirm-overlay') Confirm._answer(false);
  });

  // Restore session from stored JWT token (survives page refresh)
  const storedToken = Storage.get(STORAGE_KEYS.TOKEN, null);
  const storedUser  = Storage.get(STORAGE_KEYS.USER, null);
  if (storedToken && storedUser) {
    State.currentUser = storedUser;
    State.page = 'home';
    State.loading = true;
    render();
    try {
      await loadAppData();
      State.loading = false;
      renderContent();
    } catch (e) {
      // Token expired or invalid — force re-login
      doLogout();
    }
  } else {
    render();
  }
});
