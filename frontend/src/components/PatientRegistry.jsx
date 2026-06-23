import React, { useState } from 'react';
import { GENDERS, CONDITIONS, initials, formatDate, escapeHtml } from '../ApiService';

export default function PatientRegistry({ patients, user, onOpenModal, onDeletePatient, onExportPatients }) {
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gender, setGender] = useState('all');
  const [status, setStatus] = useState('all');
  const [condition, setCondition] = useState('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isRec = user?.role === 'receptionist';

  const canAdd = isAdmin || isRec;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  // Filter patients based on query and attributes
  const filtered = patients.filter(p => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCond = p.condition.toLowerCase().includes(q);
      const matchPhone = p.phone.includes(q);
      if (!matchName && !matchCond && !matchPhone) return false;
    }
    
    if (gender !== 'all' && p.gender !== gender) return false;
    if (status !== 'all' && p.status !== status) return false;
    if (condition !== 'all' && p.condition !== condition) return false;
    
    if (ageMin && p.age < parseInt(ageMin)) return false;
    if (ageMax && p.age > parseInt(ageMax)) return false;

    return true;
  });

  const handleClearFilters = () => {
    setGender('all');
    setStatus('all');
    setCondition('all');
    setAgeMin('');
    setAgeMax('');
  };

  const statusBadge = (s) => {
    const map = {
      Active: 'badge-green',
      Inactive: 'badge-amber',
    };
    return <span className={`badge ${map[s] || ''}`}>{escapeHtml(s)}</span>;
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="search-bar">
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4" />
              <path d="M10 10l2.5 2.5" />
            </svg>
          </span>
          <input
            className="form-input search-input"
            type="text"
            placeholder="Search by name, condition, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <button 
          className={`btn ${filtersOpen ? 'btn-primary' : ''}`} 
          onClick={() => setFiltersOpen(prev => !prev)}
        >
          &#x2699; Filters
        </button>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => onOpenModal('addPatient')}>
            + Add Patient
          </button>
        )}
        {isAdmin && (
          <button className="btn" onClick={onExportPatients} title="Export patients to CSV">
            &darr; CSV
          </button>
        )}
        <span className="result-count ml-auto">
          {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtersOpen && (
        <div className="filter-panel card">
          <div className="filter-row">
            <div className="form-group mb-0">
              <label className="form-label">Gender</label>
              <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="all">All Genders</option>
                {GENDERS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Condition</label>
              <select className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="all">All Conditions</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Age Range</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="130"
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  style={{ width: '72px' }}
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="130"
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  style={{ width: '72px' }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setFiltersOpen(false)}>Apply Filters</button>
            <button className="btn btn-sm" onClick={handleClearFilters}>Clear All</button>
          </div>
        </div>
      )}

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#x1F50D;</div>
            <div className="empty-title">{search ? 'No results found' : 'No patients yet'}</div>
            <div className="empty-desc">
              {search 
                ? `No patients match "${escapeHtml(search)}". Try a different search term.` 
                : 'Register your first patient to get started.'}
            </div>
            {!search && canAdd && (
              <div className="empty-action">
                <button className="btn btn-primary" onClick={() => onOpenModal('addPatient')}>
                  Register Patient
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
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Condition</th>
                  <th>Blood</th>
                  <th>Status</th>
                  {(canEdit || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '10px' }}>
                          {initials(p.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{escapeHtml(p.name)}</div>
                          <div className="text-xs text-muted">Joined {formatDate(p.joined)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.age} yrs / {escapeHtml(p.gender)}</td>
                    <td>
                      <div>{escapeHtml(p.phone)}</div>
                      <div className="text-xs text-muted">{escapeHtml(p.email || '—')}</div>
                    </td>
                    <td>
                      <span className="tag tag-teal">{escapeHtml(p.condition)}</span>
                    </td>
                    <td>
                      <span className="tag tag-red">{escapeHtml(p.blood)}</span>
                    </td>
                    <td>{statusBadge(p.status)}</td>
                    {(canEdit || canDelete) && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {canEdit && (
                            <button className="btn btn-sm" onClick={() => onOpenModal('editPatient', p.id)}>
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-sm btn-danger" onClick={() => onDeletePatient(p.id)}>
                              Delete
                            </button>
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
