from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from backend.core.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=settings.OPENAI_API_KEY
)

def store_research(text: str, metadata: dict) -> None:
    """Embed and store research results in pinecone """
    vector = embeddings.embed_query(text)
    index.upsert(vectors=[{
        "id": metadata['id'], 
        "values": vector,
        "metadata": {**metadata, "text": text}
    }])

def retrieve_research(query: str, top_k: int = 5, min_score: float = 0.65) -> list:
    """Retrieve most relevant research from Pinecone with score threshold."""
    vector = embeddings.embed_query(query)
    results = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True
    )
    # Only return results above similarity threshold
    filtered = [
        r["metadata"]["text"]
        for r in results["matches"]
        if r["score"] >= min_score
    ]
    return filtered

