from fastapi import APIRouter
from app.api.endpoints import auth, users, books, members, circulation, financial, barcode, dashboard, ai, audit, catalog

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(circulation.router, prefix="/circulation", tags=["circulation"])
api_router.include_router(financial.router, prefix="/financial", tags=["financial"])
api_router.include_router(barcode.router, prefix="/barcode", tags=["barcode"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])

