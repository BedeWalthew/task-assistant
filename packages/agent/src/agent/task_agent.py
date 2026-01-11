"""Main Task Agent implementation using Google ADK.

This version uses the proper ADK patterns with:
- Agent (LlmAgent) for the AI agent  
- Runner for execution
- InMemorySessionService for session management
"""

import logging
from typing import Any

from google.adk.agents import Agent  # Use Agent instead of LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from ..config import settings
from ..api.client import APIClient
from .prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# App configuration
APP_NAME = "task_assistant"


def _create_tools(api_client: APIClient) -> list:
    """Create tool functions that use the API client.

    These functions will be called by the agent when it needs to
    interact with the task management system.
    """

    async def create_ticket(
        title: str,
        description: str = "",
        priority: str = "MEDIUM",
        status: str = "TODO",
        project_id: str = "",
    ) -> dict:
        """Create a new ticket in the task management system.

        Args:
            title: Title of the ticket (required)
            description: Detailed description of the ticket
            priority: Priority level - LOW, MEDIUM, HIGH, or CRITICAL
            status: Initial status - TODO, IN_PROGRESS, DONE, or BLOCKED
            project_id: Project ID (UUID) or project key/name. Will attempt to resolve by name if not a valid UUID.

        Returns:
            The created ticket details or error message
        """
        try:
            # Try to resolve project name/key to ID if provided
            resolved_project_id = project_id
            if project_id:
                # Check if it's not a UUID (contains no hyphens or too short)
                if '-' not in project_id or len(project_id) < 30:
                    # Try to find project by name or key
                    project = await api_client.get_project_by_name(project_id)
                    if project:
                        resolved_project_id = project.id
                    else:
                        return {
                            "success": False,
                            "error": f"Project '{project_id}' not found. Use list_projects to see available projects.",
                        }
            
            ticket = await api_client.create_ticket(
                title=title,
                description=description or None,
                priority=priority,
                status=status,
                project_id=resolved_project_id or None,
            )
            return {
                "success": True,
                "message": f"Created ticket '{ticket.title}'",
                "ticket": ticket.model_dump(),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def update_ticket(
        ticket_id: str,
        title: str = "",
        description: str = "",
        priority: str = "",
    ) -> dict:
        """Update an existing ticket's details.

        Args:
            ticket_id: The ID or title of the ticket to update. Will search by title if not a valid UUID.
            title: New title (leave empty to keep current)
            description: New description (leave empty to keep current)
            priority: New priority - LOW, MEDIUM, HIGH, or CRITICAL (leave empty to keep current)

        Returns:
            The updated ticket details or error message
        """
        try:
            # Try to resolve ticket title to ID if needed
            resolved_ticket_id = ticket_id
            if '-' not in ticket_id or len(ticket_id) < 30:
                # Looks like a title, search for it
                ticket = await api_client.find_ticket_by_title(ticket_id)
                if ticket:
                    resolved_ticket_id = ticket.id
                else:
                    return {
                        "success": False,
                        "error": f"Ticket '{ticket_id}' not found. Use search_tickets or list_tickets to find it.",
                    }
            
            updates = {}
            if title:
                updates["title"] = title
            if description:
                updates["description"] = description
            if priority:
                updates["priority"] = priority

            ticket = await api_client.update_ticket(resolved_ticket_id, **updates)
            return {
                "success": True,
                "message": f"Updated ticket '{ticket.title}'",
                "ticket": ticket.model_dump(),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def move_ticket(ticket_id: str, new_status: str) -> dict:
        """Move a ticket to a different status column.

        Args:
            ticket_id: The ID or title of the ticket to move. Will search by title if not a valid UUID.
            new_status: New status - TODO, IN_PROGRESS, DONE, or BLOCKED

        Returns:
            The updated ticket details or error message
        """
        try:
            # Try to resolve ticket title to ID if needed
            resolved_ticket_id = ticket_id
            if '-' not in ticket_id or len(ticket_id) < 30:
                # Looks like a title, search for it
                ticket = await api_client.find_ticket_by_title(ticket_id)
                if ticket:
                    resolved_ticket_id = ticket.id
                else:
                    return {
                        "success": False,
                        "error": f"Ticket '{ticket_id}' not found. Use search_tickets or list_tickets to find it.",
                    }
            
            ticket = await api_client.move_ticket(resolved_ticket_id, new_status)
            return {
                "success": True,
                "message": f"Moved '{ticket.title}' to {new_status}",
                "ticket": ticket.model_dump(),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_ticket(ticket_id: str, confirmed: bool = False) -> dict:
        """Delete a ticket from the system.

        Args:
            ticket_id: The ID of the ticket to delete
            confirmed: Must be True to actually delete. Ask user to confirm first.

        Returns:
            Success message or error
        """
        if not confirmed:
            return {
                "success": False,
                "message": "Please confirm you want to delete this ticket. This action cannot be undone.",
                "requires_confirmation": True,
            }

        try:
            success = await api_client.delete_ticket(ticket_id)
            if success:
                return {"success": True, "message": "Ticket deleted successfully"}
            return {"success": False, "error": "Failed to delete ticket"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_tickets(
        project_id: str = "",
        status: str = "",
        priority: str = "",
        limit: int = 20,
    ) -> dict:
        """List tickets with optional filters.

        Args:
            project_id: Filter by project ID, key, or name. Leave empty for all projects.
            status: Filter by status - TODO, IN_PROGRESS, DONE, or BLOCKED
            priority: Filter by priority - LOW, MEDIUM, HIGH, or CRITICAL
            limit: Maximum number of tickets to return (default 20)

        Returns:
            List of matching tickets
        """
        try:
            # Try to resolve project name/key to ID if provided
            resolved_project_id = None
            if project_id:
                # Check if it's not a UUID (contains no hyphens or too short)
                if '-' not in project_id or len(project_id) < 30:
                    # Try to find project by name or key
                    project = await api_client.get_project_by_name(project_id)
                    if project:
                        resolved_project_id = project.id
                else:
                    resolved_project_id = project_id
            
            result = await api_client.list_tickets(
                project_id=resolved_project_id,
                status=status or None,
                priority=priority or None,
                limit=limit,
            )
            tickets = [t.model_dump() for t in result.items]  # Changed from result.tickets
            return {
                "success": True,
                "tickets": tickets,
                "count": len(tickets),
                "total": result.total,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def search_tickets(query: str, project_id: str = "") -> dict:
        """Search for tickets by text in title or description.

        Args:
            query: Search text to find in tickets
            project_id: Optional project ID to search within

        Returns:
            List of matching tickets
        """
        try:
            tickets = await api_client.search_tickets(
                query=query, project_id=project_id or None
            )
            return {
                "success": True,
                "tickets": [t.model_dump() for t in tickets],
                "count": len(tickets),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_ticket(ticket_id: str) -> dict:
        """Get detailed information about a specific ticket.

        Args:
            ticket_id: The ID of the ticket to retrieve

        Returns:
            Full ticket details
        """
        try:
            ticket = await api_client.get_ticket(ticket_id)
            if ticket:
                return {"success": True, "ticket": ticket.model_dump()}
            return {"success": False, "error": "Ticket not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_projects() -> dict:
        """List all available projects.

        Returns:
            List of all projects in the system
        """
        try:
            projects = await api_client.list_projects()
            return {
                "success": True,
                "projects": [p.model_dump() for p in projects],
                "count": len(projects),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_project(project_id: str) -> dict:
        """Get detailed information about a project.

        Args:
            project_id: The ID of the project to retrieve

        Returns:
            Full project details including ticket counts
        """
        try:
            project = await api_client.get_project(project_id)
            if project:
                return {"success": True, "project": project.model_dump()}
            return {"success": False, "error": "Project not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_board_summary(project_id: str = "") -> dict:
        """Get Kanban board summary with ticket counts by status.

        Args:
            project_id: Project ID to summarize (uses first project if not specified)

        Returns:
            Board summary with counts for each status column
        """
        try:
            summary = await api_client.get_board_summary(project_id or None)
            return {
                "success": True,
                **summary,  # Spread the entire summary dict
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_project(name: str, key: str, description: str = "") -> dict:
        """Create a new project in the task management system.

        Args:
            name: Name of the project (e.g., "Frontend Development")
            key: Short unique key for the project (2-10 uppercase chars, e.g., "FRNT")
            description: Optional description of the project

        Returns:
            The created project details or error message
        """
        try:
            # Ensure key is uppercase and valid length
            key = key.upper()[:10]
            if len(key) < 2:
                return {
                    "success": False,
                    "error": "Project key must be at least 2 characters",
                }
            
            project = await api_client.create_project(
                name=name,
                key=key,
                description=description or None,
            )
            return {
                "success": True,
                "message": f"Created project '{project.name}' ({project.key})",
                "project": project.model_dump(),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_project(
        project_id: str = "",
    ) -> dict:
        """Delete a project from the task management system.

        Args:
            project_id: Project ID (UUID) or project key/name. Will attempt to resolve by name/key if not a valid UUID.

        Returns:
            Success confirmation or error message
        """
        try:
            # Try to resolve project name/key to ID if provided
            resolved_project_id = project_id
            if project_id:
                # Check if it's not a UUID (contains no hyphens or too short)
                if '-' not in project_id or len(project_id) < 30:
                    # Try to find project by name or key
                    project = await api_client.get_project_by_name(project_id)
                    if project:
                        resolved_project_id = project.id
                    else:
                        return {
                            "success": False,
                            "error": f"Project '{project_id}' not found. Use list_projects to see available projects.",
                        }
            
            if not resolved_project_id:
                return {
                    "success": False,
                    "error": "Project ID or name is required",
                }
            
            await api_client.delete_project(resolved_project_id)
            return {
                "success": True,
                "message": f"Successfully deleted project '{project_id}'",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    return [
        create_ticket,
        update_ticket,
        move_ticket,
        delete_ticket,
        list_tickets,
        search_tickets,
        get_ticket,
        list_projects,
        get_project,
        get_board_summary,
        create_project,
        delete_project,
    ]


class TaskAgentService:
    """Service class that manages the ADK agent, runner, and sessions."""

    def __init__(self, api_base_url: str | None = None):
        """Initialize the agent service.

        Args:
            api_base_url: Base URL for the backend API
        """
        self.api_base_url = api_base_url or settings.backend_api_url
        self.api_client = APIClient(self.api_base_url)

        # Create the session service (in-memory for dev, can swap for DB later)
        self.session_service = InMemorySessionService()

        # Create the agent with tools (Agent is an alias for LlmAgent)
        self.agent = Agent(
            model=settings.gemini_model,
            name="task_agent",
            description="An AI assistant that helps manage tickets and projects in a task management system.",
            instruction=SYSTEM_PROMPT,
            tools=_create_tools(self.api_client),
        )

        # Create the runner
        self.runner = Runner(
            agent=self.agent,
            app_name=APP_NAME,
            session_service=self.session_service,
        )

        logger.info(f"TaskAgentService initialized with model: {settings.gemini_model}")

    async def get_or_create_session(
        self, user_id: str, session_id: str | None = None
    ) -> str:
        """Get an existing session or create a new one.

        Args:
            user_id: User identifier
            session_id: Optional existing session ID

        Returns:
            Session ID
        """
        if session_id:
            # Try to get existing session
            session = await self.session_service.get_session(
                app_name=APP_NAME, user_id=user_id, session_id=session_id
            )
            if session:
                return session.id

        # Create new session
        session = await self.session_service.create_session(
            app_name=APP_NAME, user_id=user_id
        )
        return session.id

    async def chat(
        self, message: str, user_id: str, session_id: str | None = None
    ) -> dict[str, Any]:
        """Process a chat message and return the response.

        Args:
            message: User's message
            user_id: User identifier
            session_id: Optional session ID to continue conversation

        Returns:
            Response with text, session_id, and any actions taken
        """
        # Ensure we have a session
        sid = await self.get_or_create_session(user_id, session_id)

        # Create the user message
        content = types.Content(role="user", parts=[types.Part(text=message)])

        # Run the agent
        response_text = ""
        actions_taken = []

        async for event in self.runner.run_async(
            user_id=user_id, session_id=sid, new_message=content
        ):
            logger.debug(f"Event: {event.id}, Author: {event.author}")

            # Check for tool calls in the event
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.function_call:
                        actions_taken.append({
                            "tool": part.function_call.name,
                            "args": dict(part.function_call.args)
                            if part.function_call.args
                            else {},
                        })
                    if part.function_response:
                        # Find matching action and add result
                        for action in actions_taken:
                            if action["tool"] == part.function_response.name:
                                action["result"] = dict(part.function_response.response)

            # Capture final response text
            if event.is_final_response():
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.text:
                            response_text += part.text

        return {
            "response": response_text.strip(),
            "session_id": sid,
            "actions_taken": actions_taken,
        }

    async def chat_stream(
        self, message: str, user_id: str, session_id: str | None = None
    ):
        """Process a chat message and stream the response.

        Args:
            message: User's message
            user_id: User identifier
            session_id: Optional session ID

        Yields:
            Dictionaries with event type and data
        """
        # Ensure we have a session
        sid = await self.get_or_create_session(user_id, session_id)

        # Create the user message
        content = types.Content(role="user", parts=[types.Part(text=message)])

        full_response = ""
        actions_taken = []

        async for event in self.runner.run_async(
            user_id=user_id, session_id=sid, new_message=content
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    # Handle function calls
                    if part.function_call:
                        action = {
                            "tool": part.function_call.name,
                            "args": dict(part.function_call.args)
                            if part.function_call.args
                            else {},
                        }
                        actions_taken.append(action)
                        yield {"type": "tool_call", **action}

                    # Handle function responses
                    elif part.function_response:
                        yield {
                            "type": "tool_result",
                            "tool": part.function_response.name,
                            "result": dict(part.function_response.response),
                        }

                    # Handle text chunks
                    elif part.text:
                        full_response += part.text
                        yield {"type": "text", "content": part.text}

            # Check if this is the final response
            if event.is_final_response():
                yield {
                    "type": "done",
                    "session_id": sid,
                    "full_response": full_response.strip(),
                    "actions_taken": actions_taken,
                }

    async def delete_session(self, user_id: str, session_id: str) -> bool:
        """Delete a session.

        Args:
            user_id: User identifier
            session_id: Session to delete

        Returns:
            True if deleted
        """
        try:
            await self.session_service.delete_session(
                app_name=APP_NAME, user_id=user_id, session_id=session_id
            )
            return True
        except Exception:
            return False

    async def get_session_info(self, user_id: str, session_id: str) -> dict | None:
        """Get information about a session.

        Args:
            user_id: User identifier
            session_id: Session to get info for

        Returns:
            Session info or None if not found
        """
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )
        if not session:
            return None

        return {
            "id": session.id,
            "user_id": session.user_id,
            "app_name": session.app_name,
            "event_count": len(session.events),
            "state": dict(session.state) if session.state else {},
            "last_update": session.last_update_time,
        }
