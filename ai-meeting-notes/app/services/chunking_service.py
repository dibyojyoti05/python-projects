import re
from typing import List
from app.config.settings import settings
from app.utils.logger import logger


class ChunkingService:
    """Handles intelligent transcript chunking and map-reduce segmentation for long meetings."""

    @staticmethod
    def chunk_transcript(
        text: str,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> List[str]:
        """
        Splits a transcript into overlapping semantic chunks.
        Tries to break at line breaks (speaker changes or paragraphs) rather than arbitrary characters.
        """
        size = chunk_size or settings.CHUNK_SIZE
        overlap = chunk_overlap or settings.CHUNK_OVERLAP

        if not text or len(text) <= size:
            return [text]

        lines = text.split("\n")
        chunks = []
        current_chunk = []
        current_len = 0

        for line in lines:
            line_len = len(line) + 1  # +1 for newline
            if current_len + line_len > size and current_chunk:
                chunk_str = "\n".join(current_chunk).strip()
                if chunk_str:
                    chunks.append(chunk_str)

                # Prepare overlap: retain last few lines that fit within overlap size
                overlap_chunk = []
                overlap_len = 0
                for prev_line in reversed(current_chunk):
                    if overlap_len + len(prev_line) + 1 <= overlap:
                        overlap_chunk.insert(0, prev_line)
                        overlap_len += len(prev_line) + 1
                    else:
                        break

                current_chunk = overlap_chunk
                current_len = overlap_len

            current_chunk.append(line)
            current_len += line_len

        if current_chunk:
            final_str = "\n".join(current_chunk).strip()
            if final_str:
                chunks.append(final_str)

        logger.info(f"Chunked transcript ({len(text)} chars) into {len(chunks)} chunks (size={size}, overlap={overlap})")
        return chunks

    @staticmethod
    def is_chunking_required(text: str, threshold: int = None) -> bool:
        """Determines if transcript exceeds single-pass threshold."""
        limit = threshold or settings.CHUNK_SIZE
        return len(text) > limit

