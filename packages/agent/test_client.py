#!/usr/bin/env python
"""Quick test of the API client to debug tool issues."""

import asyncio
import sys
import os

# Load .env
from dotenv import load_dotenv
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.api.client import APIClient


async def main():
    """Test the API client."""
    client = APIClient(base_url="http://localhost:3001")
    
    try:
        print("Testing /projects endpoint...")
        projects = await client.list_projects()
        print(f"Success! Found {len(projects)} projects")
        for project in projects:
            print(f"  - {project.name} ({project.key})")
        print()
        
        print("Testing /tickets endpoint...")
        tickets_result = await client.list_tickets()
        print(f"Success! Found {tickets_result.total} tickets")
        for ticket in tickets_result.items[:5]:
            print(f"  - {ticket.title} ({ticket.status})")
        print()
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
