import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintUpdateItem,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
)
from app.routers.deps import get_current_user
from app.services.duplicate_detection import detect_duplicate_complaints
from app.services.notification_service import create_notification
from app.core.config import settings

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def format_complaint_response(complaint: Complaint) -> dict:
    """Helper to convert Complaint ORM to response dict with citizen details and updates"""
    updates_list = []
    for u in complaint.updates:
        admin_name = u.admin_user.full_name if u.admin_user else "System"
        updates_list.append(
            ComplaintUpdateItem(
                id=u.id,
                previous_status=u.previous_status,
                new_status=u.new_status,
                admin_note=u.admin_note,
                updated_by_name=admin_name,
                created_at=u.created_at
            )
        )
    
    return {
        "id": complaint.id,
        "complaint_id": complaint.complaint_id,
        "user_id": complaint.user_id,
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "image_path": complaint.image_path,
        "location": complaint.location,
        "latitude": float(complaint.latitude) if complaint.latitude is not None else None,
        "longitude": float(complaint.longitude) if complaint.longitude is not None else None,
        "status": complaint.status,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "citizen_name": complaint.user.full_name if complaint.user else "Citizen",
        "citizen_email": complaint.user.email if complaint.user else "",
        "citizen_mobile": complaint.user.mobile if complaint.user else "",
        "updates": updates_list
    }

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate(data: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """Rule-based duplicate issue detection before submission"""
    matches = detect_duplicate_complaints(
        db=db,
        category=data.category,
        title=data.title,
        description=data.description,
        location_text=data.location,
        latitude=data.latitude,
        longitude=data.longitude
    )
    if matches:
        return DuplicateCheckResponse(
            has_potential_duplicates=True,
            potential_matches=matches,
            message=f"Found {len(matches)} similar existing report(s) nearby or with matching categories. You can still submit your complaint if yours is a distinct problem."
        )
    return DuplicateCheckResponse(
        has_potential_duplicates=False,
        potential_matches=[],
        message="No duplicate complaints found for this area and issue type."
    )

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    title: str = Form(..., min_length=5, max_length=200),
    description: str = Form(..., min_length=10),
    category: str = Form(...),
    location: str = Form(..., min_length=3, max_length=255),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a new civic complaint with optional photograph and GPS coordinates.
    Generates a unique complaint reference code (e.g., CIT-2026-XXXX).
    """
    image_rel_path = None
    if photo and photo.filename:
        # Validate mime type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        file_ext = os.path.splitext(photo.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format ({file_ext}). Allowed: jpg, jpeg, png, webp."
            )
        
        # Ensure uploads folder exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}{file_ext}"
        destination_path = settings.UPLOAD_DIR / filename
        
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        image_rel_path = f"/uploads/{filename}"

    # Generate unique complaint ID: CIT-YYYY-RANDOM
    unique_suffix = uuid.uuid4().hex[:6].upper()
    complaint_code = f"CIT-2026-{unique_suffix}"

    new_complaint = Complaint(
        complaint_id=complaint_code,
        user_id=current_user.id,
        title=title.strip(),
        description=description.strip(),
        category=category.strip(),
        image_path=image_rel_path,
        location=location.strip(),
        latitude=latitude,
        longitude=longitude,
        status="Submitted"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Initial update record in history
    initial_update = ComplaintUpdate(
        complaint_id=new_complaint.id,
        previous_status=None,
        new_status="Submitted",
        admin_note="Complaint registered successfully by citizen.",
        updated_by=current_user.id
    )
    db.add(initial_update)

    # Dispatch notification to citizen
    create_notification(
        db=db,
        user_id=current_user.id,
        complaint_id=new_complaint.id,
        message=f"Your complaint #{new_complaint.complaint_id} ('{new_complaint.title[:40]}...') has been successfully submitted."
    )

    db.commit()
    db.refresh(new_complaint)

    return format_complaint_response(new_complaint)

@router.get("/my", response_model=List[ComplaintResponse])
def get_my_complaints(
    status_filter: Optional[str] = Query(None),
    category_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all complaints submitted by the currently logged-in citizen"""
    query = db.query(Complaint).filter(Complaint.user_id == current_user.id)

    if status_filter and status_filter != "All":
        query = query.filter(Complaint.status == status_filter)
    if category_filter and category_filter != "All":
        query = query.filter(Complaint.category == category_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.complaint_id.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.location.ilike(search_pattern),
                Complaint.description.ilike(search_pattern)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).all()
    return [format_complaint_response(c) for c in complaints]

@router.get("", response_model=List[ComplaintResponse])
def get_public_complaints(
    status_filter: Optional[str] = Query(None),
    category_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Public feed of civic complaints for community transparency"""
    query = db.query(Complaint)

    if status_filter and status_filter != "All":
        query = query.filter(Complaint.status == status_filter)
    if category_filter and category_filter != "All":
        query = query.filter(Complaint.category == category_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.complaint_id.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.location.ilike(search_pattern)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()
    return [format_complaint_response(c) for c in complaints]

@router.get("/{complaint_identifier}", response_model=ComplaintResponse)
def get_complaint_detail(complaint_identifier: str, db: Session = Depends(get_db)):
    """
    Search and retrieve complaint by unique complaint_id (e.g. CIT-2026-XXXX) or integer ID.
    Used for public tracking and detailed views.
    """
    complaint = None
    if complaint_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(complaint_identifier)).first()
    
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_identifier.strip().upper()).first()
        
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with reference ID '{complaint_identifier}' not found."
        )

    return format_complaint_response(complaint)

@router.get("/{complaint_identifier}/history", response_model=List[ComplaintUpdateItem])
def get_complaint_history(complaint_identifier: str, db: Session = Depends(get_db)):
    """Fetch status update timeline and administrative notes for a complaint"""
    complaint = None
    if complaint_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(complaint_identifier)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_identifier.strip().upper()).first()
        
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    updates = db.query(ComplaintUpdate).filter(
        ComplaintUpdate.complaint_id == complaint.id
    ).order_by(desc(ComplaintUpdate.created_at)).all()

    result = []
    for u in updates:
        admin_name = u.admin_user.full_name if u.admin_user else "System"
        result.append(
            ComplaintUpdateItem(
                id=u.id,
                previous_status=u.previous_status,
                new_status=u.new_status,
                admin_note=u.admin_note,
                updated_by_name=admin_name,
                created_at=u.created_at
            )
        )
    return result

@router.put("/{complaint_identifier}", response_model=ComplaintResponse)
def update_citizen_complaint(
    complaint_identifier: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizens can edit their submitted complaint while it is still 'Submitted'"""
    complaint = None
    if complaint_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(complaint_identifier)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_identifier.strip().upper()).first()
        
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    if complaint.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to edit this complaint.")
        
    if complaint.status != "Submitted" and current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Complaints under review or in progress cannot be modified by citizen.")

    if title:
        complaint.title = title.strip()
    if description:
        complaint.description = description.strip()
    if location:
        complaint.location = location.strip()

    db.commit()
    db.refresh(complaint)
    return format_complaint_response(complaint)
