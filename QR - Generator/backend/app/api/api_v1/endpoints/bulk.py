import csv
import io
import zipfile
from fastapi import APIRouter, Depends, UploadFile, File, Response, HTTPException
from fastapi.responses import StreamingResponse
from app.services.qr_generator import generate_qr_code

router = APIRouter()

@router.get("/template")
async def download_csv_template():
    """
    Returns a sample CSV template for bulk QR code generation.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "destination_url"])
    writer.writerow(["Company Website", "https://example.com"])
    writer.writerow(["Product Support", "https://example.com/support"])
    writer.writerow(["Promo Campaign", "https://example.com/promo"])
    writer.writerow(["Contact Portal", "https://example.com/contact"])
    
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=qr_bulk_template.csv"}
    )

@router.post("/generate")
async def bulk_generate_zip(
    file: UploadFile = File(...),
    format: str = "png"
):
    """
    Upload CSV file and immediately stream back a ZIP archive with all generated QR codes.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
        
    contents = await file.read()
    try:
        text = contents.decode("utf-8-sig")  # handle BOM if present
    except Exception:
        text = contents.decode("latin-1")
        
    reader = csv.reader(io.StringIO(text))
    rows = [r for r in reader if r and any(cell.strip() for cell in r)]
    
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")
        
    # Check if first row is header
    first_row = rows[0]
    has_header = False
    if "url" in first_row[0].lower() or "name" in first_row[0].lower():
        has_header = True
        data_rows = rows[1:]
    else:
        data_rows = rows
        
    if not data_rows:
        raise HTTPException(status_code=400, detail="No data rows found in CSV")
        
    zip_buffer = io.BytesIO()
    ext = "png" if format.lower() == "png" else "svg"
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for idx, row in enumerate(data_rows, start=1):
            if len(row) >= 2:
                name = row[0].strip().replace("/", "_").replace("\\", "_")
                target = row[1].strip()
            else:
                name = f"qr_{idx:03d}"
                target = row[0].strip()
                
            if not target:
                continue
                
            qr_bytes, mime = generate_qr_code(target, {"scale": 10}, img_format=ext)
            filename = f"{idx:03d}_{name}.{ext}" if name else f"qr_{idx:03d}.{ext}"
            zip_file.writestr(filename, qr_bytes)
            
    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=generated_qr_codes.zip"}
    )
