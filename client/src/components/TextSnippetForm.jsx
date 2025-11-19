// src/components/TextSnippetForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';

export default function TextSnippetForm({ onSubmit, uploading }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      extension: '.txt' // Default to .txt
    }
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
          <label className="form-label" htmlFor="title">Title</label>
          <input id="title" type="text" {...register('title', { required: true })} className="form-input" placeholder="MySnippet" />
        </div>
        <div>
          <label className="form-label" htmlFor="extension">Extension</label>
          <select id="extension" {...register('extension')} className="form-input">
            <option value=".txt">.txt</option>
            <option value=".js">.js</option>
            <option value=".java">.java</option>
            <option value=".py">.py</option>
            <option value=".css">.css</option>
            <option value=".html">.html</option>
            <option value=".csv">.csv</option>
            <option value=".md">.md</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="form-label" htmlFor="body">Body</label>
        <textarea id="body" {...register('body', { required: true })} rows={10} className="form-textarea snippet-body" placeholder="Paste your text or code here..." />
      </div>

      <div>
        <label className="form-label" htmlFor="password">Password (Optional)</label>
        <input id="password" type="password" {...register('password')} className="form-input" placeholder="Leave blank for no password" />
      </div>

      <button type="submit" disabled={uploading} className="primary-button">
        {uploading ? 'Saving...' : 'Save Snippet'}
      </button>
    </form>
  );
}