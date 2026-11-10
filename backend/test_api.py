"""
Automated End-to-End Test Suite for Civic Issue Tracker API
Verifies database integrity, authentication, citizen reporting, tracking,
rule-based duplicate detection, admin operations, and role security.
"""
import sys
import io
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def run_tests():
    print("=============================================================")
    print("[TEST SUITE] RUNNING COMPREHENSIVE CIVIC ISSUE TRACKER TESTS")
    print("=============================================================\n")

    # TEST 1: Root & Health Check
    print("[1] Testing Root & Database Health...")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("    [PASS] Root endpoint operational")

    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"    [PASS] Database active: {health_data['database_type']}")

    # TEST 2: Citizen Registration
    print("\n[2] Testing Citizen Registration...")
    citizen_email = f"test.citizen.{int(sys.version_info[0])}@example.com"
    reg_payload = {
        "full_name": "Test Citizen User",
        "email": citizen_email,
        "mobile": "+91 9899887766",
        "password": "Password@123",
        "confirm_password": "Password@123"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    if res.status_code == 400 and "already registered" in res.text:
        # Already exists from previous run, login instead
        login_res = client.post("/api/auth/login", json={"email": citizen_email, "password": "Password@123"})
        assert login_res.status_code == 200
        citizen_token = login_res.json()["access_token"]
        print("    [PASS] Citizen logged in (existing)")
    else:
        assert res.status_code == 201, f"Registration failed: {res.text}"
        citizen_token = res.json()["access_token"]
        print("    [PASS] Citizen registered successfully")

    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # TEST 3: Admin Login
    print("\n[3] Testing Admin Authentication...")
    admin_login_res = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"    [PASS] Admin authenticated successfully: {settings.ADMIN_EMAIL}")

    # TEST 4: Role-Based Access Control (RBAC)
    print("\n[4] Testing Role Permissions & Security...")
    # Citizen trying to access admin endpoint should receive 403 Forbidden
    forbidden_res = client.get("/api/admin/dashboard", headers=citizen_headers)
    assert forbidden_res.status_code == 403, f"RBAC failed, expected 403 but got {forbidden_res.status_code}"
    print("    [PASS] RBAC enforced: Citizen blocked from /api/admin/dashboard (403 Forbidden)")

    # Unauthenticated request blocked with 401 Unauthorized
    unauth_res = client.get("/api/complaints/my")
    assert unauth_res.status_code == 401, f"Expected 401 but got {unauth_res.status_code}"
    print("    [PASS] Unauthenticated access blocked (401 Unauthorized)")

    # TEST 5: Rule-Based Duplicate Detection
    print("\n[5] Testing Rule-Based Duplicate Complaint Detection...")
    dup_res = client.post("/api/complaints/check-duplicate", json={
        "title": "Severe pothole cluster near Knowledge Park",
        "description": "Deep potholes causing two-wheelers to slip near the metro.",
        "category": "Road and potholes",
        "location": "Knowledge Park II, Greater Noida",
        "latitude": 28.4615,
        "longitude": 77.4965
    })
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    print(f"    [PASS] Duplicate check response: has_duplicates={dup_data['has_potential_duplicates']}")
    if dup_data['has_potential_duplicates']:
        print(f"      Matched existing: {dup_data['potential_matches'][0]['complaint_id']} (Score: {dup_data['potential_matches'][0]['similarity_score']})")

    # TEST 6: Complaint Submission with Photo & GPS Coordinates
    print("\n[6] Testing Complaint Submission & Image Upload...")
    dummy_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    dummy_image.name = "test_defect.png"

    form_data = {
        "title": "Broken storm water drain grate near Academic Block 3",
        "description": "Metal grill is bent and missing three bars, dangerous for walking students at night.",
        "category": "Drainage and sewage",
        "location": "Sharda University Campus, Near Block 3, Knowledge Park III",
        "latitude": "28.4735",
        "longitude": "77.4891"
    }

    submit_res = client.post(
        "/api/complaints",
        data=form_data,
        files={"photo": ("test_defect.png", dummy_image, "image/png")},
        headers=citizen_headers
    )
    assert submit_res.status_code == 201, f"Complaint submission failed: {submit_res.text}"
    created_complaint = submit_res.json()
    new_cid = created_complaint["complaint_id"]
    print(f"    [PASS] Complaint successfully created with ID: {new_cid}")
    print(f"      Image uploaded path: {created_complaint['image_path']}")
    assert created_complaint["image_path"] is not None
    assert created_complaint["status"] == "Submitted"

    # TEST 7: Citizen My Complaints List
    print("\n[7] Testing Citizen Complaints Dashboard Retrieval...")
    my_res = client.get("/api/complaints/my", headers=citizen_headers)
    assert my_res.status_code == 200
    my_list = my_res.json()
    assert any(c["complaint_id"] == new_cid for c in my_list)
    print(f"    [PASS] Citizen dashboard retrieved {len(my_list)} complaint(s) belonging to current user")

    # TEST 8: Tracking by Reference ID
    print(f"\n[8] Testing Public Tracking Endpoint for #{new_cid}...")
    track_res = client.get(f"/api/complaints/{new_cid}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["complaint_id"] == new_cid
    assert len(track_data["updates"]) >= 1
    print(f"    [PASS] Tracking retrieved successfully: Status '{track_data['status']}', Initial history logged")

    # TEST 9: Admin Dashboard & Status Transition
    print(f"\n[9] Testing Admin Operations & Status Workflow...")
    admin_dash = client.get("/api/admin/dashboard", headers=admin_headers)
    assert admin_dash.status_code == 200
    dash_json = admin_dash.json()
    print(f"    [PASS] Admin metrics loaded: Total {dash_json['stats']['total_complaints']} complaints across city")

    # Admin updates status to 'In Progress'
    status_update_res = client.put(
        f"/api/admin/complaints/{new_cid}/status",
        json={
            "new_status": "In Progress",
            "admin_note": "Campus Maintenance Division dispatched field crew with replacement cast-iron drain grate."
        },
        headers=admin_headers
    )
    assert status_update_res.status_code == 200
    updated_complaint = status_update_res.json()
    assert updated_complaint["status"] == "In Progress"
    print(f"    [PASS] Status updated to 'In Progress' with official municipal note")

    # Admin updates status to 'Resolved'
    resolve_res = client.put(
        f"/api/admin/complaints/{new_cid}/status",
        json={
            "new_status": "Resolved",
            "admin_note": "Drain grate replaced, welded securely, and tested for pedestrian safety."
        },
        headers=admin_headers
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "Resolved"
    print(f"    [PASS] Status updated to 'Resolved'")

    # TEST 10: In-App Notifications Verification
    print("\n[10] Testing In-App Notification System...")
    notif_res = client.get("/api/notifications", headers=citizen_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) >= 1
    target_notif = notifs[0]
    print(f"    [PASS] Citizen received notification: '{target_notif['message']}'")

    # Mark notification as read
    read_res = client.put(f"/api/notifications/{target_notif['id']}/read", headers=citizen_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True
    print(f"    [PASS] Notification #{target_notif['id']} marked as read successfully")

    # TEST 11: History Timeline Check
    print(f"\n[11] Verifying Final History Timeline for #{new_cid}...")
    history_res = client.get(f"/api/complaints/{new_cid}/history")
    assert history_res.status_code == 200
    history_items = history_res.json()
    assert len(history_items) >= 3  # Submitted, In Progress, Resolved
    print(f"    [PASS] Complete audit timeline recorded ({len(history_items)} milestone events):")
    for item in history_items:
        print(f"      - [{item['new_status']}]: {item['admin_note']}")

    print("\n=============================================================")
    print("[SUCCESS] ALL 11 TESTS PASSED PERFECTLY WITH 100% SUCCESS!")
    print("=============================================================")

if __name__ == "__main__":
    run_tests()
