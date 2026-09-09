import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WorkflowExecutionEngine:
    """
    Evaluates and simulates execution of ReactFlow automation workflows.
    Supported node types:
    - input / trigger: "Trigger: New Subscriber", "Trigger: Tag Added", etc.
    - email: "Send Welcome Email", "Send Promo Email"
    - delay: "Wait N Days / Hours"
    - condition: "Condition: Opened Email?", "Condition: Clicked Link?"
    - output / action: "Tag Contact", "Update Status"
    """

    def validate_graph(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not nodes:
            return {"valid": False, "error": "Workflow contains no nodes."}

        node_ids = {n.get("id") for n in nodes}
        # Check dangling edges
        for edge in edges:
            if edge.get("source") not in node_ids or edge.get("target") not in node_ids:
                return {"valid": False, "error": f"Edge references missing node: {edge}"}

        # Find entry node
        sources = {e.get("source") for e in edges}
        targets = {e.get("target") for e in edges}
        entry_nodes = [n for n in nodes if n.get("id") not in targets or n.get("type") == "input"]

        if not entry_nodes:
            return {"valid": False, "error": "No start/trigger node found in workflow."}

        return {"valid": True, "entry_node_id": entry_nodes[0].get("id")}

    def simulate_execution(
        self, 
        nodes: List[Dict[str, Any]], 
        edges: List[Dict[str, Any]], 
        contact_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a dry-run traversal of the workflow for a sample or specified contact.
        """
        validation = self.validate_graph(nodes, edges)
        if not validation["valid"]:
            return {
                "success": False,
                "error": validation["error"],
                "steps": []
            }

        node_map = {n.get("id"): n for n in nodes}
        # Build adjacency list
        adj: Dict[str, List[Dict[str, Any]]] = {}
        for edge in edges:
            src = edge.get("source")
            adj.setdefault(src, []).append(edge)

        steps = []
        current_id = validation["entry_node_id"]
        visited = set()
        contact = contact_context or {
            "email": "preview@recipient.local",
            "first_name": "Alex",
            "opened_email": True
        }

        while current_id and current_id not in visited:
            visited.add(current_id)
            node = node_map.get(current_id)
            if not node:
                break

            label = node.get("data", {}).get("label") or node.get("id")
            node_type = node.get("type", "default")
            step_log = {
                "node_id": current_id,
                "label": label,
                "type": node_type,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed"
            }

            # Outgoing edges
            outgoing = adj.get(current_id, [])
            if not outgoing:
                step_log["action_summary"] = "Reached end of workflow branch."
                steps.append(step_log)
                break

            # If conditional node, choose branch based on contact condition
            if "condition" in label.lower() or "opened" in label.lower():
                condition_met = contact.get("opened_email", True)
                chosen_edge = None
                for edge in outgoing:
                    edge_label = str(edge.get("label", "")).lower()
                    if condition_met and ("yes" in edge_label or "true" in edge_label):
                        chosen_edge = edge
                        break
                    elif not condition_met and ("no" in edge_label or "false" in edge_label):
                        chosen_edge = edge
                        break
                if not chosen_edge:
                    chosen_edge = outgoing[0]
                
                step_log["action_summary"] = f"Condition evaluated: {'True (Yes branch)' if condition_met else 'False (No branch)'}"
                steps.append(step_log)
                current_id = chosen_edge.get("target")
            elif "wait" in label.lower() or "delay" in label.lower():
                step_log["action_summary"] = f"Scheduled delay: {label}"
                steps.append(step_log)
                current_id = outgoing[0].get("target")
            elif "send" in label.lower() or "email" in label.lower():
                step_log["action_summary"] = f"Dispatched email to {contact['email']}"
                steps.append(step_log)
                current_id = outgoing[0].get("target")
            else:
                step_log["action_summary"] = f"Processed step: {label}"
                steps.append(step_log)
                current_id = outgoing[0].get("target")

        return {
            "success": True,
            "steps_count": len(steps),
            "steps": steps
        }

workflow_service = WorkflowExecutionEngine()
