/* ==============================================================
   Admin Documents page — two-panel layout: an interactive folder
   upload zone on the left, and a searchable library list on the
   right. Admins only.
   ============================================================== */
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import Folder from "../components/Folder.jsx";
import "./Admin.css";

/* ---------- helpers: human-readable file size, formatted upload date,
   and extracting a file extension to display on the folder papers ---------- */
function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileExt(name = "") {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "file";
}

export default function AdminDocuments() {
  /* ---------- documents list + filter state + drag/upload flags ---------- */
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const fileInput = useRef(null);

  /* ---------- fetch the document list from the server ---------- */
  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await api.listDocuments();
      setDocs(rows || []);
    } catch (err) {
      setError(err.message || "Could not load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  /* ---------- upload handler — sequential upload + optimistic insertion ---------- */
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const stored = await api.uploadDocument(file);
        setDocs((rows) => [stored, ...rows]);
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  /* ---------- drop-zone ---------- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.removeDocument(id);
      setDocs((rows) => rows.filter((d) => d.document_id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------- search + sort applied to the raw document list ---------- */
  const sorted = useMemo(() => {
    let rows = docs;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((d) => (d.filename || "").toLowerCase().includes(q));
    }
    rows = [...rows];

    return rows;
  }, [docs, search, sort]);

  return (
    <div className="stack fill-page documents-page">
      {error && <div className="error-banner">{error}</div>}

      <div className="documents-grid">
        {/* ============ LEFT PANE — interactive folder drop-zone ============
           Hovering opens the folder, dragging files in opens it AND highlights
           the dropzone. Clicking "Choose files" opens the native file picker. */}
        <section className="glass upload-pane">
          <div className="pane-head">
            <span className="pane-title">Upload</span>
            <span className="badge mute">{docs.length} files</span>
          </div>

          <div
            className={`dropzone-folder ${dragging ? "dragging" : ""}`}
            onMouseEnter={() => setFolderOpen(true)}
            onMouseLeave={() => setFolderOpen(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
              setFolderOpen(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="dropzone-folder-wrap">
              <Folder
                color="#c41230"
                size={1.3}
                open={folderOpen}
                items={docs.slice(0, 3).map((d) => (
                  <div className="folder-paper" key={d.document_id}>
                    <span className="ext">{fileExt(d.filename)}</span>
                    <span className="name" title={d.filename}>
                      {d.filename}
                    </span>
                  </div>
                ))}
              />
            </div>

            <div className="dropzone-copy">
              <div className="title">Drop files to upload</div>
              <div className="sub">PDF or DOCX only — drag or click</div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Choose files"}
              </button>
            </div>
          </div>

          {uploading && (
            <div className="upload-bar">Uploading and indexing…</div>
          )}
        </section>

        {/* ============ RIGHT PANE — searchable + sortable document library ============ */}
        <section className="glass list-card library-pane">
          <div className="toolbar">
            <div className="search">
              <span className="icn">⌕</span>
              <input
                type="search"
                placeholder="Search by file name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-ghost btn-sm" onClick={refresh}>
              Refresh
            </button>
          </div>

          <div className="list-scroll">
            {loading ? (
              <>
                <div className="skeleton" style={{ height: 56 }} />
                <div className="skeleton" style={{ height: 56 }} />
                <div className="skeleton" style={{ height: 56 }} />
              </>
            ) : sorted.length === 0 ? (
              <div className="empty empty-docs">
                <div className="empty-title">No documents yet</div>
                <div className="empty-sub">
                  Drop your first file in the upload panel on the left to get
                  started.
                </div>
              </div>
            ) : (
              sorted.map((d) => (
                <div key={d.document_id} className="doc-row">
                  <div className="name">
                    <div className="filename" title={d.filename}>
                      📄 {d.filename}
                    </div>
                    <div className="size">{formatSize(d.size)}</div>
                  </div>
                  <span className="stamp">{formatStamp(d.uploaded_at)}</span>
                  <span
                    className={`badge ${d.status === "ready" ? "success" : "warn"}`}
                  >
                    {d.status || "ready"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
