import litellm
from typing import List, Dict, Any
from app.core.config import settings

# Configure litellm globally if needed
litellm.set_verbose = False
litellm.drop_params = True
litellm.suppress_debug_info = True

async def get_chat_completion(
    model: str,
    messages: List[Dict[str, Any]],
    tools: List[Dict[str, Any]] = None,
    temperature: float = 0.7,
    stream: bool = False
) -> Any:
    """
    Standard wrapper around LiteLLM's acompletion for async chat completion.
    """
    kwargs: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }
    
    if not model.startswith("gemini/"):
        kwargs["temperature"] = temperature
    
    if model.startswith("gemini/"):
        api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
        if api_key:
            kwargs["api_key"] = api_key

    if tools:
        kwargs["tools"] = tools

    response = await litellm.acompletion(**kwargs)
    return response
