# 🏛️ CIVIC ISSUE TRACKER
> **Smart Reporting • Tracking • Resolution**  
> *A University PBL Project for Sharda University, CSCR2600 – Project-Based Learning*

---

## 🌟 Project Purpose
**Civic Issue Tracker** is a modern, full-stack civic-tech web platform enabling citizens to report local municipal infrastructure defects (potholes, garbage accumulation, water leakages, drainage overflows, and non-functional streetlights).

Citizens submit complaints with photographic evidence, categorization, and GPS coordinates. Municipal administrators review, assign, and update resolution statuses in real-time, providing complete transparency and accountable governance.

---

## 🚀 Key Features

### 1. Citizen Experience
- **Quick Registration & JWT Authentication**: Secure password hashing with bcrypt, role-based JWT sessions.
- **Interactive Reporting Form**:
  - Category selector (Roads, Waste, Water, Drainage, Streetlights, Infrastructure).
  - Photographic proof upload (JPEG, PNG, WebP up to 10MB).
  - One-click browser **GPS Geolocation detection** with manual address fallback.
  - Unique Complaint ID generation (e.g. `CIT-2026-A101`).
- **Rule-Based Duplicate Detection**: Warns citizens if a similar issue exists nearby (Haversine formula + text token overlap) without blocking submission.
- **Personal Dashboard**: Live metric cards (Total, Pending, In Progress, Resolved) and Recharts status distribution chart.
- **Real-Time Status Tracking**: 4-step resolution stepper and timestamped administrative timeline.
- **In-App Notification Bell**: Real-time alerts when ticket status changes or resolution notes are added.

### 2. Administrator Command Console
- **Role-Based Access Control (RBAC)**: Enforced via FastAPI dependencies; citizens are strictly forbidden from administrative endpoints (403 Forbidden).
- **KPI Metrics & Analytics**:
  - Total intake across municipal wards.
  - Status breakdown (Submitted, Under Review, In Progress, Resolved, Rejected).
  - Recharts Category Distribution Bar Chart.
  - Recharts Monthly Inflow Trend Chart.
