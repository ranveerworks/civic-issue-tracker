"""
Live End-to-End API Test against running FastAPI server
Tests: Auth, Duplicate detection, Complaints submission with photo, Tracking,
Admin operations, Status change, RBAC, Notifications.
"""
import requests
import io
import time

BASE_URL = "http://127.0.0.1:8000"

def run_live_tests():
    print("=============================================================")
    print("[TEST SUITE] RUNNING LIVE HTTP END-TO-END TESTS")
    print("=============================================================\n")

    # 1. Health check
    print("[1] Testing Root & Health Check...")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"    [PASS] Health check: {r.json()}")

    # 2. Citizen Registration / Login
    print("\n[2] Testing Citizen Authentication...")
    citizen_email = "citizen@example.com"
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": citizen_email,
        "password": "Citizen@123"
    })
    assert login_res.status_code == 200, f"Citizen login failed: {login_res.text}"
    citizen_token = login_res.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
    print("    [PASS] Citizen logged in successfully: citizen@example.com")

    # 3. Admin Authentication
    print("\n[3] Testing Admin Authentication...")
    admin_login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@civictracker.gov.in",
        "password": "Admin@123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("    [PASS] Admin logged in successfully: admin@civictracker.gov.in")

    # 4. RBAC Check
    print("\n[4] Testing Role Permissions (RBAC)...")
    forbidden = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=citizen_headers)
    assert forbidden.status_code == 403, f"Expected 403, got {forbidden.status_code}"
    print("    [PASS] Citizen blocked from Admin Dashboard (403 Forbidden)")

    # 5. Rule-based duplicate check
    print("\n[5] Testing Rule-Based Duplicate Complaint Detection...")
    dup_res = requests.post(f"{BASE_URL}/api/complaints/check-duplicate", json={
        "title": "Severe pothole cluster near Knowledge Park",
        "description": "Deep potholes causing two-wheelers to slip near the metro.",
        "category": "Road and potholes",
        "location": "Knowledge Park II, Greater Noida",
        "latitude": 28.4615,
        "longitude": 77.4965
    })
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    print(f"    [PASS] Duplicate detection active: has_potential_duplicates={dup_data['has_potential_duplicates']}")

    # 6. Complaint Submission with Photo & GPS
    print("\n[6] Testing Complaint Submission with Photo Upload & GPS...")
    dummy_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    
    files = {"photo": ("drain_defect.png", dummy_image.getvalue(), "image/png")}
    data = {
        "title": "Live Test: Broken drain cover near Sharda University Gate 3",
        "description": "Hazardous open storm drain cover near the student pedestrian crosswalk.",
        "category": "Drainage and sewage",
        "location": "Knowledge Park III, Near Gate 3, Sharda University",
        "latitude": 28.4727,
        "longitude": 77.4880
    }
    submit_res = requests.post(f"{BASE_URL}/api/complaints", data=data, files=files, headers=citizen_headers)
    assert submit_res.status_code == 201, f"Complaint submission failed: {submit_res.text}"
    created = submit_res.json()
    new_cid = created["complaint_id"]
    print(f"    [PASS] Complaint created successfully: #{new_cid}")
    print(f"           Photo saved at: {created['image_path']}")
    assert created["image_path"] is not None

    # 7. Citizen My Complaints
    print("\n[7] Testing Citizen Complaints Listing...")
    my_res = requests.get(f"{BASE_URL}/api/complaints/my", headers=citizen_headers)
    assert my_res.status_code == 200
    my_complaints = my_res.json()
    assert any(c["complaint_id"] == new_cid for c in my_complaints)
    print(f"    [PASS] Citizen retrieved {len(my_complaints)} personal complaints")

    # 8. Public Tracking
    print(f"\n[8] Testing Public Tracking for #{new_cid}...")
    track_res = requests.get(f"{BASE_URL}/api/complaints/{new_cid}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["complaint_id"] == new_cid
    assert track_data["status"] == "Submitted"
    print(f"    [PASS] Tracking verified: Status '{track_data['status']}'")

    # 9. Admin Dashboard & Status Update
    print("\n[9] Testing Admin Operations & Status Progression...")
    admin_dash = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
    assert admin_dash.status_code == 200
    print(f"    [PASS] Admin metrics: {admin_dash.json()['stats']['total_complaints']} total complaints in database")

    # Update to In Progress
    up_res1 = requests.put(
        f"{BASE_URL}/api/admin/complaints/{new_cid}/status",
        json={
            "new_status": "In Progress",
            "admin_note": "Assigned to Municipal Sanitation Crew 4. Replacement slab scheduled for afternoon installation."
        },
        headers=admin_headers
    )
    assert up_res1.status_code == 200
    print(f"    [PASS] Status progressed to 'In Progress'")

    # Update to Resolved
    up_res2 = requests.put(
        f"{BASE_URL}/api/admin/complaints/{new_cid}/status",
        json={
            "new_status": "Resolved",
            "admin_note": "Drain cover replaced and barricades removed. Area verified safe."
        },
        headers=admin_headers
    )
    assert up_res2.status_code == 200
    print(f"    [PASS] Status progressed to 'Resolved'")

    # 10. Notifications
    print("\n[10] Testing In-App Citizen Notifications...")
    notif_res = requests.get(f"{BASE_URL}/api/notifications", headers=citizen_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) >= 1
    print(f"    [PASS] Citizen received update notification: '{notifs[0]['message']}'")

    # 11. Final History Timeline
    print(f"\n[11] Verifying Status History Timeline for #{new_cid}...")
    hist_res = requests.get(f"{BASE_URL}/api/complaints/{new_cid}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 3
    print(f"    [PASS] Audit history recorded {len(history)} status changes:")
    for h in history:
        print(f"           - [{h['new_status']}]: {h['admin_note']}")

    print("\n=============================================================")
    print("[SUCCESS] ALL 11 LIVE HTTP TESTS PASSED WITH 100% SUCCESS!")
    print("=============================================================")

if __name__ == "__main__":
    run_live_tests()
