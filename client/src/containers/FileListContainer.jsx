// src/containers/FileListContainer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
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

  // Worker endpoint (gatekeeper) - make sure this matches your deployed worker
  const workerUrl = "https://savecode-gatekeeper.vrishankraina.workers.dev";

  const handleDownload = useCallback(async (file, enteredPassword = "") => {
    if (!file || !file.id) return false;
    setDownloading(file.id, true);

    try {
      // Request the Worker to stream the file (Worker will validate password and increment downloadCount)
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileId: file.id,
          enteredPassword: enteredPassword || ""
        }),
      });

      if (!res.ok) {
        // try to parse body
        let errJson = null;
        try { errJson = await res.json(); } catch (e) { /* ignore */ }
        const msg = (errJson && errJson.error) ? errJson.error : `Download failed (${res.status})`;
        // If incorrect password, return false so modal can stay open
        if (res.status === 401) {
          return false;
        }
        throw new Error(msg);
      }

      // Streamed binary response -> create blob and trigger download
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : (file.filename || "download");

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);

      return true;
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + (err.message || err));
      return false;
    } finally {
      setDownloading(file.id, false);
    }
  }, []);

  const handleView = useCallback(async (file, enteredPassword = "") => {
    if (!file || !file.id) return false;
    setDownloading(file.id, true);

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileId: file.id,
          enteredPassword: enteredPassword || ""
        }),
      });

      if (!res.ok) {
        let errJson = null;
        try { errJson = await res.json(); } catch (e) {}
        const msg = (errJson && errJson.error) ? errJson.error : `View failed (${res.status})`;
        if (res.status === 401) return false;
        throw new Error(msg);
      }

      // We received the response stream -> create object URL and open in new tab
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");

      // Don't increment client-side downloadCount — server has done so.
      return true;
    } catch (err) {
      console.error("View error:", err);
      alert("View failed: " + (err.message || err));
      return false;
    } finally {
      setDownloading(file.id, false);
    }
  }, []);

  const filteredFiles = files.filter((f) => {
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
        onView={handleView}
        isDownloading={(id) => downloadingSet.has(id)}
      />
    </div>
  );
}
