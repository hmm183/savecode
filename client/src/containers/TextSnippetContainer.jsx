// src/containers/TextSnippetContainer.jsx
import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import TextSnippetForm from "../components/TextSnippetForm";
import { db } from "../firebaseConfig.js";

// Utility: SHA-256 hashing (can be moved to a shared utils file later)
async function hashString(message) {
  if (!message) return "";
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function TextSnippetContainer({ onSnippetCreated }) {
  const [uploading, setUploading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");

  const handleSubmit = async ({ title, body, password, extension }) => {
    if (!title || !body) {
      alert("Please provide a title and body for the snippet.");
      return;
    }
    setUploading(true);

    try {
      let ext = extension ? String(extension).trim() : ".txt";
      if (!ext.startsWith(".")) ext = "." + ext;
      const safeTitle = title.trim().replace(/\s+/g, "_");
      const filename = `${safeTitle}${ext}`;

      const workerUrl = "https://savecode-gatekeeper.vrishankraina.workers.dev";
      const signRes = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload" }),
      });

      let signJson = null;
      try { signJson = await signRes.json(); } catch (e) { throw new Error("Invalid response from signature endpoint."); }
      if (!signRes.ok) {
        const serverMsg = signJson?.error || "Server permission denied.";
        const banExpires = signJson?.banExpires;
        if (banExpires) throw new Error(`${serverMsg} ${banExpires ? `Ban expires: ${banExpires}` : ""}`.trim());
        else throw new Error(serverMsg);
      }

      const { signature, timestamp, api_key, upload_preset, folder, public_id, resource_type, warning, remaining: remFromGatekeeper } = signJson;
      if (typeof remFromGatekeeper === "number") setRemaining(remFromGatekeeper);
      else if (typeof remFromGatekeeper === "string" && !isNaN(Number(remFromGatekeeper))) setRemaining(Number(remFromGatekeeper));
      if (warning) setWarningMessage(warning); else setWarningMessage("");
      if (!signature || !timestamp || !api_key) throw new Error("Incomplete signed data received from gatekeeper.");
      if (warning) {
        const remainingText = typeof remFromGatekeeper === "number" ? ` (${remFromGatekeeper} remaining after this)` : "";
        const confirmMsg = `${warning}\n${remainingText}\n\nThis is the last allowed upload in the 24-hour window. Do you want to continue?`;
        const proceed = window.confirm(confirmMsg);
        if (!proceed) { setUploading(false); return; }
      }

      // Create text file
      const textBlob = new Blob([body], { type: "text/plain" });
      const textFile = new File([textBlob], filename, { type: "text/plain" });

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");
      const rtype = resource_type || "auto";
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${rtype}/upload`;

      const formData = new FormData();
      formData.append("file", textFile);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      if (upload_preset) formData.append("upload_preset", upload_preset);
      if (folder) formData.append("folder", folder);
      if (public_id) formData.append("public_id", public_id);
      if (resource_type) formData.append("resource_type", resource_type);

      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      let cloudResp;
      try { cloudResp = await res.json(); } catch (e) { throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`); }
      if (!res.ok) throw new Error(cloudResp?.error?.message || "Upload to Cloudinary failed");
      const data = cloudResp;

      const passwordHash = password ? await hashString(password) : "";
      const doc = {
        title: title,
        description: `Text snippet (${ext})`,
        filename: filename,
        public_id: data.public_id,
        resource_type: data.resource_type || rtype,
        format: data.format,
        passwordHash: passwordHash,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "files"), doc);

      if (typeof remFromGatekeeper === "number") setRemaining(remFromGatekeeper);
      else setRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));

      setWarningMessage("");
      alert("Text snippet saved successfully!");
      if (onSnippetCreated) onSnippetCreated();
    } catch (err) {
      console.error(err);
      alert("Failed to save snippet: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  // Banner styles...
  const bannerStyle = {
    padding: "8px 12px",
    borderRadius: 6,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
  };
  const infoStyle = { background: "#eef6ff", color: "#055160", border: "1px solid #cfeefb" };
  const warnStyle = { background: "#fff4e6", color: "#663c00", border: "1px solid #ffddb3" };

  return (
    <div>
      {remaining !== null && (
        <div style={{ ...(warningMessage ? warnStyle : infoStyle), ...bannerStyle }}>
          <div>
            <strong>Uploads remaining:</strong> {remaining}
            {warningMessage ? <div style={{ marginTop: 6 }}><em>{warningMessage}</em></div> : null}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {remaining <= 0 ? (
              <span style={{ color: "#6b0b17" }}>Limit reached — next attempt will trigger ban.</span>
            ) : remaining === 1 ? (
              <span style={{ color: "#b66b00" }}>One upload left — use cautiously.</span>
            ) : (
              <span>{remaining} uploads available in the 24-hour window.</span>
            )}
          </div>
        </div>
      )}

      <TextSnippetForm onSubmit={handleSubmit} uploading={uploading} />
    </div>
  );
}
