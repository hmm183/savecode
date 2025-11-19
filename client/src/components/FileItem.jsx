// src/components/FileItem.jsx
import React, { useState } from "react";
import PasswordModal from "./PasswordModal.jsx";

// Utility function to truncate description
const truncateDescription = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

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
  const truncatedDescription = truncateDescription(file.description);

  return (
    <div className="file-item" style={{ maxWidth: "100%", overflow: "hidden" }}> {/* Ensure container doesn't overflow */}
      <div className="file-item-info">
        <h3 style={{ 
            display: 'flex', 
            alignItems: 'flex-start', // Align to top so icon doesn't float weirdly on multi-line
            gap: '0.5rem',
            width: '100%',          // Force it to respect parent width
            wordBreak: 'break-word', // 🔥 CRITICAL: Breaks long words/titles to next line
            overflowWrap: 'anywhere', // 🔥 CRITICAL: Ensures wrapping on mobile
            whiteSpace: 'normal',     // Force wrapping
            lineHeight: '1.4',        // Readability for 2 lines
        }}> 
          <span style={{ flex: 1 }}>{file.title}</span> {/* Allow text to take up available space */}
          
          {file.passwordHash && ( 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '4px' }}>
              <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </h3>
        
        <p className="small" style={{ wordBreak: 'break-word' }}>{truncatedDescription}</p>
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