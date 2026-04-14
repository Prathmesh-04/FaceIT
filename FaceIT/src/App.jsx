import React, { useState } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);

      const res = await axios.post(
        "http://127.0.0.1:8000/upload/",
        formData
      );

      setGroups(res.data.groups);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Face Sorting AI</h1>

      <input
        type="file"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Upload & Sort
      </button>

      {loading && <p>Processing...</p>}

      {/* 🔥 SHOW GROUPED IMAGES */}
      {groups &&
        Object.keys(groups).map((person) => (
          <div key={person} style={{ marginTop: "20px" }}>
            <h2>
              {person === "unsorted" || person === "-1"
                ? "Unsorted"
                : `Person ${person.replace("person_", "")}`}
            </h2>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              {groups[person].map((img, i) => (
                <img
                  key={i}
                  src={`http://127.0.0.1:8000${img}`}
                  alt=""
                  width="150"
                  style={{ borderRadius: "10px" }}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export default App;