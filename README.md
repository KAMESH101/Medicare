# 🏥 MediCare+ — Patient Management System

**A production-quality, role-based healthcare management application built entirely with vanilla HTML, CSS & JavaScript — no frameworks, no build tools, no compromises.**

---

## 🔗 Live Deployment

> **The application is live and fully functional:**
> ## 👉 [https://medicare-gamma-mauve.vercel.app/](https://medicare-gamma-mauve.vercel.app/)
> Hosted on **Vercel** with continuous deployment. No installation required — open the link and log in.

---

## 📖 Overview

**MediCare+** is a comprehensive, single-page patient management system designed for real-world healthcare facilities. It delivers a complete operational interface for managing patients, scheduling appointments, viewing doctor profiles, and analyzing clinic performance — all from a clean, responsive UI.

What makes this project stand out is its deliberate **zero-dependency architecture**: every feature — from role-based auth to interactive charts to a dark-mode design system — is built using pure HTML5, CSS3, and ES6+ JavaScript. The codebase demonstrates mastery of modular design, event delegation, async patterns, client-side persistence, and accessibility without leaning on any framework.

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)

MediCare+ implements a fully-featured multi-user authentication system with **three distinct roles**, each with a tailored permission set and personalized view.

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

The permission model is enforced at both the **navigation level** (restricted pages are hidden from the sidebar) and the **action level** (buttons not relevant to a role are never rendered).

#### 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Doctor** | `dr.anitha` | `doc123` |
| **Doctor** | `dr.suresh` | `doc456` |
| **Receptionist** | `riya` | `rec123` |

---

### 🔒 Authentication & Security

- **Secure Login Portal** — Dedicated login screen with username/password fields and a branded hero section
- **Password Visibility Toggle** — Eye icon to reveal or hide the password input in real time
- **Brute-Force Protection** — Account locks after **5 consecutive failed login attempts**, with a live attempt counter informing the user how many tries remain
- **Login Error Shake Animation** — The login card visually shakes on a failed attempt, providing instant tactile feedback
- **Role-Specific Welcome** — After login, each user sees a personalized welcome message and quick-action shortcuts tuned to their role
- **Session Management** — Clean logout clears all session state and returns to the login screen
- **Keyboard Submit** — Pressing `Enter` on the login form triggers authentication without needing to click the button
- **XSS Protection** — All user-supplied strings are sanitised through `escapeHtml()` before being inserted into the DOM, preventing cross-site scripting attacks

---

### 🏠 Home Page

- **Personalized Hero Banner** — A full-width gradient section that greets the logged-in user by name with a role-appropriate subtitle
- **Role-Aware Quick Action Cards** — Contextual shortcut cards (e.g., "Register Patient", "Book Appointment", "View Doctors") that are filtered and rendered based on the current user's role; admins also see a "View Dashboard" CTA
- **Upcoming Appointments Feed** — A live widget showing the next scheduled, non-cancelled appointments; doctors only see their own
- **Recent Patients Panel** — A snapshot of the latest patient registrations, showing avatar initials, condition, age, and blood group
- **System Status Indicator** — A pulsing "System Online" dot in the topbar provides real-time operational feedback

---

### 👥 Patient Registry

The patient registry is the core record-keeping module of MediCare+.

**Full CRUD:**
- **Create** — Modal form for registering new patients (Admin, Receptionist)
- **Read** — Paginated tabular view with rich data display
- **Update** — In-place edit modal pre-populated with existing data (Admin only)
- **Delete** — Confirmed deletion that also cascades to the patient's appointment records (Admin only)

**Patient Data Fields:**
- Full Name, Age, Gender, Blood Group
- Phone Number (10-digit validation), Email (format validation, optional)
- Address, Medical Condition/Diagnosis
- Active / Inactive Status
- Auto-generated Join Date

**Search & Filtering:**
- **Real-Time Search** — Instant text filtering across name, condition, and phone number as you type
- **Advanced Filter Panel** — Expandable side panel with controls for Gender, Status, Condition, and an Age Range slider (Min/Max); supports Apply and Clear All
- **Result Counter** — Live display of total matching records (e.g., "4 patients")

**Additional Features:**
- **Duplicate Detection** — Prevents registering a patient with the same name and phone number combination
- **Status Badges** — Color-coded Active (green) / Inactive (amber) indicators
- **CSV Export** — Admin-only one-click export of the entire patient list to a downloadable `.csv` file
- **Avatar Initials** — Auto-generated colored avatar using the patient's initials
- **Empty State Handling** — Friendly empty state with an icon and a CTA button when no records match the search

