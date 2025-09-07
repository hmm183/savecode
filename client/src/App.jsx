// src/App.jsx
import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import FileUploadContainer from './containers/FileUploadContainer';
import FileListContainer from './containers/FileListContainer';
import AboutPage from './components/AboutPage.jsx';
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
  const [page, setPage] = useState('home'); // ✅ NEW: State for page navigation

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="var(--brand-color)" />
            <path d="M12 5 L12 19 M5 12 L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div>
            <h1>SaveCode</h1>
          </div>
        </div>
        <nav className="controls">
           {/* ✅ NEW: Navigation links */}
          <a href="#home" onClick={() => setPage('home')} className={page === 'home' ? 'active' : ''}>Home</a>
          <a href="#about" onClick={() => setPage('about')} className={page === 'about' ? 'active' : ''}>About</a>
          <ThemeToggleButton />
        </nav>
      </header>

      <main>
        {/* ✅ NEW: Conditional rendering for pages */}
        {page === 'home' ? (
          <>
            <div className="card">
              <FileUploadContainer />
            </div>
            <div className="card">
              <FileListContainer />
            </div>
          </>
        ) : (
          <div className="card">
            <AboutPage />
          </div>
        )}
      </main>

      <footer className="footer">
        Tip: Passwords are hashed locally before being stored for your security.
      </footer>
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