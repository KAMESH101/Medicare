import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, message, confirmText, icon, danger, onAnswer }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    // Focus confirmation button automatically on mount for accessibility
    confirmBtnRef.current?.focus();
    
    // Support Escape key to dismiss
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onAnswer(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnswer]);

  return (
    <div className="confirm-overlay" onClick={(e) => { if (e.target.classList.contains('confirm-overlay')) onAnswer(false); }}>
      <div className="confirm-dialog" role="dialog" aria-modal="true">
        <div className="confirm-icon">{icon || '⚠️'}</div>
        <h3 className="confirm-title">{title || 'Are you sure?'}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn" onClick={() => onAnswer(false)}>Cancel</button>
          <button 
            ref={confirmBtnRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={() => onAnswer(true)}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
