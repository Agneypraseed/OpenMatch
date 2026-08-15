"""
PDF and text document processing for the RAG pipeline.

Native PDF text is extracted with pypdf. Pages that contain little or no
extractable text fall back to OCR so scanned resumes still work.
"""
from __future__ import annotations

from io import BytesIO

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.config import settings


MIN_NATIVE_ALNUM_CHARS = 40
OCR_DPI = 200


class OCRUnavailableError(RuntimeError):
    """Raised when a scanned PDF needs OCR but the OCR runtime is unavailable."""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from a PDF, using OCR only for pages that need it.

    Normal text PDFs stay on the fast pypdf path. For image-only or nearly
    image-only pages, the page is rasterized with PyMuPDF and recognized with
    Tesseract through pytesseract.
    """
    reader = PdfReader(BytesIO(pdf_bytes))
    page_texts: list[str] = []
    pages_needing_ocr: list[int] = []

    for page_number, page in enumerate(reader.pages):
        text = (page.extract_text() or "").strip()
        page_texts.append(text)
        if not _has_meaningful_native_text(text):
            pages_needing_ocr.append(page_number)

    if pages_needing_ocr:
        ocr_text = _ocr_pages(pdf_bytes, pages_needing_ocr)
        for page_number, text in ocr_text.items():
            # Keep whichever extraction produced more useful text. This also
            # handles hybrid pages that contain only a small native text layer.
            if _alnum_count(text) > _alnum_count(page_texts[page_number]):
                page_texts[page_number] = text.strip()

    return "\n\n".join(text for text in page_texts if text.strip())


def _alnum_count(text: str) -> int:
    return sum(character.isalnum() for character in text)


def _has_meaningful_native_text(text: str) -> bool:
    return _alnum_count(text) >= MIN_NATIVE_ALNUM_CHARS


def _ocr_pages(pdf_bytes: bytes, page_numbers: list[int]) -> dict[int, str]:
    """OCR selected PDF pages and return extracted text keyed by page number."""
    try:
        import pymupdf
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise OCRUnavailableError(
            "This resume appears to be scanned, but OCR dependencies are not installed."
        ) from exc

    try:
        # Fail early with a clear error instead of making every scanned page fail
        # independently when the Tesseract executable is missing.
        pytesseract.get_tesseract_version()
    except pytesseract.TesseractNotFoundError as exc:
        raise OCRUnavailableError(
            "This resume appears to be scanned, but Tesseract OCR is not installed "
            "or is not available on PATH."
        ) from exc

    extracted: dict[int, str] = {}
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as document:
        for page_number in page_numbers:
            page = document.load_page(page_number)
            pixmap = page.get_pixmap(
                dpi=OCR_DPI,
                colorspace=pymupdf.csGRAY,
                alpha=False,
            )
            image = Image.frombytes(
                "L",
                (pixmap.width, pixmap.height),
                pixmap.samples,
            )
            extracted[page_number] = pytesseract.image_to_string(
                image,
                lang="eng",
            ).strip()

    return extracted


def chunk_document(text: str, source: str = "cv") -> list[Document]:
    """
    Split document text into chunks optimized for resume/CV content.

    Uses section-aware splitting that tries to keep logical resume sections
    (Experience, Education, Skills) together within chunks.

    Args:
        text: The full document text.
        source: Label for the document source (used in metadata).

    Returns:
        List of LangChain Document objects with metadata.
    """
    # Custom separators that respect resume section boundaries
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=[
            "\n\n\n",   # Triple newline (major section break)
            "\n\n",      # Double newline (paragraph break)
            "\n",         # Single newline
            ". ",         # Sentence boundary
            " ",          # Word boundary
        ],
        length_function=len,
    )

    chunks = splitter.create_documents(
        texts=[text],
        metadatas=[{"source": source}],
    )

    # Add chunk index to metadata
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["total_chunks"] = len(chunks)

    return chunks
