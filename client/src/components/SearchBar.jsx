// src/components/SearchBar.jsx
import React from 'react';

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="form-input"
        placeholder={placeholder || 'Search by title or description...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}