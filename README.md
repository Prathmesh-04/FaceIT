# 🚀 FaceIT

A web app that automatically groups images based on faces using AI.

---

## 🧠 Features

* Upload multiple images
* Automatically group similar faces
* Separate **unsorted** images
* Full-stack app (React + FastAPI)

---

## ⚙️ Tech Stack

* **Frontend:** React
* **Backend:** FastAPI
* **AI:** DeepFace + DBSCAN

---

## ▶️ Run Locally

### Backend

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

---

### Frontend

```
cd frontend
npm install
npm start
```

---

## 🌐 Usage

1. Open `http://localhost:3000`
2. Upload images
3. Click **Upload & Sort**
4. View grouped results

---
