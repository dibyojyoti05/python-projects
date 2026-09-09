import segno
import io
from typing import Dict, Any, Tuple

def generate_qr_code(data: str, customization: Dict[str, Any] = None, img_format: str = None) -> Tuple[bytes, str]:
    """
    Generates a QR code image (SVG or PNG) based on data and customization settings.
    Returns a tuple of (image_bytes, mime_type).
    """
    if customization is None:
        customization = {}
        
    error_level = customization.get('error_correction', 'h').lower()
    if error_level not in ('l', 'm', 'q', 'h'):
        error_level = 'h'
        
    qr = segno.make(data, error=error_level)
    
    # Process customization
    color = customization.get('color', '#0f172a')
    bg_color = customization.get('bg_color', '#ffffff')
    scale = int(customization.get('scale', 10))
    border = int(customization.get('border', 2))
    
    fmt = (img_format or customization.get('format', 'svg')).lower()
    if fmt == 'png':
        out = io.BytesIO()
        qr.save(out, kind='png', dark=color, light=bg_color, scale=scale, border=border)
        out.seek(0)
        return out.read(), "image/png"
    else:
        out = io.BytesIO()
        qr.save(out, kind='svg', dark=color, light=bg_color, scale=scale, border=border)
        out.seek(0)
        return out.read(), "image/svg+xml"
