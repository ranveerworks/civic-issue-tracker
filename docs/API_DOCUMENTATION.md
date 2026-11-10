# Civic Issue Tracker — REST API Documentation
**Smart Reporting • Tracking • Resolution**  
*Sharda University — CSCR2600 Project-Based Learning*

---

## 1. Overview
The Civic Issue Tracker API is built using **FastAPI** and **SQLAlchemy ORM** connected to **MySQL**. It features JWT Bearer authentication, role-based access control (Citizen and Admin), rule-based duplicate complaint detection, image uploads, in-app notifications, and a complete audit status timeline.

- **Base URL**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Static Uploads URL**: `http://localhost:8000/uploads/{filename}`

---

## 2. Authentication & Authorization

All protected endpoints require an `Authorization` header containing a valid JWT access token:
```http
Authorization: Bearer <jwt_access_token>
```

### Roles:
- `citizen`: Can file complaints, upload photos, track complaints, view personal complaints, edit submitted reports, receive notifications.
- `admin`: Can view all civic complaints across wards, filter issues, change resolution statuses, append official administrative notes, view analytics.

---

## 3. Endpoints Reference

### A. Authentication & User Profile (`/api/auth`)

#### `POST /api/auth/register`
Register a new citizen account.
- **Request Body (JSON)**:
  ```json
  {
    "full_name": "Aarav Sharma",
    "email": "aarav@example.com",
    "mobile": "+91 9811223344",
    "password": "Password@123",
    "confirm_password": "Password@123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "full_name": "Aarav Sharma",
      "email": "aarav@example.com",
      "mobile": "+91 9811223344",
      "role": "citizen",
      "created_at": "2026-11-01T00:00:00Z"
    }
  }
  ```

#### `POST /api/auth/login`
Authenticate as Citizen or Admin.
- **Request Body (JSON)**:
  ```json
  {
    "email": "citizen@example.com",
    "password": "Citizen@123"
  }
  ```
- **Response `200 OK`**:
  Returns `access_token`, `token_type`, and user object with `role`.

#### `GET /api/auth/me`
Retrieve authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: User profile details.