---

### 🩺 Doctor Directory

- **Doctor Profile Cards** — Rich visual cards for each of the 6 doctors, showing:
  - Color-coded avatar with initials
  - Full name and medical specialization
  - Years of experience, star rating (★), and active appointment count
  - Weekly availability schedule (e.g., Mon, Wed, Fri)
  - Live availability dot indicator based on today's day of the week
- **Filter Tabs** — Toggle between "All Doctors" and "Available Today" — the filter automatically evaluates against the current day
- **Quick Booking** — An "Book Appointment" button on each card pre-selects that doctor when the appointment modal opens

**Pre-Seeded Doctors:**

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

- **Full Appointment Lifecycle** — Create, view, edit, and cancel appointments with real-time validation
- **Appointment Data Fields:**
  - Patient (dropdown of registered patients)
  - Doctor (dropdown with inline availability hint showing working days)
  - Date picker with past-date prevention
  - Time slot selector (12 slots: 09:00–16:30)
  - Visit type: Consultation, Follow-up, Routine, Emergency, Lab Review
  - Status: Pending / Confirmed
  - Free-text notes field
- **Smart Validation Engine:**
  - Blocks appointments on dates the selected doctor is unavailable
  - Prevents double-booking the same doctor at the same date and time slot
  - Rejects past dates outright
  - All validation errors are highlighted inline on the offending field
- **Status Filter Tabs** — View All, Confirmed, Pending, or Cancelled appointments with live counts per tab
- **Doctor-Scoped View** — Doctors log in and see only their own assigned appointments; admins and receptionists see all
- **Color-Coded Status Badges** — Green (Confirmed), Amber (Pending), Red (Cancelled)
- **Sidebar Badge Counter** — The Appointments nav item shows a live count of pending items relevant to the current user
- **Truncated Notes** — Long notes are clipped with ellipsis and reveal full text on hover
- **CSV Export** — Admin-only export of all appointment records

---

### 📊 Analytics Dashboard *(Admin Only)*

A dedicated analytics hub giving administrators a full operational overview of the clinic.

**KPI Stat Cards:**
- Total Patients (with active count)
- Active Patients (with active rate %)
- Total Appointments (with confirmed count)
- Pending Review count (accented red when > 2, drawing attention to the backlog)

**Breakdowns & Distributions:**
- **Appointment Status Breakdown** — Animated horizontal progress bars showing the split between Confirmed, Pending, and Cancelled
- **Medical Conditions Distribution** — Progress bars visualizing how patients are distributed across all tracked conditions
- **Doctor Utilization Panel** — Ranked list of doctors with their specialization and current active appointment load
- **Patient Demographics:**
  - Gender distribution with color-coded bars (Male / Female / Other)
  - Blood group distribution with labeled tags (A+, A-, B+, B-, AB+, AB-, O+, O-)

**Interactive Charts (powered by Chart.js v4.4.0):**
- **Appointments This Week** — Bar chart showing the number of non-cancelled appointments per day for the next 7 days
- **Doctor Workload** — Doughnut chart showing each doctor's share of total appointments, color-coded per doctor

---

### 🗓️ Interactive Calendar *(Admin Only)*

- **Monthly Grid View** — Full calendar with correct day-of-week alignment (Sun–Sat header)
- **Visual Appointment Indicators** — Teal dot markers on dates that have scheduled appointments (up to 3 dots shown per day)
- **Today Highlight** — The current date is highlighted with a teal background
- **Navigation Controls** — Previous/Next month buttons and a "Today" shortcut to jump back to the current month
- **Day Detail View** — Clicking any date opens a detail table below the calendar showing patient name, doctor, time, visit type, and status for that day's appointments
- **Quick Booking** — A "Book" button in the day-detail panel opens the appointment form pre-filled with the selected date

---

### 🔔 Notification System

- **Topbar Bell Icon** — Always-visible notification bell with a live red badge showing today's appointment count
- **Slide-In Notification Panel** — Clicking the bell reveals a panel listing all upcoming appointments within the next 7 days
- **Smart Visual Categorization:**
  - 🔴 Red dot + "Today" badge — same-day appointments
  - 🟢 Green dot + "Confirmed" badge — confirmed future appointments
  - 🟡 Amber dot + "Pending" badge — pending future appointments
- **Per-Notification Detail** — Each entry shows patient name, doctor, date, and time
- **Empty State** — A friendly celebratory message when no upcoming appointments exist

---

### 🌗 Dark Mode