- **Master Complaints Register**:
  - Live search across Complaint ID, citizen name, location, and keywords.
  - Multi-status and category filters.
  - Interactive "Manage Status" modal: view citizen contact details, inspect attached defect photos, change resolution status, and append official municipal notes.
  - Every action recorded in MySQL database audit history table (`complaint_updates`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, React Router DOM v6, Axios, Lucide React, Recharts |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy ORM, Pydantic v2, Python-Jose (JWT), Bcrypt |
| **Database** | MySQL 8.0+ (InnoDB, UTF-8mb4), with automated local preview fallback for grading |
| **Testing** | Automated End-to-End Test Suite (`test_live_api.py`), FastAPI TestClient |
| **Deployment** | Vercel (Frontend), Render (Backend), Cloud MySQL (Aiven / PlanetScale / AWS RDS) |

---

## 📂 Project Structure

```
civic-issue-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx     # In-app notifications dropdown & badge
│   │   │   └── StatusBadge.jsx          # Color-coded status badge component
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Hero, live stats, categories, 3-step process
│   │   │   ├── RegisterPage.jsx         # Citizen account registration
│   │   │   ├── LoginPage.jsx            # Citizen & Admin login with 1-click autofill
│   │   │   ├── CitizenDashboardPage.jsx # Personal metrics, chart & complaint list
│   │   │   ├── ReportIssuePage.jsx      # Form with photo upload, GPS, duplicate check
│   │   │   ├── TrackComplaintPage.jsx   # 4-step stepper, photo zoom & audit history
│   │   │   ├── AllComplaintsPage.jsx    # Public civic feed with filters
│   │   │   ├── AdminDashboardPage.jsx   # Admin KPI console & status modal
│   │   │   └── ProfilePage.jsx          # User info, edit phone, password change
│   │   ├── layouts/
│   │   │   ├── Navbar.jsx               # Navigation bar & mobile drawer
│   │   │   ├── Footer.jsx               # Civic helplines & PBL attribution
│   │   │   └── ProtectedRoute.jsx       # Citizen / Admin route guards
│   │   ├── services/
│   │   │   └── api.js                   # Axios client with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Auth provider & session management
│   │   ├── App.jsx                      # Client router definitions
│   │   ├── main.jsx                     # Application bootstrap
│   │   └── index.css                    # Tailwind directives & styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json                      # Vercel SPA routing rewrite configuration
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                # Environment settings & credentials
│   │   │   └── security.py              # Bcrypt hashing & JWT token generation
│   │   ├── database.py                  # SQLAlchemy engine, session & MySQL connection
│   │   ├── models/
│   │   │   ├── user.py                  # Users table model
│   │   │   ├── complaint.py             # Complaints table model
│   │   │   ├── complaint_update.py      # Status history audit log model
│   │   │   └── notification.py          # In-app notifications model
│   │   ├── schemas/
│   │   │   ├── user.py                  # User validation schemas
│   │   │   ├── complaint.py             # Complaint & duplicate detection schemas
│   │   │   └── notification.py          # Notification schemas
│   │   ├── services/
│   │   │   ├── duplicate_detection.py   # Rule-based Haversine & Jaccard similarity
│   │   │   └── notification_service.py  # Notification dispatch helper
│   │   ├── routers/
│   │   │   ├── auth.py                  # Register, login, profile endpoints
│   │   │   ├── complaints.py            # Submit, list, track, history endpoints
│   │   │   ├── admin.py                 # Admin dashboard, status change endpoints
│   │   │   └── notifications.py         # Notifications endpoints
│   │   └── main.py                      # FastAPI app entry point, CORS, startup
│   ├── uploads/                         # Stored photographs
│   ├── seed.py                          # Database seed script with sample data
│   ├── test_live_api.py                 # 11-step automated end-to-end test suite
│   ├── requirements.txt
│   ├── render.yaml                      # Render deployment blueprint
│   ├── Procfile
│   └── .env.example
│
├── database/
│   └── schema.sql                       # Pure MySQL 8.0+ DDL with tables, indexes & seeds
│
├── docs/
│   └── API_DOCUMENTATION.md             # Complete REST API documentation
│
├── README.md
└── .gitignore
```

---

## 🗄️ Database Setup (MySQL 8.0+)

### 1. Create MySQL Database and Tables
Open your MySQL terminal or Workbench:
```sql
-- Connect to MySQL
mysql -u root -p

-- Import the schema
source database/schema.sql;
```
Or run directly from your terminal:
```bash
mysql -u root -p < database/schema.sql
```

This will create:
1. `users` table (with bcrypt passwords and role check)
2. `complaints` table (with coordinates, status check, foreign key)
3. `complaint_updates` table (status history, admin notes)
4. `notifications` table (in-app user notifications)
5. Performance indexes on status, category, user, and reference ID.

### 2. Configure Backend Database URL
Edit `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/civic_issue_tracker
ALLOW_SQLITE_FALLBACK=true
```
*(Note: If MySQL service is not yet started, the application clearly reports the missing configuration and smoothly activates the local preview fallback so grading is never blocked).*

---

## 💻 Installation & Running

### Step 1: Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the database seeder (populates admin, citizens, and realistic sample complaints)
python seed.py

# Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Swagger Interactive Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Step 2: Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend application URL: `http://localhost:5173`

---

## 🔑 Default Credentials for Evaluation

The application includes one-click autofill buttons on the login screen for rapid academic review:

| Role | Email | Password | Access |
|---|---|---|---|
| **Official Admin** | `admin@civictracker.gov.in` | `Admin@123` | Full Admin Dashboard, status management, analytics |
| **Demo Citizen** | `citizen@example.com` | `Citizen@123` | Citizen Dashboard, report issues, personal history |
| **Demo Citizen 2** | `priya.v@example.com` | `Citizen@123` | Citizen Dashboard, track issues |

---

## 🧪 Automated Testing

An automated test suite tests all 11 core functional requirements:
```bash
cd backend
python test_live_api.py
```

### Tested Features:
1. ✅ Database connection & Health check (`/api/health`)
2. ✅ Citizen registration with validation
3. ✅ Citizen login & JWT generation
4. ✅ Admin login & JWT verification
5. ✅ Role-Based Access Control (RBAC: Citizen forbidden from Admin endpoints)
6. ✅ Rule-based duplicate complaint detection
7. ✅ Complaint submission with photo upload and GPS coordinates
8. ✅ Citizen dashboard personal complaints retrieval
9. ✅ Public tracking by reference ID (`CIT-2026-XXXX`)
10. ✅ Admin status progression (`Submitted` ➔ `In Progress` ➔ `Resolved`) with official notes
11. ✅ In-app notification delivery and read status

---

## 🚀 Deployment Instructions

### Frontend (Vercel)
1. Push code to GitHub repository.
2. In Vercel, import the repository and select `frontend` as Root Directory.
3. Framework Preset: **Vite**.
4. Set Environment Variable:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://civic-api.onrender.com`)
   - `VITE_API_URL`: `https://civic-api.onrender.com/api`
5. Deploy. `frontend/vercel.json` ensures client-side routing works smoothly.

### Backend (Render)
1. In Render, create a new **Web Service** connected to your repo.
2. Root Directory: `backend`.
3. Runtime: **Python 3**.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables:
   - `DATABASE_URL`: Hosted MySQL connection string (e.g. from Aiven, PlanetScale, or AWS RDS).
   - `SECRET_KEY`: A secure random secret key.
   - `CORS_ORIGINS`: Your Vercel frontend URL.
   - `ALLOW_SQLITE_FALLBACK`: `false` (for strict cloud database enforcement).

---

## 🎓 Academic Attribution
- **Institution**: Sharda University
- **Course**: CSCR2600 – Project-Based Learning
- **Project**: Civic Issue Tracker (Smart Reporting • Tracking • Resolution)
