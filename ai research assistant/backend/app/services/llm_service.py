import logging
import json
import ollama
from app.config import get_settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.settings = get_settings()
        self.host = self.settings.ollama_host
        self.model = self.settings.ollama_llm_model
        # We configure the ollama client to point to the host if needed
        self.client = ollama.Client(host=self.host)

    def generate_research_report(self, query: str, context_chunks: list, plan_dict: dict, status_callback=None) -> str:
        """
        Generates a structured research report iteratively using multiple passes.
        Requests JSON format from Ollama.
        """
        # Construct the context prompt
        context_text = "SOURCES AND EVIDENCE:\n\n"
        valid_source_ids = set()
        
        for idx, chunk in enumerate(context_chunks):
            source_id = chunk['metadata'].get('source_id', f'UNKNOWN-{idx}')
            valid_source_ids.add(source_id)
            url = chunk['metadata'].get('url', 'Unknown URL')
            context_text += f"--- SOURCE_ID: {source_id} | URL: {url} ---\n{chunk['document']}\n\n"

        target_words = plan_dict.get('target_words', 4000)
        citation_style = plan_dict.get('citation_style', 'APA')

        def call_ollama(prompt):
            try:
                response = self.client.chat(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert research AI that only outputs strictly valid JSON objects matching the requested schema. No conversational filler."},
                        {"role": "user", "content": prompt}
                    ],
                    format="json",
                    options={
                        "num_predict": 8192,
                        "num_ctx": 8192
                    }
                )
                result = json.loads(response['message']['content'])
                if isinstance(result, dict):
                    return result
                return {}
            except Exception as e:
                logger.error(f"Ollama API call failed: {e}")
                return {}

        # Pass 1: Summary
        prompt_1 = f"""
You are an expert AI Research Assistant. Your task is to generate the first part of a highly detailed research report.
RESEARCH QUESTION: {query}
EVIDENCE:
{context_text}

INSTRUCTIONS:
1. Write a very detailed, multi-paragraph 'executive_summary' (aim for 500-1000 words).
2. Do not invent facts. 
3. The topic should be the research question.

OUTPUT FORMAT:
Respond with a valid JSON object exactly matching:
{{
    "topic": "The exact research topic",
    "executive_summary": "Your very detailed, multi-paragraph summary..."
}}
"""
        if status_callback: status_callback("generating_1")
        logger.info("Running Pass 1 (Summary)")
        res_1 = call_ollama(prompt_1)

        # Pass 2: Findings
        prompt_2 = f"""
You are an expert AI Research Assistant. Your task is to extract highly detailed findings from the evidence.
RESEARCH QUESTION: {query}
EVIDENCE:
{context_text}

INSTRUCTIONS:
1. Extract detailed 'key_findings' and 'important_facts'. Write a long paragraph for each item in the lists.
2. Cite factual claims using the SOURCE_ID (e.g., [SOURCE-001]). Use the {citation_style} style if applicable.

OUTPUT FORMAT:
Respond with a valid JSON object exactly matching:
{{
    "key_findings": ["Detailed finding paragraph 1 [SOURCE-001]", "Detailed finding paragraph 2 [SOURCE-002]"],
    "important_facts": ["Detailed fact paragraph 1", "Detailed fact paragraph 2"]
}}
"""
        if status_callback: status_callback("generating_2")
        logger.info("Running Pass 2 (Findings)")
        res_2 = call_ollama(prompt_2)

        # Pass 3: Analysis
        prompt_3 = f"""
You are an expert AI Research Assistant. Your task is to analyze the evidence for benefits, risks, and perspectives.
RESEARCH QUESTION: {query}
EVIDENCE:
{context_text}

INSTRUCTIONS:
1. Extract detailed 'benefits', 'risks', 'different_perspectives', and 'research_gaps' based strictly on the evidence.
2. Write a detailed paragraph for each item in the lists.

OUTPUT FORMAT:
Respond with a valid JSON object exactly matching:
{{
    "benefits": ["Benefit 1", "Benefit 2"],
    "risks": ["Risk 1", "Risk 2"],
    "different_perspectives": ["Perspective 1", "Perspective 2"],
    "research_gaps": ["Gap 1", "Gap 2"]
}}
"""
        if status_callback: status_callback("generating_3")
        logger.info("Running Pass 3 (Analysis)")
        res_3 = call_ollama(prompt_3)

        # Pass 4: Conclusion
        prompt_4 = f"""
You are an expert AI Research Assistant. Your task is to conclude the research report.
RESEARCH QUESTION: {query}
EVIDENCE:
{context_text}

INSTRUCTIONS:
1. Write a very detailed, multi-paragraph 'conclusion'.
2. List the citations used. Only include source IDs that were actually in the evidence.

OUTPUT FORMAT:
Respond with a valid JSON object exactly matching:
{{
    "conclusion": "Your highly detailed conclusion...",
    "citations": [
        {{
            "source_id": "SOURCE-001",
            "url": "https://example.com"
        }}
    ]
}}
"""
        if status_callback: status_callback("generating_4")
        logger.info("Running Pass 4 (Conclusion)")
        res_4 = call_ollama(prompt_4)

        report_data = {
            "topic": res_1.get("topic", query),
            "executive_summary": res_1.get("executive_summary", ""),
            "key_findings": res_2.get("key_findings", []),
            "important_facts": res_2.get("important_facts", []),
            "benefits": res_3.get("benefits", []),
            "risks": res_3.get("risks", []),
            "different_perspectives": res_3.get("different_perspectives", []),
            "research_gaps": res_3.get("research_gaps", []),
            "conclusion": res_4.get("conclusion", ""),
            "citations": res_4.get("citations", [])
        }
        
        # Filter citations to only include ones we actually provided
        valid_citations = []
        for cit in report_data.get("citations", []):
            if cit.get("source_id") in valid_source_ids:
                valid_citations.append(cit)
        report_data["citations"] = valid_citations
        
        return json.dumps(report_data)
