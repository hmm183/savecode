// src/components/FileList.jsx
import React from "react";
import FileItem from "./FileItem";

// Add onView to the destructured props
export default function FileList({ files, onDownload, onView, isDownloading }) { 
  if (!files || files.length === 0) {
    return <div className="small">No files found.</div>;
  }
  return (
    <div className="file-grid">
      {files.map((file) => (
        <FileItem 
          key={file.id} 
          file={file} 
          onDownload={onDownload} 
          onView={onView} // Pass onView down to each FileItem
          isDownloading={isDownloading} 
        />
      ))}
    </div>
  );
}