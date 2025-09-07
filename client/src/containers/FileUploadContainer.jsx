// src/containers/FileUploadContainer.jsx
import React, { useState } from "react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import FileUploadForm from "../components/FileUploadForm";
import { db } from "../firebaseConfig.js";

// Utility: SHA-256 hashing
async function hashString(message) {
  if (!message) return "";
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function FileUploadContainer() {
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async ({ title, description, file, password }) => {
    if (!file) {
        alert("Please select a file to upload.");
        return;
    }
    setUploading(true);
    try {
      // 1) Upload file to Cloudinary
      // ✅ FIX: Use import.meta.env for Vite environment variables
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) throw new Error("Cloudinary configuration is missing in .env file.");

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload to Cloudinary failed");
      const data = await res.json();

      // 2) Prepare metadata and save to Firestore
      const passwordHash = password ? await hashString(password) : "";
      const doc = {
        title: title || file.name,
        description: description || "",
        filename: data.original_filename || file.name,
        url: data.secure_url,
        passwordHash: passwordHash,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "files"), doc);
      alert("File uploaded and published!");
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return <FileUploadForm onSubmit={handleSubmit} uploading={uploading} />;
}