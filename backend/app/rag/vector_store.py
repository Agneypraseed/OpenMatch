"""
FAISS vector store for CV document retrieval.

Creates an in-memory FAISS index from CV chunks and provides
similarity search for matching job requirements to relevant CV sections.
"""
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from app.rag.embeddings import get_embeddings
from app.services.ai_provider import AIProviderConfig


def create_vector_store(
    documents: list[Document],
    ai_config: AIProviderConfig,
) -> FAISS:
    """
    Create a FAISS vector store from a list of documents.

    Args:
        documents: List of LangChain Document objects (CV chunks).

    Returns:
        FAISS vector store ready for similarity search.
    """
    embeddings = get_embeddings(ai_config)
    vector_store = FAISS.from_documents(documents, embeddings)
    return vector_store


def retrieve_relevant_context(
    vector_store: FAISS,
    query: str,
    k: int = 5,
) -> list[Document]:
    """
    Retrieve the most relevant CV chunks for a given query.

    Args:
        vector_store: The FAISS vector store containing CV chunks.
        query: The search query (e.g., a job requirement or skill).
        k: Number of top results to return.

    Returns:
        List of the most relevant Document objects.
    """
    return vector_store.similarity_search(query, k=k)


def retrieve_context_for_skills(
    vector_store: FAISS,
    skills: list[str],
    k_per_skill: int = 2,
) -> str:
    """
    Retrieve relevant CV context for a list of required skills.

    Builds a comprehensive context string by querying the vector store
    for each skill and deduplicating results.

    Args:
        vector_store: The FAISS vector store containing CV chunks.
        skills: List of skill names to search for.
        k_per_skill: Number of chunks to retrieve per skill.

    Returns:
        Combined context string from all relevant CV sections.
    """
    seen_contents: set[str] = set()
    all_context: list[str] = []

    for skill in skills:
        docs = vector_store.similarity_search(skill, k=k_per_skill)
        for doc in docs:
            content = doc.page_content.strip()
            if content not in seen_contents:
                seen_contents.add(content)
                all_context.append(content)

    return "\n\n---\n\n".join(all_context)
