import shutil
import unittest
from io import BytesIO
from unittest.mock import patch

import pymupdf
from pypdf import PdfReader

from app.rag.document_processor import extract_text_from_pdf


RESUME_TEXT = (
    "Alex Morgan\n"
    "Python Engineer\n"
    "Built FastAPI REST APIs with PostgreSQL and Docker.\n"
    "Deployed services on AWS and wrote automated tests.\n"
    "5 years of software engineering experience.\n"
    "Bachelor of Science in Computer Science\n"
)


def _native_text_pdf(text: str) -> bytes:
    document = pymupdf.open()
    page = document.new_page(width=612, height=792)
    page.insert_textbox(
        pymupdf.Rect(72, 72, 540, 720),
        text,
        fontsize=12,
    )
    payload = document.tobytes()
    document.close()
    return payload


def _scanned_resume_pdf() -> bytes:
    """Create an image-only PDF with no searchable text layer."""
    source = pymupdf.open()
    page = source.new_page(width=612, height=792)
    y = 90
    for index, line in enumerate(RESUME_TEXT.splitlines()):
        size = 24 if index == 0 else 15
        page.insert_text((72, y), line, fontsize=size)
        y += 42 if index == 0 else 32

    pixmap = page.get_pixmap(dpi=200, alpha=False)
    image_bytes = pixmap.tobytes("png")
    source.close()

    scanned = pymupdf.open()
    scanned_page = scanned.new_page(width=612, height=792)
    scanned_page.insert_image(scanned_page.rect, stream=image_bytes)
    payload = scanned.tobytes(deflate=True)
    scanned.close()
    return payload


class DocumentProcessorTests(unittest.TestCase):
    def test_native_text_pdf_does_not_run_ocr(self):
        payload = _native_text_pdf(RESUME_TEXT)

        with patch("app.rag.document_processor._ocr_pages") as ocr:
            text = extract_text_from_pdf(payload)

        self.assertIn("Python Engineer", text)
        self.assertIn("FastAPI", text)
        ocr.assert_not_called()

    def test_image_only_pdf_uses_ocr_fallback(self):
        payload = _scanned_resume_pdf()
        native_text = PdfReader(BytesIO(payload)).pages[0].extract_text() or ""
        self.assertEqual(native_text.strip(), "")

        with patch(
            "app.rag.document_processor._ocr_pages",
            return_value={0: RESUME_TEXT},
        ) as ocr:
            text = extract_text_from_pdf(payload)

        self.assertIn("PostgreSQL", text)
        self.assertIn("Docker", text)
        self.assertEqual(ocr.call_args.args[1], [0])

    @unittest.skipUnless(
        shutil.which("tesseract"),
        "Tesseract executable is not installed on this test machine.",
    )
    def test_real_ocr_recognizes_scanned_resume(self):
        payload = _scanned_resume_pdf()
        native_text = PdfReader(BytesIO(payload)).pages[0].extract_text() or ""
        self.assertEqual(native_text.strip(), "")

        text = extract_text_from_pdf(payload)

        self.assertIn("Alex Morgan", text)
        self.assertIn("Python Engineer", text)
        self.assertIn("FastAPI", text)
        self.assertIn("PostgreSQL", text)
        self.assertIn("Docker", text)
        self.assertIn("AWS", text)


if __name__ == "__main__":
    unittest.main()
