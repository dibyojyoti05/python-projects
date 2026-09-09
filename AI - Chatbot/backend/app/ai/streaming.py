from typing import AsyncGenerator, Dict, Any, Optional
import json
import logging
from app.ai.ai_client import get_chat_completion
from app.core.config import settings

logger = logging.getLogger(__name__)

def sanitize_chat_history(messages: list[dict]) -> list[dict]:
    """
    Sanitize messages for Google Gemini and chat completion APIs:
    - Extracts and keeps system messages at the beginning.
    - Merges consecutive turns of the same role.
    - Ensures conversation strictly ends with a user turn (never an assistant turn).
    """
    system_msgs = [m for m in messages if m.get("role") == "system"]
    chat_msgs = [m for m in messages if m.get("role") != "system"]

    merged: list[dict] = []
    for m in chat_msgs:
        role = "user" if m.get("role") == "user" else "assistant"
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if merged and merged[-1]["role"] == role:
            merged[-1]["content"] += "\n" + content
        else:
            merged.append({"role": role, "content": content})

    # Gemini requirement: The conversation MUST end with a user turn
    while merged and merged[-1]["role"] != "user":
        merged.pop()

    return system_msgs + merged


async def generate_chat_stream(
    model: str,
    messages: list[dict],
    tools: list[dict] = None,
    db_session = None,
    chat_id: Optional[int] = None
) -> AsyncGenerator[str, None]:
    """
    Calls the LiteLLM stream and yields Server-Sent Events (SSE) chunks.
    Yields data in format: "data: {JSON}\n\n"
    """
    try:
        # Immediately flush SSE connection to avoid browser/proxy read timeouts
        yield ": connected\n\n"

        # Resolve model, defaulting to Google Gemini
        selected_model = model or settings.DEFAULT_MODEL

        # Ensure a clean, professional system prompt that directly answers without chain-of-thought
        system_prompt = {
            "role": "system",
            "content": (
                "You are an expert, knowledgeable, and direct Enterprise AI Assistant powered by Google Gemini.\n"
                "CRITICAL INSTRUCTIONS:\n"
                "- Directly, concisely, and accurately answer the user's specific question or request.\n"
                "- NEVER output your internal thoughts, thinking process, reasoning steps, or notes.\n"
                "- Output ONLY the final answer to the user.\n"
                "- Use clean, well-formatted Markdown (headers, bullet points, bold text, code blocks).\n"
                "- Deliver actionable, precise insights immediately."
            )
        }
        if not any(m.get("role") == "system" for m in messages):
            prepared_messages = [system_prompt] + messages
        else:
            prepared_messages = messages

        # Sanitize message order and roles for Gemini API requirements
        prepared_messages = sanitize_chat_history(prepared_messages)

        response_stream = await get_chat_completion(
            model=selected_model,
            messages=prepared_messages,
            tools=tools,
            stream=True
        )
        
        full_response = ""
        in_thinking = False
        buf = ""

        async for chunk in response_stream:
            choice = chunk.choices[0]
            # Ignore reasoning_content / thinking delta attributes
            raw_content = choice.delta.content or ""
            if not raw_content:
                continue

            buf += raw_content

            while buf:
                if not in_thinking:
                    lower_buf = buf.lower()
                    think_idx = lower_buf.find("<think>")
                    if think_idx != -1:
                        # Yield any text before <think>
                        before = buf[:think_idx]
                        if before:
                            full_response += before
                            yield f"data: {json.dumps({'content': before})}\n\n"
                        buf = buf[think_idx + len("<think>"):]
                        in_thinking = True
                        continue

                    # Check for partial prefix like "<", "<th", etc. at end of buf
                    partial = False
                    for i in range(1, len("<think>")):
                        if lower_buf.endswith("<think>"[:i]):
                            emit_part = buf[:-i]
                            if emit_part:
                                full_response += emit_part
                                yield f"data: {json.dumps({'content': emit_part})}\n\n"
                            buf = buf[-i:]
                            partial = True
                            break

                    if not partial:
                        emit_text = buf
                        # Filter out any literal "Thinking...\n" prefix if present at start
                        if not full_response and emit_text.lstrip().lower().startswith("thinking..."):
                            emit_text = emit_text.lstrip()[len("thinking..."):].lstrip()
                        if emit_text:
                            full_response += emit_text
                            yield f"data: {json.dumps({'content': emit_text})}\n\n"
                        buf = ""
                    else:
                        break
                else:
                    # Currently inside <think>
                    lower_buf = buf.lower()
                    end_idx = lower_buf.find("</think>")
                    if end_idx != -1:
                        buf = buf[end_idx + len("</think>"):].lstrip("\r\n ")
                        in_thinking = False
                        continue
                    else:
                        partial = False
                        for i in range(1, len("</think>")):
                            if lower_buf.endswith("</think>"[:i]):
                                buf = buf[-i:]
                                partial = True
                                break
                        if not partial:
                            buf = ""
                        break

        # Flush remaining buffer if not inside a thinking tag
        if buf and not in_thinking:
            full_response += buf
            yield f"data: {json.dumps({'content': buf})}\n\n"
                
        # Persist assistant's final response with a dedicated DB session
        if chat_id and full_response:
            from app.db.database import AsyncSessionLocal
            from app.crud import crud_chat
            from app.schemas.chat import MessageCreate
            try:
                async with AsyncSessionLocal() as session:
                    ai_msg_in = MessageCreate(chat_id=chat_id, role="assistant", content=full_response)
                    await crud_chat.create_message(session, obj_in=ai_msg_in)
            except Exception as db_err:
                logger.error(f"Failed to save AI response to DB: {db_err}")
                
    except Exception as e:
        logger.error(f"Chat stream error: {e}")
        error_payload = json.dumps({"error": str(e)})
        yield f"data: {error_payload}\n\n"
    finally:
        # Standard SSE signal that stream is finished
        yield "data: [DONE]\n\n"
