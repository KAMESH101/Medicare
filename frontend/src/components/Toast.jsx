import React, { useEffect, useState } from 'react';

export default function Toast({ id, message, type, onDismiss }) {
  const [leaving, setLeaving] = useState(false);
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  useEffect(() => {
    const duration = type === 'error' ? 4500 : 3500;
    
    // Start leaving animation slightly before actual removal
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
    }, duration - 300);

    const dismissTimer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
  }, [id, type, onDismiss]);

  const handleManualDismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 280);
  };

  return (
    <div className={`toast toast-${type} ${leaving ? 'leaving' : ''}`}>
      <span className="toast-icon">{icons[type] || icons.success}</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={handleManualDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
