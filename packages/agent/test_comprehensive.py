#!/usr/bin/env python
"""Comprehensive test of the Task Assistant Agent."""

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
    """Run comprehensive agent tests."""
    print("="*70)
    print("Task Assistant Agent - Comprehensive Test")
    print("="*70)
    
    service = TaskAgentService()
    print("\n✓ Agent initialized successfully!\n")
    
    test_scenarios = [
        {
            "name": "1. List all projects",
            "query": "What projects do I have?",
        },
        {
            "name": "2. Get board summary",
            "query": "Show me a summary of all my tickets organized by status",
        },
        {
            "name": "3. List tickets in specific project",
            "query": "What tickets are in the Personal Planner project?",
        },
        {
            "name": "4. Search for tickets",
            "query": "Find all tickets related to 'agent' or 'webhook'",
        },
        {
            "name": "5. Create a new ticket",
            "query": "Create a new critical priority ticket in Infra & Ops called 'Setup monitoring alerts' with description 'Configure Prometheus and Grafana alerting rules'",
        },
        {
            "name": "6. Filter tickets by status",
            "query": "Show me all BLOCKED tickets",
        },
        {
            "name": "7. Filter by priority",
            "query": "List all HIGH priority tickets in the AI Agent project",
        },
        {
            "name": "8. Create a test project",
            "query": "Create a new project called 'Test Project' with key 'TEST' and description 'Temporary project for testing'",
        },
        {
            "name": "9. Delete the test project",
            "query": "Delete the Test Project",
        },
    ]
    
    user_id = "test_user"
    session_id = None
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n{'='*70}")
        print(f"Test {scenario['name']}")
        print(f"{'='*70}")
        print(f"\n💬 User: {scenario['query']}\n")
        
        result = await service.chat(
            message=scenario['query'],
            user_id=user_id,
            session_id=session_id,
        )
        
        session_id = result["session_id"]
        print(f"🤖 Agent: {result['response']}")
        
        if result["actions_taken"]:
            print(f"\n📋 Actions performed:")
            for action in result["actions_taken"]:
                tool_name = action['tool']
                args = action.get('args', {})
                args_str = ', '.join(f"{k}={v}" for k, v in args.items() if v) if args else ''
                print(f"   • {tool_name}({args_str})")
    
    print("\n" + "="*70)
    print("✅ All tests completed successfully!")
    print(f"Session ID: {session_id}")
    print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
