"""
Custom tools for vector store operations.
"""

import os
import json
from typing import Any, Dict, List, Optional, Type
from langchain.tools import BaseTool
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from supabase import create_client, Client
from pydantic import BaseModel, Field


# Define input schemas for each tool
class VectorSearchInput(BaseModel):
    query: str = Field(description="The search query")
    k: int = Field(default=3, description="Number of results to return")


class VectorStoreInput(BaseModel):
    action: str = Field(description="The vector store action to perform")
    kwargs: Dict[str, Any] = Field(default={}, description="Additional parameters for the action")


# Vector store tool with proper Pydantic annotations
class VectorStoreTool(BaseTool):
    name: str = Field(default="vector_store", description="The name of the tool")
    description: str = Field(
        default="Performs vector store operations like search and store",
        description="Description of what the tool does"
    )
    args_schema: Type[BaseModel] = VectorStoreInput

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._vector_func = create_vector_store_tool()

    def _run(self, action: str, **kwargs) -> Dict[str, Any]:
        return self._vector_func(action, **kwargs)

    async def _arun(self, action: str, **kwargs) -> Dict[str, Any]:
        return self._run(action, **kwargs)


# Vector search tool with proper Pydantic annotations  
class VectorSearchTool(BaseTool):
    name: str = Field(default="vector_search", description="The name of the tool")
    description: str = Field(
        default="Searches the vector store for similar content",
        description="Description of what the tool does"
    )
    args_schema: Type[BaseModel] = VectorSearchInput

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._search_func = create_vector_search_tool()

    def _run(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        return self._search_func(query, k)

    async def _arun(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        return self._run(query, k)


# Create function-based tools
def create_vector_store_tool():
    """Create a vector store operations tool"""
    
    def vector_operations(action: str, **kwargs) -> Dict[str, Any]:
        """Perform vector store operations"""
        try:
            if action == "store_documents":
                return _store_documents(**kwargs)
            elif action == "similarity_search":
                return _similarity_search(**kwargs)
            elif action == "get_document_count":
                return _get_document_count(**kwargs)
            else:
                return {"error": f"Unknown vector store action: {action}"}
        except Exception as e:
            return {"error": f"Vector store operation failed: {str(e)}"}
    
    return vector_operations


def create_vector_search_tool():
    """Create a vector search tool"""
    
    def vector_search(query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Perform vector similarity search"""
        try:
            return _similarity_search(query=query, k=k)
        except Exception as e:
            return [{"error": f"Vector search failed: {str(e)}"}]
    
    return vector_search


# Helper functions
def _get_vector_store():
    """Initialize and return the vector store"""
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        vector_store = SupabaseVectorStore(
            client=supabase,
            embedding=embeddings,
            table_name="documents",
            query_name="match_documents"
        )
        
        return vector_store
    except Exception as e:
        raise Exception(f"Failed to initialize vector store: {str(e)}")


def _store_documents(documents: List[Dict[str, Any]], **kwargs) -> Dict[str, Any]:
    """Store documents in vector store"""
    try:
        vector_store = _get_vector_store()
        
        # Convert dicts to Document objects
        docs = []
        for doc_data in documents:
            doc = Document(
                page_content=doc_data.get("content", ""),
                metadata=doc_data.get("metadata", {})
            )
            docs.append(doc)
        
        if docs:
            vector_store.add_documents(docs)
            return {"success": True, "message": f"Stored {len(docs)} documents"}
        else:
            return {"error": "No documents to store"}
            
    except Exception as e:
        return {"error": f"Failed to store documents: {str(e)}"}


def _similarity_search(query: str = None, k: int = 3, **kwargs) -> List[Dict[str, Any]]:
    """Perform similarity search"""
    try:
        vector_store = _get_vector_store()
        
        if query:
            results = vector_store.similarity_search(query, k=k)
            
            formatted_results = []
            for i, doc in enumerate(results):
                formatted_results.append({
                    "rank": i + 1,
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": getattr(doc, 'score', None)  # Some vector stores include relevance scores
                })
            
            return formatted_results
        else:
            return [{"error": "No query provided for similarity search"}]
            
    except Exception as e:
        return [{"error": f"Similarity search failed: {str(e)}"}]


def _get_document_count(**kwargs) -> Dict[str, Any]:
    """Get document count from vector store"""
    try:
        # This would depend on your specific vector store implementation
        # For SupabaseVectorStore, you might need to query directly
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        response = supabase.table("documents").select("id", count="exact").execute()
        count = response.count if hasattr(response, 'count') else len(response.data)
        
        return {"success": True, "count": count}
        
    except Exception as e:
        return {"error": f"Failed to get document count: {str(e)}"}