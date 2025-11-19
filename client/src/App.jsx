// src/App.jsx
import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import FileUploadContainer from './containers/FileUploadContainer';
import TextSnippetContainer from './containers/TextSnippetContainer';
import FileListContainer from './containers/FileListContainer';
import AboutPage from './components/AboutPage.jsx';
import './App.css';

// (ThemeToggleButton component remains the same)
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function AppLayout() {
  const [page, setPage] = useState('home');

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          {/* ... svg ... */}
          <div>
            <h1>SaveCode</h1>
          </div>
        </div>
        <nav className="controls">
          <a href="#home" onClick={() => setPage('home')} className={page === 'home' ? 'active' : ''}>Home</a>
          <a href="#create" onClick={() => setPage('create')} className={page === 'create' ? 'active' : ''}>Create Snippet</a>
          <a href="#about" onClick={() => setPage('about')} className={page === 'about' ? 'active' : ''}>About</a>
          <ThemeToggleButton />
        </nav>
      </header>

      <main>
        {page === 'home' && (
          // ✅ CHANGE: Removed the "card-grid" div wrapper to stack the cards vertically
          <>
            <div className="card">
              <h2>Upload File</h2>
              <FileUploadContainer />
            </div>
            <div className="card">
              <h2>Available Files</h2>
              <FileListContainer />
            </div>
          </>
        )}

        {page === 'create' && (
          <div className="card">
            <h2>Create Snippet</h2>
            <TextSnippetContainer onSnippetCreated={() => setPage('home')} />
          </div>
        )}

        {page === 'about' && (
          <div className="card">
            <AboutPage />
          </div>
        )}
      </main>

      <footer className="footer">
        FUN FACT: Your Passwords are hashed locally before being stored for your security.<br />
        Built by <a href="https://github.com/Hmm183">Hmm183</a>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}