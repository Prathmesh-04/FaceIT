from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os
import uuid

from deepface import DeepFace
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import normalize

app = FastAPI()

# ✅ Allow React to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📂 Folder to store uploaded images
UPLOAD_DIR = "temp"

# ✅ Ensure directory exists BEFORE FastAPI uses it
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 📸 Serve images to frontend
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")


@app.post("/upload/")
async def upload(files: list[UploadFile] = File(...)):

    # 🔄 Clean previous uploads
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    image_paths = []
    embeddings = []

    # 🧾 Save uploaded files
    for file in files:
        unique_name = str(uuid.uuid4()) + "_" + file.filename
        path = os.path.join(UPLOAD_DIR, unique_name)

        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        image_paths.append(path)

    # 🧠 Extract embeddings
    for path in image_paths:
        try:
            result = DeepFace.represent(
                img_path=path,
                model_name="ArcFace",
                detector_backend="retinaface",
                enforce_detection=False
            )

            embeddings.append(result[0]["embedding"])

        except Exception as e:
            print(f"Error processing {path}: {e}")
            embeddings.append(np.zeros(512))  # fallback

    # ⚠️ Handle empty case
    if len(embeddings) == 0:
        return {"groups": {}}

    # 📊 Normalize + cluster
    X = normalize(np.array(embeddings))

    clustering = DBSCAN(eps=1.0, min_samples=2, metric="euclidean")
    labels = clustering.fit_predict(X)

    # 📁 Group images by person
    grouped = {}

    for i, label in enumerate(labels):
        
        if label == -1:
            key = "unsorted"
        else:
            key = f"person_{label}"

        key = str(label)

        if key not in grouped:
            grouped[key] = []

        # convert file path → URL
        url_path = image_paths[i].replace(UPLOAD_DIR, "/images")
        grouped[key].append(url_path)

    return {
        "groups": grouped,
        "labels": labels.tolist()
    }