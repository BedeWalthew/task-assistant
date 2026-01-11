"""Pydantic schemas for API communication."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TicketStatus(str, Enum):
    """Ticket status values."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    BLOCKED = "BLOCKED"


class TicketPriority(str, Enum):
    """Ticket priority values."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Ticket(BaseModel):
    """Ticket model."""

    id: str
    title: str
    description: Optional[str] = None
    status: TicketStatus
    priority: TicketPriority
    position: float
    project_id: str = Field(alias="projectId")
    assignee_id: Optional[str] = Field(default=None, alias="assigneeId")
    source: str = "MANUAL"
    source_url: Optional[str] = Field(default=None, alias="sourceUrl")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


class Project(BaseModel):
    """Project model."""

    id: str
    name: str
    description: Optional[str] = None
    key: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


class CreateTicketRequest(BaseModel):
    """Request to create a ticket."""

    title: str
    description: Optional[str] = None
    status: TicketStatus = TicketStatus.TODO
    priority: TicketPriority = TicketPriority.MEDIUM
    project_id: str = Field(serialization_alias="projectId")
    assignee_id: Optional[str] = Field(default=None, serialization_alias="assigneeId")


class UpdateTicketRequest(BaseModel):
    """Request to update a ticket."""

    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assignee_id: Optional[str] = Field(default=None, serialization_alias="assigneeId")


class ReorderTicketRequest(BaseModel):
    """Request to reorder/move a ticket."""

    status: Optional[TicketStatus] = None
    position: Optional[float] = None  # If not provided, defaults to top of column


class CreateProjectRequest(BaseModel):
    """Request to create a project."""

    name: str
    description: Optional[str] = None
    key: str  # 2-10 character project key like "FRNT"


class DeleteProjectRequest(BaseModel):
    """Request to delete a project."""

    project_id: str


class TicketFilter(BaseModel):
    """Filter parameters for listing tickets."""

    project_id: Optional[str] = Field(default=None, serialization_alias="projectId")
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    search: Optional[str] = None
    sort_by: str = Field(default="createdAt", serialization_alias="sortBy")
    sort_order: str = Field(default="desc", serialization_alias="sortOrder")
    page: int = 1
    limit: int = 20


class PaginatedTickets(BaseModel):
    """Paginated list of tickets."""

    items: list[Ticket]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")

    class Config:
        populate_by_name = True


class BoardSummary(BaseModel):
    """Summary of tickets grouped by status."""

    project_id: str
    project_name: str
    project_key: str
    todo_count: int = 0
    in_progress_count: int = 0
    done_count: int = 0
    blocked_count: int = 0


class AgentMessage(BaseModel):
    """Message from user to agent."""

    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    """Response from agent."""

    response: str
    session_id: str
    actions_taken: list[dict] = Field(default_factory=list)
