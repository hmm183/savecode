// src/components/FileItem.jsx
import React, { useState } from "react";
import PasswordModal from "./PasswordModal.jsx";

export default function FileItem({ file, onDownload, onView, isDownloading }) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [actionType, setActionType] = useState(null);

  const handleActionClick = (type) => {
    setActionType(type);
    if (file.passwordHash) {
      setShowModal(true);
    } else {
      if (type === 'view') {
        onView(file);
      } else {
        onDownload(file);
      }
    }
  };

  const handlePasswordVerify = async (enteredPassword) => {
    setError('');
    const actionToPerform = actionType === 'view' ? onView : onDownload;
    const success = await actionToPerform(file, enteredPassword);
    
    if (success) {
      setShowModal(false);
      setActionType(null);
    } else {
      setError("Incorrect password. Please try again.");
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setActionType(null);
  };

  const downloading = isDownloading(file.id);

  return (
    <div className="file-item">
      <div className="file-item-info">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> {/* Style to align icon */}
          {file.title}
          {file.passwordHash && ( // ✅ NEW: Conditionally render lock icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </h3>
        <p className="small">{file.description}</p>
        <small>Downloads: {file.downloadCount || 0}</small>
      </div>
      <div className="file-item-actions">
        <button
          onClick={() => handleActionClick('view')}
          disabled={downloading}
          className="secondary-button"
        >
          View
        </button>
        <button
          onClick={() => handleActionClick('download')}
          disabled={downloading}
          className="download-button"
        >
          {downloading ? '...' : 'Download'}
        </button>
      </div>
      {showModal && (
        <PasswordModal
          onClose={handleCloseModal}
          onVerify={handlePasswordVerify}
          error={error}
        />
      )}
    </div>
  );
}