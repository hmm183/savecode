// src/components/FileUploadForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';

export default function FileUploadForm({ onSubmit, uploading }) {
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } // Destructure errors for validation messages
  } = useForm();

  const handleFormSubmit = (data) => {
    const file = data.file[0];
    onSubmit({ ...data, file });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="form-label" htmlFor="title">Title</label> {/* ⬅️ Removed "(Optional)" */}
        <input 
          id="title" 
          type="text" 
          {...register('title', { 
            required: "Title is required." // ⬅️ NEW: Title is now mandatory
          })} 
          className="form-input" 
          placeholder="e.g., Q4 Financial Report" 
        />
        {/* ⬅️ NEW: Show error if title is missing */}
        {errors.title && <p className="modal-error">{errors.title.message}</p>}
      </div>

      <div>
        <label className="form-label" htmlFor="description">
          Description (Optional) (Max 100 chars)
        </label>
        <textarea 
          id="description" 
          {...register('description', { 
            maxLength: { 
              value: 100, 
              message: "Description must be 100 characters or less."
            } 
          })} 
          rows={3} 
          className="form-textarea" 
          placeholder="A brief description of the file." 
        />
        {errors.description && <p className="modal-error">{errors.description.message}</p>}
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