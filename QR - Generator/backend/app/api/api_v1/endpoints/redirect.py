from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.api import deps
from app.models.qr_code import QRCode
from app.models.scan import Scan

router = APIRouter()

def parse_user_agent(ua_string: str):
    """Simple, lightweight user agent parser."""
    if not ua_string:
        return "Unknown", "Unknown", "Desktop"
    
    ua = ua_string.lower()
    
    # Device
    if "ipad" in ua or "tablet" in ua:
        device = "Tablet"
    elif "mobi" in ua or "iphone" in ua or "android" in ua:
        device = "Mobile"
    else:
        device = "Desktop"
        
    # OS
    if "windows" in ua:
        os = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os = "iOS"
    elif "android" in ua:
        os = "Android"
    elif "linux" in ua:
        os = "Linux"
    else:
        os = "Other"
        
    # Browser
    if "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua or "crios" in ua:
        browser = "Chrome"
    elif "safari" in ua:
        browser = "Safari"
    elif "firefox" in ua or "fxios" in ua:
        browser = "Firefox"
    elif "opera" in ua or "opr" in ua:
        browser = "Opera"
    else:
        browser = "Other"
        
    return browser, os, device

@router.get("/{short_code}")
async def handle_redirect(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Handles dynamic QR code redirects, logs analytics, and sends user to destination.
    """
    stmt = select(QRCode).where(QRCode.short_code == short_code)
    result = await db.execute(stmt)
    qr_code = result.scalar_one_or_none()
    
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    if not qr_code.is_active:
        raise HTTPException(status_code=403, detail="This QR Code has been deactivated")
        
    if qr_code.expires_at and qr_code.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This QR Code has expired")
        
    # Parse analytics telemetry
    raw_ua = request.headers.get("user-agent", "")
    browser, os, device_type = parse_user_agent(raw_ua)
    client_ip = request.client.host if request.client else None
    referrer = request.headers.get("referer")
    
    # Extract query params (UTM tags)
    utm_source = request.query_params.get("utm_source")
    utm_medium = request.query_params.get("utm_medium")
    utm_campaign = request.query_params.get("utm_campaign")
    
    # Log the scan event
    scan = Scan(
        qr_code_id=qr_code.id,
        ip_address=client_ip,
        browser=browser,
        os=os,
        device_type=device_type,
        referrer=referrer,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        raw_user_agent=raw_ua[:500] if raw_ua else None,
        country="Local" if client_ip in ("127.0.0.1", "localhost", "::1") else "Online"
    )
    db.add(scan)
    await db.commit()
    
    destination = qr_code.destination_url or qr_code.raw_data or "https://google.com"
    if not destination.startswith("http://") and not destination.startswith("https://"):
        destination = f"https://{destination}"
        
    return RedirectResponse(url=destination, status_code=307)
