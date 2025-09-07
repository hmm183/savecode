// src/components/PasswordModal.jsx
import React, { useState } from 'react';

export default function PasswordModal({ onClose, onVerify, error }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(password);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Password Required</h2>
        <p className="small">This file is protected. Please enter the password to download.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            autoFocus
          />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="secondary-btn">Cancel</button>
            <button type="submit" className="primary-button">Verify</button>
          </div>
        </form>
      </div>
    </div>
  );
}