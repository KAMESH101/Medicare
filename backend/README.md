# 🏥 MediCare+ — Patient Management System

**A production-quality, full-stack healthcare management application built with vanilla HTML, CSS & JavaScript on the frontend and Python FastAPI + SQLite on the backend — no frontend framework, no compromises.**

---

## 🔗 Live Deployment

> **Frontend is live and fully functional:**
> ## 👉 [https://medicare-gamma-mauve.vercel.app/](https://medicare-gamma-mauve.vercel.app/)
>
> The frontend includes a **smart fallback mode** — if the backend is unreachable, it automatically switches to localStorage mode so the app never breaks.

---

## 📖 Overview

**MediCare+** is a comprehensive, full-stack patient management system designed for real-world healthcare facilities. It delivers a complete operational interface for managing patients, scheduling appointments, viewing doctor profiles, and analyzing clinic performance.

The project is split into two parts:

- **Frontend** — Pure HTML5, CSS3, and ES6+ JavaScript with a module pattern architecture. Zero npm dependencies.
- **Backend** — Python FastAPI REST API with SQLite database, JWT authentication, bcrypt password hashing, and full role-based access control.

Both are connected via real `fetch()` API calls with JWT tokens in the `Authorization: Bearer` header. The frontend also includes a **LOCAL_MODE fallback** — if the backend is offline, it silently switches to localStorage so the app remains fully usable.

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)

MediCare+ implements a fully-featured multi-user authentication system with **three distinct roles**, enforced on both the frontend (navigation, buttons) and the backend (route-level guards).

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

#### 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Doctor** | `dr.anitha` | `doc123` |
| **Doctor** | `dr.suresh` | `doc456` |
| **Receptionist** | `riya` | `rec123` |

---

### 🔒 Authentication & Security

- **JWT Authentication** — Login returns a signed JWT token stored in `localStorage`; every subsequent API call sends it in the `Authorization: Bearer` header
- **bcrypt Password Hashing** — All passwords hashed using `passlib[bcrypt]` — plaintext passwords never stored
- **Token Expiry** — Tokens expire after 480 minutes (configurable via `.env`)
- **Brute-Force Protection** — Frontend locks the account after 5 consecutive failed login attempts with a live counter
- **Password Visibility Toggle** — Eye icon to show/hide password on the login screen
- **Login Error Shake Animation** — Login card shakes on a failed attempt for instant feedback
- **XSS Protection** — All user-supplied strings sanitised through `escapeHtml()` before DOM insertion
- **Keyboard Submit** — `Enter` key on the login form triggers authentication
- **Session Restore** — On page load, stored JWT and user object are restored from `localStorage` so the user stays logged in across refreshes
- **Clean Logout** — Clears token, user, and all session state from `localStorage`

---

### 🌐 Smart LOCAL_MODE Fallback

One of the most thoughtful features of this project. On startup, the frontend pings `GET /health` on the backend. If the backend responds, it runs in **API mode** (real database). If the backend is unreachable, it automatically switches to **LOCAL_MODE** (localStorage) with no error shown to the user. This means:

- The Vercel frontend works standalone without any backend
- The full-stack version works when both frontend and backend are running
- Zero disruption to the user experience either way

---

### 🏠 Home Page

- **Personalized Hero Banner** — Greets the logged-in user by name with a role-appropriate subtitle
- **Role-Aware Quick Action Cards** — Shortcut cards filtered by role (Register Patient, Book Appointment, View Doctors, View Dashboard)
- **Upcoming Appointments Feed** — Live feed of next scheduled, non-cancelled appointments; doctors see only their own
- **Recent Patients Panel** — Snapshot of latest registrations with avatar initials, condition, age, and blood group
- **System Status Indicator** — Pulsing "System Online" dot in the topbar

---

### 👥 Patient Registry

**Full CRUD backed by real API:**
- **Create** — `POST /patients` — Modal form (Admin, Receptionist)
- **Read** — `GET /patients` — Tabular view with rich data display
- **Update** — `PUT /patients/{id}` — Edit modal pre-populated with existing data (Admin only)
- **Delete** — `DELETE /patients/{id}` — Cascades to appointments (Admin only)

