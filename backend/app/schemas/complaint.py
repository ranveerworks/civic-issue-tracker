from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ComplaintUpdateItem(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    admin_note: Optional[str] = None
    updated_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=3, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintStatusUpdate(BaseModel):
    new_status: str
    admin_note: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    user_id: int
    title: str
    description: str
    category: str
    image_path: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    citizen_mobile: Optional[str] = None
    updates: List[ComplaintUpdateItem] = []

    class Config:
        from_attributes = True

class DuplicateMatch(BaseModel):
    complaint_id: str
    title: str
    category: str
    location: str
    distance_km: Optional[float] = None
    similarity_score: float
    status: str
    created_at: datetime

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DuplicateCheckResponse(BaseModel):
    has_potential_duplicates: bool
    potential_matches: List[DuplicateMatch] = []
    message: str
