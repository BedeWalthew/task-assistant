"""HTTP client for communicating with the backend API."""

import logging
from typing import Any, Optional

import httpx

from .schemas import (
    CreateProjectRequest,
    CreateTicketRequest,
    DeleteProjectRequest,
    PaginatedTickets,
    Project,
    ReorderTicketRequest,
    Ticket,
    TicketFilter,
    UpdateTicketRequest,
)

logger = logging.getLogger(__name__)


class APIClient:
    """HTTP client for the Task Assistant backend API."""

    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        """Initialize the API client.

        Args:
            base_url: Backend API base URL (e.g., http://backend:3001)
            auth_token: Optional JWT token for authentication
        """
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None:
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    # ==================== Projects ====================

    async def list_projects(self) -> list[Project]:
        """Get all projects."""
        response = await self.client.get("/projects")
        response.raise_for_status()
        data = response.json()
        # Backend wraps responses in { "data": [...] }
        projects_data = data.get("data", data) if isinstance(data, dict) else data
        return [Project.model_validate(p) for p in projects_data]

    async def get_project(self, project_id: str) -> Project:
        """Get a project by ID."""
        response = await self.client.get(f"/projects/{project_id}")
        response.raise_for_status()
        data = response.json()
        # Backend wraps responses in { "data": {...} }
        project_data = data.get("data", data) if isinstance(data, dict) and "data" in data else data
        return Project.model_validate(project_data)

    async def get_project_by_key(self, key: str) -> Optional[Project]:
        """Get a project by its key."""
        projects = await self.list_projects()
        for project in projects:
            if project.key.upper() == key.upper():
                return project
        return None

    async def get_project_by_name(self, name: str) -> Optional[Project]:
        """Get a project by name (case-insensitive partial match)."""
        projects = await self.list_projects()
        name_lower = name.lower()
        for project in projects:
            if name_lower in project.name.lower() or name_lower == project.key.lower():
                return project
        return None

    async def create_project(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        key: Optional[str] = None,
        data: Optional[CreateProjectRequest] = None,
    ) -> Project:
        """Create a new project.
        
        Can be called with either a CreateProjectRequest object or individual kwargs.
        """
        if data is None:
            if name is None or key is None:
                raise ValueError("Either 'data' or both 'name' and 'key' must be provided")
            data = CreateProjectRequest(
                name=name,
                description=description,
                key=key,
            )
        
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = await self.client.post("/projects", json=payload)
        response.raise_for_status()
        response_data = response.json()
        # Backend wraps responses in { "data": {...} }
        project_data = response_data.get("data", response_data) if isinstance(response_data, dict) and "data" in response_data else response_data
        return Project.model_validate(project_data)

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project by ID.
        
        Args:
            project_id: The UUID of the project to delete
            
        Returns:
            True if deletion was successful
        """
        response = await self.client.delete(f"/projects/{project_id}")
        response.raise_for_status()
        return True

    # ==================== Tickets ====================

    async def list_tickets(
        self, 
        filters: Optional[TicketFilter] = None,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: Optional[int] = None,
        page: Optional[int] = None,
    ) -> PaginatedTickets:
        """List tickets with optional filters.
        
        Can be called with either a TicketFilter object or individual kwargs.
        """
        if filters is None and any([project_id, status, priority, limit is not None, page is not None]):
            filters = TicketFilter(
                project_id=project_id,
                status=status,  # type: ignore
                priority=priority,  # type: ignore
                limit=limit or 20,  # Use default if None
                page=page or 1,  # Use default if None
            )
        
        params: dict[str, Any] = {}
        if filters:
            filter_dict = filters.model_dump(by_alias=True, exclude_none=True, mode='json')
            params = filter_dict

        response = await self.client.get("/tickets", params=params)
        response.raise_for_status()
        data = response.json()
        # Backend wraps responses in { "data": {...} }
        tickets_data = data.get("data", data) if isinstance(data, dict) and "data" in data else data
        return PaginatedTickets.model_validate(tickets_data)

    async def get_ticket(self, ticket_id: str) -> Ticket:
        """Get a ticket by ID."""
        response = await self.client.get(f"/tickets/{ticket_id}")
        response.raise_for_status()
        data = response.json()
        # Backend wraps responses in { "data": {...} }
        ticket_data = data.get("data", data) if isinstance(data, dict) and "data" in data else data
        return Ticket.model_validate(ticket_data)

    async def search_tickets(
        self, query: str, project_id: Optional[str] = None, limit: int = 10
    ) -> list[Ticket]:
        """Search tickets by title/description."""
        filters = TicketFilter(search=query, project_id=project_id, limit=limit)
        result = await self.list_tickets(filters)
        return result.items

    async def find_ticket_by_title(
        self, title: str, project_id: Optional[str] = None
    ) -> Optional[Ticket]:
        """Find a ticket by title (partial match)."""
        tickets = await self.search_tickets(title, project_id, limit=5)
        title_lower = title.lower()
        for ticket in tickets:
            if title_lower in ticket.title.lower():
                return ticket
        return tickets[0] if tickets else None

    async def create_ticket(
        self, 
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        project_id: Optional[str] = None,
        data: Optional[CreateTicketRequest] = None,
    ) -> Ticket:
        """Create a new ticket.
        
        Can be called with either a CreateTicketRequest object or individual kwargs.
        """
        if data is None:
            if title is None:
                raise ValueError("Either 'data' or 'title' must be provided")
            data = CreateTicketRequest(
                title=title,  # type: ignore
                description=description,
                priority=priority,  # type: ignore
                status=status,  # type: ignore
                project_id=project_id,
            )
        
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = await self.client.post("/tickets", json=payload)
        response.raise_for_status()
        response_data = response.json()
        # Backend wraps responses in { "data": {...} }
        ticket_data = response_data.get("data", response_data) if isinstance(response_data, dict) and "data" in response_data else response_data
        return Ticket.model_validate(ticket_data)

    async def update_ticket(
        self, 
        ticket_id: str, 
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        project_id: Optional[str] = None,
        data: Optional[UpdateTicketRequest] = None,
    ) -> Ticket:
        """Update an existing ticket.
        
        Can be called with either an UpdateTicketRequest object or individual kwargs.
        """
        if data is None:
            data = UpdateTicketRequest(
                title=title,
                description=description,
                priority=priority,  # type: ignore
                status=status,  # type: ignore
                project_id=project_id,
            )
        
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = await self.client.put(f"/tickets/{ticket_id}", json=payload)
        response.raise_for_status()
        response_data = response.json()
        # Backend wraps responses in { "data": {...} }
        ticket_data = response_data.get("data", response_data) if isinstance(response_data, dict) and "data" in response_data else response_data
        return Ticket.model_validate(ticket_data)

    async def move_ticket(
        self, 
        ticket_id: str, 
        new_status: Optional[str] = None,
        after_ticket_id: Optional[str] = None,
        data: Optional[ReorderTicketRequest] = None,
    ) -> Ticket:
        """Move/reorder a ticket (change status and/or position).
        
        Can be called with either a ReorderTicketRequest object or individual kwargs.
        """
        if data is None:
            data = ReorderTicketRequest(
                new_status=new_status,  # type: ignore
                after_ticket_id=after_ticket_id,
            )
        
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = await self.client.patch(f"/tickets/{ticket_id}/reorder", json=payload)
        response.raise_for_status()
        response_data = response.json()
        # Backend wraps responses in { "data": {...} }
        ticket_data = response_data.get("data", response_data) if isinstance(response_data, dict) and "data" in response_data else response_data
        return Ticket.model_validate(ticket_data)

    async def delete_ticket(self, ticket_id: str) -> bool:
        """Delete a ticket."""
        response = await self.client.delete(f"/tickets/{ticket_id}")
        response.raise_for_status()
        return True

    # ==================== Board Summary ====================

    async def get_board_summary(self, project_id: Optional[str] = None) -> dict[str, Any]:
        """Get a summary of tickets grouped by status."""
        summaries = []

        if project_id:
            projects = [await self.get_project(project_id)]
        else:
            projects = await self.list_projects()

        for project in projects:
            summary = {
                "project_id": project.id,
                "project_name": project.name,
                "project_key": project.key,
                "TODO": 0,
                "IN_PROGRESS": 0,
                "DONE": 0,
                "BLOCKED": 0,
            }

            for status in ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]:
                filters = TicketFilter(project_id=project.id, status=status, limit=1)  # type: ignore
                result = await self.list_tickets(filters)
                summary[status] = result.total

            summaries.append(summary)

        return {"projects": summaries, "total_projects": len(summaries)}
