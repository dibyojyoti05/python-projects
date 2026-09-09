from typing import List

class ChunkingService:
    def __init__(self, chunk_size: int = 1500, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[str]:
        """
        Splits text into overlapping chunks.
        For a production app, we would use a token-aware splitter (like RecursiveCharacterTextSplitter from Langchain).
        Here we use a simple character-based chunker for fewer dependencies.
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            
            # If we're not at the end of the text, try to find a natural break (like a newline or period)
            if end < text_length:
                # Look back up to 100 characters for a newline
                last_newline = text.rfind("\n", start, end)
                if last_newline != -1 and last_newline > start + (self.chunk_size // 2):
                    end = last_newline + 1
                else:
                    # Look for a period
                    last_period = text.rfind(". ", start, end)
                    if last_period != -1 and last_period > start + (self.chunk_size // 2):
                        end = last_period + 2
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
                
            start = end - self.overlap

        return chunks
