#!/usr/bin/env python
"""Test creating a ticket with the agent."""

import asyncio
import os
import sys

from dotenv import load_dotenv
load_dotenv()

# Set env var before imports
if "GEMINI_API_KEY" in os.environ and "GOOGLE_GENAI_API_KEY" not in os.environ:
    os.environ["GOOGLE_GENAI_API_KEY"] = os.environ["GEMINI_API_KEY"]

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.agent.task_agent import TaskAgentService


async def main():
    """Test creating a ticket."""
    from src.config import settings

    print("="*60)
    print("Testing Ticket Creation")
    print("="*60)
    
    service = TaskAgentService()
    print("Agent ready!\n")
    
    test_queries = [
        "Create a new high priority ticket in the AI Agent project called 'Test RAG integration' with description 'Set up vector database and embedding pipeline'",
        "What tickets are in the AI Agent project?",
        "Move the 'Test RAG integration' ticket to IN_PROGRESS status",
    ]
    
    user_id = "test_user"
    session_id = None
    
    for query in test_queries:
        print(f"\n{'-'*60}")
        print(f"User: {query}")
        print(f"{'-'*60}\n")
        
        result = await service.chat(
            message=query,
            user_id=user_id,
            session_id=session_id,
        )
        
        session_id = result["session_id"]
        print(f"Agent: {result['response']}\n")
        
        if result["actions_taken"]:
            print("Actions:")
            for action in result["actions_taken"]:
                print(f"  - {action['tool']}")
    
    print("\n" + "="*60)
    print("Test complete!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
