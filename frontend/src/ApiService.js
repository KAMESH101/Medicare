/* ============================================================
   MediCare+ — ApiService.js
   Dual-mode: real FastAPI backend OR localStorage fallback
   ============================================================ */

// On Vercel, frontend and API share the same domain — use relative paths.
// Locally, point directly to the Express dev server on port 8000.
export const API_BASE_URL = (
  import.meta.env.PROD
    ? ''                       // Vercel: same-origin, rewrites handle routing
    : 'http://127.0.0.1:8000'  // Local dev
);

export const STORAGE_KEYS = {
  PATIENTS:        'medicare_patients',
  APPOINTMENTS:    'medicare_appointments',
  NEXT_PATIENT_ID: 'medicare_next_patient_id',
  NEXT_APPT_ID:    'medicare_next_appt_id',
  THEME:           'medicare_theme',
  TOKEN:           'medicare_token',
  USER:            'medicare_user',
};

export const USERS = [
  { id: 'u1', username: 'admin',     password: 'admin123', role: 'admin',        name: 'Administrator',       doctorId: null },
  { id: 'u2', username: 'dr.anitha', password: 'doc123',   role: 'doctor',       name: 'Dr. Anitha Krishnan', doctorId: 1    },
  { id: 'u3', username: 'dr.suresh', password: 'doc456',   role: 'doctor',       name: 'Dr. Suresh Patel',    doctorId: 2    },
  { id: 'u4', username: 'riya',      password: 'rec123',   role: 'receptionist', name: 'Riya Sharma',         doctorId: null },
];

export const ROLE_PERMISSIONS = {
  admin:        ['home', 'patients', 'doctors', 'appointments', 'dashboard', 'calendar'],
  doctor:       ['home', 'appointments', 'patients'],
  receptionist: ['home', 'patients', 'appointments'],
};

export const MAX_LOGIN_ATTEMPTS = 5;

export const BLOOD_GROUPS  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDERS       = ['Male', 'Female', 'Other'];
export const VISIT_TYPES   = ['Consultation', 'Follow-up', 'Routine', 'Emergency', 'Lab Review'];
export const APPT_STATUSES = ['Pending', 'Confirmed', 'Cancelled'];
export const TIME_SLOTS    = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
export const MONTH_NAMES   = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const CONDITIONS    = ['Hypertension', 'Diabetes Type 2', 'Asthma', 'Migraine', 'Arthritis', 'Heart Disease', 'Obesity', 'Anxiety', 'General', 'Other'];

export const SEED_PATIENTS = [
  { id: 1, name: 'Priya Nair',          age: 34, gender: 'Female', blood: 'O+',  phone: '9876543210', email: 'priya@email.com',  address: 'Anna Nagar, Chennai',  condition: 'Hypertension',   status: 'Active',   joined: '2024-01-15' },
  { id: 2, name: 'Rajan Kumar',         age: 58, gender: 'Male',   blood: 'A+',  phone: '9876543211', email: 'rajan@email.com',  address: 'T Nagar, Chennai',     condition: 'Diabetes Type 2', status: 'Active',   joined: '2024-02-20' },
  { id: 3, name: 'Meena Pillai',        age: 42, gender: 'Female', blood: 'B-',  phone: '9876543212', email: 'meena@email.com',  address: 'Adyar, Chennai',       condition: 'Asthma',         status: 'Inactive', joined: '2024-03-05' },
  { id: 4, name: 'Arjun Sharma',        age: 27, gender: 'Male',   blood: 'AB+', phone: '9876543213', email: 'arjun@email.com',  address: 'Velachery, Chennai',   condition: 'Migraine',       status: 'Active',   joined: '2024-04-10' },
];

