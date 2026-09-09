import asyncio
import os
import sys

# Add the app directory to the sys path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.planner_service import ResearchPlannerService
from dotenv import load_dotenv

def test_planner():
    load_dotenv()
    planner = ResearchPlannerService()
    topic = "How is artificial intelligence transforming the future of software development?"
    print(f"Testing ResearchPlannerService with topic: '{topic}'...\n")
    try:
        plan = planner.generate_plan(topic)
        print("Successfully generated plan:")
        print(plan.model_dump_json(indent=2))
    except Exception as e:
        print(f"Error during planning: {e}")

if __name__ == "__main__":
    test_planner()
