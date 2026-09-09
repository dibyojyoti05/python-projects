import fitz
import os
from typing import List

class PDFMergerEngine:
    """Engine for merging multiple PDF files into one."""

    @staticmethod
    def merge_pdfs(input_files: List[str], output_path: str) -> bool:
        """
        Merge a list of PDF files into a single PDF.
        """
        if not input_files:
            raise ValueError("No input files provided for merging.")
            
        try:
            result_doc = fitz.open()
            for file_path in input_files:
                if not os.path.exists(file_path):
                    continue
                doc = fitz.open(file_path)
                result_doc.insert_pdf(doc)
                doc.close()
                
            result_doc.save(output_path, garbage=4, deflate=True) # Optimized save
            result_doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to merge PDFs: {e}")
