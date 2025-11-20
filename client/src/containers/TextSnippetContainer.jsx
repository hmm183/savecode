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

/**
 * Helper: remove a trailing extension from a string, e.g. "foo.txt" -> "foo" if ext === "txt"
 */
function stripTrailingExt(name, extNoDot) {
  if (!name || !extNoDot) return name;
  const lower = name.toLowerCase();
  const extLower = extNoDot.toLowerCase();
  // match .ext or .ext at end
  if (lower.endsWith("." + extLower)) {
    return name.slice(0, name.length - (extNoDot.length + 1));
  }
  return name;
}

/**
 * Normalizes extension string:
 * input: ".txt", "txt", " .TXT " -> returns ".txt" and "txt" (noDot)
 */
function normalizeExtension(raw) {
  let ext = raw ? String(raw).trim() : ".txt";
  if (!ext) ext = ".txt";
  if (!ext.startsWith(".")) ext = "." + ext;
  ext = "." + ext.replace(/^\.+/, "").replace(/\s+/g, "").toLowerCase();
  const noDot = ext.replace(/^\./, "") || "txt";
  return { ext, noDot };
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
      // Normalize extension into ".txt" and "txt"
      const { ext, noDot: extNoDot } = normalizeExtension(extension);

      // If the title already includes the extension (user pasted full filename), strip it first
      let safeTitle = String(title).trim();
      safeTitle = stripTrailingExt(safeTitle, extNoDot);

      // Create safe filename (replace whitespace, remove unsafe chars)
      const safeBase = safeTitle.replace(/\s+/g, "_").replace(/[^\w\-_.]/g, "");
      const filename = `${safeBase}${ext}`;

      // 1. Ask Cloudflare Worker for permission / signature
      const workerUrl = "https://savecode-gatekeeper.vrishankraina.workers.dev";
      const signRes = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload" }),
      });

      // Parse gatekeeper JSON regardless of status
      let signJson = null;
      try {
        signJson = await signRes.json();
      } catch (e) {
        throw new Error("Invalid response from signature endpoint.");
      }

      // Handle non-OK responses (ban/rate-limit)
      if (!signRes.ok) {
        const serverMsg = signJson?.error || "Server permission denied.";
        const banExpires = signJson?.banExpires;
        if (banExpires) {
          throw new Error(`${serverMsg} ${banExpires ? `Ban expires: ${banExpires}` : ""}`.trim());
        } else {
          throw new Error(serverMsg);
        }
      }

      // Extract signing data
      const {
        signature,
        timestamp,
        api_key,
        upload_preset,
        folder,
        public_id: requestedPublicId,
        resource_type: returnedResourceType,
        warning,
        remaining: remFromGatekeeper,
      } = signJson;

      // Update UI banner state from gatekeeper
      if (typeof remFromGatekeeper === "number") setRemaining(remFromGatekeeper);
      else if (typeof remFromGatekeeper === "string" && !isNaN(Number(remFromGatekeeper))) {
        setRemaining(Number(remFromGatekeeper));
      }
      if (warning && typeof warning === "string") setWarningMessage(warning);
      else setWarningMessage("");

      if (!signature || !timestamp || !api_key) {
        throw new Error("Incomplete signed data received from gatekeeper.");
      }

      // If gatekeeper returned a warning (this is the 5th upload), confirm with the user
      if (warning) {
        const remainingText =
          typeof remFromGatekeeper === "number" ? ` (${remFromGatekeeper} remaining after this)` : "";
        const confirmMsg =
          `${warning}\n${remainingText}\n\nThis is the last allowed upload in the 24-hour window. Do you want to continue?`;
        const proceed = window.confirm(confirmMsg);
        if (!proceed) {
          setUploading(false);
          return;
        }
      }

      // 2. Convert the text content into a File object
      const textBlob = new Blob([body], { type: 'text/plain' });
      const textFile = new File([textBlob], filename, { type: 'text/plain' });

      // 3. Upload to Cloudinary using the SIGNATURE (Safe Mode)
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");

      // prefer returned resource_type, otherwise raw for snippets
      const rtype = returnedResourceType || "raw";
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${rtype}/upload`;

      const formData = new FormData();
      formData.append("file", textFile);
      // Required signed fields
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      // Optional/returned fields
      if (upload_preset) formData.append("upload_preset", upload_preset);
      if (folder) formData.append("folder", folder);

      // If the gatekeeper provided a public_id, ensure it does NOT include an extension.
      // If it's empty, don't set public_id (let Cloudinary auto-generate).
      if (requestedPublicId) {
        // strip trailing extension if present
        const cleanedReqPid = stripTrailingExt(requestedPublicId, extNoDot);
        if (cleanedReqPid && cleanedReqPid.length > 0) {
          formData.append("public_id", cleanedReqPid);
        }
      }

      if (returnedResourceType) formData.append("resource_type", returnedResourceType);

      const res = await fetch(uploadUrl, { method: "POST", body: formData });

      // Parse Cloudinary response even on non-OK
      let cloudResp;
      try {
        cloudResp = await res.json();
      } catch (e) {
        throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`);
      }
      if (!res.ok) {
        throw new Error(cloudResp?.error?.message || "Upload to Cloudinary failed");
      }

      const data = cloudResp;

      // 4. Prepare metadata and save to Firestore
      const passwordHash = password ? await hashString(password) : "";

      // Build doc object (only include defined fields)
      const docToSave = {
        title: title,
        description: `Text snippet (${ext})`,
        filename: filename,
        passwordHash: passwordHash,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      };

      // secure_url
      if (data.secure_url) docToSave.url = data.secure_url;

      // public_id: prefer Cloudinary's returned public_id but strip extension if present (some setups include it)
      let returnedPid = data.public_id || "";
      if (returnedPid) {
        returnedPid = stripTrailingExt(returnedPid, extNoDot);
        if (returnedPid) docToSave.public_id = returnedPid;
      }

      // format: prefer Cloudinary response; fall back to extension-derived format
      if (data.format) docToSave.format = data.format;
      else docToSave.format = extNoDot;

      // resource_type: prefer Cloudinary response else rtype
      if (data.resource_type) docToSave.resource_type = data.resource_type;
      else docToSave.resource_type = rtype || "raw";

      // version if available
      if (data.version !== undefined && data.version !== null) docToSave.version = String(data.version);

      // ensure no undefined values are present
      // (we only add fields conditionally above, so docToSave is safe)

      await addDoc(collection(db, "files"), docToSave);

      // Update remaining after success
      if (typeof remFromGatekeeper === "number") {
        setRemaining(remFromGatekeeper);
      } else {
        setRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));
      }

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

  // Small inline banner styles (reuse lightweight styles)
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
