import pytesseract
from pdf2image import convert_from_path
import os
import fitz

class OCRengine:
    """Engine for performing OCR on PDFs (via Tesseract)."""

    @staticmethod
    def ocr_to_text(input_file: str, output_txt: str) -> bool:
        """Convert a scanned PDF to a text file using OCR."""
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        try:
            # Convert PDF pages to PIL Images
            # Note: requires poppler installed on the system for pdf2image. 
            # PyMuPDF could also be used to extract images.
            doc = fitz.open(input_file)
            
            with open(output_txt, "w", encoding="utf-8") as f:
                for page_num in range(doc.page_count):
                    page = doc.load_page(page_num)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    # Save temporary image
                    temp_img_path = f"temp_ocr_page_{page_num}.png"
                    pix.save(temp_img_path)
                    
                    # Run OCR
                    text = pytesseract.image_to_string(temp_img_path)
                    f.write(text)
                    f.write("\n\n---\n\n")
                    
                    # Cleanup
                    os.remove(temp_img_path)
                    
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to perform OCR: {e}")
