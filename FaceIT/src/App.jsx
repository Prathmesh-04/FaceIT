import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState({});
  const [personCount, setPersonCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasResults = Object.keys(groups).length > 0;

  const selectedPreviews = useMemo(
    () => files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      selectedPreviews.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [selectedPreviews]);

  const groupedEntries = useMemo(() => {
    const entries = Object.entries(groups);

    return entries.sort(([a], [b]) => {
      if (a === "unsorted") return 1;
      if (b === "unsorted") return -1;

      const aNum = Number(a.replace("person_", ""));
      const bNum = Number(b.replace("person_", ""));

      if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
        return a.localeCompare(b);
      }

      return aNum - bNum;
    });
  }, [groups]);

  const onChooseFiles = (fileList) => {
    const nextFiles = Array.from(fileList || []).filter(
      (file) => file.type.startsWith("image/")
    );

    setFiles(nextFiles);
    setError("");
  };

  const onDrop = (event) => {
    event.preventDefault();
    onChooseFiles(event.dataTransfer.files);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE}${path}`;
  };

  const handleUpload = async () => {
    if (files.length === 0 || loading) return;

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API_BASE}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setGroups(res.data.groups || {});
      setPersonCount(res.data.person_count || 0);
      setTotalImages(res.data.total_images || 0);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setGroups({});
    setPersonCount(0);
    setTotalImages(0);
    setError("");
  };

  return (
    <div className="page-shell">
      <div className="ambient-layer" />
      <main className="app-card">
        <section className="top-bar">
          <h1>Face Sorter</h1>
          <p>Drop photos, run clustering, and inspect grouped faces instantly.</p>
        </section>

        <section
          className="drop-zone"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <div className="drop-content">
            <p className="drop-title">Drag & drop images here</p>
            <p className="drop-subtitle">or choose files manually</p>
            <label className="file-picker" htmlFor="imageInput">
              Choose Images
            </label>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onChooseFiles(e.target.files)}
            />
          </div>
        </section>

        <section className="action-row">
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={files.length === 0 || loading}
          >
            {loading ? "Processing..." : "Upload & Sort"}
          </button>
          <button className="btn btn-ghost" onClick={clearAll} disabled={loading}>
            Clear
          </button>
        </section>

        {error && <p className="status error">{error}</p>}

        {files.length > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h2>Selected ({files.length})</h2>
            </div>
            <div className="preview-grid">
              {selectedPreviews.map(({ file, previewUrl }) => (
                <article key={`${file.name}-${file.size}`} className="thumb-card">
                  <img src={previewUrl} alt={file.name} />
                  <p title={file.name}>{file.name}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {hasResults && (
          <section className="panel">
            <div className="panel-header">
              <h2>Results</h2>
              <div className="stats">
                <span>{personCount} people</span>
                <span>{totalImages} images</span>
              </div>
            </div>

            {groupedEntries.map(([person, images]) => (
              <section key={person} className="group-block">
                <h3>
                  {person === "unsorted"
                    ? "Unsorted"
                    : `Person ${person.replace("person_", "")}`}
                  <small>{images.length} items</small>
                </h3>

                <div className="result-grid">
                  {images.map((img, index) => (
                    <article key={`${person}-${index}`} className="result-card">
                      <img
                        src={resolveImageUrl(img)}
                        alt={`${person}-${index + 1}`}
                        loading="lazy"
                      />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;