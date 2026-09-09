from typing import Optional, List
from app.providers import get_ai_provider, AIProvider, MeetingAnalysisResult
from app.services.chunking_service import ChunkingService
from app.utils.text_cleaner import clean_transcript
from app.utils.validators import validate_transcript_text
from app.utils.logger import logger


class SummarizationService:
    """Coordinates AI summarization, long-transcript map-reduce, and schema validation."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_ai_provider()

    def analyze_meeting(
        self,
        raw_transcript: str,
        user_title: Optional[str] = None,
        progress_callback: Optional[callable] = None
    ) -> MeetingAnalysisResult:
        """
        Full meeting analysis workflow:
        1. Clean and normalize transcript
        2. Validate minimum content
        3. Determine single-pass vs. chunked map-reduce
        4. Generate structured analysis
        5. Validate schema and return result
        """
        cleaned = clean_transcript(raw_transcript)
        is_valid, err = validate_transcript_text(cleaned)
        if not is_valid:
            raise ValueError(f"Invalid transcript for AI analysis: {err}")

        if progress_callback:
            progress_callback("Analyzing meeting transcript...", 0.3)

        if ChunkingService.is_chunking_required(cleaned):
            logger.info("Long transcript detected. Executing Map-Reduce hierarchical summarization...")
            result = self._process_long_transcript(cleaned, user_title, progress_callback)
        else:
            logger.info("Executing single-pass AI summarization...")
            result = self.provider.summarize(cleaned, user_title=user_title)

        if progress_callback:
            progress_callback("Finalizing structured analysis...", 0.9)

        return result

    def _process_long_transcript(
        self,
        transcript: str,
        user_title: Optional[str] = None,
        progress_callback: Optional[callable] = None
    ) -> MeetingAnalysisResult:
        """Hierarchical map-reduce summarization for large transcripts."""
        chunks = ChunkingService.chunk_transcript(transcript)
        total_chunks = len(chunks)
        chunk_summaries = []

        for idx, chunk in enumerate(chunks, 1):
            if progress_callback:
                pct = 0.3 + (0.4 * (idx / total_chunks))
                progress_callback(f"Synthesizing transcript chunk {idx} of {total_chunks}...", pct)

            logger.info(f"Summarizing chunk {idx}/{total_chunks} ({len(chunk)} chars)")
            summary_piece = self.provider.summarize_chunk(chunk, idx, total_chunks)
            chunk_summaries.append(f"--- Section {idx} Summary ---\n{summary_piece}")

        # Reduce step: Combine intermediate chunk summaries into master synthesis
        combined_text = "\n\n".join(chunk_summaries)
        if progress_callback:
            progress_callback("Synthesizing final executive meeting notes...", 0.75)

        logger.info(f"Sending {len(chunk_summaries)} chunk summaries to final synthesis...")
        final_result = self.provider.summarize(combined_text, user_title=user_title)
        return final_result

