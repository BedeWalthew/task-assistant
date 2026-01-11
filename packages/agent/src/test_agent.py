#!/usr/bin/env python
"""Simple test script for the Task Assistant Agent.

Run with: python -m src.test_agent

Make sure you have:
1. GEMINI_API_KEY set in environment
2. Backend running at http://localhost:3001 (or set BACKEND_API_URL)
"""

import asyncio
import os
import sys

# CRITICAL: Load .env and set GOOGLE_GENAI_API_KEY before any imports
from dotenv import load_dotenv
load_dotenv()

# Set the Google ADK environment variable
if "GEMINI_API_KEY" in os.environ and "GOOGLE_GENAI_API_KEY" not in os.environ:
    os.environ["GOOGLE_GENAI_API_KEY"] = os.environ["GEMINI_API_KEY"]

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def test_agent():
    """Test the agent with some sample queries."""
    from src.agent import TaskAgentService
    from src.config import settings

    print("=" * 60)
    print("Task Assistant Agent Test")
    print("=" * 60)
    print(f"Model: {settings.gemini_model}")
    print(f"Backend URL: {settings.backend_api_url}")
    print()

    if not settings.gemini_api_key:
        print("ERROR: GEMINI_API_KEY not set!")
        print("Please set the GEMINI_API_KEY environment variable.")
        return

    # Initialize the service
    print("Initializing agent service...")
    service = TaskAgentService()
    print("Agent ready!\n")

    # Test queries
    test_queries = [
        "What projects do I have?",
        "Show me the board summary",
        "List my tickets",
    ]

    user_id = "test_user"
    session_id = None

    for query in test_queries:
        print("-" * 40)
        print(f"User: {query}")
        print("-" * 40)

        result = await service.chat(
            message=query,
            user_id=user_id,
            session_id=session_id,
        )

        # Continue with the same session
        session_id = result["session_id"]

        print(f"Agent: {result['response']}")
        print()

        if result["actions_taken"]:
            print("Actions taken:")
            for action in result["actions_taken"]:
                print(f"  - {action['tool']}: {action.get('args', {})}")
            print()

    print("=" * 60)
    print("Test complete!")
    print(f"Session ID: {session_id}")
    print("=" * 60)


async def interactive_mode():
    """Run an interactive chat session."""
    from src.agent import TaskAgentService
    from src.config import settings

    print("=" * 60)
    print("Task Assistant Agent - Interactive Mode")
    print("=" * 60)
    print(f"Model: {settings.gemini_model}")
    print("Type 'quit' or 'exit' to stop")
    print()

    if not settings.gemini_api_key:
        print("ERROR: GEMINI_API_KEY not set!")
        return

    service = TaskAgentService()
    print("Agent ready!\n")

    user_id = "interactive_user"
    session_id = None

    while True:
        try:
            query = input("You: ").strip()
            if not query:
                continue
            if query.lower() in ("quit", "exit", "q"):
                print("Goodbye!")
                break

            result = await service.chat(
                message=query,
                user_id=user_id,
                session_id=session_id,
            )

            session_id = result["session_id"]
            print(f"\nAgent: {result['response']}\n")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test the Task Assistant Agent")
    parser.add_argument(
        "-i", "--interactive", action="store_true", help="Run in interactive mode"
    )
    args = parser.parse_args()

    if args.interactive:
        asyncio.run(interactive_mode())
    else:
        asyncio.run(test_agent())