- **One-Click Theme Toggle** — Topbar ☀️/🌙 button switches between light and dark themes instantly
- **Persistent Preference** — Theme is saved to `localStorage` and restored on every page load
- **Flicker-Free Initialization** — An inline `<script>` in `<head>` applies the saved theme before first paint, eliminating the flash of unstyled content
- **Full Theme Coverage** — Every component (sidebar, topbar, cards, modals, tables, login page, calendar, charts, notifications, skeleton loaders, toasts, confirm dialogs) is fully styled for dark mode via CSS custom property overrides

---

### 🎨 UI/UX Design System

MediCare+ ships a complete, custom design system — no CSS framework involved.

**Design Token System (CSS Custom Properties):**
- Brand palette: Teal, Blue, Amber, Red, Green, Purple, Gray — each with light and dark variants
- Consistent border radii, elevation shadows (xs → lg), spacing scale, and transition durations
- Typography powered by **DM Sans** (body/UI) and **DM Serif Display** (headings) from Google Fonts

**Component Library:**
- Buttons — Primary, Danger, Ghost, Icon variants in sm and xs sizes
- Forms — Inputs, selects, and textareas with focus rings and per-field error states
- Cards, Stat Cards, Progress Bars
- Badges — Green, Amber, Red, Blue, Teal
- Tags — Teal, Blue, Amber, Red, Purple (for conditions, blood groups)
- Avatar initials circles
- Data tables with hover states
- Modals with backdrop blur
- Toast notifications — Success, Error, Info
- Promise-based Confirmation dialogs — with custom title, message, icon, and danger/safe variants
- Skeleton loaders with shimmer animation
- Empty states with icons and CTA buttons

**Micro-Animations:**
- `fadeIn` — Page content transitions
- `slideUp` — Modal and card entrances
- `slideInRight` — Toast notification entrance
- `shimmer` — Skeleton loading animation
- `shake` — Login card error feedback
- `pulse` — System status dot
- Hover lift effects on cards and stat cards

---

### 📱 Responsive Design

MediCare+ is built mobile-first and tested across all screen sizes.

- **Collapsible Mobile Sidebar** — Hidden off-canvas on small screens; toggled by a hamburger button (☰) with a backdrop overlay that dismisses on tap
- **Adaptive Breakpoints:**
  - `≤ 1100px` — Stats, Quick Actions, and Doctor grids collapse to 2 columns
  - `≤ 900px` — Two-column grids stack to single column
  - `≤ 768px` — Sidebar becomes a fixed overlay, forms go single-column, modals slide up from the bottom, topbar date hides
  - `≤ 480px` — Stat cards go single-column, login card padding reduced, confirm dialog buttons stack vertically
- **Touch-Friendly** — All interactive targets are sized for comfortable mobile use with smooth momentum scrolling
- **Custom Scrollbar** — Styled thin scrollbar for WebKit browsers for a polished desktop feel

---

### ⌨️ Accessibility

- `aria-modal`, `aria-label`, and `role` attributes on dialogs and navigation elements
- `Escape` key closes any open modal
- `Enter` key submits the login form
- `Tab` navigates through all form fields in logical order
- Error messages are programmatically linked to their input fields
- First focusable field in each modal receives automatic focus on open
- Confirm dialog's primary button receives focus when the dialog opens

---

## ⚙️ Architecture & Technical Design

MediCare+ is architected around the **Module Pattern** — a clean, self-contained approach to organizing JavaScript without a framework.

### Module Breakdown

| Module | Responsibility |
|--------|---------------|
| `Storage` | `localStorage` read/write abstraction with JSON parsing and error safety |
| `ApiService` | Simulated async data layer with a configurable 350ms delay — designed so a real REST API can be swapped in with zero changes to consumers |
| `State` | Central reactive store holding all app data: current user, active page, modal state, filters, patients, appointments. Has a `persist()` method that flushes to `localStorage` |
| `Auth` | Centralised role/permission helpers: `isAdmin()`, `isDoctor()`, `canAccess(page)`, `visibleAppointments()` |
| `Validate` | Pure validation functions for patients and appointments; returns `{ valid, errors }` |
| `DarkMode` | Theme management — get, apply, toggle, and flicker-free initialization |
| `Notifications` | Upcoming appointment logic: filters by date window, categorizes by urgency |
| `Toast` | Ephemeral notification toasts with auto-dismiss, manual close, and success/error/info variants |
| `Confirm` | Promise-based confirmation dialog — `await Confirm.show({...})` returns `true`/`false` |

### Rendering Strategy

