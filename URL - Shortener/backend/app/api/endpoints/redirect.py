from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.api import deps
from app.models.link import Link
from app.models.analytics import ClickEvent
from app.utils.request_parser import parse_user_agent, get_client_ip, get_language
from app.core import security
from pydantic import BaseModel

router = APIRouter()

class UnlockRequest(BaseModel):
    password: str

@router.post("/{short_code}/unlock")
async def unlock_link(
    short_code: str,
    payload: UnlockRequest,
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    query = select(Link).where(or_(Link.short_code == short_code, Link.custom_slug == short_code))
    result = await db.execute(query)
    link = result.scalars().first()

    if not link or not link.password_hash:
        raise HTTPException(status_code=404, detail="Link not found or not protected")
        
    if not security.verify_password(payload.password, link.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")
        
    # Return destination (Ideally apply geo rules here too if needed, but for simplicity we return original_url)
    return {"destination": link.original_url}

@router.get("/{short_code}")
async def handle_redirect(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    High-speed redirection engine handling custom slugs or short codes.
    Evaluates dynamic rules (device, os, language, expiration).
    """
    # 1. Lookup Link (Check cache here in a real production setup)
    query = select(Link).where(or_(Link.short_code == short_code, Link.custom_slug == short_code))
    result = await db.execute(query)
    link = result.scalars().first()

    if not link:
        # Redirect to a frontend 404 page
        return RedirectResponse(url=f"{request.base_url}404")

    # 2. Check Active Status
    if not link.is_active or link.is_archived:
        return RedirectResponse(url=f"{request.base_url}inactive")

    # 3. Check Expirations & Activations
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if link.activates_at and now < link.activates_at.replace(tzinfo=None):
        return RedirectResponse(url=f"{request.base_url}inactive")
    if link.expires_at and now > link.expires_at.replace(tzinfo=None):
        return RedirectResponse(url=f"{request.base_url}expired")

    # 4. Check Click Limit
    # Note: For high traffic, this requires an atomic Redis counter
    query_clicks = select(ClickEvent).where(ClickEvent.link_id == link.id)
    result_clicks = await db.execute(query_clicks)
    total_clicks = len(result_clicks.scalars().all())
    
    if link.click_limit and total_clicks >= link.click_limit:
        return RedirectResponse(url=f"{request.base_url}limit-reached")

    # 5. Check Password Protection
    if link.password_hash:
        # Redirect to a special gateway page on the frontend to enter the password
        # Passing short_code so frontend knows which link to unlock
        frontend_url = "http://localhost:3000" # In prod, read from config
        return RedirectResponse(url=f"{frontend_url}/p/{short_code}")

    # 6. Parse Client Properties
    user_agent_data = parse_user_agent(request)
    client_ip = get_client_ip(request)
    lang = get_language(request)
    
    # Simple Geo Mock (In prod, use MaxMind GeoIP with the client_ip)
    country = "US" if client_ip == "127.0.0.1" else "UNKNOWN"

    # 7. Apply Dynamic Routing Rules
    destination = link.original_url

    if link.device_routing and user_agent_data["device"] in link.device_routing:
        destination = link.device_routing[user_agent_data["device"]]
    elif link.os_routing and user_agent_data["os"] in link.os_routing:
        destination = link.os_routing[user_agent_data["os"]]
    elif link.language_routing and lang in link.language_routing:
        destination = link.language_routing[lang]
    elif link.geo_routing and country in link.geo_routing:
        destination = link.geo_routing[country]

    # 8. Record Analytics
    click_event = ClickEvent(
        link_id=link.id,
        ip_address=client_ip,
        country=country,
        device_type=user_agent_data["device"],
        browser=user_agent_data["browser"],
        os=user_agent_data["os"],
        referrer=request.headers.get("referer")
    )
    db.add(click_event)
    await db.commit()

    # Engagement milestone notification
    new_total = total_clicks + 1
    if link.created_by and new_total in [1, 5, 10, 25, 50, 100, 500, 1000]:
        try:
            from app.api.endpoints.notifications import create_and_push_notification
            await create_and_push_notification(
                user_id=link.created_by,
                title="Link Engagement Milestone! 🚀",
                message=f"Your short link /{short_code} just reached {new_total} click{'s' if new_total > 1 else ''}!",
                db=db
            )
        except Exception:
            pass

    # 9. Perform Redirect
    return RedirectResponse(url=destination, status_code=302)

