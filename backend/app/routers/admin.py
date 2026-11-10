from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintStatusUpdate,
    ComplaintUpdateItem
)
from app.routers.deps import get_current_admin
from app.routers.complaints import format_complaint_response
from app.services.notification_service import create_notification

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(get_current_admin)])

@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    """Summary metrics and analytics for administrative dashboard"""
    # 1. Total counts by status
    total_complaints = db.query(Complaint).count()
    submitted_count = db.query(Complaint).filter(Complaint.status == "Submitted").count()
    under_review_count = db.query(Complaint).filter(Complaint.status == "Under Review").count()
    in_progress_count = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    resolved_count = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    rejected_count = db.query(Complaint).filter(Complaint.status == "Rejected").count()
    total_citizens = db.query(User).filter(User.role == "citizen").count()

    # 2. Category distribution
    cat_query = db.query(
        Complaint.category,
        func.count(Complaint.id).label("count")
    ).group_by(Complaint.category).all()
    
    category_distribution = [{"category": row[0], "count": row[1]} for row in cat_query]

    # 3. Monthly Trend (last 6 months, 100% portable across MySQL and SQLite)
    monthly_trend = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        target_year = now.year
        target_month = now.month - i
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        month_label = f"{target_year}-{target_month:02d}"
        
        start_date = datetime(target_year, target_month, 1)
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1)
        else:
            end_date = datetime(target_year, target_month + 1, 1)
            
        m_count = db.query(Complaint).filter(
            Complaint.created_at >= start_date,
            Complaint.created_at < end_date
        ).count()
        monthly_trend.append({"month": month_label, "count": m_count})

    # 4. Recent 6 complaints
    recent_complaints = db.query(Complaint).order_by(desc(Complaint.created_at)).limit(6).all()

    return {
        "stats": {
            "total_complaints": total_complaints,
            "submitted": submitted_count,
            "under_review": under_review_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count,
            "rejected": rejected_count,
            "total_citizens": total_citizens
        },
        "category_distribution": category_distribution,
        "monthly_trend": monthly_trend,
        "recent_complaints": [format_complaint_response(c) for c in recent_complaints]
    }

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_all_admin_complaints(
    status_filter: Optional[str] = Query(None),
    category_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Admin filterable view of all complaints across the city"""
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
                Complaint.location.ilike(search_pattern),
                Complaint.description.ilike(search_pattern)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()
    return [format_complaint_response(c) for c in complaints]

@router.put("/complaints/{complaint_identifier}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_identifier: str,
    status_data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Update complaint resolution status, append admin note,
    and dispatch an in-app notification to the citizen.
    """
    valid_statuses = {"Submitted", "Under Review", "In Progress", "Resolved", "Rejected"}
    if status_data.new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_data.new_status}'. Allowed: {', '.join(valid_statuses)}"
        )

    complaint = None
    if complaint_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(complaint_identifier)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_identifier.strip().upper()).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    prev_status = complaint.status
    complaint.status = status_data.new_status
    complaint.updated_at = datetime.now(timezone.utc)

    # Log in complaint_updates history table
    update_log = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=prev_status,
        new_status=status_data.new_status,
        admin_note=status_data.admin_note or f"Status changed from {prev_status} to {status_data.new_status}",
        updated_by=admin.id
    )
    db.add(update_log)

    # Notify citizen
    note_snippet = f": '{status_data.admin_note}'" if status_data.admin_note else "."
    create_notification(
        db=db,
        user_id=complaint.user_id,
        complaint_id=complaint.id,
        message=f"Update on #{complaint.complaint_id}: Status changed to [{status_data.new_status}]{note_snippet}"
    )

    db.commit()
    db.refresh(complaint)
    return format_complaint_response(complaint)

@router.get("/statistics")
def get_detailed_statistics(db: Session = Depends(get_db)):
    """Comprehensive analytics including resolution rate and category metrics"""
    total = db.query(Complaint).count()
    resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    cat_breakdown = db.query(
        Complaint.category,
        func.count(Complaint.id)
    ).group_by(Complaint.category).all()

    return {
        "total_complaints": total,
        "resolved_complaints": resolved,
        "resolution_rate_percent": resolution_rate,
        "categories": [{"name": c[0], "count": c[1]} for c in cat_breakdown]
    }
