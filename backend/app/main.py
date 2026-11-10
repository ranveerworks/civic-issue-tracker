import os
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database import engine, Base, get_db, ACTIVE_DB_TYPE
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.models.notification import Notification
from app.core.security import hash_password
from app.routers import auth_router, complaints_router, admin_router, notifications_router

# Initialize FastAPI application
app = FastAPI(
    title="Civic Issue Tracker API",
    description="Backend REST API for Civic Issue Tracker - University PBL Project for Sharda University (CSCR2600).",
    version=settings.PROJECT_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    """Create database tables and seed baseline admin if needed"""
    try:
        # Create all defined tables in the active engine
        Base.metadata.create_all(bind=engine)
        
        # Check and create default admin
        from app.database import SessionLocal
        db: Session = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
            if not admin_user:
                new_admin = User(
                    full_name=settings.ADMIN_NAME,
                    email=settings.ADMIN_EMAIL,
                    mobile=settings.ADMIN_MOBILE,
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    role="admin"
                )
                db.add(new_admin)
                db.commit()
                print(f"Created default admin user: {settings.ADMIN_EMAIL}")

            # Check and create default demo citizen
            citizen = db.query(User).filter(User.email == "citizen@example.com").first()
            if not citizen:
                demo_citizen = User(
                    full_name="Aarav Sharma",
                    email="citizen@example.com",
                    mobile="+91 9811223344",
                    password_hash=hash_password("Citizen@123"),
                    role="citizen"
                )
                db.add(demo_citizen)
                db.commit()
                print("Created default demo citizen: citizen@example.com")
        finally:
            db.close()
    except Exception as e:
        print(f"Startup initialization note: {e}")

@app.get("/")
def root():
    return {
        "message": "Welcome to Civic Issue Tracker API",
        "tagline": "Smart Reporting • Tracking • Resolution",
        "institution": "Sharda University, CSCR2600 - Project-Based Learning",
        "documentation": "/docs",
        "status": "operational"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database_type": ACTIVE_DB_TYPE,
        "database_url_configured": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured",
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }
