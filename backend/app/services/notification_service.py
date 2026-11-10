from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(
    db: Session,
    user_id: int,
    message: str,
    complaint_id: Optional[int] = None
) -> Notification:
    """Helper to dispatch in-app notifications to a user"""
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        message=message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
