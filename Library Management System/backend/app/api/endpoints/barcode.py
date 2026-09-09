from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
import barcode
from barcode.writer import ImageWriter
import qrcode

router = APIRouter()

@router.get("/generate/barcode/{code}")
async def generate_barcode(code: str):
    try:
        EAN = barcode.get_barcode_class('code128')
        ean = EAN(code, writer=ImageWriter())
        buffer = io.BytesIO()
        ean.write(buffer)
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generate/qr/{code}")
async def generate_qr(code: str):
    try:
        img = qrcode.make(code)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
