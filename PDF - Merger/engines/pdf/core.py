import fitz  # PyMuPDF
import os
from typing import Dict, Any, List

class PDFCoreEngine:
    """Core Engine for reading and extracting basic PDF information."""

    @staticmethod
    def get_metadata(file_path: str) -> Dict[str, Any]:
        """Extract metadata from a PDF."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            doc = fitz.open(file_path)
            metadata = doc.metadata
            doc.close()
            return metadata
        except Exception as e:
            raise RuntimeError(f"Failed to read metadata: {e}")

    @staticmethod
    def get_page_count(file_path: str) -> int:
        """Get the total number of pages in a PDF."""
        try:
            doc = fitz.open(file_path)
            count = doc.page_count
            doc.close()
            return count
        except Exception as e:
            raise RuntimeError(f"Failed to get page count: {e}")

    @staticmethod
    def render_page_to_image(file_path: str, page_num: int, zoom_matrix: fitz.Matrix = fitz.Matrix(2, 2)):
        """Render a specific PDF page to a QPixmap (or raw bytes) for UI display."""
        try:
            doc = fitz.open(file_path)
            if page_num < 0 or page_num >= doc.page_count:
                raise ValueError("Invalid page number")
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=zoom_matrix)
            doc.close()
            return pix.tobytes("ppm") # Returning bytes to be converted to QImage in UI
        except Exception as e:
            raise RuntimeError(f"Failed to render page: {e}")
