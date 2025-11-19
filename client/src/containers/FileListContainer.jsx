// src/containers/FileListContainer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import FileList from "../components/FileList";
import SearchBar from "../components/SearchBar";

const GATEKEEPER_URL = "https://savecode-gatekeeper.vrishankraina.workers.dev";

export default function FileListContainer() {
  const [files, setFiles] = useState([]);
  const [queryText, setQueryText] = useState("");
  // track loading state per file id: "downloading" or "viewing" (string) or undefined
  const [loadingById, setLoadingById] = useState({});

  useEffect(() => {
    const q = query(collection(db, "files"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFiles(arr);
    });
    return () => unsub();
  }, []);

  const setLoading = useCallback((fileId, action) => {
    // action: undefined/null -> clear, otherwise string like "download" or "view"
    setLoadingById(prev => {
      const copy = { ...prev };
      if (!action) delete copy[fileId];
      else copy[fileId] = action;
      return copy;
    });
  }, []);

  const isLoading = useCallback((fileId) => !!loadingById[fileId], [loadingById]);

  /**
   * Download handler:
   * - Calls Worker to get signed URL, then fetches the Cloudinary URL as blob and triggers download.
   * - Disables button and shows spinner while in progress.
   */
  const handleDownload = useCallback(async (file, enteredPassword = "") => {
    if (!file || !file.id) return false;
    if (isLoading(file.id)) return false; // ignore if already loading

    setLoading(file.id, "download");
    try {
      const res = await fetch(GATEKEEPER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileId: file.id,
          enteredPassword: enteredPassword || "",
        }),
      });

      let json;
      try { json = await res.json(); } catch { json = null; }

      if (!res.ok) {
        const msg = json?.error || `Download failed with status ${res.status}`;
        if (res.status === 401) return false; // password wrong -> keep modal open
        alert("Download failed: " + msg);
        return false;
      }

      const signedUrl = json?.url;
      if (!signedUrl) {
        alert("Download failed: Signed URL missing.");
        return false;
      }

      // fetch file bytes
      const blobRes = await fetch(signedUrl);
      if (!blobRes.ok) {
        alert("Download failed while fetching file from storage.");
        return false;
      }

      const blob = await blobRes.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.filename || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();

      return true;
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + (err.message || err));
      return false;
    } finally {
      setLoading(file.id, undefined);
    }
  }, [isLoading, setLoading]);

  /**
   * View handler:
   * - Calls Worker; opens signed URL in new tab.
   */
  const handleView = useCallback(async (file, enteredPassword = "") => {
    if (!file || !file.id) return false;
    if (isLoading(file.id)) return false;

    setLoading(file.id, "view");
    try {
      const res = await fetch(GATEKEEPER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileId: file.id,
          enteredPassword: enteredPassword || "",
        }),
      });

      let json;
      try { json = await res.json(); } catch { json = null; }

      if (!res.ok) {
        const msg = json?.error || `View failed with status ${res.status}`;
        if (res.status === 401) return false; // password wrong -> keep modal open
        alert("View failed: " + msg);
        return false;
      }

      const signedUrl = json?.url;
      if (!signedUrl) {
        alert("View failed: Signed URL missing.");
        return false;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
      return true;
    } catch (err) {
      console.error("View error:", err);
      alert("View failed: " + (err.message || err));
      return false;
    } finally {
      setLoading(file.id, undefined);
    }
  }, [isLoading, setLoading]);

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
        isLoading={(id) => loadingById[id] || null} // returns "download"|"view"|null
      />
    </div>
  );
}
