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

def retrieve_research(query: str, top_k: int = 5) -> list[dict]:
    """Retrieve relevant research from pinecone"""
    vector = embeddings.embed_query(query)
    results = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True
    )
    return [r["metadata"]["text"] for r in results["matches"]]

