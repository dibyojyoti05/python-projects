from typing import Callable, Dict, Any, List

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._tool_schemas: List[Dict[str, Any]] = []

    def register(self, schema: Dict[str, Any]):
        def decorator(func: Callable):
            self._tools[func.__name__] = func
            self._tool_schemas.append({
                "type": "function",
                "function": schema
            })
            return func
        return decorator

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        return self._tool_schemas

    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> str:
        if name not in self._tools:
            return f"Error: Tool '{name}' not found."
        try:
            func = self._tools[name]
            # Assumes async tools for now
            return await func(**arguments)
        except Exception as e:
            return f"Error executing tool '{name}': {str(e)}"

# Global registry instance
agent_tools = ToolRegistry()

# Example: Calculator tool (To be implemented fully later)
@agent_tools.register(
    schema={
        "name": "calculator",
        "description": "Evaluate a simple math expression.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "The math expression, e.g. 2 + 2"
                }
            },
            "required": ["expression"]
        }
    }
)
async def calculator(expression: str) -> str:
    # A safe eval alternative would go here
    try:
        # WARNING: using eval is unsafe, this is just a placeholder for architecture demo
        result = eval(expression, {"__builtins__": {}})
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"
