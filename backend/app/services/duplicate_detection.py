import math
import re
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.schemas.complaint import DuplicateMatch

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def tokenize(text: str) -> set:
    """Normalize text into lowercase keyword tokens (excluding short stopwords)"""
    stopwords = {"the", "a", "an", "in", "on", "at", "for", "of", "and", "is", "are", "to", "this", "there", "near"}
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return {w for w in words if w not in stopwords}

def jaccard_similarity(text1: str, text2: str) -> float:
    """Calculate Jaccard token similarity between two text strings"""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def detect_duplicate_complaints(
    db: Session,
    category: str,
    title: str,
    description: str,
    location_text: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    exclude_complaint_id: Optional[str] = None,
    max_results: int = 4
) -> List[DuplicateMatch]:
    """
    Rule-based civic issue duplicate detection.
    Evaluates:
    1. Category matching.
    2. Proximity via Haversine distance (under 0.8 km considered nearby).
    3. Title & description word-level Jaccard similarity.
    4. Location string token overlap.
    """
    # Fetch active / recent complaints in the same category or overall active complaints
    query = db.query(Complaint).filter(Complaint.status.in_(["Submitted", "Under Review", "In Progress"]))
    if exclude_complaint_id:
        query = query.filter(Complaint.complaint_id != exclude_complaint_id)
    
    candidates = query.all()
    matches: List[DuplicateMatch] = []
    
    combined_new_text = f"{title} {description} {location_text}"

    for c in candidates:
        same_category = (c.category.strip().lower() == category.strip().lower())
        
        # Calculate distance if coordinates exist
        dist_km: Optional[float] = None
        is_nearby = False
        if (latitude is not None and longitude is not None and 
            c.latitude is not None and c.longitude is not None):
            try:
                dist_km = haversine_distance(latitude, longitude, float(c.latitude), float(c.longitude))
                if dist_km <= 0.8:  # within 800m
                    is_nearby = True
            except (ValueError, TypeError):
                dist_km = None

        # Text similarity on title & description
        combined_existing_text = f"{c.title} {c.description} {c.location}"
        text_sim = jaccard_similarity(combined_new_text, combined_existing_text)
        title_sim = jaccard_similarity(title, c.title)

        # Composite rule-based score
        score = 0.0
        if same_category:
            score += 0.35
        if is_nearby:
            # Scale distance score (closer = higher score, max +0.45)
            score += max(0.0, 0.45 - (dist_km * 0.4))
        score += (text_sim * 0.35) + (title_sim * 0.25)

        # Cap score between 0.0 and 1.0
        final_score = min(1.0, round(score, 2))

        # Flag as potential duplicate if score is above threshold or nearby in same category
        if final_score >= 0.45 or (same_category and is_nearby):
            matches.append(
                DuplicateMatch(
                    complaint_id=c.complaint_id,
                    title=c.title,
                    category=c.category,
                    location=c.location,
                    distance_km=round(dist_km, 2) if dist_km is not None else None,
                    similarity_score=final_score,
                    status=c.status,
                    created_at=c.created_at
                )
            )

    # Sort matches by similarity score descending
    matches.sort(key=lambda m: m.similarity_score, reverse=True)
    return matches[:max_results]
