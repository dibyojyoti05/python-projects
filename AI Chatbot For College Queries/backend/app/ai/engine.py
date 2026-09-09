from typing import Generator
import json
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import settings
from app.rag.retriever import retrieve_context
from app.crud import crud_chat, crud_analytics
from app.schemas.chat import MessageCreate
from app.schemas.analytics import UnansweredQuestionCreate

# Initialize LLM based on config
llm = None
if settings.LLM_PROVIDER == "gemini":
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL_NAME,
        google_api_key=settings.LLM_API_KEY,
        temperature=0.1 # Low temperature for more factual answers
    )

SYSTEM_PROMPT = """You are an official AI Assistant for the College.
Your primary role is to answer questions from students, faculty, and staff based STRICTLY on the provided context.

RULES:
1. ONLY use the provided context to answer the question.
2. If the answer is not in the context, clearly state: "I don't have enough information to answer that question based on the official college documents."
3. Do NOT make up information (hallucinate).
4. Be professional and concise.
5. If the context contains a partial answer, provide what you know and clarify that you don't have the full information.
6. Automatically detect the language of the user's question and respond in that same language.
"""

def generate_chat_response(db: Session, conversation_id: int, user_message: str) -> Generator[str, None, None]:
    if not llm:
        yield "LLM provider is not configured properly."
        return

    # 1. Retrieve context
    docs_with_scores = retrieve_context(db, user_message, top_k=5)
    
    context_text = ""
    citations = []
    
    for idx, (chunk, score) in enumerate(docs_with_scores):
        context_text += f"\n--- Document {idx + 1} (Page {chunk.page_number}) ---\n{chunk.text}\n"
        citations.append({
            "document_id": chunk.document_id,
            "page": chunk.page_number,
            "text": chunk.text[:100] + "..." # Snippet
        })
        
    # 2. Get conversation history
    history = crud_chat.get_messages(db, conversation_id=conversation_id, limit=10) # last 10 messages
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    
    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))
            
    # Add the new message with context
    augmented_user_message = f"Context:\n{context_text}\n\nQuestion:\n{user_message}"
    messages.append(HumanMessage(content=augmented_user_message))

    # Save user message to DB
    crud_chat.create_message(db, MessageCreate(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
        citations=None
    ))

    # 3. Stream response
    full_response = ""
    for chunk in llm.stream(messages):
        content = chunk.content
        if content:
            full_response += content
            yield content

    # Check for fallback response
    if "don't have enough information" in full_response.lower() or "do not have enough information" in full_response.lower():
        conv = crud_chat.get_conversation(db, id=conversation_id)
        crud_analytics.create_unanswered_question(db, UnansweredQuestionCreate(
            question=user_message,
            user_id=conv.user_id if conv else None,
            conversation_id=conversation_id
        ))

    # 4. Save assistant message to DB
    crud_chat.create_message(db, MessageCreate(
        conversation_id=conversation_id,
        role="assistant",
        content=full_response,
        citations=json.dumps(citations) if citations else None
    ))
