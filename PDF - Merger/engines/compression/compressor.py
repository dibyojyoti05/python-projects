import fitz
import os

class PDFCompressorEngine:
    """Engine for compressing PDF files."""

    @staticmethod
    def compress_pdf(input_file: str, output_file: str) -> bool:
        """
        Compress PDF using PyMuPDF's built-in garbage collection and deflate.
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        try:
            doc = fitz.open(input_file)
            
            # Save options:
            # garbage=4: removes unused objects, compacts xref
            # deflate=True: compress streams
            # clean=True: clean up content streams
            doc.save(output_file, garbage=4, deflate=True, clean=True)
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to compress PDF: {e}")
