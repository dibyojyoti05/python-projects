import fitz
import os
from typing import List, Tuple

class PDFSplitterEngine:
    """Engine for splitting PDF files and extracting pages."""

    @staticmethod
    def split_by_ranges(input_file: str, ranges: List[Tuple[int, int]], output_dir: str) -> List[str]:
        """
        Split a PDF by page ranges. Example ranges: [(1, 3), (4, 4), (5, 10)]
        Note: Ranges are 1-indexed for user input, but PyMuPDF is 0-indexed.
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        output_files = []
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        
        try:
            doc = fitz.open(input_file)
            for start, end in ranges:
                # Convert to 0-indexed PyMuPDF format
                idx_start = max(0, start - 1)
                idx_end = min(doc.page_count - 1, end - 1)
                
                if idx_start > idx_end:
                    continue
                    
                new_doc = fitz.open()
                new_doc.insert_pdf(doc, from_page=idx_start, to_page=idx_end)
                
                out_path = os.path.join(output_dir, f"{base_name}_pages_{start}-{end}.pdf")
                new_doc.save(out_path)
                new_doc.close()
                output_files.append(out_path)
            
            doc.close()
            return output_files
        except Exception as e:
            raise RuntimeError(f"Failed to split PDF: {e}")

    @staticmethod
    def extract_pages(input_file: str, pages: List[int], output_path: str) -> bool:
        """Extract specific pages into a new PDF."""
        try:
            doc = fitz.open(input_file)
            new_doc = fitz.open()
            
            for p in pages:
                idx = max(0, p - 1)
                if idx < doc.page_count:
                    new_doc.insert_pdf(doc, from_page=idx, to_page=idx)
                    
            new_doc.save(output_path)
            new_doc.close()
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to extract pages: {e}")
