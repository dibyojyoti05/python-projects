import fitz
import os
from typing import List

class PDFConverterEngine:
    """Engine for converting PDF to other formats (e.g., Images, Text)."""

    @staticmethod
    def pdf_to_images(input_file: str, output_dir: str, image_format: str = "png") -> List[str]:
        """Convert each page of a PDF to an image."""
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        output_files = []
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        
        try:
            doc = fitz.open(input_file)
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Higher resolution
                out_path = os.path.join(output_dir, f"{base_name}_page_{page_num+1}.{image_format}")
                pix.save(out_path)
                output_files.append(out_path)
            doc.close()
            return output_files
        except Exception as e:
            raise RuntimeError(f"Failed to convert PDF to images: {e}")

    @staticmethod
    def extract_text(input_file: str, output_txt: str) -> bool:
        """Extract text from a PDF to a text file."""
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        try:
            doc = fitz.open(input_file)
            with open(output_txt, "w", encoding="utf-8") as f:
                for page in doc:
                    f.write(page.get_text("text"))
                    f.write("\n\n---\n\n")
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to extract text: {e}")

    @staticmethod
    def pdf_to_word(input_file: str, output_file: str) -> bool:
        """Convert PDF to Word document (.docx)."""
        try:
            from pdf2docx import Converter
            cv = Converter(input_file)
            cv.convert(output_file)
            cv.close()
            return True
        except ImportError:
            raise RuntimeError("pdf2docx is not installed.")
        except Exception as e:
            raise RuntimeError(f"Failed to convert PDF to Word: {e}")

    @staticmethod
    def pdf_to_excel(input_file: str, output_file: str) -> bool:
        """Extract tables from PDF to Excel document (.xlsx)."""
        try:
            import pdfplumber
            import pandas as pd
            
            tables = []
            with pdfplumber.open(input_file) as pdf:
                for page in pdf.pages:
                    table = page.extract_table()
                    if table:
                        tables.extend(table)
                        
            if not tables:
                raise ValueError("No tables found in the PDF.")
                
            df = pd.DataFrame(tables[1:], columns=tables[0])
            df.to_excel(output_file, index=False)
            return True
        except ImportError:
            raise RuntimeError("pdfplumber or pandas is not installed.")
        except Exception as e:
            raise RuntimeError(f"Failed to convert PDF to Excel: {e}")