export const SEED_APPOINTMENTS = [
  { id: 1, patientId: 1, patientName: 'Priya Nair',   doctorId: 1, doctorName: 'Dr. Anitha Krishnan',     date: '2026-05-12', time: '10:00', type: 'Follow-up',    status: 'Confirmed', notes: 'BP check' },
  { id: 2, patientId: 2, patientName: 'Rajan Kumar',  doctorId: 2, doctorName: 'Dr. Suresh Patel',        date: '2026-05-13', time: '14:30', type: 'Consultation', status: 'Pending',   notes: 'Sugar level check' },
  { id: 3, patientId: 3, patientName: 'Meena Pillai', doctorId: 3, doctorName: 'Dr. Kavya Reddy',         date: '2026-05-14', time: '11:00', type: 'Routine',      status: 'Confirmed', notes: 'Breathing test' },
  { id: 4, patientId: 4, patientName: 'Arjun Sharma', doctorId: 1, doctorName: 'Dr. Anitha Krishnan',     date: '2026-05-15', time: '09:30', type: 'Consultation', status: 'Cancelled', notes: 'Migraine analysis' },
];

export const DOCTORS = [
  { id: 1, name: 'Dr. Anitha Krishnan',    spec: 'Neurologist',       exp: '12 yrs', rating: '4.9', slots: ['Mon', 'Wed', 'Fri'],                  color: 'teal',   initials: 'AK' },
  { id: 2, name: 'Dr. Suresh Patel',       spec: 'Endocrinologist',   exp: '8 yrs',  rating: '4.7', slots: ['Tue', 'Thu'],                        color: 'blue',   initials: 'SP' },
  { id: 3, name: 'Dr. Kavya Reddy',        spec: 'Pulmonologist',     exp: '15 yrs', rating: '4.8', slots: ['Mon', 'Tue', 'Thu'],                  color: 'amber',  initials: 'KR' },
  { id: 4, name: 'Dr. Mohammed Farhan',    spec: 'Cardiologist',      exp: '20 yrs', rating: '4.9', slots: ['Wed', 'Fri'],                        color: 'red',    initials: 'MF' },
  { id: 5, name: 'Dr. Lakshmi Subramanian', spec: 'General Physician', exp: '10 yrs', rating: '4.6', slots: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],      color: 'green',  initials: 'LS' },
  { id: 6, name: 'Dr. Venkat Rajan',       spec: 'Orthopedic Surgeon', exp: '18 yrs', rating: '4.8', slots: ['Mon', 'Thu', 'Fri'],                  color: 'purple', initials: 'VR' },
];

export const DOCTOR_COLORS = {
  teal:   { bg: '#E1F5EE', color: '#085041' },
  blue:   { bg: '#E6F1FB', color: '#042C53' },
  amber:  { bg: '#FAEEDA', color: '#BA7517' },
  red:    { bg: '#FCEBEB', color: '#E24B4A' },
  green:  { bg: '#EAF3DE', color: '#639922' },
  purple: { bg: '#EEEDFE', color: '#5B4FCF' },
};

/* ============================================================
   PERSISTENCE LAYER
   ============================================================ */
