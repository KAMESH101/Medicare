import React, { useState, useEffect, useRef } from 'react';
import { MAX_LOGIN_ATTEMPTS, escapeHtml } from '../ApiService';

export default function Login({ onLogin, errorMsg, loginAttempts }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errKey, setErrKey] = useState(0);

  const userRef = useRef(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // Update key to replay shake animation on new errors
  useEffect(() => {
    if (errorMsg) {
      setErrKey(prev => prev + 1);
    }
  }, [errorMsg, loginAttempts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) return;
    onLogin(username, password);
  };

  const locked = loginAttempts >= MAX_LOGIN_ATTEMPTS;

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div className="logo-cross" style={{ width: '36px', height: '36px', fontSize: '19px' }}>&#x271A;</div>
          <div className="login-logo">MediCare+</div>
        </div>
        <div className="login-sub">Patient Management System &mdash; Secure Portal</div>

        {errorMsg && (
          <div key={errKey} className="login-err" role="alert">
            {escapeHtml(errorMsg)}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="l-user">Username</label>
          <input
            ref={userRef}
            className="form-input"
            id="l-user"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={locked}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="l-pass">Password</label>
          <div className="password-wrap">
            <input
              className="form-input"
              id="l-pass"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={locked}
              required
            />
            <button
              className="password-toggle"
              id="pass-toggle"
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label="Toggle password visibility"
            >
              &#x1F441;
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.25rem' }}
          id="login-btn"
          type="submit"
          disabled={locked}
        >
          {locked ? '\uD83D\uDD12 Account Locked' : 'Sign In \u2192'}
        </button>

        {loginAttempts > 0 && !locked && (
          <p className="login-attempts">
            {MAX_LOGIN_ATTEMPTS - loginAttempts} attempt{MAX_LOGIN_ATTEMPTS - loginAttempts !== 1 ? 's' : ''} remaining
          </p>
        )}

        <div className="login-hint">
          <div className="login-hint-title">Demo Credentials</div>
          <div className="login-cred-grid">
            <div className="login-cred-row">
              <span className="role-badge role-badge-admin">Admin</span>
              <code>admin</code> / <code>admin123</code>
            </div>
            <div className="login-cred-row">
              <span className="role-badge role-badge-doctor">Doctor</span>
              <code>dr.anitha</code> / <code>doc123</code>
            </div>
            <div className="login-cred-row">
              <span className="role-badge role-badge-receptionist">Receptionist</span>
              <code>riya</code> / <code>rec123</code>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
