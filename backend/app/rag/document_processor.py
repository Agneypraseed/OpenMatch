"""
PDF and text document processing for the RAG pipeline.

Handles CV/resume PDF parsing and intelligent chunking that preserves
resume section boundaries (Experience, Education, Skills, etc.).
"""
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from io import BytesIO
from app.config import settings


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text content from a PDF file.

    Args:
        pdf_bytes: Raw bytes of the PDF file.

    Returns:
        Extracted text as a single string.
    """
    reader = PdfReader(BytesIO(pdf_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


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
