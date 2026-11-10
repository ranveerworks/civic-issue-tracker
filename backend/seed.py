"""
Database Seed Script for Civic Issue Tracker
CSCR2600 - Sharda University
Populates realistic civic complaints, updates, and notifications for demonstration.
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Ensure backend path is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import engine, Base, SessionLocal, ACTIVE_DB_TYPE
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.models.notification import Notification
from app.core.security import hash_password
from app.core.config import settings

def seed_database():
    print(f"[*] Initializing tables on active database: {ACTIVE_DB_TYPE}...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed or fetch Admin
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                full_name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                mobile=settings.ADMIN_MOBILE,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[+] Admin account created: {admin.email} (Password: {settings.ADMIN_PASSWORD})")
        else:
            print(f"[=] Admin account already present: {admin.email}")

        # 2. Seed or fetch Citizens
        citizens_data = [
            ("Aarav Sharma", "citizen@example.com", "+91 9811223344", "Citizen@123"),
            ("Priya Verma", "priya.v@example.com", "+91 9822334455", "Citizen@123"),
            ("Rohan Gupta", "rohan.g@example.com", "+91 9833445566", "Citizen@123"),
        ]

        citizens = []
        for name, email, mobile, raw_pass in citizens_data:
            c = db.query(User).filter(User.email == email).first()
            if not c:
                c = User(
                    full_name=name,
                    email=email,
                    mobile=mobile,
                    password_hash=hash_password(raw_pass),
                    role="citizen"
                )
                db.add(c)
                db.commit()
                db.refresh(c)
                print(f"[+] Citizen account created: {email} (Password: {raw_pass})")
            citizens.append(c)

        # 3. Seed Realistic Complaints
        sample_complaints = [
            {
                "cid": "CIT-2026-A101",
                "user": citizens[0],
                "title": "Severe pothole cluster near Knowledge Park II Gate",
                "desc": "Multiple deep potholes stretching across 25 meters causing vehicles to brake suddenly. High risk of two-wheeler accidents during evening peak hours.",
                "cat": "Road and potholes",
                "loc": "Knowledge Park II, Greater Noida, near Metro Station",
                "lat": 28.4615,
                "lon": 77.4965,
                "status": "In Progress",
                "days_ago": 3,
                "history": [
                    ("Submitted", "Complaint registered by citizen with location coordinates.", citizens[0].id, 3),
                    ("Under Review", "Assigned to Greater Noida Road Maintenance Division.", admin.id, 2),
                    ("In Progress", "Inspection completed. Cold mix asphalt dispatched for patch work.", admin.id, 1),
                ]
            },
            {
                "cid": "CIT-2026-B202",
                "user": citizens[1],
                "title": "Overflowing municipal garbage dumpster at Sector Alpha 1",
                "desc": "The community waste bin has not been cleared for three consecutive days. Garbage is spilling onto the pedestrian sidewalk and attracting stray animals.",
                "cat": "Garbage and waste management",
                "loc": "Sector Alpha 1 Commercial Belt, Greater Noida",
                "lat": 28.4731,
                "lon": 77.5123,
                "status": "Resolved",
                "days_ago": 5,
                "history": [
                    ("Submitted", "Complaint registered by citizen with photo proof.", citizens[1].id, 5),
                    ("Under Review", "Notified Sanitation Inspector Zone-3.", admin.id, 4),
                    ("In Progress", "Compactor truck scheduled for prompt clearance.", admin.id, 3),
                    ("Resolved", "Waste cleared thoroughly and area disinfected with bleaching powder.", admin.id, 1),
                ]
            },
            {
                "cid": "CIT-2026-C303",
                "user": citizens[2],
                "title": "Continuous drinking water pipeline leakage on main road",
                "desc": "Clean water is gushing out of a cracked joint on the supply main, flooding the street and reducing water pressure to nearby residential towers.",
                "cat": "Water leakage",
                "loc": "Block B, Gamma 2 Main Road, Greater Noida",
                "lat": 28.4855,
                "lon": 77.5244,
                "status": "Under Review",
                "days_ago": 2,
                "history": [
                    ("Submitted", "Citizen submitted report with GPS marker.", citizens[2].id, 2),
                    ("Under Review", "Water board engineer alerted for valve isolation.", admin.id, 1),
                ]
            },
            {
                "cid": "CIT-2026-D404",
                "user": citizens[0],
                "title": "Non-functional streetlights across entire Sharda University Outer Ring",
                "desc": "Four continuous LED streetlights are dark after sunset, making the walkway pitch dark for students and pedestrians.",
                "cat": "Streetlight problems",
                "loc": "Plot No. 32-34, Knowledge Park III, Greater Noida",
                "lat": 28.4727,
                "lon": 77.4880,
                "status": "Submitted",
                "days_ago": 1,
                "history": [
                    ("Submitted", "Complaint registered by citizen.", citizens[0].id, 1),
                ]
            },
            {
                "cid": "CIT-2026-E505",
                "user": citizens[1],
                "title": "Open sewage drain cover causing hazard for pedestrians",
                "desc": "The concrete storm-drain slab is broken in half and open. At night pedestrians or cyclists could fall inside.",
                "cat": "Drainage and sewage",
                "loc": "Near Pari Chowk Roundabout, Greater Noida",
                "lat": 28.4639,
                "lon": 77.5186,
                "status": "In Progress",
                "days_ago": 4,
                "history": [
                    ("Submitted", "Complaint logged by citizen.", citizens[1].id, 4),
                    ("Under Review", "Sanitation department flagged high priority hazard.", admin.id, 3),
                    ("In Progress", "Barricades installed around open drain; replacement slab ordered.", admin.id, 2),
                ]
            },
            {
                "cid": "CIT-2026-F606",
                "user": citizens[2],
                "title": "Broken bench and damaged walkway inside Community Park",
                "desc": "Two concrete public benches have broken armrests and sharp rebar protruding, unsafe for senior citizens.",
                "cat": "Public infrastructure",
                "loc": "Delta 1 Central Park, Greater Noida",
                "lat": 28.4902,
                "lon": 77.5301,
                "status": "Rejected",
                "days_ago": 6,
                "history": [
                    ("Submitted", "Submitted by citizen.", citizens[2].id, 6),
                    ("Rejected", "Duplicate of existing work order #WO-9941. Parks department is already renovating this sector.", admin.id, 5),
                ]
            }
        ]

        now = datetime.now(timezone.utc)
        for sc in sample_complaints:
            existing = db.query(Complaint).filter(Complaint.complaint_id == sc["cid"]).first()
            if not existing:
                complaint_time = now - timedelta(days=sc["days_ago"])
                complaint = Complaint(
                    complaint_id=sc["cid"],
                    user_id=sc["user"].id,
                    title=sc["title"],
                    description=sc["desc"],
                    category=sc["cat"],
                    location=sc["loc"],
                    latitude=sc["lat"],
                    longitude=sc["lon"],
                    status=sc["status"],
                    created_at=complaint_time,
                    updated_at=now - timedelta(days=sc["days_ago"] // 2)
                )
                db.add(complaint)
                db.commit()
                db.refresh(complaint)

                # History items
                prev = None
                for new_st, note, uid, d_ago in sc["history"]:
                    up_time = now - timedelta(days=d_ago)
                    up = ComplaintUpdate(
                        complaint_id=complaint.id,
                        previous_status=prev,
                        new_status=new_st,
                        admin_note=note,
                        updated_by=uid,
                        created_at=up_time
                    )
                    db.add(up)
                    prev = new_st

                # Notification
                notif = Notification(
                    user_id=sc["user"].id,
                    complaint_id=complaint.id,
                    message=f"Update on #{complaint.complaint_id}: Current status is '{complaint.status}'",
                    is_read=(sc["status"] == "Resolved"),
                    created_at=now - timedelta(days=1)
                )
                db.add(notif)
                db.commit()
                print(f"[+] Seeded complaint {sc['cid']}: {sc['title'][:40]}... [{sc['status']}]")

        print("\n========================================================")
        print("[SUCCESS] DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("========================================================")
        print("Admin Credentials:")
        print(f"  Email:    {settings.ADMIN_EMAIL}")
        print(f"  Password: {settings.ADMIN_PASSWORD}")
        print("Demo Citizen Credentials:")
        print("  Email:    citizen@example.com")
        print("  Password: Citizen@123")
        print("========================================================")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
