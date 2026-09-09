from pydantic import BaseModel, Field
from typing import List

class ResearchPlan(BaseModel):
    topic: str = Field(description="The research topic")
    research_depth: str = Field(description="Depth of research: quick, standard, deep, comprehensive")
    target_pages: int = Field(description="Target number of pages (e.g. 3, 5, 10, 15, 20)", gt=0)
    target_words: int = Field(description="Approximate word count based on pages", gt=0)
    minimum_sources: int = Field(description="Minimum sources to retrieve", gt=0)
    maximum_sources: int = Field(description="Maximum sources to retrieve", gt=0)
    source_recency_years: int = Field(description="Number of years to look back, or 0 for any", ge=0)
    source_types: List[str] = Field(description="List of source types: academic, industry_reports, official, technology_publications, news, etc.")
    include_statistics: bool = Field(description="Whether statistics are useful for this topic")
    compare_sources: bool = Field(description="Whether source comparison is useful")
    identify_research_gaps: bool = Field(description="Whether identifying gaps is meaningful")
    include_future_trends: bool = Field(description="Whether future trends are relevant")
    citation_style: str = Field(description="Suggested citation style: APA, MLA, Chicago, IEEE, Numbered")
    recommended_sections: List[str] = Field(description="Recommended headings/sections for the final report")
    reasoning: str = Field(description="Short user-facing explanation of why this plan was chosen")
