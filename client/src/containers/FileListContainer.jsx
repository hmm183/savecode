// src/containers/FileListContainer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseConfig";
import FileList from "../components/FileList";
import SearchBar from "../components/SearchBar";

// (Keep the hashString utility function as is)
async function hashString(message) {
  if (!message) return "";
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function FileListContainer() {
  const [files, setFiles] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [downloadingSet, setDownloadingSet] = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, "files"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFiles(arr);
    });
    return () => unsub();
  }, []);

  const setDownloading = (fileId, isOn) => {
    setDownloadingSet((prev) => {
      const copy = new Set(prev);
      if (isOn) copy.add(fileId);
      else copy.delete(fileId);
      return copy;
    });
  };

  const handleDownload = useCallback(async (file, enteredPassword = "") => {
    // ... (This function remains unchanged)
    if (!file || !file.id) return false;
    setDownloading(file.id, true);
    try {
      if (file.passwordHash) {
        const enteredHash = await hashString(enteredPassword);
        if (enteredHash !== file.passwordHash) return false;
      }
      
      const res = await fetch(file.url);
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.filename || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      await updateDoc(doc(db, "files", file.id), { downloadCount: increment(1) });
      return true;
    } catch (err) {
      console.error("Download error:", err);
      return false;
    } finally {
      setDownloading(file.id, false);
    }
  }, []);

  // ✅ NEW: Add a handler for the view action
  const handleView = useCallback(async (file, enteredPassword = "") => {
    if (!file || !file.id) return false;
    
    try {
      // Still need to verify password for protected files
      if (file.passwordHash) {
        const enteredHash = await hashString(enteredPassword);
        if (enteredHash !== file.passwordHash) {
          return false; // Wrong password
        }
      }
      
      // Open the file URL in a new tab
      window.open(file.url, '_blank', 'noopener,noreferrer');
      return true; // Signal success to the modal
    } catch (err) {
      console.error("View error:", err);
      return false; // Signal failure
    }
  }, []);

  const filteredFiles = files.filter((f) => {
    // ... (This function remains unchanged)
    if (!queryText) return true;
    const q = queryText.toLowerCase();
    return (f.title || "").toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <SearchBar value={queryText} onChange={setQueryText} />
      <FileList
        files={filteredFiles}
        onDownload={handleDownload}
        onView={handleView} // Pass the new handler down
        isDownloading={(id) => downloadingSet.has(id)}
      />
    </div>
  );
}