#### `PUT /api/auth/profile`
Update user's name, phone, or password.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "full_name": "Aarav S.",
    "mobile": "+91 9811223399",
    "current_password": "Citizen@123",
    "new_password": "NewCitizenPassword@123"
  }
  ```

---

### B. Complaints Management (`/api/complaints`)

#### `POST /api/complaints/check-duplicate`
Rule-based duplicate issue check prior to complaint filing.
- **Request Body (JSON)**:
  ```json
  {
    "title": "Severe pothole cluster near Metro",
    "description": "Deep potholes causing two-wheelers to slip near the metro station.",
    "category": "Road and potholes",
    "location": "Knowledge Park II, Greater Noida",
    "latitude": 28.4615,
    "longitude": 77.4965
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "has_potential_duplicates": true,
    "potential_matches": [
      {
        "complaint_id": "CIT-2026-A101",
        "title": "Severe pothole cluster near Knowledge Park II Gate",
        "category": "Road and potholes",
        "location": "Knowledge Park II, Greater Noida",
        "distance_km": 0.12,
        "similarity_score": 0.88,
        "status": "In Progress",
        "created_at": "2026-10-29T10:00:00Z"
      }
    ],
    "message": "Found 1 similar existing report(s) nearby..."
  }
  ```

#### `POST /api/complaints`
Submit a new civic complaint with photograph and GPS location.
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Fields**:
  - `title` (text, 5-200 chars)
  - `description` (text, min 10 chars)
  - `category` (Road and potholes, Garbage and waste management, Water leakage, Drainage and sewage, Streetlight problems, Public infrastructure, Other civic problems)
  - `location` (text address/landmark)
  - `latitude` (float, optional)
  - `longitude` (float, optional)
  - `photo` (file, optional, jpg/png/webp)
- **Response `201 Created`**:
  ```json
  {
    "id": 12,
    "complaint_id": "CIT-2026-B812F9",
    "user_id": 2,
    "title": "Broken streetlights along main boulevard",
    "description": "Entire street is dark at night, high risk for pedestrians.",
    "category": "Streetlight problems",
    "image_path": "/uploads/a912c_172000.jpg",
    "location": "Knowledge Park III, Greater Noida",
    "latitude": 28.4727,
    "longitude": 77.488,
    "status": "Submitted",
    "created_at": "2026-11-01T00:15:00Z",
    "updated_at": "2026-11-01T00:15:00Z",
    "citizen_name": "Aarav Sharma",
    "updates": [
      {
        "id": 1,
        "previous_status": null,
        "new_status": "Submitted",
        "admin_note": "Complaint registered successfully by citizen.",
        "updated_by_name": "Aarav Sharma",
        "created_at": "2026-11-01T00:15:00Z"
      }
    ]
  }
  ```

#### `GET /api/complaints/my`
List authenticated citizen's submitted complaints.
- **Query Params**: `status_filter`, `category_filter`, `search`
- **Response `200 OK`**: Array of complaints.

#### `GET /api/complaints`
Public feed of municipal complaints for transparency.
- **Query Params**: `status_filter`, `category_filter`, `search`, `limit`, `offset`
- **Response `200 OK`**: Array of public complaints.

#### `GET /api/complaints/{complaint_id}`
Search complaint by unique reference ID (e.g. `CIT-2026-A101`) or integer ID.
- **Response `200 OK`**: Full complaint record with photograph and audit timeline.

#### `GET /api/complaints/{complaint_id}/history`
Retrieve all historical status changes and administrative notes for a complaint.
- **Response `200 OK`**: Array of update milestones.

#### `PUT /api/complaints/{complaint_id}`
Citizen updates title/description while complaint is still `Submitted`.
- **Response `200 OK`**: Updated complaint record.

---

### C. Admin Management (`/api/admin`)
*All admin endpoints require an authenticated user with `role="admin"`.*

#### `GET /api/admin/dashboard`
Returns high-level KPI metrics, category distribution, monthly inflow trend, and recent complaints.
- **Response `200 OK`**:
  ```json
  {
    "stats": {
      "total_complaints": 24,
      "submitted": 6,
      "under_review": 4,
      "in_progress": 5,
      "resolved": 8,
      "rejected": 1,
      "total_citizens": 18
    },
    "category_distribution": [
      {"category": "Road and potholes", "count": 8},
      {"category": "Garbage and waste management", "count": 5}
    ],
    "monthly_trend": [
      {"month": "2026-08", "count": 2},
      {"month": "2026-09", "count": 6},
      {"month": "2026-10", "count": 16}
    ],
    "recent_complaints": [...]
  }
  ```

#### `GET /api/admin/complaints`
Filterable table of all complaints across the municipality.
- **Query Params**: `status_filter`, `category_filter`, `search`, `limit`, `offset`

#### `PUT /api/admin/complaints/{complaint_id}/status`
Update complaint status, append official note, and dispatch in-app notification.
- **Request Body (JSON)**:
  ```json
  {
    "new_status": "In Progress",
    "admin_note": "Inspection completed. Maintenance division dispatched with cold mix asphalt."
  }
  ```
- **Allowed Statuses**: `Submitted`, `Under Review`, `In Progress`, `Resolved`, `Rejected`
- **Response `200 OK`**: Updated complaint.

#### `GET /api/admin/statistics`
Resolution percentage and category metrics.

---

### D. In-App Notifications (`/api/notifications`)

#### `GET /api/notifications`
Get unread and recent notifications for the logged-in user.
- **Response `200 OK`**: Array of notifications.

#### `PUT /api/notifications/{id}/read`
Mark a single notification as read.

#### `PUT /api/notifications/read-all`
Mark all notifications as read for current user.

---

## 4. HTTP Status Codes

| Code | Meaning |
|---|---|
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Missing or invalid parameters |
| `401 Unauthorized` | Missing, expired, or invalid JWT Bearer token |
| `403 Forbidden` | Insufficient permissions (e.g. non-admin accessing admin portal) |
| `404 Not Found` | Complaint or resource not found |
| `422 Unprocessable` | Pydantic schema validation error |
