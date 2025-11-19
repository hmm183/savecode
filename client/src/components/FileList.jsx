// src/components/FileList.jsx
import React from "react";

export default function FileList({ files = [], onDownload, onView, isLoading }) {
  if (!files || files.length === 0) {
    return <div style={styles.emptyState}>No files found.</div>;
  }

  return (
    <>
      <style>{`
        /* Mobile First: 1 column by default */
        .file-grid-responsive {
          display: grid;
          gap: 12px;
          margin-top: 12px;
          grid-template-columns: 1fr; 
        }

        /* Tablet & Desktop (min-width: 600px): STRICTLY 2 columns */
        @media (min-width: 600px) {
          .file-grid-responsive {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Hides filename on small mobile screens (< 500px) */
        @media (max-width: 500px) {
          .file-meta-responsive { display: none !important; }
        }
        
        /* Micro-adjustments for tiny 320px screens */
        @media (max-width: 350px) {
          .file-action-btn { padding: 8px 4px !important; font-size: 12px !important; }
        }
      `}</style>

      {/* Note: We removed style={styles.grid} and used className instead for the columns */}
      <div className="file-grid-responsive">
        {files.map((f) => {
          const loading = isLoading ? isLoading(f.id) : null;
          const isDownloading = loading === "download";
          const isViewing = loading === "view";

          return (
            <div key={f.id} style={styles.card}>
              <div style={styles.cardContent}>
                <div style={styles.header}>
                  <div style={styles.title}>{f.title || f.filename || "Untitled"}</div>
                  
                  {/* Disappears on mobile */}
                  <div className="file-meta-responsive" style={styles.meta}>
                    {f.filename || ""}
                  </div>
                </div>

                <div style={styles.desc}>
                  {f.description || <span style={{ opacity: 0.5, fontStyle: "italic" }}>No description</span>}
                </div>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => onView && onView(f)}
                  disabled={!!loading}
                  className="file-action-btn"
                  style={{
                    ...styles.button,
                    ...(isViewing ? styles.buttonLoading : {}),
                  }}
                  title="View file"
                >
                  {isViewing ? <SpinnerInline /> : "View"}
                </button>

                <button
                  onClick={() => onDownload && onDownload(f)}
                  disabled={!!loading}
                  className="file-action-btn"
                  style={{
                    ...styles.button,
                    ...(isDownloading ? styles.buttonLoading : {}),
                  }}
                  title="Download file"
                >
                  {isDownloading ? <SpinnerInline /> : "Download"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SpinnerInline() {
  return (
    <svg width="16" height="16" viewBox="0 0 50 50" style={styles.spinner} aria-hidden="true">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path fill="currentColor" d="M25 5A20 20 0 1 0 45 25" opacity="0.25" />
      <path fill="currentColor" d="M45 25a20 20 0 0 0-4.5-12.5" />
    </svg>
  );
}

const styles = {
  // REMOVED: styles.grid (replaced by CSS class .file-grid-responsive above)
  emptyState: {
    padding: "20px",
    textAlign: "center",
    color: "var(--text-secondary)",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "12px",
    borderRadius: "8px",
    background: "var(--card-bg)", 
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 1px 2px var(--card-shadow)",
    overflow: "hidden",
    minWidth: 0, // CSS Grid fix to prevent content blowout
  },
  cardContent: {
    marginBottom: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "6px",
    overflow: "hidden",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    wordBreak: "break-word",
    lineHeight: "1.3",
    flex: 1,
  },
  meta: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "40%",
    flexShrink: 0,
    opacity: 0.8,
  },
  desc: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "auto",
    flexWrap: "wrap",
  },
  button: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "var(--button-bg)",
    color: "var(--button-text)",
    minWidth: "80px",
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: "default",
    color: "var(--button-loading-text)",
  },
  spinner: {
    verticalAlign: "middle",
    animation: "spin 1s linear infinite",
  },
};