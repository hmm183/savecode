// src/components/FileUploadForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';

export default function FileUploadForm({ onSubmit, uploading }) {
  const { register, handleSubmit, reset } = useForm();

  const handleFormSubmit = (data) => {
    const file = data.file[0];
    onSubmit({ ...data, file });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="form-label" htmlFor="title">Title (Optional)</label>
        <input id="title" type="text" {...register('title')} className="form-input" placeholder="e.g., Q4 Financial Report" />
      </div>
      <div>
        <label className="form-label" htmlFor="description">Description (Optional)</label>
        <textarea id="description" {...register('description')} rows={3} className="form-textarea" placeholder="A brief description of the file." />
      </div>
      <div>
        <label className="form-label" htmlFor="password">Password (Optional)</label>
        <input id="password" type="password" {...register('password')} className="form-input" placeholder="Leave blank for no password" />
      </div>
      <div>
        <label className="form-label" htmlFor="file">File</label>
        <input id="file" type="file" {...register('file', { required: true })} className="form-input" />
      </div>
      <button type="submit" disabled={uploading} className="primary-button">
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
}