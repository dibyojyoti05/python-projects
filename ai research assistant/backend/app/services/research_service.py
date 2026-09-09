import logging
import asyncio
from typing import Dict, Any

from app.services.search_service import SearchService
from app.services.extraction_service import ExtractionService
from app.services.chunking_service import ChunkingService
from app.services.vector_service import VectorService
from app.services.llm_service import OllamaService

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.search_service = SearchService()
        self.extraction_service = ExtractionService()
        self.chunking_service = ChunkingService()
        self.vector_service = VectorService()
        self.ai_service = OllamaService()

    async def run_research(self, session_id: str, query: str, plan_dict: dict, update_status_callback) -> Dict[str, Any]:
        """
        Executes the full RAG pipeline for a research query.
        """
        try:
            # 1. Search
            update_status_callback(session_id, "searching")
            max_results = plan_dict.get('maximum_sources', 10)
            search_results = await asyncio.to_thread(self.search_service.search, query, max_results=max_results)
            if not search_results:
                return {"error": "No search results found for the query."}
            
            # 2. Extract and Chunk
            update_status_callback(session_id, "extracting")
            all_chunks = []
            all_metadatas = []
            all_ids = []
            
            # For simplicity in demo, we do sequential async extraction, but could use asyncio.gather
            for idx, result in enumerate(search_results):
                url = result.get('href')
                if not url:
                    continue
                    
                source_id = f"SOURCE-{idx+1:03d}"
                text = await self.extraction_service.extract_url(url)
                
                if text:
                    chunks = self.chunking_service.chunk_text(text)
                    for c_idx, chunk in enumerate(chunks):
                        all_chunks.append(chunk)
                        all_metadatas.append({
                            "source_id": source_id,
                            "url": url,
                            "title": result.get('title', 'Unknown Title')
                        })
                        all_ids.append(f"{source_id}-chunk-{c_idx}")

            if not all_chunks:
                return {"error": "Could not extract sufficient text from search results."}

            # 3. Embed and Store
            update_status_callback(session_id, "embedding")
            await asyncio.to_thread(self.vector_service.add_chunks, session_id, all_chunks, all_metadatas, all_ids)
            
            # 4. Retrieve Context
            update_status_callback(session_id, "analyzing")
            # Retrieve enough chunks to synthesize a large report if needed
            top_k = min(len(all_chunks), max_results * 4) 
            top_chunks = await asyncio.to_thread(self.vector_service.search, session_id, query, top_k=top_k)
            
            # 5. Generate Report with OpenAI
            update_status_callback(session_id, "generating_1")
            
            def llm_cb(status):
                update_status_callback(session_id, status)
                
            report_json_str = await asyncio.to_thread(self.ai_service.generate_research_report, query, top_chunks, plan_dict, llm_cb)
            
            # Parse JSON safely
            import json
            try:
                report_data = json.loads(report_json_str)
            except json.JSONDecodeError:
                report_data = {"raw_output": report_json_str, "error": "Failed to parse AI output as JSON"}

            # Save the final sources used
            unique_sources = {}
            for chunk in top_chunks:
                meta = chunk['metadata']
                sid = meta['source_id']
                if sid not in unique_sources:
                    unique_sources[sid] = {
                        "source_id": sid,
                        "url": meta['url'],
                        "title": meta['title']
                    }
            
            return {
                "report": report_data,
                "sources_used": list(unique_sources.values())
            }

        except Exception as e:
            logger.error(f"Research pipeline failed: {e}")
            return {"error": str(e)}