**Patient Data Fields:**
- Full Name, Age, Gender, Blood Group
- Phone (10-digit validation), Email (format validation, optional)
- Address, Medical Condition/Diagnosis
- Active / Inactive Status, Auto-generated Join Date

**Search & Filtering:**
- Real-Time Search — filters by name, condition, and phone as you type
- Advanced Filter Panel — Gender, Status, Condition, Age Range (Min/Max) with Apply and Clear All
- Live Result Counter

**Additional Features:**
- Duplicate Detection — backend returns `409 Conflict` for same name + phone
- Color-coded Status Badges (Active = green, Inactive = amber)
- CSV Export — Admin-only one-click download
- Auto-generated Avatar Initials
- Empty State with CTA button

---

### 🩺 Doctor Directory

- **Doctor Profile Cards** — Color-coded avatar, name, specialization, experience, star rating, appointment count, weekly availability schedule, live availability dot
- **Filter Tabs** — "All Doctors" and "Available Today" (evaluates against current day)
- **Quick Booking** — Book button pre-selects the doctor in the appointment modal

**6 Pre-Seeded Doctors:**

| Name | Specialization | Experience | Rating | Availability |
|------|---------------|------------|--------|--------------|
| Dr. Anitha Krishnan | Neurologist | 12 yrs | ⭐ 4.9 | Mon, Wed, Fri |
| Dr. Suresh Patel | Endocrinologist | 8 yrs | ⭐ 4.7 | Tue, Thu |
| Dr. Kavya Reddy | Pulmonologist | 15 yrs | ⭐ 4.8 | Mon, Tue, Thu |
| Dr. Mohammed Farhan | Cardiologist | 20 yrs | ⭐ 4.9 | Wed, Fri |
| Dr. Lakshmi Subramanian | General Physician | 10 yrs | ⭐ 4.6 | Mon–Fri |
| Dr. Venkat Rajan | Orthopedic Surgeon | 18 yrs | ⭐ 4.8 | Mon, Thu, Fri |

---

### 📅 Appointment Management

**Full lifecycle backed by real API:**
- **Create** — `POST /appointments`
- **Read** — `GET /appointments` (doctor-scoped on backend)
- **Update** — `PUT /appointments/{id}`
- **Cancel** — `DELETE /appointments/{id}` (sets status to Cancelled)

**Fields:** Patient, Doctor, Date, Time Slot (12 slots 09:00–16:30), Visit Type, Status, Notes

**Smart Validation (both frontend and backend):**
- Blocks appointments on doctor's unavailable days
- `409 Conflict` from backend for double-booked slots (same doctor + date + time)
- Rejects past dates
- Inline field-level error display

**Other Features:**
- Status Filter Tabs — All, Confirmed, Pending, Cancelled with live counts
- Doctor-scoped view — backend filters by `doctor_id` for doctor role
- Color-coded badges — Green (Confirmed), Amber (Pending), Red (Cancelled)
- Sidebar pending count badge (role-aware)
- CSV Export (Admin only)

---

### 📊 Analytics Dashboard *(Admin Only)*

**KPI Stat Cards:**
- Total Patients (with active count)
- Active Patients (with active rate %)
- Total Appointments (with confirmed count)
- Pending Review (red accent when > 2)

**Breakdowns:**
- Appointment Status — animated progress bars (Confirmed / Pending / Cancelled %)
- Medical Conditions Distribution — progress bars per condition
- Doctor Utilization — ranked list with specialization and appointment count
- Gender Distribution — colored bars (Male / Female / Other)
- Blood Group Distribution — labeled tags (A+, A-, B+, B-, AB+, AB-, O+, O-)

**Interactive Charts (Chart.js v4.4.0):**
- Bar chart — Appointments per day for next 7 days
- Doughnut chart — Appointment share per doctor

---

### 🗓️ Interactive Calendar *(Admin Only)*

- Full monthly grid with correct day-of-week alignment
- Teal dot indicators on dates with appointments
- Today highlighted with teal background
- Previous / Next month navigation + "Today" jump button
- Day detail view — table of appointments for selected date
- Quick booking button from day detail panel

