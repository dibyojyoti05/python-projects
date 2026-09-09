import os
import fitz
import pytest
import shutil
from engines.pdf.core import PDFCoreEngine
from engines.merge.merger import PDFMergerEngine
from engines.split.splitter import PDFSplitterEngine
from engines.compression.compressor import PDFCompressorEngine
from engines.conversion.converter import PDFConverterEngine
from engines.security.security_engine import PDFSecurityEngine

@pytest.fixture
def sample_pdf_files(tmp_path):
    """Fixture to generate test PDF files in a temporary directory."""
    pdf1 = str(tmp_path / "doc1.pdf")
    pdf2 = str(tmp_path / "doc2.pdf")

    # Document 1: 3 pages
    doc1 = fitz.open()
    for i in range(1, 4):
        p = doc1.new_page()
        p.insert_text((50, 72), f"Document 1 Page {i}")
    doc1.set_metadata({"title": "Test Doc 1", "author": "Suite Tester"})
    doc1.save(pdf1)
    doc1.close()

    # Document 2: 2 pages
    doc2 = fitz.open()
    for i in range(1, 3):
        p = doc2.new_page()
        p.insert_text((50, 72), f"Document 2 Page {i}")
    doc2.save(pdf2)
    doc2.close()

    return pdf1, pdf2, str(tmp_path)

def test_pdf_core_engine(sample_pdf_files):
    pdf1, _, _ = sample_pdf_files
    # Metadata
    meta = PDFCoreEngine.get_metadata(pdf1)
    assert meta.get("title") == "Test Doc 1"
    assert meta.get("author") == "Suite Tester"

    # Page count
    count = PDFCoreEngine.get_page_count(pdf1)
    assert count == 3

    # Render image bytes
    ppm_bytes = PDFCoreEngine.render_page_to_image(pdf1, 0)
    assert len(ppm_bytes) > 0
    assert ppm_bytes.startswith(b"P6")  # PPM image header

def test_pdf_merger_engine(sample_pdf_files):
    pdf1, pdf2, out_dir = sample_pdf_files
    merged_pdf = os.path.join(out_dir, "merged.pdf")

    success = PDFMergerEngine.merge_pdfs([pdf1, pdf2], merged_pdf)
    assert success is True
    assert os.path.exists(merged_pdf)
    assert PDFCoreEngine.get_page_count(merged_pdf) == 5

    # Test empty list raises ValueError
    with pytest.raises(ValueError):
        PDFMergerEngine.merge_pdfs([], os.path.join(out_dir, "fail.pdf"))

def test_pdf_splitter_engine(sample_pdf_files):
    pdf1, _, out_dir = sample_pdf_files

    # Split ranges (1-2) and (3-3)
    splits = PDFSplitterEngine.split_by_ranges(pdf1, [(1, 2), (3, 3)], out_dir)
    assert len(splits) == 2
    for s in splits:
        assert os.path.exists(s)

    assert PDFCoreEngine.get_page_count(splits[0]) == 2
    assert PDFCoreEngine.get_page_count(splits[1]) == 1

    # Extract specific page
    extracted = os.path.join(out_dir, "extracted_page2.pdf")
    res = PDFSplitterEngine.extract_pages(pdf1, [2], extracted)
    assert res is True
    assert PDFCoreEngine.get_page_count(extracted) == 1

def test_pdf_compressor_engine(sample_pdf_files):
    pdf1, _, out_dir = sample_pdf_files
    compressed = os.path.join(out_dir, "compressed.pdf")

    res = PDFCompressorEngine.compress_pdf(pdf1, compressed)
    assert res is True
    assert os.path.exists(compressed)
    assert os.path.getsize(compressed) > 0

def test_pdf_converter_engine(sample_pdf_files):
    pdf1, _, out_dir = sample_pdf_files

    # Text extraction
    txt_out = os.path.join(out_dir, "extracted.txt")
    res = PDFConverterEngine.extract_text(pdf1, txt_out)
    assert res is True
    assert os.path.exists(txt_out)
    with open(txt_out, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Document 1 Page 1" in content

    # Image conversion
    img_dir = os.path.join(out_dir, "images")
    os.makedirs(img_dir, exist_ok=True)
    images = PDFConverterEngine.pdf_to_images(pdf1, img_dir, "png")
    assert len(images) == 3
    for img in images:
        assert os.path.exists(img)

def test_pdf_security_engine(sample_pdf_files):
    pdf1, _, out_dir = sample_pdf_files
    encrypted = os.path.join(out_dir, "encrypted.pdf")
    decrypted = os.path.join(out_dir, "decrypted.pdf")
    password = "SuperSecretPassword123!"

    # Encrypt
    res_enc = PDFSecurityEngine.encrypt_pdf(pdf1, encrypted, password)
    assert res_enc is True
    assert os.path.exists(encrypted)

    # Verify encrypted document needs password
    doc = fitz.open(encrypted)
    assert bool(doc.needs_pass) is True
    doc.close()

    # Decrypt with wrong password fails
    with pytest.raises(Exception):
        PDFSecurityEngine.decrypt_pdf(encrypted, decrypted, "WrongPassword")

    # Decrypt with correct password succeeds
    res_dec = PDFSecurityEngine.decrypt_pdf(encrypted, decrypted, password)
    assert res_dec is True
    assert os.path.exists(decrypted)
    assert PDFCoreEngine.get_page_count(decrypted) == 3
