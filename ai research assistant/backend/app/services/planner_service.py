import json
import logging
import ollama
from app.config import get_settings
from app.schemas.planner import ResearchPlan
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class ResearchPlannerService:
    def __init__(self):
        self.settings = get_settings()
        self.host = self.settings.ollama_host
        self.model = self.settings.ollama_llm_model
        self.client = ollama.Client(host=self.host)

    def generate_plan(self, topic: str) -> ResearchPlan:
        logger.info(f"Generating research plan for topic: {topic}")
        
        prompt = f"""
You are an expert AI Research Planner.
Your task is to analyze the following research topic and determine an appropriate research strategy.

Topic: "{topic}"

Analyze:
* Topic complexity
* Number of major subtopics
* Availability of likely source material
* Whether the topic is broad or narrow
* Whether recent sources are important
* Whether academic sources are useful
* Whether comparison is necessary
* Whether statistics are useful
* Whether research gaps are meaningful

Convert page recommendations into approximate word counts:
3 pages ≈ 1,200-1,500 words
5 pages ≈ 2,000-2,500 words
10 pages ≈ 4,000-5,000 words
15 pages ≈ 6,000-7,500 words
20 pages ≈ 8,000-10,000 words

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this structure exactly (do not include markdown wrapping):
{{
  "topic": "The exact research topic",
  "research_depth": "quick | standard | deep | comprehensive",
  "target_pages": 5,
  "target_words": 2500,
  "minimum_sources": 5,
  "maximum_sources": 10,
  "source_recency_years": 5,
  "source_types": ["academic", "industry_reports", "official", "technology_publications"],
  "include_statistics": true,
  "compare_sources": true,
  "identify_research_gaps": true,
  "include_future_trends": true,
  "citation_style": "APA",
  "recommended_sections": ["Executive Summary", "Key Findings", "Analysis", "Conclusion"],
  "reasoning": "This topic is moderate in complexity and benefits from recent industry reports."
}}
"""
        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert research planner that only outputs strictly valid JSON objects matching the requested schema. No conversational filler."},
                    {"role": "user", "content": prompt}
                ],
                format="json"
            )
            
            content = response['message']['content']
            plan_data = json.loads(content)
            
            # Ensure proper casting where necessary by passing to Pydantic
            plan = ResearchPlan(**plan_data)
            return plan
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Failed to parse research plan: {e}")
            logger.error(f"Raw output: {content if 'content' in locals() else 'No response'}")
            
            # Fallback safe plan
            return ResearchPlan(
                topic=topic,
                research_depth="standard",
                target_pages=5,
                target_words=2000,
                minimum_sources=5,
                maximum_sources=10,
                source_recency_years=0,
                source_types=["general"],
                include_statistics=False,
                compare_sources=False,
                identify_research_gaps=False,
                include_future_trends=False,
                citation_style="Numbered",
                recommended_sections=["Executive Summary", "Key Findings", "Conclusion"],
                reasoning="Fallback plan generated due to an error in AI planning."
            )
        except Exception as e:
            logger.error(f"Ollama API call failed during planning: {e}")
            # Fallback safe plan
            return ResearchPlan(
                topic=topic,
                research_depth="standard",
                target_pages=5,
                target_words=2000,
                minimum_sources=5,
                maximum_sources=10,
                source_recency_years=0,
                source_types=["general"],
                include_statistics=False,
                compare_sources=False,
                identify_research_gaps=False,
                include_future_trends=False,
                citation_style="Numbered",
                recommended_sections=["Executive Summary", "Key Findings", "Conclusion"],
                reasoning="Fallback plan generated due to an error in AI planning."
            )
