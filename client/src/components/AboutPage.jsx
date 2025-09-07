// src/components/AboutPage.jsx
import React from 'react';

export default function AboutPage() {
  return (
    <div className="about-page">
      <h2>About SaveCode</h2>
      <p>
        Welcome to SaveCode, a modern, serverless file-sharing application designed for simplicity and security.
      </p>
      
      <h4>How It Works</h4>
      <p>
        Our platform leverages a powerful and secure serverless architecture:
      </p>
      <ul>
        <li><strong>File Storage:</strong> All files are uploaded directly and securely to Cloudinary, a robust, industry-leading media management service.</li>
        <li><strong>Metadata and Logic:</strong> File information (like title, description, and download counts) is stored in Google's Firebase Firestore, a highly scalable and real-time NoSQL database.</li>
        <li><strong>Password Protection:</strong> For sensitive files, you can add a password. This password is <strong>hashed in your browser</strong> using the SHA-256 algorithm before the hash is sent to our database. This means the raw password is never stored, providing an essential layer of security.</li>
      </ul>

      <h4>Our Philosophy</h4>
      <p>
        We believe in privacy and efficiency. By using a serverless approach, we minimize our infrastructure footprint and ensure that your files are handled by world-class, secure services. No login is required, making it fast and easy to share files with anyone.
      </p>
    </div>
  );
}