import shutil
from pathlib import Path
from typing import Tuple, Union, BinaryIO
import pypdf
import docx

from app.config.settings import settings
from app.utils.logger import logger
from app.utils.security import sanitize_filename, compute_file_hash
from app.utils.validators import validate_file_type, validate_file_size


class FileService:
    """Handles file saving, validation, text extraction, and temporary audio handling."""

    @staticmethod
    def save_uploaded_file(
        uploaded_file, destination_dir: Path = None
    ) -> Tuple[Path, str, str, int]:
        """
        Saves an uploaded file safely.
        Returns (saved_path, sanitized_filename, file_hash, file_size_bytes).
        """
        dest_dir = destination_dir or settings.UPLOAD_DIR
        dest_dir.mkdir(parents=True, exist_ok=True)

        original_name = getattr(uploaded_file, "name", "uploaded_file.txt")
        clean_name = sanitize_filename(original_name)

        # Compute hash and size
        if hasattr(uploaded_file, "getvalue"):
            content_bytes = uploaded_file.getvalue()
        elif hasattr(uploaded_file, "read"):
            uploaded_file.seek(0)
            content_bytes = uploaded_file.read()
            uploaded_file.seek(0)
        else:
            raise ValueError("Invalid uploaded file object")

        file_size = len(content_bytes)
        file_hash = compute_file_hash(content_bytes)

        # Validate
        is_valid_type, category, type_err = validate_file_type(clean_name)
        if not is_valid_type:
            raise ValueError(type_err)

        is_valid_size, size_err = validate_file_size(file_size)
        if not is_valid_size:
            raise ValueError(size_err)

        # Save with unique timestamp or hash prefix to prevent overwriting
        save_path = dest_dir / f"{file_hash[:10]}_{clean_name}"
        with open(save_path, "wb") as f:
            f.write(content_bytes)

        logger.info(f"Saved file {clean_name} ({file_size} bytes, category: {category}) to {save_path}")
        return save_path, clean_name, file_hash, file_size

    @staticmethod
    def extract_text_from_file(file_path: Path) -> str:
        """
        Extract text from TXT, MD, DOCX, or PDF files.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = file_path.suffix.lower()
        logger.info(f"Extracting text from {file_path.name} (type: {ext})")

        try:
            if ext in [".txt", ".md"]:
                return FileService._extract_from_txt(file_path)
            elif ext == ".docx":
                return FileService._extract_from_docx(file_path)
            elif ext == ".pdf":
                return FileService._extract_from_pdf(file_path)
            else:
                raise ValueError(f"Direct text extraction is not supported for extension '{ext}'")
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {e}")
            raise

    @staticmethod
    def _extract_from_txt(file_path: Path) -> str:
        # Try UTF-8 first, fallback to Latin-1
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
        raise ValueError(f"Unable to decode text file {file_path.name} with standard encodings.")

    @staticmethod
    def _extract_from_docx(file_path: Path) -> str:
        doc = docx.Document(str(file_path))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    full_text.append(" | ".join(row_text))
        return "\n\n".join(full_text)

    @staticmethod
    def _extract_from_pdf(file_path: Path) -> str:
        full_text = []
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception:
                    raise ValueError("Encrypted PDF files are not supported.")

            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    full_text.append(page_text.strip())

        if not full_text:
            raise ValueError("PDF file contains no readable text (it may be scanned/image-only).")

        return "\n\n".join(full_text)

