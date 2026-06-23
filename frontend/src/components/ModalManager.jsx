import React, { useState, useEffect, useRef } from 'react';
import { GENDERS, BLOOD_GROUPS, VISIT_TYPES, TIME_SLOTS, todayISO, escapeHtml } from '../ApiService';

export default function ModalManager({
  modal,
  patients,
  doctors,
  appointments,
  editPatient,
  editAppt,
  prefDoc,
  onSavePatient,
  onSaveAppt,
  onClose,
}) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Patient Form State ──
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [pGender, setPGender] = useState('Male');
  const [pBlood, setPBlood] = useState('A+');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pCondition, setPCondition] = useState('General');
  const [pStatus, setPStatus] = useState('Active');

  // ── Appointment Form State ──
  const [aPatientId, setAPatientId] = useState('');
  const [aDoctorId, setADoctorId] = useState('');
  const [aDate, setADate] = useState(todayISO());
  const [aTime, setATime] = useState('09:00');
  const [aType, setAType] = useState('Consultation');
  const [aStatus, setAStatus] = useState('Pending');
  const [aNotes, setANotes] = useState('');

  const firstInputRef = useRef(null);

  // Load edit/pref values on mount or state change
  useEffect(() => {
    setErrors({});
    if (modal === 'addPatient') {
      setPName('');
      setPAge('');
      setPGender('Male');
      setPBlood('A+');
      setPPhone('');
      setPEmail('');
      setPAddress('');
      setPCondition('General');
      setPStatus('Active');
    } else if (modal === 'editPatient' && editPatient) {
      setPName(editPatient.name || '');
      setPAge(editPatient.age || '');
      setPGender(editPatient.gender || 'Male');
      setPBlood(editPatient.blood || 'A+');
      setPPhone(editPatient.phone || '');
      setPEmail(editPatient.email || '');
      setPAddress(editPatient.address || '');
      setPCondition(editPatient.condition || 'General');
      setPStatus(editPatient.status || 'Active');
    } else if (modal === 'bookAppt') {
      setAPatientId('');
      setADoctorId(prefDoc ? String(prefDoc) : '');
      setADate(todayISO());
      setATime('09:00');
      setAType('Consultation');
      setAStatus('Pending');
      setANotes('');
    } else if (modal === 'editAppt' && editAppt) {
      setAPatientId(String(editAppt.patientId || ''));
      setADoctorId(String(editAppt.doctorId || ''));
      setADate(editAppt.date || todayISO());
      setATime(editAppt.time || '09:00');
      setAType(editAppt.type || 'Consultation');
      setAStatus(editAppt.status || 'Pending');
      setANotes(editAppt.notes || '');
    }

    // Accessibility focus on first input
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
  }, [modal, editPatient, editAppt, prefDoc]);

  if (!modal) return null;

  // ── VALIDATION LOGIC ──
  const validatePatient = () => {
    const errs = {};
    if (!pName.trim()) errs.name = 'Full name is required';
    else if (pName.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    const age = parseInt(pAge);
    if (!pAge) errs.age = 'Age is required';
    else if (isNaN(age) || age < 0 || age > 130) errs.age = 'Enter a valid age (0–130)';

    if (!pPhone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(pPhone.trim())) errs.phone = 'Phone must be exactly 10 digits';

    if (pEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pEmail.trim())) {
      errs.email = 'Enter a valid email address';
    }

    // Duplicate local check
    const dup = patients.find(p =>
      p.id !== (editPatient?.id ?? -1) &&
      p.name.toLowerCase() === pName.trim().toLowerCase() &&
      p.phone.trim() === pPhone.trim()
    );
    if (dup) errs.name = 'A patient with this name and phone already exists';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAppointment = () => {
    const errs = {};
    if (!aPatientId) errs.patientId = 'Please select a patient';
    if (!aDoctorId) errs.doctorId = 'Please select a doctor';
    if (!aTime) errs.time = 'Please select a time slot';
    
    if (!aDate) {
      errs.date = 'Please select a date';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(aDate);
      if (chosen < today) {
        errs.date = 'Cannot book an appointment in the past';
      }
    }

    const docIdNum = parseInt(aDoctorId);
    const doc = doctors.find(d => d.id === docIdNum);
    
    // Doctor availability check
    if (doc && aDate && !errs.date) {
      const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = new Date(aDate).getDay();
      const dayNameShort = weekdaysShort[dayIndex];
      
      if (!doc.slots.includes(dayNameShort)) {
        errs.date = `${doc.name} is not available on ${weekdaysFull[dayIndex]}`;
      }
    }

    // Double booking slot conflict check
    if (doc && aDate && aTime) {
      const conflict = appointments.find(a =>
        a.id !== (editAppt?.id ?? -1) &&
        a.doctorId === docIdNum &&
        a.date === aDate &&
        a.time === aTime &&
        a.status !== 'Cancelled'
      );
      if (conflict) {
        errs.time = `This slot is already booked for ${conflict.patientName}`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── SUBMIT HANDLERS ──
  const handleSavePatientSubmit = async () => {
    if (!validatePatient()) return;
    setSaving(true);
    try {
      const payload = {
        name: pName.trim(),
        age: parseInt(pAge),
        gender: pGender,
        blood: pBlood,
        phone: pPhone.trim(),
        email: pEmail.trim(),
        address: pAddress.trim(),
        condition: pCondition.trim() || 'General',
        status: pStatus,
      };
      await onSavePatient(payload, editPatient?.id ?? null);
      onClose();
    } catch {
      // Errors handled by parent toast triggers
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApptSubmit = async () => {
    if (!validateAppointment()) return;
    setSaving(true);
    try {
      const patient = patients.find(p => p.id === parseInt(aPatientId));
      const doctor = doctors.find(d => d.id === parseInt(aDoctorId));
      const payload = {
        patientId: parseInt(aPatientId),
        patientName: patient.name,
        doctorId: parseInt(aDoctorId),
        doctorName: doctor.name,
        date: aDate,
        time: aTime,
        type: aType,
        status: aStatus,
        notes: aNotes,
      };
      await onSaveAppt(payload, editAppt?.id ?? null);
      onClose();
    } catch {
      // Errors handled by parent toast triggers
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === parseInt(aDoctorId));

  const isPatientModal = modal === 'addPatient' || modal === 'editPatient';
  const isApptModal = modal === 'bookAppt' || modal === 'editAppt';

  return (
    <div className="modal-backdrop" id="modal-backdrop" onClick={(e) => { if (e.target.id === 'modal-backdrop') onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <span className="modal-title" id="modal-title">
            {isPatientModal 
              ? (editPatient ? 'Edit Patient' : 'Register New Patient')
              : (editAppt ? 'Edit Appointment' : 'Book Appointment')}
          </span>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-body">
          {isPatientModal && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-name">Full Name <span className="required">*</span></label>
                  <input
                    ref={firstInputRef}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    id="f-name"
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="Patient's full name"
                    autoComplete="off"
                  />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-age">Age <span className="required">*</span></label>
                  <input
                    className={`form-input ${errors.age ? 'error' : ''}`}
                    id="f-age"
                    type="number"
                    min="0"
                    max="130"
                    value={pAge}
                    onChange={(e) => setPAge(e.target.value)}
                    placeholder="Age in years"
                  />
                  {errors.age && <div className="field-error">{errors.age}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-gender">Gender</label>
                  <select className="form-select" id="f-gender" value={pGender} onChange={(e) => setPGender(e.target.value)}>
                    {GENDERS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-blood">Blood Group</label>
                  <select className="form-select" id="f-blood" value={pBlood} onChange={(e) => setPBlood(e.target.value)}>
                    {BLOOD_GROUPS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-phone">Phone <span className="required">*</span></label>
                  <input
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    id="f-phone"
                    type="tel"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="10-digit number"
                    maxLength="10"
                  />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-email">Email</label>
                  <input
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    id="f-email"
                    type="email"
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="f-address">Address</label>
                <input
                  className="form-input"
                  id="f-address"
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  placeholder="Street, City"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-condition">Condition / Diagnosis</label>
                  <input
                    className="form-input"
                    id="f-condition"
                    value={pCondition}
                    onChange={(e) => setPCondition(e.target.value)}
                    placeholder="e.g. Hypertension"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-status">Status</label>
                  <select className="form-select" id="f-status" value={pStatus} onChange={(e) => setPStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {isApptModal && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="a-patient">Patient <span className="required">*</span></label>
                <select 
                  ref={firstInputRef}
                  className={`form-select ${errors.patientId ? 'error' : ''}`} 
                  id="a-patient" 
                  value={aPatientId} 
                  onChange={(e) => setAPatientId(e.target.value)}
                >
                  <option value="">Select patient…</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{escapeHtml(p.name)}</option>
                  ))}
                </select>
                {errors.patientId && <div className="field-error">{errors.patientId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="a-doctor">Doctor <span className="required">*</span></label>
                <select 
                  className={`form-select ${errors.doctorId ? 'error' : ''}`} 
                  id="a-doctor" 
                  value={aDoctorId} 
                  onChange={(e) => setADoctorId(e.target.value)}
                >
                  <option value="">Select doctor…</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{escapeHtml(d.name)} — {escapeHtml(d.spec)}</option>
                  ))}
                </select>
                {errors.doctorId && <div className="field-error">{errors.doctorId}</div>}
              </div>

              {selectedDoctor && (
                <div id="doc-avail-hint" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '-6px 0 10px' }}>
                  Available: {selectedDoctor.slots.join(', ')}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="a-date">Date <span className="required">*</span></label>
                  <input
                    className={`form-input ${errors.date ? 'error' : ''}`}
                    id="a-date"
                    type="date"
                    min={todayISO()}
                    value={aDate}
                    onChange={(e) => setADate(e.target.value)}
                  />
                  {errors.date && <div className="field-error">{errors.date}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="a-time">Time <span className="required">*</span></label>
                  <select 
                    className={`form-select ${errors.time ? 'error' : ''}`} 
                    id="a-time" 
                    value={aTime} 
                    onChange={(e) => setATime(e.target.value)}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.time && <div className="field-error">{errors.time}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="a-type">Visit Type</label>
                  <select className="form-select" id="a-type" value={aType} onChange={(e) => setAType(e.target.value)}>
                    {VISIT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="a-status">Status</label>
                  <select className="form-select" id="a-status" value={aStatus} onChange={(e) => setAStatus(e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label" htmlFor="a-notes">Notes</label>
                <textarea
                  className="form-input"
                  id="a-notes"
                  placeholder="Any specific notes or symptoms…"
                  value={aNotes}
                  onChange={(e) => setANotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button 
            className={`btn btn-primary ${saving ? 'saving' : ''}`} 
            onClick={isPatientModal ? handleSavePatientSubmit : handleSaveApptSubmit}
            disabled={saving}
          >
            {isPatientModal 
              ? (editPatient ? 'Save Changes' : 'Register Patient')
              : (editAppt ? 'Save Changes' : 'Book Appointment')}
          </button>
        </div>
      </div>
    </div>
  );
}