export const Storage = {
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

/* ============================================================
   API SERVICE LAYER
   ============================================================ */
let _localMode = false;

export const ApiService = {
  isLocalMode() {
    return _localMode;
  },
  setLocalMode(val) {
    _localMode = val;
  },

  _token() { return Storage.get(STORAGE_KEYS.TOKEN, null); },
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },
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
  _delay(ms = 350) { return new Promise(r => setTimeout(r, ms)); },

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
  async fetchPatients(statePatients) {
    if (_localMode) return statePatients;
    const data = await this._fetch('/patients');
    return data.map(p => this._toCamel(p));
  },
  async fetchAppointments(stateAppointments) {
    if (_localMode) return stateAppointments;
    const data = await this._fetch('/appointments');
    return data.map(a => this._toCamel(a));
  },

  /* Patient CRUD */
  async createPatient(d, stateUpdateFn) {
    if (_localMode) {
      await this._delay();
      const currentPatients = Storage.get(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
      let nextId = Storage.get(STORAGE_KEYS.NEXT_PATIENT_ID, 5);
      const p = { id: nextId, joined: todayISO(), ...d };
      const updated = [...currentPatients, p];
      Storage.set(STORAGE_KEYS.PATIENTS, updated);
      Storage.set(STORAGE_KEYS.NEXT_PATIENT_ID, nextId + 1);
      if (stateUpdateFn) stateUpdateFn(updated);
      return p;
    }
    const data = await this._fetch('/patients', { method: 'POST', body: JSON.stringify(d) });
    const p = this._toCamel(data);
    return p;
  },
  async updatePatient(id, d, stateUpdateFn) {
    if (_localMode) {
      await this._delay();
      const currentPatients = Storage.get(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
      const idx = currentPatients.findIndex(p => p.id === id);
      if (idx >= 0) {
        currentPatients[idx] = { ...currentPatients[idx], ...d };
        Storage.set(STORAGE_KEYS.PATIENTS, currentPatients);
        if (stateUpdateFn) stateUpdateFn(currentPatients);
        return currentPatients[idx];
      }
      throw new Error("Patient not found");
    }
    const data = await this._fetch(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(d) });
    const p = this._toCamel(data);
    return p;
  },
  async deletePatient(id, statePatientsUpdateFn, stateApptsUpdateFn) {
    if (_localMode) {
      await this._delay();
      const currentPatients = Storage.get(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
      const currentAppts = Storage.get(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
      
      const filteredPats = currentPatients.filter(p => p.id !== id);
      const filteredAppts = currentAppts.filter(a => a.patientId !== id);
      
      Storage.set(STORAGE_KEYS.PATIENTS, filteredPats);
      Storage.set(STORAGE_KEYS.APPOINTMENTS, filteredAppts);
      
      if (statePatientsUpdateFn) statePatientsUpdateFn(filteredPats);
      if (stateApptsUpdateFn) stateApptsUpdateFn(filteredAppts);
      return;
    }
    await this._fetch(`/patients/${id}`, { method: 'DELETE' });
  },

  /* Appointment CRUD */
  async createAppointment(d, stateUpdateFn) {
    if (_localMode) {
      await this._delay();
      const currentAppts = Storage.get(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
      let nextId = Storage.get(STORAGE_KEYS.NEXT_APPT_ID, 5);
      const a = { id: nextId, ...d };
      const updated = [...currentAppts, a];
      Storage.set(STORAGE_KEYS.APPOINTMENTS, updated);
      Storage.set(STORAGE_KEYS.NEXT_APPT_ID, nextId + 1);
      if (stateUpdateFn) stateUpdateFn(updated);
      return a;
    }
    const data = await this._fetch('/appointments', { method: 'POST', body: JSON.stringify(this._toSnake(d)) });
    const a = this._toCamel(data);
    return a;
  },
  async updateAppointment(id, d, stateUpdateFn) {
    if (_localMode) {
      await this._delay();
      const currentAppts = Storage.get(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
      const idx = currentAppts.findIndex(a => a.id === id);
      if (idx >= 0) {
        currentAppts[idx] = { ...currentAppts[idx], ...d };
        Storage.set(STORAGE_KEYS.APPOINTMENTS, currentAppts);
        if (stateUpdateFn) stateUpdateFn(currentAppts);
        return currentAppts[idx];
      }
      throw new Error("Appointment not found");
    }
    const data = await this._fetch(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(this._toSnake(d)) });
    const a = this._toCamel(data);
    return a;
  },
  async cancelAppointment(id, stateUpdateFn) {
    if (_localMode) {
      return this.updateAppointment(id, { status: 'Cancelled' }, stateUpdateFn);
    }
    const data = await this._fetch(`/appointments/${id}`, { method: 'DELETE' });
    const a = this._toCamel(data);
    return a;
  },
};

/* ============================================================
   DOMAIN HELPERS
   ============================================================ */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function initials(name) {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('').slice(0, 2);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
