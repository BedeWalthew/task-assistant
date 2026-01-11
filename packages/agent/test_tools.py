#!/usr/bin/env python
"""Test tools directly to debug errors."""

import asyncio
import sys
import os

from dotenv import load_dotenv
load_dotenv()

# Set env var before imports
if "GEMINI_API_KEY" in os.environ and "GOOGLE_GENAI_API_KEY" not in os.environ:
    os.environ["GOOGLE_GENAI_API_KEY"] = os.environ["GEMINI_API_KEY"]

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.agent.task_agent import _create_tools
from src.api.client import APIClient


async def main():
    """Test tools directly."""
    print("Creating API client...")
    client = APIClient(base_url="http://localhost:3001")
    
    print("Creating tools...")
    tools = _create_tools(client)
    
    # Find the tools we want to test
    list_projects_tool = next(t for t in tools if t.__name__ == "list_projects")
    list_tickets_tool = next(t for t in tools if t.__name__ == "list_tickets")
    get_board_summary_tool = next(t for t in tools if t.__name__ == "get_board_summary")
    create_project_tool = next(t for t in tools if t.__name__ == "create_project")
    delete_project_tool = next(t for t in tools if t.__name__ == "delete_project")
    
    print("\n" + "="*60)
    print("Testing list_projects...")
    print("="*60)
    result = await list_projects_tool()
    print(f"Result: {result}")
    
    print("\n" + "="*60)
    print("Testing list_tickets...")
    print("="*60)
    result = await list_tickets_tool()
    print(f"Result: {result}")
    
    print("\n" + "="*60)
    print("Testing get_board_summary...")
    print("="*60)
    result = await get_board_summary_tool()
    print(f"Result: {result}")
    
    print("\n" + "="*60)
    print("Testing create_project...")
    print("="*60)
    result = await create_project_tool(
        name="Test Project for Deletion",
        key="TDEL",
        description="This project will be deleted in the next test"
    )
    print(f"Result: {result}")
    
    if result.get("success"):
        project_key = result.get("project", {}).get("key", "TDEL")
        print("\n" + "="*60)
        print("Testing delete_project...")
        print("="*60)
        result = await delete_project_tool(project_id=project_key)
        print(f"Result: {result}")
    
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
