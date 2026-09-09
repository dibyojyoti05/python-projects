from fastapi import Request
from typing import Dict, Any

def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers or fallback to client.host"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def parse_user_agent(request: Request) -> Dict[str, str]:
    """Basic extraction of OS and Device from User-Agent"""
    user_agent = request.headers.get("User-Agent", "").lower()
    
    # Basic OS detection
    os_name = "unknown"
    if "windows" in user_agent:
        os_name = "Windows"
    elif "mac" in user_agent:
        os_name = "MacOS"
    elif "android" in user_agent:
        os_name = "Android"
    elif "linux" in user_agent:
        os_name = "Linux"
    elif "iphone" in user_agent or "ipad" in user_agent:
        os_name = "iOS"
        
    # Basic Device detection
    device_type = "desktop"
    if "mobile" in user_agent or "android" in user_agent or "iphone" in user_agent:
        device_type = "mobile"
    elif "ipad" in user_agent or "tablet" in user_agent:
        device_type = "tablet"
        
    # Basic Browser detection
    browser = "unknown"
    if "chrome" in user_agent and "edg" not in user_agent:
        browser = "Chrome"
    elif "safari" in user_agent and "chrome" not in user_agent:
        browser = "Safari"
    elif "firefox" in user_agent:
        browser = "Firefox"
    elif "edg" in user_agent:
        browser = "Edge"
        
    return {
        "os": os_name,
        "device": device_type,
        "browser": browser
    }

def get_language(request: Request) -> str:
    """Extract language from Accept-Language header"""
    lang = request.headers.get("Accept-Language", "en")
    return lang.split(",")[0].split("-")[0].upper()