---

### 🔔 Notification System

- Topbar bell icon with red badge (today's appointment count)
- Slide-in panel — upcoming appointments within next 7 days
- Color-coded: Red (Today), Green (Confirmed), Amber (Pending)
- Each notification shows patient name, doctor, date, time
- Empty state when no upcoming appointments

---

### 🌗 Dark Mode

- One-click toggle ☀️/🌙 in topbar
- Persisted to `localStorage`, restored across sessions
- Flicker-free — theme applied before first paint via inline `<script>` in `<head>`
- Full coverage — every component styled for dark mode via CSS custom properties

---

### 📱 Responsive Design

- Collapsible mobile sidebar with hamburger toggle and backdrop
- Breakpoints: 1100px → 2-col grids, 900px → single col, 768px → sidebar overlay + mobile modals, 480px → single col stats
- Touch-friendly targets, smooth scrolling, custom WebKit scrollbar

---

### ⌨️ Accessibility

- `aria-modal`, `aria-label`, `role` on dialogs and navigation
- `Escape` closes modals, `Enter` submits login, `Tab` navigates forms
- First focusable field auto-focused on modal open
- Inline field-level error messages linked to inputs

---

## ⚙️ Architecture & Technical Design

### Frontend Module Breakdown

| Module | Responsibility |
|--------|---------------|
| `Storage` | `localStorage` read/write with JSON parsing and error safety |
| `ApiService` | Real `fetch()` calls to FastAPI backend with JWT headers; LOCAL_MODE fallback for all operations |
| `State` | Central store — current user, page, modal, filters, patients, appointments |
| `Auth` | Role helpers: `isAdmin()`, `isDoctor()`, `canAccess(page)`, `visibleAppointments()` |
| `Validate` | Pure client-side validation returning `{ valid, errors }` |
| `DarkMode` | Theme get/apply/toggle with flicker-free init |
| `Notifications` | Upcoming appointment filtering and urgency categorization |
| `Toast` | Auto-dismiss toasts — success, error, info |
| `Confirm` | Promise-based confirmation dialog — `await Confirm.show({...})` |

### Backend Module Breakdown

| File | Responsibility |
|------|---------------|
| `main.py` | FastAPI app, CORS, lifespan (startup DB init + seed), auth route, health check, global exception handlers |
| `database.py` | SQLite engine, SQLAlchemy session factory, `get_db` dependency |
| `models.py` | SQLAlchemy ORM models — `User`, `Patient`, `Appointment` |
| `schemas.py` | Pydantic request/response schemas with field validation |
| `auth.py` | bcrypt hashing, JWT creation/decoding, `authenticate_user()` |
| `dependencies.py` | `get_current_user` (JWT extractor), `require_role(*roles)` (route guard) |
| `seed.py` | One-time database seeding — 4 users, 4 patients, 4 appointments |
| `routers/patients.py` | GET, POST, PUT, DELETE for `/patients` with role guards |
| `routers/appointments.py` | GET, POST, PUT, DELETE for `/appointments` with role guards and doctor-scoped filtering |

### API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/auth/login` | Public |
| `GET` | `/health` | Public |
| `GET` | `/patients` | All roles |
| `POST` | `/patients` | Admin, Receptionist |
| `PUT` | `/patients/{id}` | Admin only |
| `DELETE` | `/patients/{id}` | Admin only |
| `GET` | `/appointments` | All roles (doctor-scoped) |
| `POST` | `/appointments` | Admin, Receptionist |
| `PUT` | `/appointments/{id}` | Admin only |
| `DELETE` | `/appointments/{id}` | Admin only |

---

## 🛠️ Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic elements) |
| Styling | Vanilla CSS (Custom Properties, Grid, Flexbox, Animations) |
| Logic | Vanilla JavaScript (ES6+, Module Pattern, Async/Await) |
| Charts | Chart.js v4.4.0 via CDN |
| Typography | Google Fonts — DM Sans + DM Serif Display |
| Storage | Browser `localStorage` (fallback mode) |
| Deployment | Vercel |

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | Python FastAPI |
| Database | SQLite via SQLAlchemy ORM |
| Authentication | JWT (`python-jose`) |
| Password Hashing | bcrypt (`passlib`) |
| Validation | Pydantic v2 |
| Server | Uvicorn (ASGI) |
| Config | python-dotenv |

> **Frontend: Zero npm dependencies.** No React, no Vue, no Webpack, no Babel.
> **Backend: Pure Python.** No paid services, no cloud database required.

---

## 📁 Project Structure

```
MediCare+/
│
├── frontend/
│   ├── index.html            # App shell, toast & confirm mounts, CDN scripts
│   ├── styles.css            # Full design system — tokens, components, dark mode, responsive
│   └── app.js                # All frontend logic — modules, state, rendering, API calls
│
├── backend/
│   ├── main.py               # FastAPI app, CORS, startup, auth route, health check
│   ├── database.py           # SQLite engine and SQLAlchemy session
│   ├── models.py             # ORM models — User, Patient, Appointment
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT + bcrypt authentication logic
│   ├── dependencies.py       # get_current_user, require_role dependencies
│   ├── seed.py               # Demo data seeding on first run
│   ├── routers/
│   │   ├── patients.py       # Patient CRUD endpoints
│   │   └── appointments.py   # Appointment CRUD endpoints
│   ├── requirements.txt      # Python dependencies with pinned versions
│   ├── .env                  # Environment variables (not committed)
│   └── .env.example          # Environment variable template
│
└── README.md
```

---

## 📊 Seed Data

The backend automatically seeds the database on first startup — no manual setup required.

**Users:**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `dr.anitha` | `doc123` | Doctor |
| `dr.suresh` | `doc456` | Doctor |
| `riya` | `rec123` | Receptionist |

**Patients:** Priya Nair, Rajan Kumar, Meena Pillai, Arjun Sharma — with real Chennai addresses, conditions, and blood groups.

**Appointments:** 4 records across different doctors, visit types, and statuses (Confirmed, Pending, Cancelled).

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Any modern browser (Chrome, Firefox, Edge, Safari)
- VS Code with Live Server extension (recommended for frontend)

### 1. Start the Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Open .env and set a strong JWT_SECRET_KEY

# Run the server
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

Auto-generated API docs at: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend

Open `frontend/index.html` with VS Code Live Server (runs at `http://127.0.0.1:5500`).

Or use Python:

```bash
cd frontend
python -m http.server 5500
```

### 3. Login

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `dr.anitha` | `doc123` |
| Receptionist | `riya` | `rec123` |

> **Tip:** Log in as Admin first — Dashboard, Calendar, full CRUD, and CSV export are all admin-exclusive.

### Environment Variables (.env)

```env
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./medicare.db
```

---

## 🎯 Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **No frontend framework** | Demonstrates deep JS fundamentals and clean architecture without scaffolding |
| **FastAPI over Flask** | Native async support, automatic Swagger docs, Pydantic validation built-in |
| **SQLite** | Zero cost, zero setup, single file — perfect for a self-contained project |
| **LOCAL_MODE fallback** | Frontend never breaks without the backend — graceful degradation |
| **Role guards on backend** | Security enforced server-side — frontend hiding is UX, backend rejecting is real security |
| **Pydantic schemas** | Strict input validation at the API boundary — bad data never reaches the database |
| **Cascade delete** | Deleting a patient removes all their appointments — no orphaned records |
| **Slot conflict check on backend** | Double-booking prevention enforced server-side, not just client-side |
| **Event delegation** | One listener for the entire frontend app — no dangling listeners as HTML is replaced |
| **CSS custom properties** | Full design token system makes dark mode a zero-JS concern |
| **Promise-based Confirm** | `await Confirm.show()` enables clean async destructive-action guards |

---

## 👨‍💻 Author

**S. Kamesh**
- GitHub: https://github.com/KAMESH101
- LinkedIn: https://www.linkedin.com/in/kams001/
- Email: kams.offi.018@gmail.com

---

Built with ❤️ using vanilla HTML, CSS & JavaScript + Python FastAPI — full stack, no shortcuts.

🔗 Live Demo: https://medicare-gamma-mauve.vercel.app/
