from app.routers.auth import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.admin import router as admin_router
from app.routers.notifications import router as notifications_router

__all__ = ["auth_router", "complaints_router", "admin_router", "notifications_router"]
