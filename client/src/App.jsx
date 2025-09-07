// src/App.jsx
import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import FileUploadContainer from './containers/FileUploadContainer';
import FileListContainer from './containers/FileListContainer';
import './App.css';

// ThemeToggleButton Component
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

// Main App Layout
function AppLayout() {
  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="var(--brand-color)" />
            <path d="M7 8h10v8H7z" fill="white" />
          </svg>
          <div>
            <h1>SAVECODE</h1>
            <div className="small">Public file sharing — serverless</div>
          </div>
        </div>
        <div className="controls">
          <ThemeToggleButton />
        </div>
      </div>

      <div className="card">
        <FileUploadContainer />
      </div>

      <div className="card">
        <FileListContainer />
      </div>

      <div className="footer">
        Tip: Passwords are hashed locally before being stored.
      </div>
    </div>
  );
}

// App Wrapper with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}