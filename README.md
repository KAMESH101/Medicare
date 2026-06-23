# 🏥 MediCare+ — Patient Management System (MERN Stack)

**A production-quality, full-stack healthcare management application built with the MERN stack (MongoDB, Express, React, Node.js). Features role-based access control, real-time analytics, dynamic appointment scheduling, and a smart offline fallback mode.**

---

## 🔗 Live Deployment

> **Frontend is live and fully functional:**
> ## 👉 [https://medicare-gamma-mauve.vercel.app/](https://medicare-gamma-mauve.vercel.app/)
>
> *The frontend includes a **smart fallback mode** — if the backend API is unreachable, it automatically switches to localStorage mode so the app never breaks, allowing it to function as a standalone demo.*

---

## 📖 Overview

**MediCare+** is a comprehensive patient management system designed for medical facilities. It delivers an operational workspace for managing patients, scheduling appointments, viewing doctor profiles, and analyzing clinic performance.

The project is split into two parts:

- **Frontend** — React + Vite SPA using vanilla CSS and Chart.js for data visualization.
- **Backend** — Node.js + Express REST API with MongoDB (Mongoose ODM), JWT authentication, bcryptjs password hashing, and role-based access control (RBAC).

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)

MediCare+ enforces role-based access control on both the frontend (navigation, UI actions) and the backend (route-level middleware).

| Capability | 🛡️ Admin | 🩺 Doctor | 🗂️ Receptionist |
|---|:---:|:---:|:---:|
| **Dashboard & Analytics** | ✅ | ❌ | ❌ |
| **Doctor Directory** | ✅ | ❌ | ❌ |
| **Interactive Calendar** | ✅ | ❌ | ❌ |
| **View All Patients** | ✅ | ✅ (read-only) | ✅ |
| **Register Patient** | ✅ | ❌ | ✅ |
| **Edit Patient** | ✅ | ❌ | ❌ |
| **Delete Patient** | ✅ | ❌ | ❌ |
| **View All Appointments** | ✅ | Own only | ✅ |
| **Book Appointment** | ✅ | ❌ | ✅ |
| **Edit / Cancel Appointment** | ✅ | ❌ | ❌ |
| **Export CSV** | ✅ | ❌ | ❌ |
| **KPI Analytics** | ✅ | ❌ | ❌ |

#### 🔑 Seeded Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Doctor** | `dr.anitha` | `doc123` |
| **Doctor** | `dr.suresh` | `doc456` |
| **Receptionist** | `riya` | `rec123` |

---

### 🔒 Security

- **JWT Auth** — Login returns a signed JWT token sent in subsequent request headers.
- **bcryptjs Hashing** — Passwords are encrypted using salted bcrypt hashing.
- **Token Expiry** — Access tokens expire after 8 hours (configurable).
- **Brute-Force Lockout** — Accounts temporarily lock after 5 failed login attempts.

---

### 🌐 Smart Fallback (Offline Mode)

On startup, the frontend pings `GET /health` on the backend.
- If the backend responds, the app operates in **API mode** (persisting directly to MongoDB).
- If the backend is offline, the app switches to **LOCAL_MODE** (storing everything in `localStorage`).
- Zero disruption to the user experience.

---

## 🛠️ Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Set Up the Database (MongoDB)

You can use **MongoDB Atlas** (Free Cloud DB) or a **local MongoDB** instance:

- **Option A: MongoDB Atlas (Recommended)**
  1. Register at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Create a free M0 cluster.
  3. Get your connection string under **Connect** → **Drivers**.
  4. Create/edit `backend/.env` and paste your connection string:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/medicare
     ```

- **Option B: Local MongoDB**
  1. Download and run [MongoDB Community Server](https://www.mongodb.com/try/download/community).
  2. The default `MONGO_URI` in `backend/.env` is set to:
     ```env
     MONGO_URI=mongodb://127.0.0.1:27017/medicare
     ```

### 2. Start the Backend API

```bash
cd backend
npm install
npm start
```
The server will start on [http://localhost:8000](http://localhost:8000). On the first launch, it will automatically seed the database with demo users, patients, and appointments.

### 3. Start the Frontend App

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Structure

```text
Medicare/
├── backend/
│   ├── models/        # Mongoose database schemas (User, Patient, Appointment)
│   ├── routes/        # Express REST API routes (auth, patients, appointments)
│   ├── middleware/    # Auth and RBAC middleware
│   ├── db.js          # MongoDB connection & data seeder
│   ├── server.js      # Express server entry point
│   └── .env           # DB and JWT secrets config
└── frontend/
    ├── src/
    │   ├── components/# Sidebar, Dashboard, Calendar, PatientRegistry, etc.
    │   ├── ApiService.js  # Service layer handling HTTP & LocalStorage fallback
    │   ├── App.jsx    # Application shell & state coordinator
    │   └── index.css  # Dark & light theme stylesheets
    ├── vite.config.js
    └── index.html
```

---

## 🚀 Deployment

### Frontend (Vercel)
The root `vercel.json` coordinates building only the React frontend when deploying to Vercel:
```json
{
  "buildCommand": "npm --prefix frontend install && npm --prefix frontend run build",
  "outputDirectory": "frontend/dist"
}
```
If you push this project to a connected GitHub repo, Vercel will build and deploy the React app.

### Backend (Express)
The backend can be hosted on platforms like **Render**, **Railway**, or **Heroku** by connecting the `backend/` folder and setting up the environment variables. Once deployed, update the `API_BASE_URL` in `frontend/src/ApiService.js` to point to the live server URL.