- **String-Based HTML Rendering** — All views are built as HTML strings and injected via `innerHTML`. No virtual DOM, no diffing — just fast, predictable DOM replacement
- **Two-Level Rendering:** `render()` does a full page rebuild (only on login/logout/navigation); `renderContent()` surgically replaces only the `#page-content` area, making filter and search updates snappy without re-rendering the sidebar or topbar
- **Event Delegation** — A single delegated click handler (`handleDelegatedClick`) attached to the document root handles all interactive elements via `data-*` attributes, keeping memory usage minimal

### Data Persistence

- All patient and appointment records are persisted to `localStorage` as JSON on every mutation
- Auto-incremented IDs (`nextPatientId`, `nextApptId`) are also persisted to prevent ID collisions across sessions
- Seed data is loaded on first visit; subsequent visits restore from `localStorage`

### Form Validation Architecture

The `Validate` module returns a structured `{ valid: boolean, errors: { fieldKey: message } }` object. The `showFieldErrors()` helper maps field keys to DOM IDs, applies `.error` class to inputs, and appends inline error `<div>` elements — all without any third-party form library.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5 (Semantic elements) |
| **Styling** | Vanilla CSS (Custom Properties, Grid, Flexbox, Animations) |
| **Logic** | Vanilla JavaScript (ES6+, Module Pattern, Async/Await) |
| **Charts** | [Chart.js v4.4.0](https://www.chartjs.org/) via CDN |
| **Typography** | [Google Fonts](https://fonts.google.com/) — DM Sans + DM Serif Display |
| **Storage** | Browser `localStorage` |
| **Deployment** | [Vercel](https://vercel.com/) |

> **Zero npm dependencies.** No React, no Vue, no Webpack, no Babel, no Tailwind. Every line of code is hand-written.

---

## 📁 Project Structure

```
Medicare/
├── index.html      # App shell — HTML structure, toast & confirm dialog mounts, CDN scripts
├── styles.css      # Complete design system — tokens, reset, layout, all components, animations, dark mode, responsive
├── app.js          # Full application — modules, state, rendering engine, CRUD, validation, charts, events
└── README.md       # Project documentation
```

The entire application ships in **three files** with no build step. Deploying is as simple as uploading the folder.

---

## 📊 Seed Data

The application ships with pre-loaded data for immediate exploration — no manual setup required.

**Patients:**

| Name | Age | Condition | Blood Group | Status |
|------|-----|-----------|-------------|--------|
| Priya Nair | 34 | Hypertension | O+ | Active |
| Rajan Kumar | 58 | Diabetes Type 2 | A+ | Active |
| Meena Pillai | 42 | Asthma | B- | Inactive |
| Arjun Sharma | 27 | Migraine | AB+ | Active |

**Appointments:** 4 pre-seeded appointments across different doctors, visit types, and statuses (Confirmed, Pending, Cancelled) — giving the dashboard and calendar meaningful data on first load.

---

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No Node.js, no npm, no build tools required

### Run Locally

```bash
# 1. Clone the repository
git clone <repository-url>
cd Medicare

# 2. Open directly in browser
open index.html

# Or serve with any static server:
npx serve .
# python -m http.server 3000
```

### Login

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `dr.anitha` | `doc123` |
| Receptionist | `riya` | `rec123` |

> **Tip:** Log in as Admin first to explore all features — Dashboard, Calendar, full CRUD, and CSV export are all admin-exclusive.

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

---

## 🎯 Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **No framework** | Demonstrates clean architecture and deep JS fundamentals without framework scaffolding |
| **Module pattern** | Provides encapsulation and clear separation of concerns in a single file without ES modules or bundlers |
| **Simulated API layer** | `ApiService` with async delays mirrors real API consumption patterns; swapping in `fetch()` calls requires changing only this module |
| **String-based rendering** | Fast, predictable, and debuggable — no virtual DOM overhead for a single-page app of this scale |
| **Event delegation** | One listener for the whole app; no risk of dangling listeners as HTML is replaced |
| **CSS custom properties** | Full design token system makes dark mode and theming a zero-JS concern |
| **localStorage persistence** | Gives the app state that survives page refreshes, mimicking a real backend without one |
| **Promise-based Confirm** | `await Confirm.show()` enables clean async destructive-action guards without callback hell |

---

## 👨‍💻 Author

**S. Kamesh**
- GitHub: https://github.com/KAMESH101
- LinkedIn: https://www.linkedin.com/in/kams001/
- Email: kams.offi.018@gmail.com

---

---

Built with ❤️ using pure HTML, CSS & JavaScript — no frameworks, no compromises.

🔗 Live Demo: https://medicare-gamma-mauve.vercel.app/
